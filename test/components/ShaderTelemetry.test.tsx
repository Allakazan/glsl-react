import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShaderTelemetry, Panel } from '../../src/components/ShaderTelemetry';

describe('ShaderTelemetry Component', () => {
  let frameTimeHistory: React.MutableRefObject<number[]>;
  let frameCountRef: React.MutableRefObject<number>;
  let performanceNowMock: jest.SpyInstance;

  beforeEach(() => {
    // Reset refs before each test
    frameTimeHistory = { current: [] };
    frameCountRef = { current: 0 };

    // Mock performance.now() - starts at 1000ms
    let currentTime = 1000;
    performanceNowMock = jest.spyOn(performance, 'now').mockImplementation(() => currentTime);
    
    // Create a helper to advance time
    (global as any).advanceTime = (ms: number) => {
      currentTime += ms;
    };

    // Mock setInterval and clearInterval
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (global as any).advanceTime;
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render FPS and MS panels', () => {
      render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      expect(screen.getByText(/FPS/i)).toBeInTheDocument();
      expect(screen.getByText(/MS/i)).toBeInTheDocument();
    });

    it('should render two canvas elements', () => {
      const { container } = render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const canvases = container.querySelectorAll('canvas');
      expect(canvases).toHaveLength(2);
    });

    it('should have correct canvas dimensions', () => {
      const { container } = render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const canvases = container.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        expect(canvas).toHaveAttribute('width', '80');
        expect(canvas).toHaveAttribute('height', '30');
      });
    });
  });

  describe('Position Props', () => {
    it('should position at top-left by default', () => {
      const { container } = render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
      });
    });

    it('should position at top-right when specified', () => {
      const { container } = render(
        <ShaderTelemetry
          position="top-right"
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        position: 'fixed',
        top: '0',
        right: '0',
      });
    });

    it('should position at bottom-left when specified', () => {
      const { container } = render(
        <ShaderTelemetry
          position="bottom-left"
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        position: 'fixed',
        bottom: '0',
        left: '0',
      });
    });

    it('should position at bottom-right when specified', () => {
      const { container } = render(
        <ShaderTelemetry
          position="bottom-right"
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        position: 'fixed',
        bottom: '0',
        right: '0',
      });
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate FPS correctly', async () => {
      frameCountRef.current = 60;
      frameTimeHistory.current = [16.7, 16.7, 16.7];

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      // Initial render shows 0 FPS
      expect(screen.getByText('0 FPS')).toBeInTheDocument();

      // Advance performance.now() time by 100ms
      (global as any).advanceTime(100);

      // Advance timers and wrap in act
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        // 60 frames in 0.1 seconds = 600 FPS
        expect(screen.getByText('600 FPS')).toBeInTheDocument();
      });
    });

    it('should calculate average frame time correctly', async () => {
      frameCountRef.current = 10;
      frameTimeHistory.current = [10, 20, 30]; // Average: 20ms

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('20 MS')).toBeInTheDocument();
      });
    });

    it('should handle empty frame time history', async () => {
      frameCountRef.current = 0;
      frameTimeHistory.current = [];

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('0 MS')).toBeInTheDocument();
      });
    });

    it('should reset frame count after update', async () => {
      frameCountRef.current = 60;
      frameTimeHistory.current = [16.7];

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(frameCountRef.current).toBe(0);
      });
    });
  });

  describe('Update Interval', () => {
    it('should use default update interval of 100ms', async () => {
      frameCountRef.current = 30;
      
      render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      // Advance by 100ms (default interval)
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText(/300 FPS/i)).toBeInTheDocument();
      });
    });

    it('should respect custom update interval', async () => {
      frameCountRef.current = 50;
      
      render(
        <ShaderTelemetry
          updateInterval={200}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      // Advance by 199ms (should not update yet)
      await act(async () => {
        jest.advanceTimersByTime(199);
      });
      expect(screen.getByText('0 FPS')).toBeInTheDocument();

      // Advance by 1 more ms and advance performance time
      (global as any).advanceTime(200);
      
      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.getByText(/250 FPS/i)).toBeInTheDocument();
      });
    });
  });

  describe('Graph Samples', () => {
    it('should limit FPS history to graphSamples', async () => {
      const graphSamples = 5;
      
      render(
        <ShaderTelemetry
          graphSamples={graphSamples}
          updateInterval={10}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      // Trigger multiple updates
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          frameCountRef.current = 60;
          (global as any).advanceTime(10);
          jest.advanceTimersByTime(10);
        }
      });

      // The component should internally limit history length
      // This is tested indirectly through rendering without errors
      await waitFor(() => {
        expect(screen.getByText(/FPS/i)).toBeInTheDocument();
      });
    });
  });

  describe('Canvas Drawing', () => {
    it('should draw on canvas when data is available', async () => {
      frameCountRef.current = 60;
      frameTimeHistory.current = [16.7, 16.7, 16.7];

      const { container } = render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      const canvases = container.querySelectorAll('canvas');
      expect(canvases).toHaveLength(2);

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Verify the component updated (FPS changed from 0)
      await waitFor(() => {
        expect(screen.getByText('600 FPS')).toBeInTheDocument();
      });

      // Canvases should still be present and not have crashed
      const canvasesAfter = container.querySelectorAll('canvas');
      expect(canvasesAfter).toHaveLength(2);
    });
  });

  describe('Cleanup', () => {
    it('should clear interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      const { unmount } = render(
        <ShaderTelemetry
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Panel Component', () => {
    it('should render Panel with correct props', () => {
      const mockRef = React.createRef<HTMLCanvasElement>();
      
      // Suppress the ref warning for this test since we're testing the component itself
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <Panel
          ref={mockRef}
          type="fps"
          text="60 FPS"
        />
      );

      expect(screen.getByText('60 FPS')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should apply wrapper styles', () => {
      const mockRef = React.createRef<HTMLCanvasElement>();
      const wrapperStyle = { border: '1px solid red' };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { container } = render(
        <Panel
          ref={mockRef}
          type="fps"
          text="60 FPS"
          wrapperStyle={wrapperStyle}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ border: '1px solid red' });
      
      consoleSpy.mockRestore();
    });

    it('should apply panel styles', () => {
      const mockRef = React.createRef<HTMLCanvasElement>();
      const panelStyle = { fontSize: '12px' };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <Panel
          ref={mockRef}
          type="fps"
          text="60 FPS"
          panelStyle={panelStyle}
        />
      );

      const textElement = screen.getByText('60 FPS');
      expect(textElement).toHaveStyle({ fontSize: '12px' });
      
      consoleSpy.mockRestore();
    });

    it('should render canvas with correct dimensions', () => {
      const mockRef = React.createRef<HTMLCanvasElement>();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { container } = render(
        <Panel
          ref={mockRef}
          type="ms"
          text="16.7 MS"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '80');
      expect(canvas).toHaveAttribute('height', '30');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero elapsed time gracefully', async () => {
      // Don't advance performance.now time - it stays at 1000ms
      frameCountRef.current = 60;

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        // Should show 0 FPS when elapsed time is 0
        expect(screen.getByText('0 FPS')).toBeInTheDocument();
      });
    });

    it('should handle very high frame rates', async () => {
      frameCountRef.current = 10000;
      frameTimeHistory.current = [0.1];

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        // Should display high FPS values
        expect(screen.getByText(/FPS/i)).toBeInTheDocument();
      });
    });

    it('should round frame time to 1 decimal place', async () => {
      frameCountRef.current = 60;
      frameTimeHistory.current = [16.666666, 16.777777]; // Should average to ~16.7

      render(
        <ShaderTelemetry
          updateInterval={100}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      (global as any).advanceTime(100);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const msText = screen.getByText(/MS/i).textContent;
        // Should have at most 1 decimal place
        expect(msText).toMatch(/^\d+\.\d{1} MS$/);
      });
    });
  });

  describe('Performance', () => {
    it('should update metrics at specified intervals only', async () => {
      const updateInterval = 500;
      frameCountRef.current = 60;

      render(
        <ShaderTelemetry
          updateInterval={updateInterval}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );

      // Should show initial state
      expect(screen.getByText('0 FPS')).toBeInTheDocument();

      // Advance halfway through interval
      await act(async () => {
        jest.advanceTimersByTime(250);
      });
      expect(screen.getByText('0 FPS')).toBeInTheDocument();

      // Complete the interval and advance performance time
      (global as any).advanceTime(500);
      
      await act(async () => {
        jest.advanceTimersByTime(250);
      });

      await waitFor(() => {
        expect(screen.queryByText('0 FPS')).not.toBeInTheDocument();
      });
    });
  });
});