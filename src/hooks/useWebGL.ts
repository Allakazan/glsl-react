import { RefObject, useEffect, useRef, useState } from "react";
import { compileShader, createProgram, createQuadBuffer, getUniformLocations } from "../utils/shaders";
import { Uniforms, WebGLProgramInfo } from "../types";

/**
 * Hook for initializing and managing WebGL context and shader program
 * @param canvasRef Reference to the canvas element
 * @param vertexShader Vertex shader source (optional, uses default fullscreen quad)
 * @param fragmentShader Fragment shader source
 * @param onError Error callback
 * @returns WebGL program info or null if not ready
 */
export function useWebGL(
  canvasRef: RefObject<HTMLCanvasElement>,
  uniformsRef: RefObject<Uniforms>,
  vertexShader: string,
  fragmentShader: string,
  //onError?: (error: Error) => void
): WebGLProgramInfo | null {
  const [programInfo, setProgramInfo] = useState<WebGLProgramInfo | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const quadBufferRef = useRef<WebGLBuffer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log("Initializing WebGL context...");

    /*{
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }*/

    try {
      const gl = canvas.getContext("webgl");

      if (!gl) {
        throw new Error('WebGL not supported in this browser');
      }

      glRef.current = gl;

      const compiledVertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
      const compiledFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

      const program = createProgram(
        gl,
        compiledVertexShader,
        compiledFragmentShader
      );

      programRef.current = program;
      gl.useProgram(program);

      const quadBuffer = createQuadBuffer(gl);
      quadBufferRef.current = quadBuffer;

      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // ---------- uniforms ----------
      const uniformLocations = getUniformLocations(
        gl,
        program,
        Object.keys(uniformsRef.current || {})
      );

      setProgramInfo({
        gl,
        program,
        uniformLocations,
        textureUnits: new Map(),
      });

      // Clean up shaders (no longer needed after linking)
      gl.deleteShader(compiledVertexShader);
      gl.deleteShader(compiledFragmentShader);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('WebGL initialization error:', err);
      //if (onError) {
      //  onError(err);
      //}
      setProgramInfo(null);
    }

    return () => {  
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
        if (quadBufferRef.current) {
          glRef.current.deleteBuffer(quadBufferRef.current);
        }
      }

      // Clear all refs
      glRef.current = null;
      programRef.current = null;
      quadBufferRef.current = null;
    };
  }, [canvasRef, fragmentShader, vertexShader]);

  return programInfo;
}