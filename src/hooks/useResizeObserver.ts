import { useEffect, useRef } from 'react';

/**
 * Hook that observes element resize and calls callback when size changes
 */
export function useResizeObserver(
  elementRef: React.RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      // Call the callback with the first entry (our canvas)
      if (entries[0]) {
        callbackRef.current(entries[0]);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);
}