import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  if (!Element.prototype.animate) {
    Element.prototype.animate = function () {
      return {
        finished: Promise.resolve(),
        cancel: () => {},
        play: () => {},
        pause: () => {},
        reverse: () => {},
        onfinish: null,
      } as unknown as Animation;
    };
  }
}
