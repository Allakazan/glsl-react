# glsl-react

A React library for rendering WebGL shaders with a simple, declarative API. Write GLSL fragment shaders and render them as React components with minimal setup. It has no dependencies.

## Features

- 🎨 **Simple declarative API** - Render shaders as React components
- 🔧 **Built-in uniforms** - Automatic time, resolution, and mouse position tracking
- 🖼️ **Texture support** - Load images, videos, and canvas elements as textures
- 📊 **Performance monitoring** - Built-in FPS and frame time telemetry
- 🎯 **TypeScript first** - Full type safety and IntelliSense support
- ⚡ **Optimized rendering** - Efficient uniform updates and texture management
- 🪝 **Composable hooks** - Build custom shader components with low-level hooks
- 📦 **Zero dependencies** - Lightweight and no external runtime dependencies

## Installation

```bash
npm install glsl-react
```

```bash
yarn add glsl-react
```

```bash
pnpm add glsl-react
```

## Quick Start

```tsx
import { ShaderCanvas } from 'glsl-react';

const fragmentShader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ShaderCanvas fragmentShader={fragmentShader} />
    </div>
  );
}
```

## Core Concepts

### Built-in Uniforms

The library automatically provides three essential uniforms:

- `u_resolution` (vec2) - Canvas dimensions in pixels
- `u_time` (float) - Time in seconds since shader started
- `u_mouse` (vec2) - Normalized mouse position [0, 1]

### Custom Uniforms

Pass custom uniforms to your shader. **Important: Always memoize the uniforms object** to prevent unnecessary re-renders and performance issues:

```tsx
import { useMemo } from 'react';

function MyShader() {
  const [scale, setScale] = useState(2.0);
  const [color, setColor] = useState([1.0, 0.5, 0.2]);

  const uniforms = useMemo<Uniforms>(() => ({
    u_color: { type: 'vec3', value: color },
    u_scale: { type: 'float', value: scale },
    u_matrix: { type: 'mat4', value: new Float32Array(16) }
  }), [color, scale]);

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

### Texture Uniforms

Load images, videos, or canvas elements as textures:

```tsx
import { useMemo, useState, useEffect } from 'react';

function TextureShader() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/path/to/texture.jpg';
    img.onload = () => setImage(img);
  }, []);

  const uniforms = useMemo<Uniforms>(() => {
    if (!image) return {};
    
    return {
      u_texture: {
        type: 'texture',
        value: image,
        options: {
          wrapS: TextureWrap.REPEAT,
          wrapT: TextureWrap.REPEAT,
          minFilter: TextureFilter.LINEAR,
          magFilter: TextureFilter.LINEAR,
          flipY: true
        }
      }
    };
  }, [image]);

  if (!image) return <div>Loading...</div>;

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

### Performance Monitoring

Track shader performance with the built-in telemetry hook:

```tsx
import { ShaderCanvas, useShaderTelemetry } from 'glsl-react';

function App() {
  const { onFrameRender, Telemetry } = useShaderTelemetry({
    position: 'top-right'
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

## API Reference

### `ShaderCanvas`

Main component for rendering WebGL shaders.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fragmentShader` | `string` | Yes | GLSL fragment shader source code |
| `vertexShader` | `string` | No | Custom vertex shader (defaults to fullscreen quad) |
| `uniforms` | `Uniforms` | No | Custom uniform values |
| `pixelRatio` | `number` | No | Pixel ratio for high-DPI displays (default: `window.devicePixelRatio`) |
| `style` | `CSSProperties` | No | CSS styles for canvas element |
| `className` | `string` | No | CSS class name |
| `options` | `ShaderCanvasOptions` | No | Additional configuration options |
| `onFrameRender` | `(frameTime: number) => void` | No | Callback fired after each frame |

### Uniform Types

Supported uniform types:

- **Scalars**: `float`, `int`
- **Vectors**: `vec2`, `vec3`, `vec4`, `ivec2`, `ivec3`, `ivec4`
- **Matrices**: `mat3`, `mat4`
- **Textures**: `texture`

### Texture Configuration

**TextureWrap** enum:
- `REPEAT` - Repeat texture
- `CLAMP_TO_EDGE` - Clamp to edge
- `MIRRORED_REPEAT` - Mirror and repeat

**TextureFilter** enum:
- `NEAREST` - Nearest neighbor filtering
- `LINEAR` - Linear filtering
- `NEAREST_MIPMAP_NEAREST` - Nearest mipmap, nearest filtering
- `LINEAR_MIPMAP_NEAREST` - Linear mipmap, nearest filtering
- `NEAREST_MIPMAP_LINEAR` - Nearest mipmap, linear filtering
- `LINEAR_MIPMAP_LINEAR` - Linear mipmap, linear filtering

### Hooks

#### `useShaderTelemetry(props?)`

Creates performance monitoring for shader rendering.

```tsx
const { onFrameRender, Telemetry } = useShaderTelemetry({
  position: 'top-right',
  updateInterval: 100,
  graphSamples: 60
});
```

#### `useWebGL(canvasRef, uniformsRef, vertexShader, fragmentShader)`

Low-level hook for WebGL context and shader program management.

#### `useTextures(gl, uniforms)`

Manages WebGL textures from uniform definitions.

#### `useMousePosition(elementRef)`

Tracks normalized mouse position [0, 1] within an element.

#### `useResizeObserver(elementRef, callback)`

Observes element resize with efficient ResizeObserver API.

## Advanced Usage

### Custom Vertex Shader

```tsx
const vertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

<ShaderCanvas
  vertexShader={vertexShader}
  fragmentShader={fragmentShader}
/>
```

### Custom Built-in Uniform Names

```tsx
<ShaderCanvas
  fragmentShader={shader}
  options={{
    builtInUniforms: {
      u_time: 'time',
      u_resolution: 'resolution',
      u_mouse: 'mouse'
    }
  }}
/>
```

### Video Textures

```tsx
import { useMemo, useState } from 'react';

function VideoShader() {
  const [video] = useState(() => {
    const vid = document.createElement('video');
    vid.src = '/path/to/video.mp4';
    vid.loop = true;
    vid.play();
    return vid;
  });

  const uniforms = useMemo<Uniforms>(() => ({
    u_video: {
      type: 'texture',
      value: video
    }
  }), [video]);

  return <ShaderCanvas fragmentShader={shader} uniforms={uniforms} />;
}
```

### Forwarding Canvas Ref

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);

<ShaderCanvas
  ref={canvasRef}
  fragmentShader={shader}
/>
```

## Examples

### Animated Gradient

```tsx
const shader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(color, 1.0);
  }
`;
```

### Mouse-Interactive Shader

```tsx
const shader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float dist = distance(uv, u_mouse);
    vec3 color = vec3(1.0 - smoothstep(0.0, 0.3, dist));
    gl_FragColor = vec4(color, 1.0);
  }
`;
```

### Texture Mapping

```tsx
import { useMemo, useState, useEffect } from 'react';

function TextureMappingExample() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/texture.jpg';
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

## Browser Support

This library requires WebGL support. It works in all modern browsers:

- Chrome/Edge 9+
- Firefox 4+
- Safari 5.1+
- Opera 12+
- iOS Safari 8+
- Android Browser 4.4+

## Performance Tips

1. **Memoize uniforms object** - Always wrap uniforms in `useMemo()` to prevent unnecessary updates
2. **Minimize uniform updates** - Only include changing values in dependency array
3. **Use appropriate texture sizes** - Large textures impact performance
4. **Optimize shader complexity** - Complex calculations affect frame rate
5. **Monitor performance** - Use `useShaderTelemetry` to track metrics
6. **Consider pixel ratio** - Lower pixel ratio improves performance on high-DPI displays

## License

MIT

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Support

- 🐛 [Report bugs](https://github.com/Allakazan/glsl-react/issues)
- 💡 [Request features](https://github.com/Allakazan/glsl-react/issues)
- 📖 [Documentation](https://github.com/Allakazan/glsl-react) (WIP)
