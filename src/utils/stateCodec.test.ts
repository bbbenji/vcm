import { describe, it, expect } from "vitest";
import {
  encodeBoardState,
  decodeBoardState,
  type CompactState,
  type CompactCell,
} from "./stateCodec";

const empty = (size: CompactState["s"] = 10): CompactState => ({ s: size, m: [], sec: [] });

const cell = (
  r: number,
  c: number,
  bg: string | null = null,
  icon: string | null = null,
  text: string | null = null,
): CompactCell => [r, c, bg, icon, text];

/** Cells compare equal regardless of ordering within a grid. */
const sortCells = (cells: CompactCell[]) =>
  [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

const roundTrip = (state: CompactState): CompactState => {
  const encoded = encodeBoardState(state);
  const decoded = decodeBoardState(encoded);
  expect(decoded).not.toBeNull();
  return decoded as CompactState;
};

const expectRoundTrip = (state: CompactState) => {
  const decoded = roundTrip(state);
  expect(decoded.s).toBe(state.s);
  expect(sortCells(decoded.m)).toEqual(sortCells(state.m));
  expect(sortCells(decoded.sec)).toEqual(sortCells(state.sec));
};

describe("encodeBoardState output", () => {
  it("produces only URL-safe characters", () => {
    const state: CompactState = {
      s: 10,
      m: [cell(0, 0, "#3b82f6"), cell(9, 9, null, "Bot"), cell(4, 4, null, null, "Ż")],
      sec: [cell(0, 0, null, "Play")],
    };

    expect(encodeBoardState(state)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("is dramatically shorter than the legacy JSON encoding", () => {
    const m: CompactCell[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) m.push(cell(r, c, "#3b82f6"));
    }
    const state: CompactState = { s: 10, m, sec: [] };

    const legacy = btoa(encodeURIComponent(JSON.stringify(state)));
    const encoded = encodeBoardState(state);

    expect(encoded.length).toBeLessThan(legacy.length / 10);
  });
});

describe("round trip", () => {
  it("handles an empty board", () => {
    expectRoundTrip(empty());
  });

  it.each([10, 12, 14, 16, 18, 20] as const)("handles a %ix grid", (size) => {
    expectRoundTrip({
      s: size,
      m: [cell(0, 0, "#ef4444"), cell(size - 1, size - 1, null, "Bot")],
      sec: [cell(2, size - 1, null, null, "9")],
    });
  });

  it("handles backgrounds with a small palette", () => {
    const m = [
      cell(0, 0, "#3b82f6"),
      cell(0, 1, "#3b82f6"),
      cell(1, 0, "#ef4444"),
      cell(9, 9, "#22c55e"),
    ];
    expectRoundTrip({ s: 10, m, sec: [] });
  });

  it("handles more than 15 distinct colours, which needs the wide index path", () => {
    const m: CompactCell[] = [];
    for (let i = 0; i < 40; i++) {
      const hex = `#${i.toString(16).padStart(2, "0")}2244`;
      m.push(cell(Math.floor(i / 10), i % 10, hex));
    }
    expectRoundTrip({ s: 10, m, sec: [] });
  });

  it("handles icons on both grids", () => {
    expectRoundTrip({
      s: 10,
      m: [cell(0, 0, null, "Bot"), cell(5, 5, null, "EvCharger"), cell(9, 0, null, "Rocket")],
      sec: [cell(0, 0, null, "Play"), cell(0, 1, null, "ArrowUp"), cell(1, 0, null, "RotateCw")],
    });
  });

  it("keeps an icon it does not know about", () => {
    expectRoundTrip({ s: 10, m: [cell(3, 3, null, "SomeFutureIcon")], sec: [] });
  });

  it("handles text, including Polish and emoji", () => {
    expectRoundTrip({
      s: 10,
      m: [cell(0, 0, null, null, "A"), cell(1, 1, null, null, "Ż"), cell(2, 2, null, null, "🤖")],
      sec: [cell(0, 0, null, null, "5")],
    });
  });

  it("handles a cell carrying background, icon and text at once", () => {
    expectRoundTrip({ s: 10, m: [cell(4, 4, "#f43f5e", "Bot", "X")], sec: [] });
  });

  it("handles a fully painted largest grid", () => {
    const m: CompactCell[] = [];
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 20; c++) m.push(cell(r, c, (r + c) % 2 ? "#000000" : "#ffffff"));
    }
    expectRoundTrip({ s: 20, m, sec: [] });
  });
});

describe("decodeBoardState rejects bad input", () => {
  it.each([
    ["empty string", ""],
    ["not base64url", "!!!!"],
    ["truncated payload", "AQ"],
    ["random text", "hello-world"],
  ])("returns null for %s", (_label, input) => {
    expect(decodeBoardState(input)).toBeNull();
  });

  it("returns null for an unknown format version", () => {
    // First byte is the format version; 0x7f is not one we write.
    const bogus = btoa(String.fromCharCode(0x7f, 10, 0))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeBoardState(bogus)).toBeNull();
  });

  it("returns null rather than throwing on a corrupted body", () => {
    const good = encodeBoardState({ s: 10, m: [cell(0, 0, "#123456")], sec: [] });
    expect(() => decodeBoardState(good.slice(0, 4))).not.toThrow();
  });
});

describe("fuzz", () => {
  it("round trips randomly generated boards", () => {
    const icons = ["Bot", "Rocket", "ArrowUp", "EvCharger", "Play"];
    const texts = ["1", "A", "Ż", "🤖", "12"];
    let seed = 12345;
    const rnd = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };

    for (let iteration = 0; iteration < 60; iteration++) {
      const size = ([10, 12, 14, 16, 18, 20] as const)[rnd(6)]!;
      const used = new Set<string>();
      const m: CompactCell[] = [];
      for (let i = 0; i < rnd(60); i++) {
        const r = rnd(size);
        const c = rnd(size);
        if (used.has(`${r},${c}`)) continue;
        used.add(`${r},${c}`);
        m.push(
          cell(
            r,
            c,
            rnd(2) ? `#${rnd(16).toString(16).repeat(6)}` : null,
            rnd(3) === 0 ? icons[rnd(icons.length)]! : null,
            rnd(4) === 0 ? texts[rnd(texts.length)]! : null,
          ),
        );
      }
      const kept = m.filter((x) => x[2] || x[3] || x[4]);
      expectRoundTrip({ s: size, m: kept, sec: [] });
    }
  });
});
