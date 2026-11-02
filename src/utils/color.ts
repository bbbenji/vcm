/**
 * Colour helpers for deciding when a cell colour needs an outline to stay
 * visible. A white or pale dot printed on white paper disappears entirely, so
 * dot mode rings those colours instead of relying on the fill alone.
 */

/** Above this WCAG relative luminance a colour reads as "pale" against paper. */
const PALE_LUMINANCE_THRESHOLD = 0.7;

function parseHex(color: string): [number, number, number] | null {
  const value = color.trim().toLowerCase();
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (!match) return null;

  const digits = match[1] ?? "";
  const expanded =
    digits.length === 3
      ? digits
          .split("")
          .map((d) => d + d)
          .join("")
      : digits;

  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance in [0, 1], or null if the colour cannot be parsed. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;

  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** True when a colour is too light to be seen on white paper without an outline. */
export function isPaleColor(color: string): boolean {
  const luminance = relativeLuminance(color);
  return luminance !== null && luminance > PALE_LUMINANCE_THRESHOLD;
}
