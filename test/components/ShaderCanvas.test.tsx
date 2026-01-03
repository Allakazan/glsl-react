import React, { createRef } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShaderCanvas } from '../../src/components/ShaderCanvas';
import { useWebGL } from '../../src/hooks/useWebGL';
import { useTextures } from '../../src/hooks/useTextures';
import { useResizeObserver } from '../../src/hooks/useResizeObserver';
import { useMousePosition } from '../../src/hooks/useMousePosition';
import * as uniformUtils from '../../src/utils/uniforms';
import * as textureUtils from '../../src/utils/textures';
import type { WebGLProgramInfo } from '../../src/types';

// Mock all hooks and utilities
jest.mock('../../src/hooks/useWebGL');
jest.mock('../../src/hooks/useTextures');
jest.mock('../../src/hooks/useResizeObserver');
jest.mock('../../src/hooks/useMousePosition');
jest.mock('../../src/utils/uniforms');
jest.mock('../../src/utils/textures');

const mockUseWebGL = useWebGL as jest.MockedFunction<typeof useWebGL>;
const mockUseTextures = useTextures as jest.MockedFunction<typeof useTextures>;
const mockUseResizeObserver = useResizeObserver as jest.MockedFunction<typeof useResizeObserver>;
const mockUseMousePosition = useMousePosition as jest.MockedFunction<typeof useMousePosition>;

const MOCK_FRAGMENT_SHADER = 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';
const MOCK_VERTEX_SHADER = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }';

describe('ShaderCanvas', () => {
  let mockGl: WebGLRenderingContext;
  let mockProgram: WebGLProgram;
  let mockProgramInfo: WebGLProgramInfo;
  let rafSpy: jest.SpyInstance;
  let rafCallbacks: Array<(time: number) => void>;

  // Helper to create a mock ResizeObserverEntry
  const createMockResizeObserverEntry = (
    target: Element,
    contentRect: Partial<DOMRectReadOnly> = {}
  ): ResizeObserverEntry => {
    const defaultRect = {
      x: 0,
      y: 0,
      width: contentRect.width ?? 0,
      height: contentRect.height ?? 0,
      top: 0,
      right: contentRect.width ?? 0,
      bottom: contentRect.height ?? 0,
      left: 0,
      toJSON: () => ({}),
    };

    return {
      target,
      contentRect: defaultRect as DOMRectReadOnly,
      borderBoxSize: [] as any,
      contentBoxSize: [] as any,
      devicePixelContentBoxSize: [] as any,
    };
  };

  beforeEach(() => {
    // Mock requestAnimationFrame
    rafCallbacks = [];
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback as any);
      return rafCallbacks.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(1000);

    // Create mock WebGL context
    mockProgram = {} as WebGLProgram;
    mockGl = {
      clearColor: jest.fn(),
      clear: jest.fn(),
      getUniformLocation: jest.fn(() => ({} as WebGLUniformLocation)),
      uniform1f: jest.fn(),
      uniform2f: jest.fn(),
      drawArrays: jest.fn(),
      viewport: jest.fn(),
      COLOR_BUFFER_BIT: 16384,
      TRIANGLES: 4,
    } as unknown as WebGLRenderingContext;

    mockProgramInfo = {
      gl: mockGl,
      program: mockProgram,
      uniformLocations: new Map(),
      textureUnits: new Map(),
    };

    // Set up default mock implementations
    mockUseWebGL.mockReturnValue(mockProgramInfo);
    mockUseTextures.mockReturnValue({
      textureUnits: new Map(),
      textures: new Map(), // Empty map with correct type
    });
    mockUseResizeObserver.mockImplementation(() => {});
    mockUseMousePosition.mockReturnValue({ x: 0, y: 0 });

    // Mock uniform utilities
    (uniformUtils.getChangedUniforms as jest.Mock).mockReturnValue(new Set());
    (uniformUtils.cloneUniforms as jest.Mock).mockImplementation((u) => ({ ...u }));
    (uniformUtils.setUniform as jest.Mock).mockImplementation(() => {});

    // Mock texture utilities
    (textureUtils.updateTexture as jest.Mock).mockImplementation(() => {});

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rafCallbacks = [];
  });

  const triggerRaf = (time = 1000) => {
    act(() => {
      rafCallbacks.forEach((cb) => cb(time));
    });
  };

  describe('Happy Path - Successful Rendering', () => {
    it('should render canvas with correct styles and className', () => {
      const { container } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          style={{ border: '1px solid red' }}
          className="test-canvas"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('test-canvas');
      expect(canvas).toHaveStyle({ border: '1px solid red' });
    });

    it('should initialize WebGL with correct shaders', () => {
      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          vertexShader={MOCK_VERTEX_SHADER}
        />
      );

      expect(mockUseWebGL).toHaveBeenCalledWith(
        expect.objectContaining({ current: expect.any(HTMLCanvasElement) }),
        expect.any(Object),
        MOCK_VERTEX_SHADER,
        MOCK_FRAGMENT_SHADER
      );
    });

    it('should use default vertex shader when not provided', () => {
      render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      expect(mockUseWebGL).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.any(String), // DEFAULT_VERTEX_SHADER
        MOCK_FRAGMENT_SHADER
      );
    });

    it('should start render loop and call requestAnimationFrame', async () => {
      render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      await waitFor(() => {
        expect(rafSpy).toHaveBeenCalled();
      });
    });

    it('should render frames correctly', async () => {
      render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      triggerRaf(1000);

      await waitFor(() => {
        expect(mockGl.clearColor).toHaveBeenCalledWith(0, 0, 0, 1);
        expect(mockGl.clear).toHaveBeenCalledWith(mockGl.COLOR_BUFFER_BIT);
        expect(mockGl.drawArrays).toHaveBeenCalledWith(mockGl.TRIANGLES, 0, 6);
      });
    });

    it('should set built-in uniforms (u_resolution, u_time, u_mouse)', async () => {
      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Mock canvas dimensions
      Object.defineProperty(canvas, 'width', { value: 800, writable: true });
      Object.defineProperty(canvas, 'height', { value: 600, writable: true });

      // Set mouse position BEFORE rendering
      mockUseMousePosition.mockReturnValue({ x: .5, y: .75 });

      // Re-render to pick up the new mouse position
      const { rerender } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      rerender(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      triggerRaf(5000);

      await waitFor(() => {
        expect(mockGl.uniform2f).toHaveBeenCalledWith(expect.anything(), 800, 600); // u_resolution
        expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 5); // u_time (5000 * 0.001)
        expect(mockGl.uniform2f).toHaveBeenCalledWith(expect.anything(), .5, .75); // u_mouse
      });
    });

    it.skip('should call onFrameRender callback with frame time - SIMPLE CHECK', async () => {
      const onFrameRender = jest.fn();
      
      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          onFrameRender={onFrameRender}
        />
      );

      // Wait a bit to ensure some time passes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      triggerRaf(1000);

      await waitFor(() => {
        expect(onFrameRender).toHaveBeenCalled();
      });

      // Just verify the callback was called with a number (frame time in ms)
      // We can't reliably test the exact value in a mocked environment
      const frameTime = onFrameRender.mock.calls[0][0];
      
      process.stderr.write(`frame: ${frameTime}\n`);

      expect(typeof frameTime).toBe('number');
      expect(frameTime).toBeGreaterThanOrEqual(0);
    });

    it('should call onFrameRender callback with frame time', async () => {
      const onFrameRender = jest.fn();
      
      // Get the existing spy and reset it completely
      const perfNowSpy = jest.spyOn(performance, 'now');
      perfNowSpy.mockReset();
      
      // Return incrementing time values to simulate time passing
      let perfNowCallCount = 0;
      perfNowSpy.mockImplementation(() => {
        perfNowCallCount++;
        // Each call adds 16ms to simulate frame time
        const value = 1000 + (perfNowCallCount - 1) * 16;
        return value;
      });

      // Render component
      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          onFrameRender={onFrameRender}
        />
      );

      // Note the call count after render to calculate expected frame time
      const callsAfterRender = perfNowCallCount;

      // Clear the callback from any renders during mount
      //onFrameRender.mockClear();

      // Trigger RAF - this is the frame we want to test
      triggerRaf(1000);

      await waitFor(() => {
        expect(onFrameRender).toHaveBeenCalled();
      });

      const frameTime = onFrameRender.mock.calls[0][0];
      
      // Frame time should be a positive multiple of 16ms
      // (depends on how many performance.now() calls happened between frames)
      expect(frameTime).toBeGreaterThan(0);
      expect(frameTime).toBe(16 * callsAfterRender); // Should be a multiple of 16
    });

    it('should handle custom uniform changes', async () => {
      const uniforms = {
        u_color: { type: 'vec3' as const, value: [1, 0, 0] },
        u_intensity: { type: 'float' as const, value: 0.5 },
      };

      const uniformLoc1 = {} as WebGLUniformLocation;
      const uniformLoc2 = {} as WebGLUniformLocation;
      
      mockProgramInfo.uniformLocations.set('u_color', uniformLoc1);
      mockProgramInfo.uniformLocations.set('u_intensity', uniformLoc2);

      (uniformUtils.getChangedUniforms as jest.Mock).mockReturnValue(
        new Set(['u_color', 'u_intensity'])
      );

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        expect(uniformUtils.setUniform).toHaveBeenCalledWith(
          mockGl,
          uniformLoc1,
          uniforms.u_color,
          undefined
        );
        expect(uniformUtils.setUniform).toHaveBeenCalledWith(
          mockGl,
          uniformLoc2,
          uniforms.u_intensity,
          undefined
        );
      });
    });

    it('should handle texture uniforms and update dynamic textures', async () => {
      const mockVideo = document.createElement('video');
      const mockTexture = {} as WebGLTexture;
      const textureUnit = 0;

      const uniforms = {
        u_video: {
          type: 'texture' as const,
          value: mockVideo,
          options: {},
        },
      };

      const texturesMap = new Map([
        ['u_video', { texture: mockTexture, source: mockVideo, unit: textureUnit }],
      ]);

      mockUseTextures.mockReturnValue({
        textureUnits: new Map([['u_video', textureUnit]]),
        textures: texturesMap,
      });

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        expect(textureUtils.updateTexture).toHaveBeenCalledWith(
          mockGl,
          mockTexture,
          mockVideo,
          {},
          textureUnit
        );
      });
    });

    it('should handle canvas element as texture source', async () => {
      const mockCanvas = document.createElement('canvas');
      const mockTexture = {} as WebGLTexture;
      const textureUnit = 0;

      const uniforms = {
        u_canvas: {
          type: 'texture' as const,
          value: mockCanvas,
        },
      };

      const texturesMap = new Map([
        ['u_canvas', { texture: mockTexture, source: mockCanvas, unit: textureUnit }],
      ]);

      mockUseTextures.mockReturnValue({
        textureUnits: new Map([['u_canvas', textureUnit]]),
        textures: texturesMap,
      });

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        expect(textureUtils.updateTexture).toHaveBeenCalledWith(
          mockGl,
          mockTexture,
          mockCanvas,
          undefined,
          textureUnit
        );
      });
    });
  });

  describe('Resizing Behavior', () => {
    it('should handle resize and update viewport', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          pixelRatio={2}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      
      // Mock canvas client dimensions
      Object.defineProperty(canvas, 'clientWidth', { value: 400, writable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: 300, writable: true });
      Object.defineProperty(canvas, 'width', { value: 0, writable: true });
      Object.defineProperty(canvas, 'height', { value: 0, writable: true });

      // Trigger resize with mock entry
      act(() => {
        const mockEntry = createMockResizeObserverEntry(canvas, { width: 400, height: 300 });
        resizeCallback?.(mockEntry);
      });

      await waitFor(() => {
        expect(canvas.width).toBe(800); // 400 * 2 (pixelRatio)
        expect(canvas.height).toBe(600); // 300 * 2
        expect(mockGl.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
      });
    });

    it('should render immediately after resize to prevent flickering', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      Object.defineProperty(canvas, 'clientWidth', { value: 800, writable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: 600, writable: true });
      Object.defineProperty(canvas, 'width', { value: 0, writable: true });
      Object.defineProperty(canvas, 'height', { value: 0, writable: true });

      // Clear previous calls
      jest.clearAllMocks();

      act(() => {
        const mockEntry = createMockResizeObserverEntry(canvas, { width: 800, height: 600 });
        resizeCallback?.(mockEntry);
      });

      await waitFor(() => {
        expect(mockGl.drawArrays).toHaveBeenCalled();
      });
    });

    it('should not resize if dimensions have not changed', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      Object.defineProperty(canvas, 'clientWidth', { value: 400, writable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: 300, writable: true });
      Object.defineProperty(canvas, 'width', { value: 400, writable: true });
      Object.defineProperty(canvas, 'height', { value: 300, writable: true });

      jest.clearAllMocks();

      act(() => {
        const mockEntry = createMockResizeObserverEntry(canvas, { width: 400, height: 300 });
        resizeCallback?.(mockEntry);
      });

      // Viewport should not be called if dimensions didn't change
      expect(mockGl.viewport).not.toHaveBeenCalled();
    });
  });

  describe('Custom Options', () => {
    it('should use custom built-in uniform names from options', async () => {
      const customResolutionLoc = {} as WebGLUniformLocation;
      const customTimeLoc = {} as WebGLUniformLocation;
      const customMouseLoc = {} as WebGLUniformLocation;

      (mockGl.getUniformLocation as jest.Mock)
        .mockReturnValueOnce(customResolutionLoc)
        .mockReturnValueOnce(customTimeLoc)
        .mockReturnValueOnce(customMouseLoc);

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          options={{
            builtInUniforms: {
              u_resolution: 'customResolution',
              u_time: 'customTime',
              u_mouse: 'customMouse',
            },
          }}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        expect(mockGl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'customResolution');
        expect(mockGl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'customTime');
        expect(mockGl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'customMouse');
      });
    });
  });

  describe('forwardRef Handling', () => {
    it('should forward ref as object', () => {
      const ref = createRef<HTMLCanvasElement>();
      
      render(<ShaderCanvas ref={ref} fragmentShader={MOCK_FRAGMENT_SHADER} />);

      expect(ref.current).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should forward ref as callback function', () => {
      let capturedCanvas: HTMLCanvasElement | null = null;
      const refCallback = (node: HTMLCanvasElement | null) => {
        capturedCanvas = node;
      };

      render(<ShaderCanvas ref={refCallback} fragmentShader={MOCK_FRAGMENT_SHADER} />);

      expect(capturedCanvas).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should handle null ref gracefully', () => {
      expect(() => {
        render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should not crash when WebGL initialization fails', () => {
      mockUseWebGL.mockReturnValue(null);

      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      triggerRaf(1000);

      // Should render canvas but not call WebGL methods
      expect(container.querySelector('canvas')).toBeInTheDocument();
      expect(mockGl.clearColor).not.toHaveBeenCalled();
    });

    it('should handle missing uniform locations gracefully', async () => {
      (mockGl.getUniformLocation as jest.Mock).mockReturnValue(null);

      render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      triggerRaf(1000);

      // Should not throw, just skip setting the uniform
      await waitFor(() => {
        expect(mockGl.drawArrays).toHaveBeenCalled();
      });
    });

    it('should catch and log errors when setting uniforms fails', async () => {
      const uniforms = {
        u_badUniform: { type: 'float' as const, value: 0.5 },
      };

      const uniformLoc = {} as WebGLUniformLocation;
      mockProgramInfo.uniformLocations.set('u_badUniform', uniformLoc);

      (uniformUtils.getChangedUniforms as jest.Mock).mockReturnValue(
        new Set(['u_badUniform'])
      );
      (uniformUtils.setUniform as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid uniform value');
      });

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to set uniform "u_badUniform":',
          expect.any(Error)
        );
      });
    });

    it('should handle null canvas ref in resize handler', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Force canvas ref to be null
      const canvasRefGetter = jest.spyOn(React, 'useRef');
      canvasRefGetter.mockReturnValueOnce({ current: null });

      // Should not throw
      expect(() => {
        act(() => {
          const mockEntry = createMockResizeObserverEntry(canvas);
          resizeCallback?.(mockEntry);
        });
      }).not.toThrow();
    });

    it('should handle null programInfo in resize handler', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      mockUseWebGL.mockReturnValue(null);

      const { container } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Should not throw
      expect(() => {
        act(() => {
          const mockEntry = createMockResizeObserverEntry(canvas);
          resizeCallback?.(mockEntry);
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', () => {
      const { unmount } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      unmount();

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should clear render function ref on unmount', () => {
      const { unmount } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      unmount();

      // Verify cleanup completed without errors
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Prop Updates', () => {
    it('should handle uniform updates correctly', async () => {
      const initialUniforms = {
        u_value: { type: 'float' as const, value: 0.5 },
      };

      const updatedUniforms = {
        u_value: { type: 'float' as const, value: 0.8 },
      };

      (uniformUtils.getChangedUniforms as jest.Mock)
        .mockReturnValueOnce(new Set(['u_value']))
        .mockReturnValueOnce(new Set(['u_value']));

      const { rerender } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={initialUniforms}
        />
      );

      rerender(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={updatedUniforms}
        />
      );

      await waitFor(() => {
        expect(uniformUtils.getChangedUniforms).toHaveBeenCalledWith(
          updatedUniforms,
          expect.anything()
        );
      });
    });

    it('should update onFrameRender callback when it changes', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          onFrameRender={callback1}
        />
      );

      triggerRaf(1000);
      await waitFor(() => expect(callback1).toHaveBeenCalled());

      jest.clearAllMocks();

      rerender(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          onFrameRender={callback2}
        />
      );

      triggerRaf(2000);
      await waitFor(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    it('should update mouse position when useMousePosition returns new values', async () => {
      mockUseMousePosition.mockReturnValue({ x: 50, y: 100 });

      const { rerender } = render(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      mockUseMousePosition.mockReturnValue({ x: 150, y: 250 });
      
      rerender(<ShaderCanvas fragmentShader={MOCK_FRAGMENT_SHADER} />);

      triggerRaf(1000);

      await waitFor(() => {
        expect(mockGl.uniform2f).toHaveBeenCalledWith(expect.anything(), 150, 250);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty uniforms object', () => {
      expect(() => {
        render(
          <ShaderCanvas
            fragmentShader={MOCK_FRAGMENT_SHADER}
            uniforms={{}}
          />
        );
      }).not.toThrow();
    });

    it('should handle pixelRatio of 0', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          pixelRatio={0}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      Object.defineProperty(canvas, 'clientWidth', { value: 400, writable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: 300, writable: true });
      Object.defineProperty(canvas, 'width', { value: 100, writable: true });
      Object.defineProperty(canvas, 'height', { value: 100, writable: true });

      act(() => {
        const mockEntry = createMockResizeObserverEntry(canvas, { width: 400, height: 300 });
        resizeCallback?.(mockEntry);
      });

      // Should set canvas to 0x0
      expect(canvas.width).toBe(0);
      expect(canvas.height).toBe(0);
    });

    it('should handle very high pixelRatio', async () => {
      let resizeCallback: ((entry: ResizeObserverEntry) => void) | undefined;
      mockUseResizeObserver.mockImplementation((ref, callback) => {
        resizeCallback = callback;
      });

      const { container } = render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          pixelRatio={10}
        />
      );

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      Object.defineProperty(canvas, 'clientWidth', { value: 100, writable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: 100, writable: true });
      Object.defineProperty(canvas, 'width', { value: 0, writable: true });
      Object.defineProperty(canvas, 'height', { value: 0, writable: true });

      act(() => {
        const mockEntry = createMockResizeObserverEntry(canvas, { width: 100, height: 100 });
        resizeCallback?.(mockEntry);
      });

      expect(canvas.width).toBe(1000); // 100 * 10
      expect(canvas.height).toBe(1000);
    });

    it('should clear changed uniforms after each frame', async () => {
      const uniforms = {
        u_value: { type: 'float' as const, value: 0.5 },
      };

      const uniformLoc = {} as WebGLUniformLocation;
      mockProgramInfo.uniformLocations.set('u_value', uniformLoc);

      // First call returns the uniform as changed
      (uniformUtils.getChangedUniforms as jest.Mock).mockReturnValueOnce(
        new Set(['u_value'])
      );

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      // First frame should process the uniform
      await waitFor(() => {
        expect(uniformUtils.setUniform).toHaveBeenCalledWith(
          mockGl,
          uniformLoc,
          uniforms.u_value,
          undefined
        );
      });

      jest.clearAllMocks();

      // Second call returns empty set (uniforms were cleared)
      (uniformUtils.getChangedUniforms as jest.Mock).mockReturnValueOnce(
        new Set()
      );

      // Second frame should not process it again (set was cleared)
      triggerRaf(2000);

      // setUniform should not be called again for the same uniform
      expect(uniformUtils.setUniform).not.toHaveBeenCalled();
    });

    it('should handle static texture sources (not video or canvas)', async () => {
      const mockImage = new Image();
      const mockTexture = {} as WebGLTexture;
      const textureUnit = 0;

      const uniforms = {
        u_image: {
          type: 'texture' as const,
          value: mockImage,
        },
      };

      const texturesMap = new Map([
        ['u_image', { texture: mockTexture, source: mockImage, unit: textureUnit }],
      ]);

      mockUseTextures.mockReturnValue({
        textureUnits: new Map([['u_image', textureUnit]]),
        textures: texturesMap,
      });

      render(
        <ShaderCanvas
          fragmentShader={MOCK_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      );

      triggerRaf(1000);

      await waitFor(() => {
        // updateTexture should NOT be called for static images
        expect(textureUtils.updateTexture).not.toHaveBeenCalled();
      });
    });
  });
});