import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import type { ShaderCanvasProps, Uniforms } from '../types';
import { cloneUniforms, getChangedUniforms, setUniform } from "../utils/uniforms";
import { DEFAULT_VERTEX_SHADER } from "../utils/shaders";
import { useResizeObserver } from "../hooks/useResizeObserver";
import { useMousePosition } from "../hooks/useMousePosition";
import { useWebGL } from "../hooks/useWebGL";
import { useTextures } from "../hooks/useTextures";
import { updateTexture } from "../utils/textures";

/**
 * ShaderCanvas component - Renders a WebGL shader
 */
export const ShaderCanvas = forwardRef<
  HTMLCanvasElement,
  ShaderCanvasProps
>(function ShaderCanvas(
  {
    fragmentShader,
    vertexShader = DEFAULT_VERTEX_SHADER,
    uniforms = {},
    pixelRatio = window.devicePixelRatio,
    style,
    className,
    options,
    onFrameRender
  },
  forwardedRef
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uniformsRef = useRef(uniforms);
  const onFrameRenderRef = useRef(onFrameRender);

  // Track previous uniforms for change detection
  const previousUniformsRef = useRef<Uniforms | null>(null);
  const changedUniformsRef = useRef<Set<string>>(new Set(Object.keys(uniforms)));

  // Initialize WebGL and compile shaders
  const programInfo = useWebGL(canvasRef, uniformsRef, vertexShader, fragmentShader);

  // Track mouse position
  const mousePosition = useRef({ x: 0, y: 0 });
  const mousePositionState = useMousePosition(canvasRef);

  // Manage textures
  const { textureUnits, textures } = useTextures(programInfo?.gl || null, uniforms);
  const textureUnitsRef = useRef(textureUnits);
  const texturesRef = useRef(textures);

  useEffect(() => {
    textureUnitsRef.current = textureUnits;
    texturesRef.current = textures;
  }, [textureUnits, textures]);

  useEffect(() => {
    // Detect changed uniforms when uniforms prop updates
    const changed = getChangedUniforms(uniforms, previousUniformsRef.current);
    changedUniformsRef.current = changed;
    
    // Efficiently clone the uniforms for next comparison
    previousUniformsRef.current = cloneUniforms(uniforms);
    uniformsRef.current = uniforms;
  }, [uniforms]);

  useEffect(() => {
    onFrameRenderRef.current = onFrameRender;
  }, [onFrameRender]);

  useEffect(() => {
    mousePosition.current = mousePositionState;
  }, [mousePositionState]);

  useEffect(() => {
    if (!forwardedRef) return;

    if (typeof forwardedRef === "function") {
      forwardedRef(canvasRef.current);
    } else {
      forwardedRef.current = canvasRef.current;
    }
  }, [forwardedRef]);

  // Store render function reference
  const renderFnRef = useRef<((time: number) => void) | null>(null);

  // Track last frame time for accurate frame time measurement
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Resize handler function
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = programInfo?.gl;
    
    if (!canvas || !gl) return;

    const displayWidth = Math.floor(canvas.clientWidth * pixelRatio);
    const displayHeight = Math.floor(canvas.clientHeight * pixelRatio);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);


      // Immediately render a frame after resize to prevent flickering
      if (renderFnRef.current) {
        renderFnRef.current(performance.now());
      }
    }
  }, [programInfo, pixelRatio]);

  // Initial resize on mount when programInfo is ready
  useEffect(() => {
    if (programInfo) {
      handleResize();
    }
  }, [programInfo, handleResize]);

  // Handle ongoing resizing efficiently with ResizeObserver
  useResizeObserver(canvasRef, handleResize);

  const renderLoop = useCallback(
    (time: number) => {
      if (!canvasRef.current || !programInfo) return;

      const { gl, program, uniformLocations } = programInfo;
      const canvas = canvasRef.current;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // common useful uniforms
      const resLoc = gl.getUniformLocation(program, options?.builtInUniforms?.u_resolution || "u_resolution");
      if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);

      const timeLoc = gl.getUniformLocation(program, options?.builtInUniforms?.u_time ||  "u_time");
      if (timeLoc) gl.uniform1f(timeLoc, time * 0.001);

      const mouseLocation = gl.getUniformLocation(program, options?.builtInUniforms?.u_mouse || "u_mouse");
      if (mouseLocation) {
        gl.uniform2f(mouseLocation, mousePosition.current.x, mousePosition.current.y);
      }

      const activeUniforms = uniformsRef.current;
      const locations = uniformLocations;
      const changedUniforms = changedUniformsRef.current;

      // Bind all textures to their units and update dynamic ones
      const currentTextures = texturesRef.current;
      for (const [name, info] of currentTextures) {
        const uniform = activeUniforms[name];
        
        // Update texture data for video and canvas elements every frame
        if (uniform?.type === 'texture') {
          const source = uniform.value;
          if (source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement) {
            updateTexture(gl, info.texture, source, uniform.options, info.unit);
          }
        }
      }

      for (const key of changedUniforms) {
        const loc = locations.get(key);
        if (!loc) continue;

        try {
          // Get texture unit if this is a texture uniform
          const textureUnit = textureUnitsRef.current.get(key);
          setUniform(gl, loc, activeUniforms[key], textureUnit);
        } catch (error) {
          console.error(`Failed to set uniform "${key}":`, error);
        }
      }

      // Clear changed uniforms after processing
      changedUniformsRef.current = new Set();

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // Call onFrameRender callback with actual frame time (time since last frame)
      if (onFrameRenderRef.current) {
        const now = performance.now();
        const frameTime = now - lastFrameTimeRef.current;

        lastFrameTimeRef.current = now;
        onFrameRenderRef.current(frameTime);
      }
    }, [programInfo, options]
  )

  useEffect(() => {
    let rafId: number;

    console.log("Starting render loop...");

    const render = (time: number) => {
      renderLoop(time);
      rafId = requestAnimationFrame(render);
    };

    // Store render function for immediate resize updates
    renderFnRef.current = renderLoop;

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      renderFnRef.current = null;
    }
  }, [renderLoop]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", ...style }}
      className={className}
    />
  );
});

ShaderCanvas.displayName = 'ShaderCanvas';