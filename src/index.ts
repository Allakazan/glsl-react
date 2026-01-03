// Main component
export { ShaderCanvas } from './components/ShaderCanvas';

// Enums
export { TextureWrap, TextureFilter } from './types';

// Types
export type {
  ShaderCanvasProps,
  UniformType,
  UniformValue,
  Uniforms,
  TextureUniform,
  NumericUniform,
  TextureOptions,
  ShaderTelemetryProps
} from './types';

// Hooks (if users want to build custom components)
export { useWebGL } from './hooks/useWebGL';
export { useMousePosition } from './hooks/useMousePosition';
export { useResizeObserver } from './hooks/useResizeObserver';
export { useTextures } from './hooks/useTextures';
export { useShaderTelemetry } from './hooks/useShaderTelemetry';

// Utilities (if users want low-level access)
export {
  DEFAULT_VERTEX_SHADER,
  compileShader,
  createProgram,
  createQuadBuffer,
  getUniformLocations
} from './utils/shaders';

export {
  setUniform
} from './utils/uniforms';

export {
  createTexture,
  updateTexture,
  bindTexture,
  deleteTexture,
  isTextureSourceReady,
} from './utils/textures';
