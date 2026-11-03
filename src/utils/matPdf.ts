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

/** Site the QR code and link point at. */
export const SITE_URL = "https://kodowanie.mamywydruki.pl/";
const SITE_LABEL = "kodowanie.mamywydruki.pl";

/**
 * Everything below the board sits in one strip: QR code, logo and link, plus
 * the calibration ruler on prints. Keeping it to a single row rather than
 * stacking rows leaves ~17mm of slack against the tallest board, so a 1:1 print
 * cannot be quietly demoted to a scaled one just to fit the branding in.
 */
const FOOTER_MM = 30;

/**
 * Footer ink is positioned up from the bottom edge, not down from the reserved
 * band, so the lowest text keeps a comfortable margin on printers whose
 * unprintable area is larger than this one's ~4mm.
 */
const FOOTER_BOTTOM_MARGIN_MM = 8;

const QR_SIZE_MM = 20;
const QR_GAP_MM = 5;
/** Quiet zone required around a QR code, in modules. */
const QR_QUIET_MODULES = 4;

const RULER_LENGTH_MM = 100;
const RULER_GAP_MM = 9;

/**
 * The logo is drawn straight into the PDF at a fixed physical size rather than
 * captured from the page. The DOM logo block is a fixed pixel height, so at 1:1
 * it would measure 39mm on a wide window and 66mm on a phone - enough to push
 * the board off A4 and silently demote the print to a scaled one.
 */
const LOGO_WIDTH_MM = 26;
const LOGO_TIMEOUT_MS = 5000;

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

export interface PdfCopy {
  /** Invitation printed above the link, e.g. "Make your own at:". */
  cta: string;
  /** Ruler note when a cell is exactly TARGET_CELL_MM; `{mm}` is substituted. */
  exact?: string;
  /** Ruler note when the board had to be scaled to fit A4; `{mm}` is substituted. */
  scaled?: string;
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

export async function exportMatPdf(fileName: string, copy: PdfCopy): Promise<boolean> {
  // hideBranding drops the logo block from the capture; it is drawn into the
  // footer strip below instead, alongside the QR code and link.
  const capture = await captureMat({ hideBranding: true });
  if (!capture) return false;

  const logo = await loadLogo();
  const { pdf, layout } = await createPdf(capture, "fit", 0, FOOTER_MM);
  await drawFooter(pdf, layout, logo, copy);
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

/** Draws the QR code as vector squares, so it stays crisp at any print size. */
// `export =` means the module type IS the factory, while the ESM build this
// resolves to at runtime exposes it as the default export.
type QrFactory = typeof import("qrcode-generator");

function drawQrCode(
  pdf: import("jspdf").jsPDF,
  qrcode: QrFactory,
  x: number,
  y: number,
  size: number,
) {
  const qr = qrcode(0, "M");
  qr.addData(SITE_URL);
  qr.make();

  const modules = qr.getModuleCount();
  // The quiet zone is part of the symbol: without it scanners struggle.
  const scale = size / (modules + QR_QUIET_MODULES * 2);
  const originX = x + QR_QUIET_MODULES * scale;
  const originY = y + QR_QUIET_MODULES * scale;

  pdf.setFillColor(15, 23, 42); // slate-900
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (!qr.isDark(row, col)) continue;
      // Overdraw by a hair so neighbouring modules meet with no seam.
      pdf.rect(originX + col * scale, originY + row * scale, scale + 0.02, scale + 0.02, "F");
    }
  }
}

/**
 * Lays out the footer strip: QR code, logo over the site link, and - on prints -
 * a 100mm calibration bar so a printer that silently rescales can be caught
 * with a ruler. The whole strip is centred as one group.
 */
async function drawFooter(
  pdf: import("jspdf").jsPDF,
  layout: MatPdfLayout,
  logo: LogoBitmap | null,
  copy: PdfCopy,
) {
  // Only needed when a PDF is actually produced, so it stays out of the chunk
  // that loads with the share menu.
  const { default: qrcode } = await import("qrcode-generator");
  const bottom = A4_HEIGHT_MM - FOOTER_BOTTOM_MARGIN_MM;
  const top = bottom - QR_SIZE_MM;
  const withRuler = Boolean(copy.exact && copy.scaled);

  pdf.setTextColor(100, 116, 139); // slate-500

  const logoHeightMm = logo ? LOGO_WIDTH_MM / logo.ratio : 0;
  pdf.setFontSize(7);
  const ctaWidth = pdf.getTextWidth(copy.cta);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  const labelWidth = pdf.getTextWidth(SITE_LABEL);
  pdf.setFont("helvetica", "normal");
  const textBlockWidth = Math.max(logo ? LOGO_WIDTH_MM : 0, ctaWidth, labelWidth);

  let groupWidth = QR_SIZE_MM + QR_GAP_MM + textBlockWidth;
  if (withRuler) groupWidth += RULER_GAP_MM + RULER_LENGTH_MM;

  const qrX = (A4_WIDTH_MM - groupWidth) / 2;
  const textX = qrX + QR_SIZE_MM + QR_GAP_MM;

  drawQrCode(pdf, qrcode, qrX, top, QR_SIZE_MM);

  if (logo) {
    pdf.addImage(logo.dataUrl, "PNG", textX, top + 0.5, LOGO_WIDTH_MM, logoHeightMm);
  }

  // "Make your own at:" above the address, so the QR has an obvious purpose.
  pdf.setFontSize(7);
  pdf.text(copy.cta, textX, top + logoHeightMm + 4);

  // Visible link text, and a real PDF hyperlink over it.
  const labelBaseline = bottom - 1;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(79, 70, 229); // indigo-600, so it reads as a link
  pdf.textWithLink(SITE_LABEL, textX, labelBaseline, { url: SITE_URL });
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);

  if (!copy.exact || !copy.scaled) return;

  const rulerX = textX + textBlockWidth + RULER_GAP_MM;
  const rulerY = top + QR_SIZE_MM / 2;

  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.25);
  pdf.line(rulerX, rulerY, rulerX + RULER_LENGTH_MM, rulerY);
  for (let offset = 0; offset <= RULER_LENGTH_MM; offset += 10) {
    const tick = offset === 0 || offset === RULER_LENGTH_MM ? 2.4 : 1.2;
    pdf.line(rulerX + offset, rulerY - tick, rulerX + offset, rulerY + tick);
  }

  const cellMm = Math.round(layout.cellMm * 10) / 10;
  const note = (layout.trueToSize ? copy.exact : copy.scaled).replace(
    "{mm}",
    layout.trueToSize ? String(TARGET_CELL_MM) : cellMm.toFixed(1),
  );
  const rulerCentre = rulerX + RULER_LENGTH_MM / 2;
  pdf.text(`${RULER_LENGTH_MM} mm`, rulerCentre, rulerY - 3.5, { align: "center" });
  pdf.text(note, rulerCentre, labelBaseline, { align: "center" });
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
export async function printMatPdf(fileName: string, copy: PdfCopy): Promise<PrintOutcome> {
  const capture = await captureMat({ hideBranding: true });
  if (!capture) return "unavailable";

  const logo = await loadLogo();
  const { pdf, layout } = await createPdf(capture, "actual-size", 0, FOOTER_MM);
  await drawFooter(pdf, layout, logo, copy);
  // Best effort: the "javascript" variant uses the /Names tree instead of a second
  // /OpenAction key, which would make the catalog malformed. Viewers that block PDF
  // JavaScript (Chrome's built-in one does) simply show the file instead.
  pdf.autoPrint({ variant: "javascript" });

  const printWindow = window.open(pdf.output("bloburl").toString(), "_blank");
  if (printWindow) return "opened";

  pdf.save(fileName);
  return "downloaded";
}
