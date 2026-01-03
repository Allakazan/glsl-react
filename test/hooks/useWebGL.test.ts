import { renderHook } from '@testing-library/react';
import { useWebGL } from '../../src/hooks/useWebGL';
import { Uniforms } from '../../src/types';
import * as shaders from '../../src/utils/shaders';

const MOCK_VERTEX_SHADER = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }';
const MOCK_FRAGMENT_SHADER = 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';

describe('useWebGL', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let uniformsRef: React.RefObject<Uniforms>;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = {
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      useProgram: jest.fn(),
      createBuffer: jest.fn(() => ({})),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      getAttribLocation: jest.fn(() => 0),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      getUniformLocation: jest.fn(() => ({})),
      deleteShader: jest.fn(),
      deleteProgram: jest.fn(),
      deleteBuffer: jest.fn(),
    } as unknown as WebGLRenderingContext;

    jest.spyOn(canvas, 'getContext').mockImplementation(() => gl);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    uniformsRef = { current: { u_time: { type: 'float', value: 0 } } };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (console.error as jest.Mock).mockRestore?.(); // More explicit
  });

  it('should initialize WebGL context and program successfully', () => {
    const canvasRef = { current: canvas };

    const { result } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    expect(canvas.getContext).toHaveBeenCalledWith('webgl');
    expect(gl.createProgram).toHaveBeenCalled();
    expect(gl.useProgram).toHaveBeenCalled();
    expect(result.current).not.toBeNull();
    expect(result.current?.gl).toBe(gl);
    expect(result.current?.program).toBeDefined();
    expect(result.current?.uniformLocations).toBeDefined();
  });

  it('should return null and log error if WebGL is not supported', () => {
    jest.spyOn(canvas, 'getContext').mockImplementation(() => null);
    const canvasRef = { current: canvas };

    const { result } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    expect(result.current).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'WebGL initialization error:',
      new Error('WebGL not supported in this browser')
    );
  });

  it('should return null and log error if shader compilation fails', () => {
    (gl.getShaderParameter as jest.Mock).mockReturnValue(false);
    const canvasRef = { current: canvas };

    const { result } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    expect(result.current).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'WebGL initialization error:',
      expect.any(Error)
    );
  });

  it('should clean up resources and clear refs on unmount', () => {
    const canvasRef = { current: canvas };

    const { result, unmount } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    const program = result.current?.program;
    expect(program).toBeDefined();
    
    unmount();

    expect(gl.deleteProgram).toHaveBeenCalledWith(program);
    expect(gl.deleteBuffer).toHaveBeenCalled();
    // Verify it can be safely called again (refs should be null)
    unmount(); // Should not throw
  });

  it('should return null when canvas ref is null', () => {
    const canvasRef = { current: null };

    const { result } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    expect(result.current).toBeNull();
    expect(canvas.getContext).not.toHaveBeenCalled();
  });

  it('should re-initialize when shaders change', () => {
    const canvasRef = { current: canvas };
    const NEW_FRAGMENT_SHADER = 'void main() { gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); }';

    const { rerender } = renderHook(
      ({ fragmentShader }) => useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, fragmentShader),
      { initialProps: { fragmentShader: MOCK_FRAGMENT_SHADER } }
    );

    const initialCallCount = (gl.createProgram as jest.Mock).mock.calls.length;

    rerender({ fragmentShader: NEW_FRAGMENT_SHADER });

    expect(gl.deleteProgram).toHaveBeenCalled(); // Old program deleted
    expect((gl.createProgram as jest.Mock).mock.calls.length).toBe(initialCallCount + 1);
  });

  it('should return null if program linking fails', () => {
    (gl.getProgramParameter as jest.Mock).mockReturnValue(false);
    const canvasRef = { current: canvas };

    const { result } = renderHook(() =>
      useWebGL(canvasRef, uniformsRef, MOCK_VERTEX_SHADER, MOCK_FRAGMENT_SHADER)
    );

    expect(result.current).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

});