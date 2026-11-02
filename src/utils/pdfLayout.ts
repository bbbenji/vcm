/**
 * Geometry for placing a captured mat image on an A4 PDF page.
 *
 * The physical 3D printed mat is 150x150mm for its 10x10 cell area, i.e. a 15mm
 * cell pitch. "actual-size" mode reproduces that pitch exactly by deriving the
 * mm-per-pixel factor from the measured on-screen cell width, so the result does
 * not depend on the browser window size the capture was taken at.
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** Cell pitch of the 3D printed mat. */
export const TARGET_CELL_MM = 15;

/** Kept clear of the page edges so printers do not force a "fit to page" rescale. */
export const MIN_MARGIN_MM = 8;

/**
 * Smaller allowance for 1:1 prints. The capture carries its own white padding
 * (~6mm at actual size), so ink never reaches these edges, and refusing a board
 * that is a millimetre over the usual margin would silently drop it to a scaled
 * print - which is the one thing an actual-size print must never do.
 */
export const ACTUAL_SIZE_MIN_MARGIN_MM = 5;

export type MatPdfLayoutMode = "actual-size" | "fit";

export interface MatPdfLayoutInput {
  /** Width of the captured element in CSS pixels. */
  containerWidthPx: number;
  /** Height of the captured element in CSS pixels. */
  containerHeightPx: number;
  /** Width of one main-grid cell in CSS pixels. */
  cellWidthPx: number;
  /** Page space reserved above the image, e.g. for the logo. */
  headerMm?: number;
  /** Page space reserved below the image, e.g. for a calibration ruler. */
  footerMm?: number;
}

export interface MatPdfLayout {
  /** Left edge of the image on the page, in mm. */
  x: number;
  /** Top edge of the image on the page, in mm. */
  y: number;
  widthMm: number;
  heightMm: number;
  /** Resulting cell pitch on paper, in mm. */
  cellMm: number;
  /** True when a cell lands on exactly TARGET_CELL_MM. */
  trueToSize: boolean;
}

interface Bands {
  /** Space kept clear at the top of the page. */
  top: number;
  /** Space kept clear at the bottom of the page. */
  bottom: number;
  /** Space kept clear at each side. */
  side: number;
}

/**
 * A reserved band doubles as the margin on that edge: a 18mm logo band already
 * keeps the board well clear of the paper edge, so the plain margin only applies
 * where nothing is reserved.
 */
function bandsFor(input: MatPdfLayoutInput, minMargin: number): Bands {
  return {
    top: Math.max(input.headerMm ?? 0, minMargin),
    bottom: Math.max(input.footerMm ?? 0, minMargin),
    side: minMargin,
  };
}

function place(
  input: MatPdfLayoutInput,
  mmPerPx: number,
  bands: Bands,
  trueToSize: boolean,
): MatPdfLayout {
  const widthMm = input.containerWidthPx * mmPerPx;
  const heightMm = input.containerHeightPx * mmPerPx;

  return {
    x: (A4_WIDTH_MM - widthMm) / 2,
    // Centred in the space left between the bands, not on the page.
    y: bands.top + (A4_HEIGHT_MM - bands.top - bands.bottom - heightMm) / 2,
    widthMm,
    heightMm,
    cellMm: input.cellWidthPx * mmPerPx,
    trueToSize,
  };
}

function fitLayout(input: MatPdfLayoutInput): MatPdfLayout {
  const bands = bandsFor(input, MIN_MARGIN_MM);
  const mmPerPx = Math.min(
    (A4_WIDTH_MM - 2 * bands.side) / input.containerWidthPx,
    (A4_HEIGHT_MM - bands.top - bands.bottom) / input.containerHeightPx,
  );

  return place(input, mmPerPx, bands, false);
}

export function computeMatPdfLayout(
  input: MatPdfLayoutInput,
  mode: MatPdfLayoutMode = "fit",
): MatPdfLayout {
  if (mode !== "actual-size" || !(input.cellWidthPx > 0)) {
    return fitLayout(input);
  }

  const bands = bandsFor(input, ACTUAL_SIZE_MIN_MARGIN_MM);
  const mmPerPx = TARGET_CELL_MM / input.cellWidthPx;
  const candidate = place(input, mmPerPx, bands, true);

  const fitsWidth = candidate.widthMm <= A4_WIDTH_MM - 2 * bands.side;
  const fitsHeight = candidate.heightMm <= A4_HEIGHT_MM - bands.top - bands.bottom;

  return fitsWidth && fitsHeight ? candidate : fitLayout(input);
}
