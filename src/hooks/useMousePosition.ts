import { useEffect, useState, useCallback, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Hook for tracking normalized mouse position [0, 1] relative to an element
 * @param elementRef Reference to the element to track mouse position within
 * @returns Normalized mouse coordinates [0, 1]
 */
export function useMousePosition(
  elementRef: RefObject<HTMLElement>
): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    
    // Normalize to [0, 1]
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Clamp values to [0, 1]
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setPosition({ x: clampedX, y: clampedY });
  }, [elementRef]);

  useEffect(() => {
    
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [elementRef, handleMouseMove]);

  return position;
}
