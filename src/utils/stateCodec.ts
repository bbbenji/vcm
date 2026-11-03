/**
 * Compact binary encoding of a board, for putting a whole design in a URL.
 *
 * The original format was `btoa(encodeURIComponent(JSON.stringify(state)))`.
 * JSON punctuation and the `#` of every colour get percent-escaped before
 * base64 runs, which roughly triples the payload and then adds a third again -
 * a 20 cell board came out at over 1300 characters, far past what a QR code can
 * carry. This packs the same information into bytes instead.
 *
 * Layout (all integers little-endian where multi-byte, lengths as varints):
 *
 *   u8    format version
 *   u8    grid size
 *   u8    section bitmask (see SECTION_*), so empty sections cost nothing
 *   u8    palette length P        | only when a background section is present
 *   u8[]  P * 3 RGB triples       |
 *   ...   per present section, in bit order
 *
 * A background section is a dense plane of palette indices, one per cell, 0
 * meaning no background. The index width adapts to the palette - 1 bit for a
 * single colour, then 2, 4 and 8 - because most designs use very few colours
 * and a one-colour maze would otherwise waste four bits per cell. Icon and text
 * sections are sparse lists keyed by cell index, because they are almost always
 * a handful of cells.
 *
 * The format is versioned and decoding is total: anything unparseable returns
 * null so the caller can fall back to the legacy format.
 */

export type CompactCell = [number, number, string | null, string | null, string | null];

export interface CompactState {
  s: number;
  m: CompactCell[];
  sec: CompactCell[];
}

const FORMAT_VERSION = 1;

/** Rows in the instruction grid; mirrors SECONDARY_ROWS in the store. */
const SECONDARY_ROWS = 3;

const SECTION_MAIN_BG = 1 << 0;
const SECTION_MAIN_ICON = 1 << 1;
const SECTION_MAIN_TEXT = 1 << 2;
const SECTION_SEC_BG = 1 << 3;
const SECTION_SEC_ICON = 1 << 4;
const SECTION_SEC_TEXT = 1 << 5;

/**
 * Icon ids are positional and this list is append-only: reordering or removing
 * an entry would silently change what every existing shared link decodes to.
 * An icon missing from here still round trips, just by name (see ICON_BY_NAME).
 */
const ICON_TABLE = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "RotateCw",
  "RotateCcw",
  "CornerUpLeft",
  "CornerUpRight",
  "Play",
  "Bot",
  "EvCharger",
  "Square",
  "Eraser",
  "Move",
  "Bike",
  "Binary",
  "Bird",
  "Bug",
  "Bus",
  "Car",
  "Cat",
  "Dog",
  "Fish",
  "Gamepad2",
  "HelpCircle",
  "Palette",
  "Plane",
  "Puzzle",
  "Rabbit",
  "Rocket",
  "Ship",
  "Smile",
  "Snail",
  "Tractor",
  "TrainFront",
  "Turtle",
  "Type",
  "PartyPopper",
  "Zap",
  "Compass",
  "BookOpen",
  "FolderHeart",
  "FolderOpen",
  "History",
  "Activity",
  "MapPin",
  "Leaf",
  "Package",
  "Apple",
  "Hash",
  "Flag",
  "Calculator",
  "EqualNot",
  "Superscript",
  "Pi",
  "Infinity",
  "Triangle",
  "PlayFilled",
  "StopFilled",
  "F1Icon",
  "F2Icon",
  "LoopPlayIcon",
  "LoopStopIcon",
  "Num2Icon",
  "Num3Icon",
  "Num4Icon",
  "Num5Icon",
  "Num6Icon",
] as const;

/** Marks an icon stored by name because it is not in ICON_TABLE. */
const ICON_BY_NAME = 0xff;

const ICON_IDS = new Map(ICON_TABLE.map((name, index) => [name as string, index]));

class ByteWriter {
  private readonly bytes: number[] = [];

  u8(value: number) {
    this.bytes.push(value & 0xff);
  }

  varint(value: number) {
    let v = value >>> 0;
    while (v >= 0x80) {
      this.bytes.push((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    this.bytes.push(v);
  }

  raw(values: ArrayLike<number>) {
    for (let i = 0; i < values.length; i++) this.bytes.push(values[i]! & 0xff);
  }

  /** Length-prefixed UTF-8. */
  text(value: string) {
    const encoded = new TextEncoder().encode(value);
    this.varint(encoded.length);
    this.raw(encoded);
  }

  toUint8Array() {
    return Uint8Array.from(this.bytes);
  }
}

class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done() {
    return this.offset >= this.bytes.length;
  }

  u8(): number {
    if (this.offset >= this.bytes.length) throw new RangeError("unexpected end of state");
    return this.bytes[this.offset++]!;
  }

  varint(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.u8();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result >>> 0;
      shift += 7;
      if (shift > 28) throw new RangeError("varint too long");
    }
  }

  take(count: number): Uint8Array {
    if (this.offset + count > this.bytes.length) {
      throw new RangeError("unexpected end of state");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return slice;
  }

  text(): string {
    return new TextDecoder().decode(this.take(this.varint()));
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalised = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseHexColor(value: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1]!;
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

const toHexColor = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

interface Plane {
  /** Palette index per cell, 0 meaning empty. */
  background: number[];
  icons: Array<{ index: number; value: string }>;
  texts: Array<{ index: number; value: string }>;
  hasBackground: boolean;
}

function buildPlane(
  cells: CompactCell[],
  rows: number,
  cols: number,
  paletteIds: Map<string, number>,
): Plane {
  const background: number[] = Array.from({ length: rows * cols }, () => 0);
  const icons: Plane["icons"] = [];
  const texts: Plane["texts"] = [];
  let hasBackground = false;

  for (const [r, c, bg, icon, text] of cells) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    const index = r * cols + c;

    if (bg) {
      const id = paletteIds.get(bg.toLowerCase());
      if (id !== undefined) {
        background[index] = id + 1;
        hasBackground = true;
      }
    }
    if (icon) icons.push({ index, value: icon });
    if (text) texts.push({ index, value: text });
  }

  return { background, icons, texts, hasBackground };
}

/**
 * Bits needed per cell to hold a palette index plus the 0 "empty" value. Both
 * sides derive this from the palette length, so it costs nothing to store.
 */
function bitsForPalette(paletteLength: number): number {
  if (paletteLength <= 1) return 1;
  if (paletteLength <= 3) return 2;
  if (paletteLength <= 15) return 4;
  return 8;
}

/**
 * Only cells up to the last painted one are stored, with that count as a
 * varint; the rest of the plane is empty by definition. Designs rarely paint
 * the bottom-right corner, and the trailing run was otherwise costing a byte
 * per two cells for nothing.
 */
function writeBackground(writer: ByteWriter, plane: Plane, bits: number) {
  let used = plane.background.length;
  while (used > 0 && plane.background[used - 1] === 0) used--;
  writer.varint(used);
  if (used === 0) return;

  if (bits === 8) {
    writer.raw(plane.background.slice(0, used));
    return;
  }
  const perByte = 8 / bits;
  const mask = (1 << bits) - 1;
  for (let i = 0; i < used; i += perByte) {
    let byte = 0;
    for (let slot = 0; slot < perByte; slot++) {
      byte |= ((plane.background[i + slot] ?? 0) & mask) << (8 - bits * (slot + 1));
    }
    writer.u8(byte);
  }
}

function readBackground(reader: ByteReader, count: number, bits: number): number[] {
  const used = reader.varint();
  if (used > count) throw new RangeError("background plane longer than the grid");

  const values: number[] =
    bits === 8
      ? Array.from(reader.take(used))
      : (() => {
          const perByte = 8 / bits;
          const mask = (1 << bits) - 1;
          const packed = reader.take(Math.ceil(used / perByte));
          const out: number[] = [];
          for (let i = 0; i < packed.length; i++) {
            for (let slot = 0; slot < perByte; slot++) {
              out.push((packed[i]! >> (8 - bits * (slot + 1))) & mask);
            }
          }
          return out.slice(0, used);
        })();

  while (values.length < count) values.push(0);
  return values;
}

function writeIcons(writer: ByteWriter, icons: Plane["icons"]) {
  writer.varint(icons.length);
  for (const { index, value } of icons) {
    writer.varint(index);
    const id = ICON_IDS.get(value);
    if (id === undefined) {
      writer.u8(ICON_BY_NAME);
      writer.text(value);
    } else {
      writer.u8(id);
    }
  }
}

function writeTexts(writer: ByteWriter, texts: Plane["texts"]) {
  writer.varint(texts.length);
  for (const { index, value } of texts) {
    writer.varint(index);
    writer.text(value);
  }
}

export function encodeBoardState(state: CompactState): string {
  const size = state.s;
  const writer = new ByteWriter();

  // Palette: distinct background colours across both grids, in first-seen order.
  const paletteIds = new Map<string, number>();
  const palette: Array<[number, number, number]> = [];
  for (const cells of [state.m, state.sec]) {
    for (const [, , bg] of cells) {
      if (!bg) continue;
      const key = bg.toLowerCase();
      if (paletteIds.has(key)) continue;
      const rgb = parseHexColor(key);
      if (!rgb) continue;
      paletteIds.set(key, palette.length);
      palette.push(rgb);
    }
  }

  const main = buildPlane(state.m, size, size, paletteIds);
  const secondary = buildPlane(state.sec, SECONDARY_ROWS, size, paletteIds);

  let sections = 0;
  if (main.hasBackground) sections |= SECTION_MAIN_BG;
  if (main.icons.length) sections |= SECTION_MAIN_ICON;
  if (main.texts.length) sections |= SECTION_MAIN_TEXT;
  if (secondary.hasBackground) sections |= SECTION_SEC_BG;
  if (secondary.icons.length) sections |= SECTION_SEC_ICON;
  if (secondary.texts.length) sections |= SECTION_SEC_TEXT;

  writer.u8(FORMAT_VERSION);
  writer.u8(size);
  writer.u8(sections);

  const needsPalette = Boolean(sections & (SECTION_MAIN_BG | SECTION_SEC_BG));
  const bits = bitsForPalette(palette.length);
  if (needsPalette) {
    writer.u8(palette.length);
    for (const [r, g, b] of palette) {
      writer.u8(r);
      writer.u8(g);
      writer.u8(b);
    }
  }

  if (sections & SECTION_MAIN_BG) writeBackground(writer, main, bits);
  if (sections & SECTION_MAIN_ICON) writeIcons(writer, main.icons);
  if (sections & SECTION_MAIN_TEXT) writeTexts(writer, main.texts);
  if (sections & SECTION_SEC_BG) writeBackground(writer, secondary, bits);
  if (sections & SECTION_SEC_ICON) writeIcons(writer, secondary.icons);
  if (sections & SECTION_SEC_TEXT) writeTexts(writer, secondary.texts);

  return toBase64Url(writer.toUint8Array());
}

type CellDraft = { bg: string | null; icon: string | null; text: string | null };

function draftsToCells(drafts: Map<number, CellDraft>, cols: number): CompactCell[] {
  const cells: CompactCell[] = [];
  for (const [index, draft] of drafts) {
    if (!draft.bg && !draft.icon && !draft.text) continue;
    cells.push([Math.floor(index / cols), index % cols, draft.bg, draft.icon, draft.text]);
  }
  return cells;
}

function draftFor(drafts: Map<number, CellDraft>, index: number): CellDraft {
  const existing = drafts.get(index);
  if (existing) return existing;
  const created: CellDraft = { bg: null, icon: null, text: null };
  drafts.set(index, created);
  return created;
}

export function decodeBoardState(encoded: string): CompactState | null {
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;

  try {
    const reader = new ByteReader(fromBase64Url(encoded));

    if (reader.u8() !== FORMAT_VERSION) return null;
    const size = reader.u8();
    if (size < 2 || size > 64) return null;
    const sections = reader.u8();

    const palette: string[] = [];
    if (sections & (SECTION_MAIN_BG | SECTION_SEC_BG)) {
      const count = reader.u8();
      for (let i = 0; i < count; i++) {
        const rgb = reader.take(3);
        palette.push(toHexColor(rgb[0]!, rgb[1]!, rgb[2]!));
      }
    }
    const bits = bitsForPalette(palette.length);

    const mainDrafts = new Map<number, CellDraft>();
    const secDrafts = new Map<number, CellDraft>();

    const readPlane = (
      drafts: Map<number, CellDraft>,
      cellCount: number,
      bgBit: number,
      iconBit: number,
      textBit: number,
    ) => {
      if (sections & bgBit) {
        const values = readBackground(reader, cellCount, bits);
        values.forEach((value, index) => {
          if (value === 0) return;
          const colour = palette[value - 1];
          if (colour) draftFor(drafts, index).bg = colour;
        });
      }
      if (sections & iconBit) {
        const count = reader.varint();
        for (let i = 0; i < count; i++) {
          const index = reader.varint();
          const id = reader.u8();
          const name = id === ICON_BY_NAME ? reader.text() : ICON_TABLE[id];
          if (name) draftFor(drafts, index).icon = name;
        }
      }
      if (sections & textBit) {
        const count = reader.varint();
        for (let i = 0; i < count; i++) {
          const index = reader.varint();
          const value = reader.text();
          if (value) draftFor(drafts, index).text = value;
        }
      }
    };

    readPlane(mainDrafts, size * size, SECTION_MAIN_BG, SECTION_MAIN_ICON, SECTION_MAIN_TEXT);
    readPlane(
      secDrafts,
      SECONDARY_ROWS * size,
      SECTION_SEC_BG,
      SECTION_SEC_ICON,
      SECTION_SEC_TEXT,
    );

    return {
      s: size,
      m: draftsToCells(mainDrafts, size),
      sec: draftsToCells(secDrafts, size),
    };
  } catch {
    return null;
  }
}
