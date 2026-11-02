import { describe, it, expect, vi, afterEach } from "vitest";
import { waitForRepaint } from "./waitForRepaint";

const originalRaf = globalThis.requestAnimationFrame;

afterEach(() => {
  globalThis.requestAnimationFrame = originalRaf;
  vi.useRealTimers();
});

describe("waitForRepaint", () => {
  it("resolves after two animation frames when the page is visible", async () => {
    let frames = 0;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      frames++;
      setTimeout(() => cb(performance.now()), 0);
      return frames;
    }) as typeof globalThis.requestAnimationFrame;

    await waitForRepaint(1000);

    expect(frames).toBe(2);
  });

  it("still resolves when animation frames never fire, as in a hidden tab", async () => {
    // Chrome stops servicing requestAnimationFrame once the tab is backgrounded,
    // which happens to the opener as soon as window.open() focuses the new tab.
    globalThis.requestAnimationFrame = (() => 1) as typeof globalThis.requestAnimationFrame;

    const start = Date.now();
    await waitForRepaint(40);

    expect(Date.now() - start).toBeGreaterThanOrEqual(30);
  });

  it("resolves when requestAnimationFrame is unavailable altogether", async () => {
    globalThis.requestAnimationFrame =
      undefined as unknown as typeof globalThis.requestAnimationFrame;

    await expect(waitForRepaint(20)).resolves.toBeUndefined();
  });

  it("resolves only once when frames fire and the fallback also elapses", async () => {
    const resolved = vi.fn();
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      setTimeout(() => cb(performance.now()), 0);
      return 1;
    }) as typeof globalThis.requestAnimationFrame;

    await waitForRepaint(10).then(resolved);
    await new Promise((r) => setTimeout(r, 40));

    expect(resolved).toHaveBeenCalledTimes(1);
  });
});
