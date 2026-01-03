import { renderHook } from '@testing-library/react';
import { useResizeObserver } from '../../src/hooks/useResizeObserver';
import { createRef } from 'react';

// Mock ResizeObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let observerInstance: MockResizeObserver | null = null;

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observerInstance = this; // Capture the instance
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  callback: ResizeObserverCallback;
}

// Explicitly define ResizeObserver on the global object for JSDOM
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

describe('useResizeObserver', () => {
  let elementRef: React.RefObject<HTMLElement>;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    elementRef = createRef<HTMLElement>();
    // @ts-ignore
    elementRef.current = document.createElement('div');
    mockCallback = jest.fn();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    observerInstance = null; // Reset instance before each test
  });

  it('should observe the element on mount', () => {
    renderHook(() => useResizeObserver(elementRef, mockCallback));
    expect(mockObserve).toHaveBeenCalledWith(elementRef.current);
  });

  it('should disconnect the observer on unmount', () => {
    const { unmount } = renderHook(() => useResizeObserver(elementRef, mockCallback));
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should call the callback when the observed element resizes', () => {
    renderHook(() => useResizeObserver(elementRef, mockCallback));

    // Simulate a resize event
    const entry = {
      contentRect: { width: 100, height: 100, x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 100, toJSON: () => ({}) },
      target: elementRef.current!,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
    
    // Call the stored callback from the captured instance
    if (observerInstance) {
      observerInstance.callback([entry], observerInstance as unknown as ResizeObserver);
    }

    expect(mockCallback).toHaveBeenCalledWith(entry);
  });

  it('should update callback if it changes', () => {
    const initialCallback = jest.fn();
    const { rerender } = renderHook(({ cb }) => useResizeObserver(elementRef, cb), {
      initialProps: { cb: initialCallback },
    });

    // Simulate a resize event with the initial callback
    const entry1 = {
      contentRect: { width: 50, height: 50, x: 0, y: 0, top: 0, left: 0, right: 50, bottom: 50, toJSON: () => ({}) },
      target: elementRef.current!,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
    if (observerInstance) {
      observerInstance.callback([entry1], observerInstance as unknown as ResizeObserver);
    }
    expect(initialCallback).toHaveBeenCalledWith(entry1);
    expect(mockCallback).not.toHaveBeenCalled(); 

    // Rerender with a new callback
    const newCallback = jest.fn();
    rerender({ cb: newCallback });

    // Simulate another resize event
    const entry2 = {
      contentRect: { width: 200, height: 200, x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 200, toJSON: () => ({}) },
      target: elementRef.current!,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
    if (observerInstance) {
      observerInstance.callback([entry2], observerInstance as unknown as ResizeObserver);
    }

    expect(initialCallback).toHaveBeenCalledTimes(1); 
    expect(newCallback).toHaveBeenCalledWith(entry2);
  });

  it('should not observe if elementRef.current is null', () => {
    // @ts-ignore
    elementRef.current = null;
    renderHook(() => useResizeObserver(elementRef, mockCallback));
    expect(mockObserve).not.toHaveBeenCalled();
  });
});