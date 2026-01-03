import { renderHook, act } from '@testing-library/react';
import { useMousePosition } from '../../src/hooks/useMousePosition';
import { createRef } from 'react';

describe('useMousePosition', () => {
  it('should initialize with default position { x: 0.5, y: 0.5 }', () => {
    const elementRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useMousePosition(elementRef));
    expect(result.current).toEqual({ x: 0.5, y: 0.5 });
  });

  it('should not update position if element is not available', () => {
    const elementRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useMousePosition(elementRef));

    act(() => {
      // Create a fake event
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });
      // Dispatch the event
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current).toEqual({ x: 0.5, y: 0.5 });
  });


  it('should update position on mousemove event', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    // Mock getBoundingClientRect
    element.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      toJSON: () => ({}),
    }));

    const elementRef = { current: element };
    const { result } = renderHook(() => useMousePosition(elementRef));

    act(() => {
      // Create and dispatch the event on the element
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 100,
      });
      element.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current).toEqual({ x: 0.25, y: 0.5 });
  });

  it('should clamp position values to be between 0 and 1', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    element.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      toJSON: () => ({}),
    }));

    const elementRef = { current: element };
    const { result } = renderHook(() => useMousePosition(elementRef));

    act(() => {
      // Event with clientX/Y outside the element's bounds
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 200, // > width
        clientY: -50,  // < 0
      });
      element.dispatchEvent(mouseMoveEvent);
    });

    // x should be clamped to 1, y should be clamped to 0
    expect(result.current).toEqual({ x: 1, y: 0 });
  });

  it('should clean up event listener on unmount', () => {
    const element = document.createElement('div');
    const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

    const elementRef = { current: element };
    const { unmount } = renderHook(() => useMousePosition(elementRef));

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });
});
