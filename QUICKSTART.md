# Quick Start Guide

Get up and running with glsl-react in minutes. This guide walks you through installation, basic usage, and common patterns.

## Installation

Install glsl-react using your preferred package manager:

```bash
npm install glsl-react
```

## Your First Shader

Create a simple animated shader in three steps:

### Step 1: Create the Shader Code

```tsx
const fragmentShader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(wave), 1.0);
  }
`;
```

### Step 2: Import the Component

```tsx
import { ShaderCanvas } from 'glsl-react';
```

### Step 3: Render It

```tsx
function App() {
  return (
    <div style={{ width: '800px', height: '600px' }}>
      <ShaderCanvas fragmentShader={fragmentShader} />
    </div>
  );
}
```

That's it! You now have an animated wave pattern running at 60fps.

## Understanding Built-in Uniforms

Every shader automatically receives three uniforms:

### Why Memoize Uniforms?

**Performance is critical!** The uniforms object should always be wrapped in `useMemo()` because:

1. Creating a new object on every render triggers uniform updates even when values haven't changed
2. This causes unnecessary WebGL state changes and texture rebinding
3. Can lead to severe performance degradation, especially with textures

```tsx
// ❌ BAD - Creates new object every render
<ShaderCanvas uniforms={{ u_value: { type: 'float', value: 1.0 } }} />

// ✅ GOOD - Stable reference, only updates when dependencies change
const uniforms = useMemo<Uniforms>(() => ({
  u_value: { type: 'float', value: myValue }
}), [myValue]);
```

### `u_resolution` (vec2)

Canvas dimensions in pixels. Use it to normalize coordinates:

```glsl
vec2 uv = gl_FragCoord.xy / u_resolution;  // Normalized [0, 1]
```

### `u_time` (float)

Time in seconds since the shader started. Perfect for animations:

```glsl
float pulse = sin(u_time * 2.0) * 0.5 + 0.5;
```

### `u_mouse` (vec2)

Normalized mouse position [0, 1] within the canvas:

```glsl
float dist = distance(uv, u_mouse);
```

## Adding Custom Uniforms

Pass additional data to your shader. **Important: Always memoize the uniforms object** to prevent unnecessary re-renders:

```tsx
import { ShaderCanvas, Uniforms } from 'glsl-react';
import { useState, useMemo } from 'react';

function App() {
  const [color, setColor] = useState([1.0, 0.5, 0.2]);

  const shader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec3 u_color;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      gl_FragColor = vec4(u_color * uv.x, 1.0);
    }
  `;

  const uniforms = useMemo<Uniforms>(() => ({
    u_color: { type: 'vec3', value: color }
  }), [color]);

  return (
    <div>
      <ShaderCanvas
        fragmentShader={shader}
        uniforms={uniforms}
      />
      <button onClick={() => setColor([0.2, 0.8, 1.0])}>
        Change Color
      </button>
    </div>
  );
}
```

## Working with Textures

Load and use images in your shaders:

```tsx
import { ShaderCanvas, Uniforms } from 'glsl-react';
import { useEffect, useState, useMemo } from 'react';

function TextureExample() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/path/to/image.jpg';
    img.onload = () => setImage(img);
  }, []);

  const shader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec4 texColor = texture2D(u_texture, uv);
      gl_FragColor = texColor;
    }
  `;

  const uniforms = useMemo<Uniforms>(() => {
    if (!image) return {};
    return {
      u_texture: { type: 'texture', value: image }
    };
  }, [image]);

  if (!image) return <div>Loading...</div>;

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

## Monitoring Performance

Track FPS and frame time with the telemetry hook:

```tsx
import { ShaderCanvas, useShaderTelemetry } from 'glsl-react';

function App() {
  const { onFrameRender, Telemetry } = useShaderTelemetry({
    position: 'top-right',
    updateInterval: 100,
    graphSamples: 60
  });

  return (
    <>
      <ShaderCanvas
        fragmentShader={shader}
        onFrameRender={onFrameRender}
      />
      <Telemetry />
    </>
  );
}
```

## Common Patterns

### Responsive Fullscreen Shader

```tsx
<div style={{ width: '100vw', height: '100vh' }}>
  <ShaderCanvas fragmentShader={shader} />
</div>
```

### Multiple Shaders in One Component

```tsx
function App() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ height: '400px' }}>
        <ShaderCanvas fragmentShader={shader1} />
      </div>
      <div style={{ height: '400px' }}>
        <ShaderCanvas fragmentShader={shader2} />
      </div>
    </div>
  );
}
```

### React State to Shader Uniforms

```tsx
import { useMemo } from 'react';

function InteractiveShader() {
  const [intensity, setIntensity] = useState(1.0);

  const uniforms = useMemo<Uniforms>(() => ({
    u_intensity: { type: 'float', value: intensity }
  }), [intensity]);

  return (
    <>
      <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />
      <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={intensity}
        onChange={(e) => setIntensity(parseFloat(e.target.value))}
      />
    </>
  );
}
```

## Practical Examples

### Example 1: Animated Gradient Background

```tsx
const gradientShader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(color, 1.0);
  }
`;

<div style={{ width: '100vw', height: '100vh' }}>
  <ShaderCanvas fragmentShader={gradientShader} />
</div>
```

### Example 2: Mouse-Following Spotlight

```tsx
const spotlightShader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float dist = distance(uv, u_mouse);
    float intensity = 1.0 - smoothstep(0.0, 0.5, dist);
    
    vec3 color = vec3(0.1, 0.1, 0.2);
    vec3 lightColor = vec3(1.0, 0.9, 0.7);
    
    gl_FragColor = vec4(mix(color, lightColor, intensity), 1.0);
  }
`;

<ShaderCanvas fragmentShader={spotlightShader} />
```

### Example 3: Image Filter Effect

```tsx
import { useMemo } from 'react';

function ImageFilter() {
  const [image] = useState(() => {
    const img = new Image();
    img.src = '/photo.jpg';
    return img;
  });

  const filterShader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    uniform float u_time;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      
      // Add chromatic aberration effect
      float offset = sin(u_time) * 0.01;
      float r = texture2D(u_texture, uv + vec2(offset, 0.0)).r;
      float g = texture2D(u_texture, uv).g;
      float b = texture2D(u_texture, uv - vec2(offset, 0.0)).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `;

  const uniforms = useMemo<Uniforms>(() => ({
    u_texture: { type: 'texture', value: image }
  }), [image]);

  return <ShaderCanvas fragmentShader={filterShader} uniforms={uniforms} />;
}
```

### Example 4: Video Texture with Effects

```tsx
import { useMemo } from 'react';

function VideoShader() {
  const [video] = useState(() => {
    const vid = document.createElement('video');
    vid.src = '/video.mp4';
    vid.loop = true;
    vid.muted = true;
    vid.play();
    return vid;
  });

  const videoShader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform sampler2D u_video;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec4 color = texture2D(u_video, uv);
      
      // Convert to grayscale
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      
      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;

  const uniforms = useMemo<Uniforms>(() => ({
    u_video: { type: 'texture', value: video }
  }), [video]);

  return <ShaderCanvas fragmentShader={videoShader} uniforms={uniforms} />;
}
```

## Texture Configuration

Customize how textures are sampled:

```tsx
import { TextureWrap, TextureFilter, Uniforms } from 'glsl-react';
import { useMemo } from 'react';

function ConfiguredTexture({ image }: { image: HTMLImageElement }) {
  const uniforms = useMemo<Uniforms>(() => ({
    u_texture: {
      type: 'texture',
      value: image,
      options: {
        wrapS: TextureWrap.REPEAT,
        wrapT: TextureWrap.CLAMP_TO_EDGE,
        minFilter: TextureFilter.LINEAR,
        magFilter: TextureFilter.LINEAR,
        flipY: true
      }
    }
  }), [image]);

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

## Handling Canvas Reference

Access the canvas element directly:

```tsx
import { useRef } from 'react';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      // Download or use dataUrl
    }
  };

  return (
    <>
      <ShaderCanvas
        ref={canvasRef}
        fragmentShader={shader}
      />
      <button onClick={handleScreenshot}>Take Screenshot</button>
    </>
  );
}
```

## Optimizing for High-DPI Displays

Control pixel ratio for performance:

```tsx
// Use device pixel ratio (default - highest quality)
<ShaderCanvas fragmentShader={shader} />

// Use fixed pixel ratio for better performance
<ShaderCanvas fragmentShader={shader} pixelRatio={1} />

// Use custom pixel ratio
<ShaderCanvas fragmentShader={shader} pixelRatio={1.5} />
```

## TypeScript Support

Full type safety with TypeScript:

```tsx
import { ShaderCanvas, Uniforms, TextureWrap } from 'glsl-react';
import { useMemo } from 'react';

function TypedShader({ image }: { image: HTMLImageElement }) {
  const [scale, setScale] = useState(2.0);

  const uniforms = useMemo<Uniforms>(() => ({
    u_color: { type: 'vec3', value: [1.0, 0.5, 0.2] },
    u_scale: { type: 'float', value: scale },
    u_texture: {
      type: 'texture',
      value: image,
      options: {
        wrapS: TextureWrap.REPEAT,
        wrapT: TextureWrap.REPEAT
      }
    }
  }), [scale, image]);

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

## Troubleshooting

### Shader Compilation Errors

Check the browser console for detailed error messages:

```tsx
// Shader with intentional error
const badShader = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0);  // Missing semicolon
  }
`;
```

The console will show: `Shader compilation failed: ERROR: ...`

### Image Not Showing

Ensure the image is loaded before using it:

```tsx
const [image, setImage] = useState<HTMLImageElement | null>(null);

useEffect(() => {
  const img = new Image();
  img.crossOrigin = 'anonymous';  // For CORS images
  img.src = '/texture.jpg';
  img.onload = () => setImage(img);
  img.onerror = (e) => console.error('Failed to load image:', e);
}, []);

if (!image) return <div>Loading texture...</div>;
```

### Performance Issues

1. Lower the pixel ratio
2. Simplify shader calculations
3. Reduce texture sizes
4. Use telemetry to identify bottlenecks

### Complex Uniform Management

For complex shaders with many uniforms, proper memoization is essential:

```tsx
import { useMemo, useState } from 'react';
import { ShaderCanvas, Uniforms } from 'glsl-react';

function ComplexShader() {
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [iterations, setIterations] = useState(100);

  const uniforms = useMemo<Uniforms>(() => ({
    u_maxIterations: { type: 'int', value: iterations },
    u_zoom: { type: 'float', value: zoom },
    u_offset: { type: 'vec2', value: [offset.x, offset.y] },
    u_colorShift: { type: 'float', value: 0.5 }
  }), [iterations, zoom, offset]);

  return (
    <>
      <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />
      <input
        type="range"
        value={zoom}
        onChange={(e) => setZoom(parseFloat(e.target.value))}
      />
    </>
  );
}
```

## Next Steps

- Explore the [full API documentation](./README.md#api-reference)
- Learn about [advanced patterns](./README.md#advanced-usage)
- Check out [contributing guidelines](./CONTRIBUTING.md)
- Experiment with GLSL shader tutorials online

## Resources

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [The Book of Shaders](https://thebookofshaders.com/)
- [Shadertoy](https://www.shadertoy.com/) - Shader examples and inspiration
- [GLSL Language Specification](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
