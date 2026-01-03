import { createTexture, updateTexture, bindTexture, deleteTexture, isTextureSourceReady } from '../../src/utils/textures';
import { TextureFilter, TextureWrap } from '../../src/types';

describe('textures', () => {
  let gl: WebGLRenderingContext;

  beforeAll(() => {
    gl = {
      createTexture: jest.fn(() => ({}) as WebGLTexture),
      activeTexture: jest.fn(),
      bindTexture: jest.fn(),
      texParameteri: jest.fn(),
      texImage2D: jest.fn(),
      generateMipmap: jest.fn(),
      deleteTexture: jest.fn(),
      pixelStorei: jest.fn(),
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
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
    } as unknown as WebGLRenderingContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTexture', () => {
    it('should create and configure a texture with default options', () => {
      const source = new Image();
      const texture = createTexture(gl, source, {}, 0);

      expect(gl.createTexture).toHaveBeenCalled();
      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 0);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, texture);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      expect(gl.pixelStorei).toHaveBeenCalledWith(gl.UNPACK_FLIP_Y_WEBGL, true);
      expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      expect(gl.generateMipmap).not.toHaveBeenCalled();
      expect(texture).toBeDefined();
    });

    it('should create and configure a texture with custom options', () => {
      const source = new Image();
      const options = {
        wrapS: TextureWrap.REPEAT,
        wrapT: TextureWrap.MIRRORED_REPEAT,
        minFilter: TextureFilter.NEAREST,
        magFilter: TextureFilter.NEAREST,
        flipY: false,
      };
      const texture = createTexture(gl, source, options, 1);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 1);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, texture);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      expect(gl.pixelStorei).toHaveBeenCalledWith(gl.UNPACK_FLIP_Y_WEBGL, false);
      expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      expect(gl.generateMipmap).not.toHaveBeenCalled();
    });

    it('should generate mipmaps if minFilter is a mipmap filter', () => {
      const source = new Image();
      const options = { minFilter: TextureFilter.LINEAR_MIPMAP_LINEAR };
      createTexture(gl, source, options, 0);
      expect(gl.generateMipmap).toHaveBeenCalledWith(gl.TEXTURE_2D);
    });
  });

  describe('updateTexture', () => {
    it('should update an existing texture with new source and options', () => {
      const texture = {} as WebGLTexture;
      const source = new Image();
      const options = {
        wrapS: TextureWrap.REPEAT,
        flipY: true,
      };
      updateTexture(gl, texture, source, options, 0);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 0);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, texture);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      expect(gl.pixelStorei).toHaveBeenCalledWith(gl.UNPACK_FLIP_Y_WEBGL, true);
      expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    });

    it('should generate mipmaps if minFilter is a mipmap filter during update', () => {
      const texture = {} as WebGLTexture;
      const source = new Image();
      const options = { minFilter: TextureFilter.NEAREST_MIPMAP_NEAREST };
      updateTexture(gl, texture, source, options, 0);
      expect(gl.generateMipmap).toHaveBeenCalledWith(gl.TEXTURE_2D);
    });
  });

  describe('bindTexture', () => {
    it('should bind a texture to a specific unit', () => {
      const texture = {} as WebGLTexture;
      bindTexture(gl, texture, 3);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 3);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, texture);
    });
  });

  describe('deleteTexture', () => {
    it('should delete a WebGL texture', () => {
      const texture = {} as WebGLTexture;
      deleteTexture(gl, texture);

      expect(gl.deleteTexture).toHaveBeenCalledWith(texture);
    });
  });

  describe('isTextureSourceReady', () => {
    it('should return true for HTMLImageElement when complete and naturalWidth > 0', () => {
      const img = new Image();
      Object.defineProperty(img, 'complete', { value: true });
      Object.defineProperty(img, 'naturalWidth', { value: 10 });
      expect(isTextureSourceReady(img)).toBe(true);
    });

    it('should return false for HTMLImageElement when not complete', () => {
      const img = new Image();
      Object.defineProperty(img, 'complete', { value: false });
      Object.defineProperty(img, 'naturalWidth', { value: 10 });
      expect(isTextureSourceReady(img)).toBe(false);
    });

    it('should return false for HTMLImageElement when naturalWidth is 0', () => {
      const img = new Image();
      Object.defineProperty(img, 'complete', { value: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0 });
      expect(isTextureSourceReady(img)).toBe(false);
    });

    it('should return true for HTMLVideoElement when readyState is HAVE_CURRENT_DATA or higher', () => {
      const video1 = document.createElement('video');
      Object.defineProperty(video1, 'readyState', { value: video1.HAVE_CURRENT_DATA });
      expect(isTextureSourceReady(video1)).toBe(true);

      const video2 = document.createElement('video');
      Object.defineProperty(video2, 'readyState', { value: video2.HAVE_ENOUGH_DATA });
      expect(isTextureSourceReady(video2)).toBe(true);
    });

    it('should return false for HTMLVideoElement when readyState is less than HAVE_CURRENT_DATA', () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'readyState', { value: video.HAVE_NOTHING });
      expect(isTextureSourceReady(video)).toBe(false);
    });

    it('should return true for HTMLCanvasElement', () => {
      const canvas = document.createElement('canvas');
      expect(isTextureSourceReady(canvas)).toBe(true);
    });

    it('should return true for ImageBitmap', () => {
      const imageBitmap = {} as ImageBitmap; // Mock ImageBitmap
      expect(isTextureSourceReady(imageBitmap)).toBe(true);
    });
  });
});