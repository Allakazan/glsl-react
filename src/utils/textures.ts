import { TextureFilter, TextureWrap, type TextureOptions } from '../types';

/**
 * Create and configure a WebGL texture
 */
export function createTexture(
  gl: WebGLRenderingContext,
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  options: TextureOptions = {},
  unit: number
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create WebGL texture');
  }

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set texture parameters
  const {
    wrapS = TextureWrap.CLAMP_TO_EDGE,
    wrapT = TextureWrap.CLAMP_TO_EDGE,
    minFilter = TextureFilter.LINEAR,
    magFilter = TextureFilter.LINEAR,
    flipY = true,
  } = options;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

  // Flip Y for images (standard for WebGL)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

  // Upload texture data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source
  );

  // Generate mipmaps if using mipmap filters
  if (
    [
      TextureFilter.NEAREST_MIPMAP_NEAREST,
      TextureFilter.LINEAR_MIPMAP_NEAREST,
      TextureFilter.NEAREST_MIPMAP_LINEAR,
      TextureFilter.LINEAR_MIPMAP_LINEAR
    ].includes(minFilter)
  ) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  return texture;
}

/**
 * Update an existing texture with new source data
 */
export function updateTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  options: TextureOptions = {},
  unit: number
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (options.wrapS) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS);
  if (options.wrapT) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT);
  if (options.minFilter) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter);
  if (options.magFilter) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter);
  if (options.flipY !== undefined) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source
  );

  if (
    options.minFilter &&
    [
      TextureFilter.NEAREST_MIPMAP_NEAREST,
      TextureFilter.LINEAR_MIPMAP_NEAREST,
      TextureFilter.NEAREST_MIPMAP_LINEAR,
      TextureFilter.LINEAR_MIPMAP_LINEAR
    ].includes(options.minFilter)
  ) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}

/**
 * Bind a texture to a specific texture unit
 */
export function bindTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  unit: number
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

/**
 * Delete a WebGL texture
 */
export function deleteTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture
): void {
  gl.deleteTexture(texture);
}

/**
 * Check if a texture source is ready to be uploaded
 */
export function isTextureSourceReady(
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap
): boolean {
  if (source instanceof HTMLImageElement) {
    return source.complete && source.naturalWidth > 0;
  }

  if (source instanceof HTMLVideoElement) {
    return source.readyState >= source.HAVE_CURRENT_DATA;
  }

  // Canvas and ImageBitmap are always ready
  return true;
}
