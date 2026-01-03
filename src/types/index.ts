import { CSSProperties } from "react";

/**
 * Supported uniform types for WebGL shaders
 */
export type UniformType =   
  | 'float' | 'vec2' | 'vec3' | 'vec4'  // Floats 
  | 'int' | 'ivec2' | 'ivec3' | 'ivec4' // Integers 
  | 'mat3' | 'mat4'                     // Matrices 
  | 'texture';                          // Textures

/**
 * Texture wrapping modes
 * Values correspond to WebGL constants
 */
export enum TextureWrap {
  REPEAT = 0x2901,           // 10497
  CLAMP_TO_EDGE = 0x812F,    // 33071
  MIRRORED_REPEAT = 0x8370   // 33648
}

/**
 * Texture filtering modes
 * Values correspond to WebGL constants
 */
export enum TextureFilter {
  NEAREST = 0x2600,                    // 9728
  LINEAR = 0x2601,                     // 9729
  NEAREST_MIPMAP_NEAREST = 0x2700,     // 9984
  LINEAR_MIPMAP_NEAREST = 0x2701,      // 9985
  NEAREST_MIPMAP_LINEAR = 0x2702,      // 9986
  LINEAR_MIPMAP_LINEAR = 0x2703        // 9987
}

/**
 * Options for texture configuration
 */
export interface TextureOptions {
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  minFilter?: TextureFilter;
  magFilter?: TextureFilter;
  flipY?: boolean;
}

/**
 * Texture uniform value
 */
export interface TextureUniform {
  type: 'texture';
  value: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap;
  options?: TextureOptions;
}

/**
 * Numeric uniform value (floats, ints, matrices)
 */
export interface NumericUniform {
  type: Exclude<UniformType, 'texture'>;
  value: number | number[] | Float32Array;
}

/**
 * Union type for all uniform values
 */
export type UniformValue = TextureUniform | NumericUniform;

/**
 * Record of uniform names to their values
 */
export type Uniforms = Record<string, UniformValue>;

/**
 * Options for the ShaderCanvas component
 */ 
export type ShaderCanvasOptions = {

  /**
   * Built-in uniform names mapping. Use this option if you want to customize
   * the names of the built-in uniforms (u_time, u_resolution, u_mouse).
   */
  builtInUniforms?: Record<'u_time' | 'u_resolution' | 'u_mouse', string>;

  /**
   * Default texture options applied to all texture uniforms unless overridden
   * by individual texture uniform options.
   */
  defaultTextureOptions?: TextureOptions;

}

/**
 * Props for the ShaderCanvas component
 */
export type ShaderCanvasProps = {
  /**
   * GLSL fragment shader source code
   */
  fragmentShader: string;
  /**
   * Optional custom vertex shader (defaults to fullscreen quad)
   */
  vertexShader?: string;

  /**
   * Custom uniforms to pass to the shader
   * Note: u_time, u_resolution, and u_mouse are provided automatically
   */
  uniforms?: Uniforms;

  /**
   * Pixel ratio for high-DPI displays (defaults to window.devicePixelRatio)
   */
  pixelRatio?: number;

  /**
   * CSS styles for the canvas element
   */
  style?: CSSProperties;

  /**
   * CSS class name for the canvas element
   */
  className?: string;

  /**
   * Additional options for the ShaderCanvas
   */
  options?: ShaderCanvasOptions;
  
  /**
   * Callback fired after each frame is rendered with frame time in ms
   * Useful for performance monitoring
   */
  onFrameRender?: (frameTime: number) => void;

};

/**
 * WebGL program and context wrapper
 */
export interface WebGLProgramInfo {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniformLocations: Map<string, WebGLUniformLocation>;
  textureUnits: Map<string, number>;
}

export interface ShaderTelemetryProps {
  /**
   * Position of the telemetry panel (default: 'top-left')
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Update interval in milliseconds (default: 100ms)
   */
  updateInterval?: number;
  
  /**
   * Number of samples to keep in the graph (default: 60)
   */
  graphSamples?: number;
}