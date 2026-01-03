import { setUniform, uniformsEqual, getChangedUniforms, cloneUniformValue, cloneUniforms } from '../../src/utils/uniforms';
import { Uniforms, TextureUniform, NumericUniform, UniformType, TextureWrap, TextureFilter } from '../../src/types';

describe('uniforms', () => {
  let gl: WebGLRenderingContext;

  beforeAll(() => {
    gl = {
      uniform1f: jest.fn(),
      uniform2f: jest.fn(),
      uniform3f: jest.fn(),
      uniform4f: jest.fn(),
      uniform1i: jest.fn(),
      uniform2i: jest.fn(),
      uniform3i: jest.fn(),
      uniform4i: jest.fn(),
      uniformMatrix3fv: jest.fn(),
      uniformMatrix4fv: jest.fn(),
    } as unknown as WebGLRenderingContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setUniform', () => {
    const location = {} as WebGLUniformLocation;

    it('should set float uniform', () => {
      const uniform = { type: 'float', value: 1.0 } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform1f).toHaveBeenCalledWith(location, 1.0);
    });

    it('should set vec2 uniform', () => {
      const uniform = { type: 'vec2', value: [1.0, 2.0] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform2f).toHaveBeenCalledWith(location, 1.0, 2.0);
    });

    it('should set vec3 uniform', () => {
      const uniform = { type: 'vec3', value: [1.0, 2.0, 3.0] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform3f).toHaveBeenCalledWith(location, 1.0, 2.0, 3.0);
    });

    it('should set vec4 uniform', () => {
      const uniform = { type: 'vec4', value: [1.0, 2.0, 3.0, 4.0] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform4f).toHaveBeenCalledWith(location, 1.0, 2.0, 3.0, 4.0);
    });

    it('should set int uniform', () => {
      const uniform = { type: 'int', value: 1 } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform1i).toHaveBeenCalledWith(location, 1);
    });

    it('should set ivec2 uniform', () => {
      const uniform = { type: 'ivec2', value: [1, 2] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform2i).toHaveBeenCalledWith(location, 1, 2);
    });

    it('should set ivec3 uniform', () => {
      const uniform = { type: 'ivec3', value: [1, 2, 3] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform3i).toHaveBeenCalledWith(location, 1, 2, 3);
    });

    it('should set ivec4 uniform', () => {
      const uniform = { type: 'ivec4', value: [1, 2, 3, 4] } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniform4i).toHaveBeenCalledWith(location, 1, 2, 3, 4);
    });

    it('should set mat3 uniform', () => {
      const value = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const uniform = { type: 'mat3', value } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniformMatrix3fv).toHaveBeenCalledWith(location, false, expect.any(Float32Array));
    });

    it('should set mat4 uniform', () => {
      const value = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      const uniform = { type: 'mat4', value } as NumericUniform;
      setUniform(gl, location, uniform);
      expect(gl.uniformMatrix4fv).toHaveBeenCalledWith(location, false, expect.any(Float32Array));
    });

    it('should set texture uniform', () => {
      const uniform = { type: 'texture', value: new Image() } as TextureUniform;
      setUniform(gl, location, uniform, 5);
      expect(gl.uniform1i).toHaveBeenCalledWith(location, 5);
    });

    it('should throw error for texture uniform without texture unit', () => {
      const uniform = { type: 'texture', value: new Image() } as TextureUniform;
      expect(() => setUniform(gl, location, uniform)).toThrow('Texture unit must be provided for texture uniforms');
    });

    it('should warn for unknown uniform type', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      const uniform = { type: 'unknown' as UniformType, value: 0 };
      setUniform(gl, location, uniform as NumericUniform);
      expect(warnSpy).toHaveBeenCalledWith('Unknown uniform type', 'unknown');
      warnSpy.mockRestore();
    });
  });

  describe('uniformsEqual', () => {
    it('should return true for identical numeric uniforms', () => {
      const u1 = { type: 'float', value: 1.0 } as NumericUniform;
      const u2 = { type: 'float', value: 1.0 } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(true);
    });

    it('should return false for different numeric uniform values', () => {
      const u1 = { type: 'float', value: 1.0 } as NumericUniform;
      const u2 = { type: 'float', value: 2.0 } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });

    it('should return false for different uniform types', () => {
      const u1 = { type: 'float', value: 1.0 };
      const u2 = { type: 'int', value: 1 };
      expect(uniformsEqual(u1 as any, u2 as any)).toBe(false);
    });

    it('should return true for identical array numeric uniforms', () => {
      const u1 = { type: 'vec3', value: [1.0, 2.0, 3.0] } as NumericUniform;
      const u2 = { type: 'vec3', value: [1.0, 2.0, 3.0] } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(true);
    });

    it('should return false for different array numeric uniform values', () => {
      const u1 = { type: 'vec3', value: [1.0, 2.0, 3.0] } as NumericUniform;
      const u2 = { type: 'vec3', value: [1.0, 2.0, 4.0] } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });

    it('should return false for different array numeric uniform lengths', () => {
      const u1 = { type: 'vec3', value: [1.0, 2.0, 3.0] };
      const u2 = { type: 'vec2', value: [1.0, 2.0] };
      expect(uniformsEqual(u1 as any, u2 as any)).toBe(false);
    });

    it('should return true for identical Float32Array numeric uniforms', () => {
      const u1 = { type: 'mat4', value: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) } as NumericUniform;
      const u2 = { type: 'mat4', value: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(true);
    });

    it('should return false for different Float32Array numeric uniform values', () => {
      const u1 = { type: 'mat4', value: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) } as NumericUniform;
      const u2 = { type: 'mat4', value: new Float32Array([2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) } as NumericUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });

    it('should return false for different Float32Array numeric uniform lengths', () => {
      const u1 = { type: 'mat4', value: new Float32Array(16) };
      const u2 = { type: 'mat3', value: new Float32Array(9) };
      expect(uniformsEqual(u1 as any, u2 as any)).toBe(false);
    });

    it('should return true for identical texture uniforms with same value and options', () => {
      const img = new Image();
      const u1 = { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } } as TextureUniform;
      const u2 = { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } } as TextureUniform;
      expect(uniformsEqual(u1, u2)).toBe(true);
    });

    it('should return true for identical texture uniforms with same value and undefined options', () => {
      const img = new Image();
      const u1 = { type: 'texture', value: img } as TextureUniform;
      const u2 = { type: 'texture', value: img } as TextureUniform;
      expect(uniformsEqual(u1, u2)).toBe(true);
    });

    it('should return false for texture uniforms with different values', () => {
      const u1 = { type: 'texture', value: new Image() } as TextureUniform;
      const u2 = { type: 'texture', value: new Image() } as TextureUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });

    it('should return false for texture uniforms with different options', () => {
      const img = new Image();
      const u1 = { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } } as TextureUniform;
      const u2 = { type: 'texture', value: img, options: { wrapS: TextureWrap.CLAMP_TO_EDGE } } as TextureUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });

    it("should return false for texture uniforms when one has options and the other doesn't", () => {
      const img = new Image();
      const u1 = { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } } as TextureUniform;
      const u2 = { type: 'texture', value: img } as TextureUniform;
      expect(uniformsEqual(u1, u2)).toBe(false);
    });
  });

  describe('getChangedUniforms', () => {
    it('should return all uniforms as changed if no previous uniforms', () => {
      const current: Uniforms = { u_time: { type: 'float', value: 1.0 }, u_res: { type: 'vec2', value: [10, 10] } };
      const changed = getChangedUniforms(current, null);
      expect(changed).toEqual(new Set(['u_time', 'u_res']));
    });

    it('should return changed and new uniforms', () => {
      const previous: Uniforms = { u_time: { type: 'float', value: 1.0 }, u_res: { type: 'vec2', value: [10, 10] } };
      const current: Uniforms = { u_time: { type: 'float', value: 2.0 }, u_res: { type: 'vec2', value: [10, 10] }, u_mouse: { type: 'vec2', value: [0.5, 0.5] } };
      const changed = getChangedUniforms(current, previous);
      expect(changed).toEqual(new Set(['u_time', 'u_mouse']));
    });

    it('should return an empty set if no uniforms have changed', () => {
      const previous: Uniforms = { u_time: { type: 'float', value: 1.0 }, u_res: { type: 'vec2', value: [10, 10] } };
      const current: Uniforms = { u_time: { type: 'float', value: 1.0 }, u_res: { type: 'vec2', value: [10, 10] } };
      const changed = getChangedUniforms(current, previous);
      expect(changed).toEqual(new Set());
    });

    it('should detect changes in texture uniform options', () => {
      const img = new Image();
      const previous: Uniforms = { u_texture: { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } } };
      const current: Uniforms = { u_texture: { type: 'texture', value: img, options: { wrapS: TextureWrap.CLAMP_TO_EDGE } } };
      const changed = getChangedUniforms(current, previous);
      expect(changed).toEqual(new Set(['u_texture']));
    });

    it('should not return removed uniforms as changed', () => {
      const previous: Uniforms = { u_time: { type: 'float', value: 1.0 }, u_old: { type: 'float', value: 5.0 } };
      const current: Uniforms = { u_time: { type: 'float', value: 1.0 } };
      const changed = getChangedUniforms(current, previous);
      expect(changed).toEqual(new Set());
    });
  });

  describe('cloneUniformValue', () => {
    it('should clone a numeric uniform value (number)', () => {
      const uniform: NumericUniform = { type: 'float', value: 1.0 };
      const cloned = cloneUniformValue(uniform) as NumericUniform;
      expect(cloned).toEqual(uniform);
      expect(cloned).not.toBe(uniform);
      expect(cloned.value).toBe(uniform.value);
    });

    it('should clone a numeric uniform value (array)', () => {
      const uniform: NumericUniform = { type: 'vec2', value: [1.0, 2.0] };
      const cloned = cloneUniformValue(uniform) as NumericUniform;
      expect(cloned).toEqual(uniform);
      expect(cloned).not.toBe(uniform);
      expect(cloned.value).toEqual(uniform.value);
      expect(cloned.value).not.toBe(uniform.value);
    });

    it('should clone a numeric uniform value (Float32Array)', () => {
      const value = new Float32Array([1, 2, 3]);
      const uniform: NumericUniform = { type: 'mat3', value };
      const cloned = cloneUniformValue(uniform) as NumericUniform;
      expect(cloned).toEqual(uniform);
      expect(cloned).not.toBe(uniform);
      expect(cloned.value).toEqual(uniform.value);
      expect(cloned.value).not.toBe(uniform.value);
    });

    it('should clone a texture uniform value', () => {
      const img = new Image();
      const options = { wrapS: TextureWrap.REPEAT };
      const uniform: TextureUniform = { type: 'texture', value: img, options };
      const cloned = cloneUniformValue(uniform) as TextureUniform;
      expect(cloned).toEqual(uniform);
      expect(cloned).not.toBe(uniform);
      expect(cloned.value).toBe(uniform.value); // Value reference should be the same
      expect(cloned.options).toEqual(uniform.options);
      expect(cloned.options).not.toBe(uniform.options); // Options object should be cloned
    });

    it('should clone a texture uniform value without options', () => {
      const img = new Image();
      const uniform: TextureUniform = { type: 'texture', value: img };
      const cloned = cloneUniformValue(uniform) as TextureUniform;
      expect(cloned).toEqual(uniform);
      expect(cloned).not.toBe(uniform);
      expect(cloned.value).toBe(uniform.value);
      expect(cloned.options).toBeUndefined();
    });
  });

  describe('cloneUniforms', () => {
    it('should deep clone all uniforms', () => {
      const img = new Image();
      const uniforms: Uniforms = {
        u_float: { type: 'float', value: 1.0 },
        u_vec2: { type: 'vec2', value: [1.0, 2.0] },
        u_mat4: { type: 'mat4', value: new Float32Array(16) },
        u_texture: { type: 'texture', value: img, options: { wrapS: TextureWrap.REPEAT } },
      };

      const clonedUniforms = cloneUniforms(uniforms);

      expect(clonedUniforms).toEqual(uniforms);
      expect(clonedUniforms).not.toBe(uniforms);

      // Verify deep cloning for mutable values
      expect((clonedUniforms.u_vec2 as NumericUniform).value).not.toBe((uniforms.u_vec2 as NumericUniform).value);
      expect((clonedUniforms.u_mat4 as NumericUniform).value).not.toBe((uniforms.u_mat4 as NumericUniform).value);
      expect((clonedUniforms.u_texture as TextureUniform).options).not.toBe((uniforms.u_texture as TextureUniform).options);
      // Texture value itself (the Image object) should be the same reference
      expect((clonedUniforms.u_texture as TextureUniform).value).toBe((uniforms.u_texture as TextureUniform).value);
    });

    it('should return an empty object if no uniforms are provided', () => {
      const uniforms: Uniforms = {};
      const clonedUniforms = cloneUniforms(uniforms);
      expect(clonedUniforms).toEqual({});
      expect(clonedUniforms).not.toBe(uniforms);
    });
  });
});