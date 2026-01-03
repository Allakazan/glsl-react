import { useRef, useEffect, useMemo } from 'react';
import type { TextureOptions, TextureUniform, Uniforms } from '../types';
import {
  createTexture,
  updateTexture,
  deleteTexture,
  isTextureSourceReady,
} from '../utils/textures';

export interface TextureInfo {
  texture: WebGLTexture;
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap;
  unit: number;
}

/**
 * Hook for managing WebGL textures from uniforms
 * @param gl WebGL rendering context
 * @param uniforms Current uniforms object
 * @returns Object with texture units map and textures map
 */
export function useTextures(
  gl: WebGLRenderingContext | null,
  uniforms: Uniforms | undefined
): { textureUnits: Map<string, number>; textures: Map<string, TextureInfo> } {
  const texturesRef = useRef<Map<string, TextureInfo>>(new Map());
  const textureUnitsRef = useRef<Map<string, number>>(new Map());

  // Get available texture unit (reuse deleted ones)
  const getAvailableUnit = (gl: WebGLRenderingContext): number => {

    const maxUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)

    const usedUnits = new Set(textureUnitsRef.current.values());
    for (let i = 0; i < maxUnits; i++) {
      if (!usedUnits.has(i)) return i;
    }
    throw new Error(`No available texture units (max ${maxUnits})`);
  };

  // Create a stable dependency key based on texture uniform names and their source references
  const textureUniformsKey = useMemo(() => {
    if (!uniforms) return 'none';
    
    const textureEntries: [string, any, TextureOptions | undefined][] = [];
    for (const [name, uniform] of Object.entries(uniforms)) {
      if (uniform.type === 'texture') {
        textureEntries.push([
          name,
          (uniform as TextureUniform).value,
          (uniform as TextureUniform).options
        ]);
      }
    }
    
    // Sort by name for stable key
    textureEntries.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Create a key that changes only when texture names or sources change
    // This code my cause some issues if the two or more images have the same name
    // TODO: Implement a unique ID generator for every image to manage this stable key
    return textureEntries.map(
      ([name, src, options]: [string, HTMLImageElement, TextureOptions | undefined]) => `${name}:${src.src}${options && JSON.stringify(options)}`
    ).join('|');
  }, [uniforms]);

  const textureUniforms = useMemo(() => {
    if (!uniforms) return null;
    
    const textures = new Map<string, TextureUniform>();
    for (const [name, uniform] of Object.entries(uniforms)) {
      if (uniform.type === 'texture') {
        textures.set(name, uniform as TextureUniform);
      }
    }
    
    return textures.size > 0 ? textures : null;
  }, [textureUniformsKey]);

  useEffect(() => {
    if (!gl || !textureUniforms) return;

    //console.log("useTextures called with uniforms:", textureUniforms);

    const currentTextures = texturesRef.current;

    // Remove textures that are no longer in uniforms
    for (const [name, info] of currentTextures) {
      if (!textureUniforms.has(name)) {
        deleteTexture(gl, info.texture);
        currentTextures.delete(name);
        textureUnitsRef.current.delete(name);
      }
    }

    // Create or update textures
    for (const [name, uniform] of textureUniforms) {
      const existingInfo = currentTextures.get(name);

      // Check if source is ready
      if (!isTextureSourceReady(uniform.value)) {
        console.warn(`Texture source for "${name}" is not ready yet`);
        continue;
      }

      if (existingInfo) {
        // Update existing texture if source changed
        //if (existingInfo.source !== uniform.value) {
          try {
            updateTexture(
              gl,
              existingInfo.texture,
              uniform.value,
              uniform.options,
              existingInfo.unit
            );
            existingInfo.source = uniform.value;
          } catch (error) {
            console.error(`Failed to update texture "${name}":`, error);
          }
        //}
      } else {
        // Create new texture
        try {
          const unit = getAvailableUnit(gl);

          const texture = createTexture(gl, uniform.value, uniform.options, unit);

          currentTextures.set(name, {
            texture,
            source: uniform.value,
            unit,
          });

          textureUnitsRef.current.set(name, unit);
        } catch (error) {
          console.error(`Failed to create texture "${name}":`, error);
        }
      }
    }
  }, [gl, textureUniforms]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!gl) return;

      //console.log('useTextures cleanup: texturesRef.current before deletion:', texturesRef.current);
      for (const info of texturesRef.current.values()) {
        deleteTexture(gl, info.texture);
      }

      texturesRef.current.clear();
      textureUnitsRef.current.clear();
    };
  }, [gl]);

  return { textureUnits: textureUnitsRef.current, textures: texturesRef.current };
}