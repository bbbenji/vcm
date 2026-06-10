import { describe, it, expect } from "vitest";
import { buildAiPrompt } from "./aiPrompt";

describe("buildAiPrompt", () => {
  it("includes the subject, declared size and import format markers (en)", () => {
    const prompt = buildAiPrompt("en", "a car", 18);
    expect(prompt).toContain("a car");
    expect(prompt).toContain("Size: 18x18");
    expect(prompt).toContain("A-R");
    expect(prompt).toContain("Background: #");
    expect(prompt).toContain("=>");
  });

  it("uses Polish headings recognized by the coordinate importer", () => {
    const prompt = buildAiPrompt("pl", "samochód", 12);
    expect(prompt).toContain("samochód");
    expect(prompt).toContain("Rozmiar: 12x12");
    expect(prompt).toContain("A-L");
    expect(prompt).toContain("Tło: #");
  });
});
