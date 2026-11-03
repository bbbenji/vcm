import { describe, it, expect } from "vitest";
import {
  computeMatPdfLayout,
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  TARGET_CELL_MM,
  MIN_MARGIN_MM,
  ACTUAL_SIZE_MIN_MARGIN_MM,
} from "./pdfLayout";

// Measurements taken from the real app layout in print mode (headless Chrome, `exporting`
// class applied, branding block hidden), with the instruction grid visible. A 10x10 board
// renders at 48px cells on desktop, 40px at 800px wide and 28px on a narrow phone viewport.
const desktop10x10 = { containerWidthPx: 610, containerHeightPx: 788, cellWidthPx: 48 };
const medium10x10 = { containerWidthPx: 514, containerHeightPx: 668, cellWidthPx: 40 };
const narrow10x10 = { containerWidthPx: 358, containerHeightPx: 460, cellWidthPx: 28 };
// 640-767px wide: 32px cells, the widest the board ever gets at 1:1 (195.9mm).
const small10x10 = { containerWidthPx: 418, containerHeightPx: 532, cellWidthPx: 32 };
const desktop20x20 = { containerWidthPx: 1090, containerHeightPx: 1268, cellWidthPx: 48 };

/** Band the print flow reserves for the QR/branding strip; kept in sync with matPdf.ts. */
const PRINT_HEADER_MM = 0;
const PRINT_FOOTER_MM = 36;

describe("computeMatPdfLayout, actual-size mode", () => {
  it("renders a cell at exactly 15mm on a desktop viewport", () => {
    const layout = computeMatPdfLayout(desktop10x10, "actual-size");

    expect(layout.trueToSize).toBe(true);
    expect(layout.cellMm).toBeCloseTo(TARGET_CELL_MM, 10);
    // 10 cells must span exactly 150mm, matching the 3D printed mat.
    expect(layout.cellMm * 10).toBeCloseTo(150, 10);
  });

  // Every breakpoint the board renders at must still print true to size with the
  // real footer reserved, otherwise the mat silently comes out scaled.
  it.each([
    ["narrow (28px cells)", narrow10x10],
    ["small (32px cells)", small10x10],
    ["medium (40px cells)", medium10x10],
    ["desktop (48px cells)", desktop10x10],
  ])("renders a cell at exactly 15mm on a %s viewport", (_label, input) => {
    const layout = computeMatPdfLayout(
      { ...input, headerMm: PRINT_HEADER_MM, footerMm: PRINT_FOOTER_MM },
      "actual-size",
    );

    expect(layout.trueToSize).toBe(true);
    expect(layout.cellMm).toBeCloseTo(TARGET_CELL_MM, 10);
    expect(layout.x).toBeGreaterThanOrEqual(ACTUAL_SIZE_MIN_MARGIN_MM);
    // The board must clear the logo band above and the ruler band below.
    expect(layout.y).toBeGreaterThanOrEqual(ACTUAL_SIZE_MIN_MARGIN_MM);
    expect(layout.y + layout.heightMm).toBeLessThanOrEqual(A4_HEIGHT_MM - PRINT_FOOTER_MM);
  });

  it("centres the board between the reserved bands", () => {
    const layout = computeMatPdfLayout(
      { ...desktop10x10, headerMm: PRINT_HEADER_MM, footerMm: PRINT_FOOTER_MM },
      "actual-size",
    );
    // A band smaller than the plain margin is widened to it, so the top reserve
    // here is the margin rather than PRINT_HEADER_MM.
    const topReserve = Math.max(PRINT_HEADER_MM, ACTUAL_SIZE_MIN_MARGIN_MM);
    const topGap = layout.y - topReserve;
    const bottomGap = A4_HEIGHT_MM - PRINT_FOOTER_MM - (layout.y + layout.heightMm);

    expect(topGap).toBeCloseTo(bottomGap, 6);
    expect(topGap).toBeGreaterThanOrEqual(0);
  });

  it("keeps the tallest board true to size with both bands reserved", () => {
    // medium10x10 is the tallest the board gets at 1:1 - 250.5mm, at a 900px
    // window with 40px cells, every label and the instruction grid shown.
    // Measured from the real layout, not assumed.
    const layout = computeMatPdfLayout(
      { ...medium10x10, headerMm: PRINT_HEADER_MM, footerMm: PRINT_FOOTER_MM },
      "actual-size",
    );

    expect(layout.heightMm).toBeCloseTo(250.5, 1);
    expect(layout.trueToSize).toBe(true);
  });

  it("scales the whole capture by the same mm-per-px factor as the cell", () => {
    const layout = computeMatPdfLayout(desktop10x10, "actual-size");
    const mmPerPx = TARGET_CELL_MM / desktop10x10.cellWidthPx;

    expect(layout.widthMm).toBeCloseTo(desktop10x10.containerWidthPx * mmPerPx, 10);
    expect(layout.heightMm).toBeCloseTo(desktop10x10.containerHeightPx * mmPerPx, 10);
  });

  it("centres the image on the page", () => {
    const layout = computeMatPdfLayout(desktop10x10, "actual-size");

    expect(layout.x).toBeCloseTo((A4_WIDTH_MM - layout.widthMm) / 2, 10);
    expect(layout.x + layout.widthMm).toBeCloseTo(A4_WIDTH_MM - layout.x, 10);
  });

  it("falls back to fit-to-page when 15mm cells cannot fit on A4", () => {
    const layout = computeMatPdfLayout(desktop20x20, "actual-size");

    expect(layout.trueToSize).toBe(false);
    expect(layout.cellMm).toBeLessThan(TARGET_CELL_MM);
  });

  it("reserves footer space when asked, and still keeps 15mm cells", () => {
    const layout = computeMatPdfLayout({ ...desktop10x10, footerMm: 20 }, "actual-size");

    expect(layout.trueToSize).toBe(true);
    expect(layout.cellMm).toBeCloseTo(TARGET_CELL_MM, 10);
    expect(layout.y + layout.heightMm).toBeLessThanOrEqual(A4_HEIGHT_MM - 20);
  });
});

describe("computeMatPdfLayout, fit mode", () => {
  it("never overflows the page, even for a tall narrow-viewport capture", () => {
    const layout = computeMatPdfLayout(narrow10x10, "fit");

    expect(layout.y).toBeGreaterThanOrEqual(MIN_MARGIN_MM);
    expect(layout.y + layout.heightMm).toBeLessThanOrEqual(A4_HEIGHT_MM - MIN_MARGIN_MM);
    expect(layout.x).toBeGreaterThanOrEqual(MIN_MARGIN_MM);
    expect(layout.x + layout.widthMm).toBeLessThanOrEqual(A4_WIDTH_MM - MIN_MARGIN_MM);
  });

  it("preserves the capture aspect ratio", () => {
    const layout = computeMatPdfLayout(desktop20x20, "fit");
    const sourceRatio = desktop20x20.containerHeightPx / desktop20x20.containerWidthPx;

    expect(layout.heightMm / layout.widthMm).toBeCloseTo(sourceRatio, 6);
  });

  it("fills the available width when the capture is wide", () => {
    const layout = computeMatPdfLayout(
      { containerWidthPx: 1000, containerHeightPx: 400, cellWidthPx: 48 },
      "fit",
    );

    expect(layout.widthMm).toBeCloseTo(A4_WIDTH_MM - 2 * MIN_MARGIN_MM, 6);
    expect(layout.trueToSize).toBe(false);
  });

  it("keeps a 20x20 board on the page", () => {
    const layout = computeMatPdfLayout({ ...desktop20x20, footerMm: 14 }, "fit");

    expect(layout.x).toBeGreaterThanOrEqual(MIN_MARGIN_MM);
    expect(layout.y).toBeGreaterThanOrEqual(MIN_MARGIN_MM);
    expect(layout.y + layout.heightMm).toBeLessThanOrEqual(A4_HEIGHT_MM - 14);
  });
});

describe("computeMatPdfLayout, invalid input", () => {
  it("does not divide by zero when the cell width is unknown", () => {
    const layout = computeMatPdfLayout(
      { containerWidthPx: 610, containerHeightPx: 912, cellWidthPx: 0 },
      "actual-size",
    );

    expect(layout.trueToSize).toBe(false);
    expect(Number.isFinite(layout.widthMm)).toBe(true);
    expect(layout.widthMm).toBeGreaterThan(0);
  });
});
