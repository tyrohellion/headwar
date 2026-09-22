// Adds the `overflowing` class to an element only when its text genuinely
// overflows its box (scrollWidth > clientWidth). Consumers attach a right-edge
// fade mask to that class so the fade only appears for edge cases — e.g. very
// long team/player names — instead of always being applied.
//
// Re-checks when the element resizes (viewport/card changes) and once document
// fonts finish loading, since glyph widths can change after the first paint.
export function overflowFade(node) {
  const check = () => {
    node.classList.toggle("overflowing", node.scrollWidth > node.clientWidth);
  };

  check();

  const observer = new ResizeObserver(check);
  observer.observe(node);

  document.fonts?.ready?.then(check);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
