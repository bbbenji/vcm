import { describe, expect, it } from "vitest";
import { templates, trayDesigns, isTrayDesign } from "./templates";
import { translations } from "./i18n";

describe("isTrayDesign", () => {
  it("accepts a 10x10 board painted only with colours", () => {
    expect(
      isTrayDesign({
        id: "x",
        size: 10,
        type: "premade",
        category: "pixel_art",
        main: [[0, 0, "#ef4444", null, null]],
        secondary: [],
      }),
    ).toBe(true);
  });

  it("rejects a board too big for the tray", () => {
    expect(
      isTrayDesign({
        id: "x",
        size: 12,
        type: "premade",
        category: "pixel_art",
        main: [[0, 0, "#ef4444", null, null]],
        secondary: [],
      }),
    ).toBe(false);
  });

  it("rejects a board that places icons or text", () => {
    expect(
      isTrayDesign({
        id: "x",
        size: 10,
        type: "premade",
        category: "pixel_art",
        main: [[0, 0, "#ef4444", "ArrowUp", null]],
        secondary: [],
      }),
    ).toBe(false);
  });

  it("rejects a task that needs the coding section", () => {
    expect(
      isTrayDesign({
        id: "x",
        size: 10,
        type: "instruction",
        category: "algorithm",
        main: [[0, 0, "#ef4444", null, null]],
        secondary: [],
      }),
    ).toBe(false);
  });
});

describe("trayDesigns", () => {
  it("picks up the colour-only 10x10 designs already shipped", () => {
    const ids = trayDesigns.map((t) => t.id);
    expect(ids).toContain("heart");
    expect(ids).toContain("rocket");
    expect(ids).toContain("flower");
    expect(ids).toContain("house");
  });

  it("leaves out boards that do not fit the 16.5cm tray", () => {
    const ids = trayDesigns.map((t) => t.id);
    expect(ids).not.toContain("castle");
    expect(ids).not.toContain("digital_robot");
  });

  it("leaves out boards that are not painted with colours alone", () => {
    const ids = trayDesigns.map((t) => t.id);
    expect(ids).not.toContain("maze1");
    expect(ids).not.toContain("coded_heart");
  });

  // Nothing reaches the tray tab unless it really fits the tray.
  it("only ever offers 10x10 colour-only boards", () => {
    for (const design of trayDesigns) {
      expect(design.size).toBe(10);
      expect(design.secondary).toHaveLength(0);
      for (const [, , bg, icon, text] of design.main) {
        expect(bg).toBeTruthy();
        expect(icon).toBeNull();
        expect(text).toBeNull();
      }
    }
  });
});

describe("template translations", () => {
  it("names and describes every shipped template in both languages", () => {
    const missing: string[] = [];

    for (const tpl of templates) {
      for (const lang of ["pl", "en"] as const) {
        for (const suffix of ["name", "desc"] as const) {
          const key = `tpl_${tpl.id}_${suffix}`;
          const value = translations[lang][key as keyof (typeof translations)[typeof lang]];
          if (typeof value !== "string" || value.length === 0) {
            missing.push(`${lang}.${key}`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
