# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-27

### Added
- Initial release of glsl-react
- `ShaderCanvas` component for rendering WebGL shaders
- Default uniforms: `u_time`, `u_resolution`, `u_mouse`
- Custom uniform support for floats, vectors, integers, matrices
- Texture uniform support with configurable options
- TypeScript support with full type definitions
- Automatic canvas resizing with pixel ratio support
- Mouse position tracking (normalized [0, 1])
- Animation frame management
- WebGL error handling and logging
- React 16.8+ compatibility
- Exportable hooks for custom implementations:
  - `useWebGL`
  - `useShaderTelemetry`
  - `useMousePosition`
  - `useResizeObserver`
  - `useTextures`
- Utility functions for shader compilation and uniform management
- Comprehensive documentation and examples
- Support for ESM and CJS builds
- tsup-based build system

### Features
- Fullscreen quad vertex shader (default)
- Optional custom vertex shader support
- Shallow comparison for uniform updates
- Automatic texture unit management
- High-DPI display support
- Performance optimizations with memoization
- Compatible with Vite, Next.js, Remix, CRA

### Examples
- Julia set fractal visualization
- Animated gradient with mouse interaction

[0.1.0]: https://github.com/yourusername/glsl-react/releases/tag/v0.1.0
