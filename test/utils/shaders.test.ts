import { compileShader, createProgram, createQuadBuffer, getUniformLocations, DEFAULT_VERTEX_SHADER } from '../../src/utils/shaders';

describe('shaders', () => {
  let gl: WebGLRenderingContext;

  beforeAll(() => {
    // Manually mock WebGLRenderingContext and its methods
    gl = {
      createShader: jest.fn(() => ({}) as WebGLShader),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn((shader, param) => {
        if (param === 35713 /* gl.COMPILE_STATUS */) return true;
        return null;
      }),
      getShaderInfoLog: jest.fn(() => ''),
      deleteShader: jest.fn(),

      createProgram: jest.fn(() => ({}) as WebGLProgram),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn((program, param) => {
        if (param === 35714 /* gl.LINK_STATUS */) return true;
        return null;
      }),
      getProgramInfoLog: jest.fn(() => ''),
      deleteProgram: jest.fn(),
      useProgram: jest.fn(),

      createBuffer: jest.fn(() => ({}) as WebGLBuffer),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      getAttribLocation: jest.fn(() => 0),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),

      getUniformLocation: jest.fn((program, name) => {
        if (name === 'u_resolution' || name === 'u_time' || name === 'u_mouse') {
          return {} as WebGLUniformLocation;
        }
        return null;
      }),
      // Add other necessary GL constants and methods that might be accessed
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      ARRAY_BUFFER: 34962,
      STATIC_DRAW: 35044,
      FLOAT: 5126,
      COLOR_BUFFER_BIT: 16384,
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
      TEXTURE_2D: 3553,
      TEXTURE0: 33984,
      TEXTURE_WRAP_S: 10242,
      TEXTURE_WRAP_T: 10243,
      TEXTURE_MIN_FILTER: 10241,
      TEXTURE_MAG_FILTER: 10240,
      CLAMP_TO_EDGE: 33071,
      REPEAT: 10497,
      MIRRORED_REPEAT: 33648,
      NEAREST: 9728,
      LINEAR: 9729,
      NEAREST_MIPMAP_NEAREST: 9984,
      LINEAR_MIPMAP_NEAREST: 9985,
      NEAREST_MIPMAP_LINEAR: 9986,
      LINEAR_MIPMAP_LINEAR: 9987,
      UNPACK_FLIP_Y_WEBGL: 37440,
      activeTexture: jest.fn(),
      bindTexture: jest.fn(),
      texParameteri: jest.fn(),
      texImage2D: jest.fn(),
      generateMipmap: jest.fn(),
      deleteTexture: jest.fn(),
      getParameter: jest.fn(() => 8), // Mock MAX_COMBINED_TEXTURE_IMAGE_UNITS

    } as unknown as WebGLRenderingContext; // Cast to WebGLRenderingContext

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('compileShader', () => {
    it('should compile a vertex shader successfully', () => {
      const shaderSource = 'attribute vec4 a_position; void main() { gl_Position = a_position; }';
      const shader = compileShader(gl, gl.VERTEX_SHADER, shaderSource);

      expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
      expect(gl.shaderSource).toHaveBeenCalledWith(shader, shaderSource);
      expect(gl.compileShader).toHaveBeenCalledWith(shader);
      expect(gl.getShaderParameter).toHaveBeenCalledWith(shader, gl.COMPILE_STATUS);
      expect(shader).toBeDefined();
    });

    it('should compile a fragment shader successfully', () => {
      const shaderSource = 'precision mediump float; void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';
      const shader = compileShader(gl, gl.FRAGMENT_SHADER, shaderSource);

      expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
      expect(gl.shaderSource).toHaveBeenCalledWith(shader, shaderSource);
      expect(gl.compileShader).toHaveBeenCalledWith(shader);
      expect(gl.getShaderParameter).toHaveBeenCalledWith(shader, gl.COMPILE_STATUS);
      expect(shader).toBeDefined();
    });

    it('should throw an error if shader compilation fails', () => {
      (gl.getShaderParameter as jest.Mock).mockReturnValueOnce(false);
      (gl.getShaderInfoLog as jest.Mock).mockReturnValueOnce('Shader error');

      const shaderSource = 'invalid shader';
      expect(() => compileShader(gl, gl.FRAGMENT_SHADER, shaderSource)).toThrow('Shader compilation failed: Shader error');
      expect(gl.deleteShader).toHaveBeenCalled();
    });
  });

  describe('createProgram', () => {
    it('should create and link a program successfully', () => {
      const vertexShader = {} as WebGLShader;
      const fragmentShader = {} as WebGLShader;
      const program = createProgram(gl, vertexShader, fragmentShader);

      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.attachShader).toHaveBeenCalledWith(program, vertexShader);
      expect(gl.attachShader).toHaveBeenCalledWith(program, fragmentShader);
      expect(gl.linkProgram).toHaveBeenCalledWith(program);
      expect(gl.getProgramParameter).toHaveBeenCalledWith(program, gl.LINK_STATUS);
      expect(program).toBeDefined();
    });

    it('should throw an error if program linking fails', () => {
      (gl.getProgramParameter as jest.Mock).mockReturnValueOnce(false);
      (gl.getProgramInfoLog as jest.Mock).mockReturnValueOnce('Program error');

      const vertexShader = {} as WebGLShader;
      const fragmentShader = {} as WebGLShader;
      expect(() => createProgram(gl, vertexShader, fragmentShader)).toThrow('Program linking failed: Program error');
      expect(gl.deleteProgram).toHaveBeenCalled();
    });
  });

  describe('createQuadBuffer', () => {
    it('should create and bind a buffer for the fullscreen quad', () => {
      const buffer = createQuadBuffer(gl);

      expect(gl.createBuffer).toHaveBeenCalled();
      expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, buffer);
      expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, expect.any(Float32Array), gl.STATIC_DRAW);
      expect(buffer).toBeDefined();
    });
  });

  describe('getUniformLocations', () => {
    it('should return a map of uniform locations', () => {
      const program = {} as WebGLProgram;
      const uniformNames = ['u_resolution', 'u_time', 'u_mouse', 'u_custom'];
      const locations = getUniformLocations(gl, program, uniformNames);

      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_resolution');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_time');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_mouse');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_custom'); // This one should return null and be warned about

      expect(locations.has('u_resolution')).toBe(true);
      expect(locations.has('u_time')).toBe(true);
      expect(locations.has('u_mouse')).toBe(true);
      expect(locations.has('u_custom')).toBe(false); // Not found, so not in map
      expect(locations.size).toBe(3);
    });

    it('should warn if a uniform is not found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const program = {} as WebGLProgram;
      const uniformNames = ['u_non_existent'];
      getUniformLocations(gl, program, uniformNames);

      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_non_existent');
      expect(warnSpy).toHaveBeenCalledWith('Uniform "u_non_existent" not found in shader program');
      warnSpy.mockRestore();
    });
  });
});