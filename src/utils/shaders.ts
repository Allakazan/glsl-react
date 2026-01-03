
/**
 * Default vertex shader for fullscreen quad
 */
export const DEFAULT_VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`.trim();

/**
 * Compiles a WebGL shader from the given source code.
 * @param gl The WebGL rendering context.
 * @param type The type of shader to compile (e.g., gl.VERTEX_SHADER, gl.FRAGMENT_SHADER).
 * @param source The GLSL source code for the shader.
 * @returns The compiled WebGLShader.
 * @throws Error if the shader creation or compilation fails.
 */
export const compileShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error(`Failed to create shader of type ${type}`);
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }

  return shader;
};

/**
 * Creates and links a WebGL program with the given vertex and fragment shaders.
 * @param gl The WebGL rendering context.
 * @param vertexShader The compiled vertex shader.
 * @param fragmentShader The compiled fragment shader.
 * @returns The linked WebGLProgram.
 * @throws Error if the program creation or linking fails.
 */
export const createProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram => {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create WebGL program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${info}`);
  }

  return program;
};

/**
 * Creates a WebGL buffer for a fullscreen quad.
 * @param gl The WebGL rendering context.
 * @returns The WebGLBuffer containing the quad's position data.
 * @throws Error if the buffer creation fails.
 */
export function createQuadBuffer(gl: WebGLRenderingContext): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error('Failed to create quad buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Two triangles forming a fullscreen quad
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  return buffer;
}

/**
 * Retrieves the WebGL uniform locations for a given program and list of uniform names.
 * @param gl The WebGL rendering context.
 * @param program The WebGLProgram to get uniform locations from.
 * @param uniformNames An array of uniform names to retrieve locations for.
 * @returns A Map where keys are uniform names and values are their respective WebGLUniformLocation.
 */
export function getUniformLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  uniformNames: string[]
): Map<string, WebGLUniformLocation> {
  const locations = new Map<string, WebGLUniformLocation>();

  for (const name of uniformNames) {
    const location = gl.getUniformLocation(program, name);

    if (!location) {
      console.warn(`Uniform "${name}" not found in shader program`);
      continue;
    }

    locations.set(name, location);
  }

  return locations;
}


/*
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  pixelRatio: number = window.devicePixelRatio
): boolean {
  const displayWidth = Math.floor(canvas.clientWidth * pixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    return true;
  }

  return false;
}*/