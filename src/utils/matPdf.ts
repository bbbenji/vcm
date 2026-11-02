/**
 * Capturing the mat board and turning it into PNG / PDF output.
 *
 * `printMatPdf` is the one that matters for the 3D printed mat: it places the
 * capture so a grid cell measures exactly 15mm on paper, matching the physical
 * 10x10 / 150x150mm mat, and adds a 100mm calibration bar so a printer that
 * silently rescales the page can be spotted with a ruler.
 */

import {
  computeMatPdfLayout,
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  TARGET_CELL_MM,
  type MatPdfLayout,
  type MatPdfLayoutMode,
} from "./pdfLayout";
import { waitForRepaint } from "./waitForRepaint";

const MAT_ELEMENT_ID = "mat-grid-container";
const PIXEL_RATIO = 2;

/** Vertical space reserved above the board for the logo. */
const HEADER_MM = 18;
/** Vertical space reserved under the board for the calibration bar. */
const FOOTER_MM = 24;
const RULER_LENGTH_MM = 100;

/**
 * The logo is drawn straight into the PDF at a fixed physical size rather than
 * captured from the page. The DOM logo block is a fixed pixel height, so at 1:1
 * it would measure 39mm on a wide window and 66mm on a phone - enough to push
 * the board off A4 and silently demote the print to a scaled one.
 */
const LOGO_WIDTH_MM = 36;
const LOGO_TOP_MM = 7;
const LOGO_TIMEOUT_MS = 5000;

/**
 * Footer ink is positioned up from the bottom edge, not down from the reserved
 * band, so the lowest text keeps a comfortable margin on printers whose
 * unprintable area is larger than this one's ~4mm.
 */
const NOTE_BASELINE_FROM_BOTTOM_MM = 12;
const RULER_ABOVE_NOTE_MM = 6;
const RULER_LABEL_ABOVE_MM = 3.5;

/** Guards against html-to-image never settling (see captureMat). */
const CAPTURE_TIMEOUT_MS = 20000;

export interface MatCaptureMetrics {
  containerWidthPx: number;
  containerHeightPx: number;
  cellWidthPx: number;
}

export interface MatCapture {
  dataUrl: string;
  metrics: MatCaptureMetrics;
}

export interface PrintNotes {
  /** Note shown when a cell is exactly TARGET_CELL_MM; `{mm}` is substituted. */
  exact: string;
  /** Note shown when the board had to be scaled down to fit A4; `{mm}` is substituted. */
  scaled: string;
}

function readMetrics(element: HTMLElement): MatCaptureMetrics {
  const rect = element.getBoundingClientRect();
  const cell = element.querySelector(".grid [data-row]");
  const cellWidthPx = cell ? cell.getBoundingClientRect().width : 0;

  return {
    containerWidthPx: rect.width,
    containerHeightPx: rect.height,
    cellWidthPx,
  };
}

/**
 * Renders the mat board to a PNG data URL, forcing the light theme and the
 * export styling first. Resolves to null when the board is not mounted.
 */
export async function captureMat(
  options: { hideBranding?: boolean } = {},
): Promise<MatCapture | null> {
  const element = document.getElementById(MAT_ELEMENT_ID);
  if (!element) return null;

  const isDark = document.documentElement.classList.contains("dark");

  try {
    if (isDark) document.documentElement.classList.remove("dark");
    element.classList.add("exporting");
    if (options.hideBranding) element.classList.add("printing");

    // Force synchronous style/layout calculation, then wait for the repaint.
    // The offsetHeight read is what actually guarantees the export styles are
    // applied; waitForRepaint must not hang if the tab is hidden.
    void element.offsetHeight;
    await waitForRepaint();

    const metrics = readMetrics(element);

    const { toPng } = await import("html-to-image");
    const render = toPng(element, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: "#ffffff",
      filter: (node) => {
        if (
          node instanceof HTMLElement &&
          node.getAttribute("data-html2canvas-ignore") === "true"
        ) {
          return false;
        }
        return true;
      },
    });

    // html-to-image resolves inside a requestAnimationFrame callback, so it never
    // settles if the tab is backgrounded mid-render. Fail loudly instead of
    // leaving the caller pending forever.
    const dataUrl = await Promise.race([
      render,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Mat capture timed out, the tab may have been hidden")),
          CAPTURE_TIMEOUT_MS,
        ),
      ),
    ]);

    return { dataUrl, metrics };
  } finally {
    element.classList.remove("exporting", "printing");
    if (isDark) document.documentElement.classList.add("dark");
  }
}

function triggerDownload(fileName: string, href: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = href;
  link.click();
}

export async function exportMatPng(fileName: string): Promise<boolean> {
  const capture = await captureMat();
  if (!capture) return false;

  triggerDownload(fileName, capture.dataUrl);
  return true;
}

async function createPdf(
  capture: MatCapture,
  mode: MatPdfLayoutMode,
  headerMm: number,
  footerMm: number,
) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const layout = computeMatPdfLayout({ ...capture.metrics, headerMm, footerMm }, mode);

  pdf.addImage(
    capture.dataUrl,
    "PNG",
    layout.x,
    layout.y,
    layout.widthMm,
    layout.heightMm,
    undefined,
    "FAST",
  );

  return { pdf, layout };
}

export async function exportMatPdf(fileName: string): Promise<boolean> {
  const capture = await captureMat();
  if (!capture) return false;

  const { pdf } = await createPdf(capture, "fit", 0, 0);
  pdf.save(fileName);
  return true;
}

interface LogoBitmap {
  dataUrl: string;
  /** width / height */
  ratio: number;
}

/**
 * Rasterises the site logo for embedding. Returns null on any failure - the
 * print is useful without branding, so a missing logo must never block it.
 */
async function loadLogo(): Promise<LogoBitmap | null> {
  try {
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo failed to load"));
    });
    img.src = `${import.meta.env.BASE_URL}logo.svg`;

    await Promise.race([
      loaded,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("logo load timed out")), LOGO_TIMEOUT_MS),
      ),
    ]);

    if (!img.naturalWidth || !img.naturalHeight) return null;

    const width = 1200;
    const height = Math.round((width * img.naturalHeight) / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    return { dataUrl: canvas.toDataURL("image/png"), ratio: img.naturalWidth / img.naturalHeight };
  } catch (error) {
    console.warn("Logo unavailable for print", error);
    return null;
  }
}

function drawLogo(pdf: import("jspdf").jsPDF, logo: LogoBitmap) {
  const heightMm = LOGO_WIDTH_MM / logo.ratio;
  pdf.addImage(
    logo.dataUrl,
    "PNG",
    (A4_WIDTH_MM - LOGO_WIDTH_MM) / 2,
    LOGO_TOP_MM,
    LOGO_WIDTH_MM,
    heightMm,
  );
}

/** Draws a 100mm reference bar plus a short "do not scale" note. */
function drawCalibrationFooter(
  pdf: import("jspdf").jsPDF,
  layout: MatPdfLayout,
  notes: PrintNotes,
) {
  const noteBaseline = A4_HEIGHT_MM - NOTE_BASELINE_FROM_BOTTOM_MM;
  const baseline = noteBaseline - RULER_ABOVE_NOTE_MM;
  const startX = (A4_WIDTH_MM - RULER_LENGTH_MM) / 2;

  pdf.setDrawColor(100, 116, 139); // slate-500
  pdf.setLineWidth(0.25);
  pdf.line(startX, baseline, startX + RULER_LENGTH_MM, baseline);

  for (let offset = 0; offset <= RULER_LENGTH_MM; offset += 10) {
    const isEnd = offset === 0 || offset === RULER_LENGTH_MM;
    const tick = isEnd ? 2.4 : 1.2;
    pdf.line(startX + offset, baseline - tick, startX + offset, baseline + tick);
  }

  const cellMm = Math.round(layout.cellMm * 10) / 10;
  const note = (layout.trueToSize ? notes.exact : notes.scaled).replace(
    "{mm}",
    layout.trueToSize ? String(TARGET_CELL_MM) : cellMm.toFixed(1),
  );

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${RULER_LENGTH_MM} mm`, A4_WIDTH_MM / 2, baseline - RULER_LABEL_ABOVE_MM, {
    align: "center",
  });
  pdf.text(note, A4_WIDTH_MM / 2, noteBaseline, { align: "center" });
}

export type PrintOutcome = "opened" | "downloaded" | "unavailable";

/**
 * Builds the 1:1 print PDF and opens it in a new tab.
 *
 * The capture MUST finish before the tab is opened. Opening it first backgrounds
 * this page, and a hidden tab gets no animation frames - html-to-image resolves
 * its image inside a requestAnimationFrame callback, so the capture would hang
 * forever and the new tab would sit on about:blank.
 *
 * Opening afterwards relies on the click's transient user activation still being
 * live, which it normally is. If the popup is blocked anyway we save the file
 * instead, so the button always produces the PDF one way or the other.
 */
export async function printMatPdf(fileName: string, notes: PrintNotes): Promise<PrintOutcome> {
  const capture = await captureMat({ hideBranding: true });
  if (!capture) return "unavailable";

  const logo = await loadLogo();
  const { pdf, layout } = await createPdf(capture, "actual-size", HEADER_MM, FOOTER_MM);
  if (logo) drawLogo(pdf, logo);
  drawCalibrationFooter(pdf, layout, notes);
  // Best effort: the "javascript" variant uses the /Names tree instead of a second
  // /OpenAction key, which would make the catalog malformed. Viewers that block PDF
  // JavaScript (Chrome's built-in one does) simply show the file instead.
  pdf.autoPrint({ variant: "javascript" });

  const printWindow = window.open(pdf.output("bloburl").toString(), "_blank");
  if (printWindow) return "opened";

  pdf.save(fileName);
  return "downloaded";
}
