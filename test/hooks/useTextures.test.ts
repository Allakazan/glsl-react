import { renderHook, act } from '@testing-library/react';
import { useTextures } from '../../src/hooks/useTextures';
import { Uniforms, TextureUniform, TextureWrap, TextureFilter } from '../../src/types';
import * as texturesUtils from '../../src/utils/textures';

describe('useTextures', () => {
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
      getParameter: jest.fn((param) => {
        if (param === 34076 /* gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS */) return 8;
        return 0;
      }),
      // Constants
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: 34076,
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

    // Mock textures utility functions
    jest.spyOn(texturesUtils, 'createTexture').mockImplementation(
      (mockGl, source, options, unit) => {
        mockGl.activeTexture(mockGl.TEXTURE0 + unit);
        mockGl.bindTexture(mockGl.TEXTURE_2D, { id: unit } as WebGLTexture);
        return { mockTexture: true, source, options, unit, id: unit } as unknown as WebGLTexture;
      }
    );
    jest.spyOn(texturesUtils, 'updateTexture').mockImplementation(() => { });
    jest.spyOn(texturesUtils, 'deleteTexture').mockImplementation(() => { });
    jest.spyOn(texturesUtils, 'isTextureSourceReady').mockImplementation(() => true);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty textureMaps if no texture uniforms', () => {
    const uniforms: Uniforms = { u_float: { type: 'float', value: 1.0 } };
    const { result } = renderHook(() => useTextures(gl, uniforms));

    expect(result.current.textureUnits.size).toBe(0);
    expect(result.current.textures.size).toBe(0);
    expect(texturesUtils.createTexture).not.toHaveBeenCalled();
  });

  it('should create textures for texture uniforms on mount', () => {
    const image = new Image();
    image.src = 'test.jpg';
    const uniforms: Uniforms = {
      u_texture: { type: 'texture', value: image, options: { wrapS: TextureWrap.REPEAT } },
    };

    const { result } = renderHook(() => useTextures(gl, uniforms));

    expect(texturesUtils.createTexture).toHaveBeenCalledTimes(1);
    expect(texturesUtils.createTexture).toHaveBeenCalledWith(gl, image, { wrapS: TextureWrap.REPEAT }, 0);
    expect(result.current.textureUnits.get('u_texture')).toBe(0);
    expect(result.current.textures.has('u_texture')).toBe(true);
  });

  it('should update existing textures if source or options change', () => {
    const image1 = new Image();
    image1.src = 'image1.jpg';
    const image2 = new Image();
    image2.src = 'image2.jpg';

    const initialUniforms: Uniforms = {
      u_texture: { type: 'texture', value: image1, options: { wrapS: TextureWrap.REPEAT } },
    };

    const { result, rerender } = renderHook(({ uniforms }) => useTextures(gl, uniforms), {
      initialProps: { uniforms: initialUniforms },
    });

    expect(texturesUtils.createTexture).toHaveBeenCalledTimes(1);
    expect(result.current.textureUnits.get('u_texture')).toBe(0);

    // Rerender with changed source and options
    const updatedUniforms: Uniforms = {
      u_texture: { type: 'texture', value: image2, options: { wrapS: TextureWrap.CLAMP_TO_EDGE } },
    };
    rerender({ uniforms: updatedUniforms });

    expect(texturesUtils.updateTexture).toHaveBeenCalledTimes(1);
    expect(texturesUtils.updateTexture).toHaveBeenCalledWith(
      gl,
      (result.current.textures.get('u_texture') as any).texture,
      image2,
      { wrapS: TextureWrap.CLAMP_TO_EDGE },
      0 // Should reuse the same unit
    );
    // Should not create a new texture
    expect(texturesUtils.createTexture).toHaveBeenCalledTimes(1);
  });

  it('should delete textures on unmount', () => {
    const image = new Image();
    image.src = 'test-unmount.jpg';
    const uniforms: Uniforms = {
      u_texture: { type: 'texture', value: image },
    };

    const { result, unmount } = renderHook(() => useTextures(gl, uniforms));

    const createdTexture = (result.current.textures.get('u_texture') as any).texture;
    expect(texturesUtils.createTexture).toHaveBeenCalledTimes(1);

    unmount();

    expect(texturesUtils.deleteTexture).toHaveBeenCalledTimes(1);
    expect(texturesUtils.deleteTexture).toHaveBeenCalledWith(gl, createdTexture);
    expect(result.current.textureUnits.size).toBe(0);
    expect(result.current.textures.size).toBe(0);
  });

  it('should delete textures that are no longer in uniforms', () => {
    const image1 = new Image();
    image1.src = 'image1.jpg';
    const image2 = new Image();
    image2.src = 'image2.jpg';

    const initialUniforms: Uniforms = {
      u_texture1: { type: 'texture', value: image1 },
      u_texture2: { type: 'texture', value: image2 },
    };

    const { result, rerender } = renderHook(({ uniforms }) => useTextures(gl, uniforms), {
      initialProps: { uniforms: initialUniforms },
    });

    expect(texturesUtils.createTexture).toHaveBeenCalledTimes(2);

    // Remove u_texture2
    const updatedUniforms: Uniforms = {
      u_texture1: { type: 'texture', value: image1 },
    };
    rerender({ uniforms: updatedUniforms });

    expect(texturesUtils.deleteTexture).toHaveBeenCalledTimes(1);
    // The deleted texture should be u_texture2's texture
    expect(texturesUtils.deleteTexture).toHaveBeenCalledWith(gl, expect.objectContaining({ source: image2 }));
    expect(result.current.textureUnits.has('u_texture2')).toBe(false);
    expect(result.current.textures.has('u_texture2')).toBe(false);
    expect(result.current.textureUnits.has('u_texture1')).toBe(true);
  });

  it('should not create or update textures if source is not ready', () => {
    jest.spyOn(texturesUtils, 'isTextureSourceReady').mockReturnValueOnce(false);

    const image = new Image();
    const uniforms: Uniforms = {
      u_texture: { type: 'texture', value: image },
    };

    renderHook(() => useTextures(gl, uniforms));

    expect(texturesUtils.createTexture).not.toHaveBeenCalled();
    expect(texturesUtils.updateTexture).not.toHaveBeenCalled();
  });

  it('should allocate unique texture units', () => {
    const image1 = new Image();
    image1.src = 'image1.jpg';
    const image2 = new Image();
    image2.src = 'image2.jpg';
    const image3 = new Image();
    image3.src = 'image3.jpg';

    const uniforms: Uniforms = {
      u_tex1: { type: 'texture', value: image1 },
      u_tex2: { type: 'texture', value: image2 },
      u_tex3: { type: 'texture', value: image3 },
    };

    const { result } = renderHook(() => useTextures(gl, uniforms));

    const units = Array.from(result.current.textureUnits.values());
    // Expect unique units to be assigned, typically starting from 0
    expect(units.sort()).toEqual([0, 1, 2]);
    expect(gl.activeTexture).toHaveBeenCalledTimes(3);
  });

  it('should reuse texture units when textures are removed', () => {
    const image1 = new Image();
    image1.src = 'image1.jpg';
    const image2 = new Image();
    image2.src = 'image2.jpg';

    const initialUniforms: Uniforms = {
      u_tex1: { type: 'texture', value: image1 },
      u_tex2: { type: 'texture', value: image2 },
    };

    const { result, rerender } = renderHook(({ uniforms }) => useTextures(gl, uniforms), {
      initialProps: { uniforms: initialUniforms },
    });

    const initialUnit1 = result.current.textureUnits.get('u_tex1');
    const initialUnit2 = result.current.textureUnits.get('u_tex2');
    expect(initialUnit1).toBe(0);
    expect(initialUnit2).toBe(1);

    // Remove u_tex2, its unit (1) should become available
    rerender({ uniforms: { u_tex1: { type: 'texture', value: image1 } } });

    expect(result.current.textureUnits.has('u_tex2')).toBe(false);

    // Add a new texture, it should reuse unit 1
    const image3 = new Image();
    image3.src = 'image3.jpg';
    rerender({ uniforms: {
      u_tex1: { type: 'texture', value: image1 },
      u_tex3: { type: 'texture', value: image3 },
    } });

    expect(result.current.textureUnits.get('u_tex3')).toBe(1);
  });
});
