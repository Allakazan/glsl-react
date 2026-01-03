import type { UniformValue, NumericUniform, Uniforms } from '../types';


/**
 * Set a uniform value in the shader
 * @param gl The WebGL rendering context.
 * @param location The location of the uniform to set.
 * @param uniform The uniform value to set.
 * @returns void
 */
export function setUniform(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation,
  uniform: UniformValue,
  textureUnit?: number
) {

  if (uniform.type === 'texture') {
    if (textureUnit === undefined) {
      throw new Error('Texture unit must be provided for texture uniforms');
    }
    gl.uniform1i(location, textureUnit);
    return;
  }

  const numericUniform = uniform as NumericUniform;
  const { type, value } = numericUniform;

  switch (type) {
    // ===== floats =====
    case 'float':
      gl.uniform1f(location, value as number);
      break;

    case 'vec2': {
      const v = value as number[];
      gl.uniform2f(location, v[0], v[1]);
      break;
    }

    case 'vec3': {
      const v = value as number[];
      gl.uniform3f(location, v[0], v[1], v[2]);
      break;
    }

    case 'vec4': {
      const v = value as number[];
      gl.uniform4f(location, v[0], v[1], v[2], v[3]);
      break;
    }

    // ===== integers =====
    case 'int':
      gl.uniform1i(location, value as number);
      break;

    case 'ivec2': {
      const v = value as number[];
      gl.uniform2i(location, v[0], v[1]);
      break;
    }

    case 'ivec3': {
      const v = value as number[];
      gl.uniform3i(location, v[0], v[1], v[2]);
      break;
    }

    case 'ivec4': {
      const v = value as number[];
      gl.uniform4i(location, v[0], v[1], v[2], v[3]);
      break;
    }

    // ===== matrices =====
    case 'mat3': {
      const v = value as number[] | Float32Array;
      gl.uniformMatrix3fv(
        location,
        false,
        v instanceof Float32Array ? v : new Float32Array(v)
      );
      break;
    }

    case 'mat4': {
      const v = value as number[] | Float32Array;
      gl.uniformMatrix4fv(
        location,
        false,
        v instanceof Float32Array ? v : new Float32Array(v)
      );
      break;
    }

    default:
      console.warn('Unknown uniform type', type);
  }
}

/**
 * Deep comparison for uniform values to detect changes
 */
export function uniformsEqual(a: UniformValue, b: UniformValue): boolean {
  if (a.type !== b.type) return false;
  
  if (a.type === 'texture' && b.type === 'texture') {
    // For textures, compare the source reference and options
    if (a.value !== b.value) return false;
    
    // Compare texture options if they exist
    const aOpts = a.options;
    const bOpts = b.options;
    if (aOpts === bOpts) return true;
    if (!aOpts || !bOpts) return false;
    
    return aOpts.wrapS === bOpts.wrapS &&
           aOpts.wrapT === bOpts.wrapT &&
           aOpts.minFilter === bOpts.minFilter &&
           aOpts.magFilter === bOpts.magFilter &&
           aOpts.flipY === bOpts.flipY;
  }
  
  // For numeric uniforms, compare values
  const aVal = a.value;
  const bVal = b.value;
  
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return aVal === bVal;
  }
  
  if (Array.isArray(aVal) && Array.isArray(bVal)) {
    if (aVal.length !== bVal.length) return false;
    return aVal.every((v, i) => v === bVal[i]);
  }
  
  if (aVal instanceof Float32Array && bVal instanceof Float32Array) {
    if (aVal.length !== bVal.length) return false;
    return aVal.every((v, i) => v === bVal[i]);
  }
  
  return false;
}

/**
 * Get uniforms that have changed since the last frame
 */
export function getChangedUniforms(
  current: Uniforms,
  previous: Uniforms | null
): Set<string> {
  const changed = new Set<string>();
  
  // If no previous uniforms, all are considered changed
  if (!previous) {
    return new Set(Object.keys(current));
  }
  
  // Check for new or modified uniforms
  for (const key in current) {
    if (!(key in previous) || !uniformsEqual(current[key], previous[key])) {
      changed.add(key);
    }
  }
  
  return changed;
}

/**
 * Efficiently clone uniform values for change tracking
 */
export function cloneUniformValue(uniform: UniformValue): UniformValue {
  if (uniform.type === 'texture') {
    return {
      type: 'texture',
      value: uniform.value, // Keep reference, we compare by reference anyway
      options: uniform.options ? { ...uniform.options } : undefined
    };
  }
  
  // For numeric uniforms, clone the value
  const value = uniform.value;
  let clonedValue: number | number[] | Float32Array;
  
  if (typeof value === 'number') {
    clonedValue = value;
  } else if (value instanceof Float32Array) {
    clonedValue = new Float32Array(value);
  } else {
    clonedValue = [...value];
  }
  
  return {
    type: uniform.type,
    value: clonedValue
  } as UniformValue;
}

/**
 * Clone all uniforms efficiently
 */
export function cloneUniforms(uniforms: Uniforms): Uniforms {
  const cloned: Uniforms = {};
  for (const key in uniforms) {
    cloned[key] = cloneUniformValue(uniforms[key]);
  }
  return cloned;
}