/**
 * Waits for the browser to apply pending style/layout changes before reading the
 * DOM back.
 *
 * Two animation frames are the reliable signal while the tab is visible, but a
 * backgrounded tab never gets them: Chrome stops servicing requestAnimationFrame
 * as soon as the document is hidden, which happens to the opener the moment
 * window.open() focuses a new tab. Without the timeout fallback the caller hangs
 * forever instead of producing its capture.
 */
export function waitForRepaint(timeoutMs = 60): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    // `done` only ever runs asynchronously, so reading `timer` from it is safe.
    const timer = setTimeout(done, timeoutMs);

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(done));
    }
  });
}
