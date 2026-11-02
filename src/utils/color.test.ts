import { describe, it, expect } from "vitest";
import { relativeLuminance, isPaleColor } from "./color";

describe("relativeLuminance", () => {
  it("returns 1 for white and 0 for black", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("accepts shorthand hex", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000")).toBeCloseTo(0, 5);
  });

  it("is case insensitive and tolerates surrounding space", () => {
    expect(relativeLuminance("  #FFFFFF ")).toBeCloseTo(1, 5);
  });

  it("returns null for values it cannot parse", () => {
    expect(relativeLuminance("rebeccapurple")).toBeNull();
    expect(relativeLuminance("")).toBeNull();
    expect(relativeLuminance("#12345")).toBeNull();
  });
});

describe("isPaleColor", () => {
  it("treats white as pale, so a dot on white paper gets an outline", () => {
    expect(isPaleColor("#ffffff")).toBe(true);
  });

  it.each([
    ["pale yellow", "#fde047"],
    ["light grey", "#e5e7eb"],
    ["cream", "#fef9c3"],
  ])("treats %s as pale too", (_label, hex) => {
    expect(isPaleColor(hex)).toBe(true);
  });

  it.each([
    ["blue", "#3b82f6"],
    ["green", "#22c55e"],
    ["black", "#000000"],
    ["rose", "#f43f5e"],
  ])("leaves %s alone", (_label, hex) => {
    expect(isPaleColor(hex)).toBe(false);
  });

  it("does not outline colours it cannot parse", () => {
    expect(isPaleColor("not-a-colour")).toBe(false);
  });
});
