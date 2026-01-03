# Contributing to glsl-react

Thank you for your interest in contributing to glsl-react! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Basic knowledge of React, TypeScript, and WebGL/GLSL
- Git for version control

### Development Setup

1. **Fork and Clone**

```bash
git clone https://github.com/yourusername/glsl-react.git
cd glsl-react
```

2. **Install Dependencies**

```bash
npm install
```

3. **Build the Library**

```bash
npm run build
```

4. **Run Type Checking**

```bash
npm run typecheck
```

5. **Watch Mode for Development**

```bash
npm run dev
```

## Project Structure

```
glsl-react/
├── src/
│   ├── components/
│   │   ├── ShaderCanvas.tsx      # Main component
│   │   └── ShaderTelemetry.tsx   # Performance monitoring
│   ├── hooks/
│   │   ├── useWebGL.ts           # WebGL context management
│   │   ├── useTextures.ts        # Texture management
│   │   ├── useMousePosition.ts   # Mouse tracking
│   │   ├── useResizeObserver.ts  # Canvas resizing
│   │   └── useShaderTelemetry.tsx # Telemetry hook
│   ├── utils/
│   │   ├── shaders.ts            # Shader compilation utilities
│   │   ├── textures.ts           # Texture utilities
│   │   └── uniforms.ts           # Uniform management
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   └── index.ts                  # Public API exports
├── dist/                         # Build output
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Development Workflow

### Making Changes

1. **Create a Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add TypeScript types for all new code
   - Update documentation as needed

3. **Test Your Changes**
   - Build the library: `npm run build`
   - Test in a local React project (see below)
   - Verify TypeScript compilation: `npm run typecheck`

4. **Commit Your Changes**

```bash
git add .
git commit -m "feat: add new feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Testing Locally

To test your changes in a React application:

1. **Build the library**

```bash
npm run build
```

2. **Link the package**

```bash
npm link
```

3. **In your test React app**

```bash
npm link glsl-react
```

4. **Import and test**

```tsx
import { ShaderCanvas } from 'glsl-react';
```

### Submitting Changes

1. **Push Your Branch**

```bash
git push origin feature/your-feature-name
```

2. **Open a Pull Request**
   - Go to GitHub and create a pull request
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all checks pass

## Coding Standards

### TypeScript Guidelines

- **Use strict types** - Avoid `any` types
- **Export types** - Make types available for library users
- **Document complex types** - Add JSDoc comments for clarity

```tsx
/**
 * Configuration options for texture handling
 */
export interface TextureOptions {
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  minFilter?: TextureFilter;
  magFilter?: TextureFilter;
  flipY?: boolean;
}
```

### React Guidelines

- **Use functional components** with hooks
- **Memoize expensive computations** with `useMemo`
- **Always memoize uniforms** - Prevent unnecessary WebGL updates
- **Use refs for stable references** across renders
- **Forward refs** when components wrap DOM elements

```tsx
export const ShaderCanvas = forwardRef<HTMLCanvasElement, ShaderCanvasProps>(
  function ShaderCanvas(props, forwardedRef) {
    // Component implementation
  }
);
```

**Example of proper uniform usage in documentation:**

```tsx
// ✅ GOOD - Memoized uniforms
const uniforms = useMemo<Uniforms>(() => ({
  u_value: { type: 'float', value: myValue }
}), [myValue]);

<ShaderCanvas fragmentShader={shader} uniforms={uniforms} />

// ❌ BAD - Never show this pattern in docs
<ShaderCanvas
  fragmentShader={shader}
  uniforms={{ u_value: { type: 'float', value: myValue } }}
/>
```

### WebGL Guidelines

- **Clean up resources** - Always delete textures, programs, and buffers
- **Handle context loss** - Consider WebGL context loss scenarios
- **Optimize uniform updates** - Only update changed uniforms
- **Batch texture operations** - Group texture binding operations

```tsx
useEffect(() => {
  return () => {
    if (gl) {
      deleteTexture(gl, texture);
      gl.deleteProgram(program);
    }
  };
}, [gl]);
```

### Performance Considerations

- **Avoid unnecessary re-renders** - Use `useRef` for stable values
- **Memoize uniforms** - Always wrap uniforms in `useMemo()` in examples and documentation
- **Optimize dependency arrays** - Only include necessary dependencies
- **Use `useCallback` for handlers** - Prevent function recreation
- **Minimize WebGL state changes** - Batch operations when possible

## Adding New Features

### Adding a New Uniform Type

1. Update `types/index.ts` with the new type
2. Add handling in `utils/uniforms.ts` `setUniform` function
3. Update type guards and validation
4. Add documentation and examples
5. Test with real shaders

### Adding a New Hook

1. Create hook file in `hooks/`
2. Implement with proper TypeScript types
3. Export from `src/index.ts`
4. Add JSDoc documentation
5. Create usage example

```tsx
/**
 * Hook for tracking custom shader data
 * @param initialValue Initial data value
 * @returns Current data and update function
 */
export function useCustomData(initialValue: number) {
  const [data, setData] = useState(initialValue);
  return { data, setData };
}
```

### Adding a New Utility Function

1. Place in appropriate `utils/` file
2. Make it pure and testable
3. Add comprehensive JSDoc
4. Export from module and `src/index.ts`
5. Include usage example in docs

## Documentation

### Code Documentation

Use JSDoc comments for all public APIs:

```tsx
/**
 * Creates a WebGL texture from an image source
 * 
 * @param gl - WebGL rendering context
 * @param source - Image, canvas, or video element
 * @param options - Texture configuration options
 * @returns WebGLTexture instance
 * @throws {Error} If texture creation fails
 * 
 * @example
 * const texture = createTexture(gl, image, {
 *   wrapS: TextureWrap.REPEAT,
 *   minFilter: TextureFilter.LINEAR
 * });
 */
export function createTexture(
  gl: WebGLRenderingContext,
  source: HTMLImageElement | HTMLCanvasElement,
  options?: TextureOptions
): WebGLTexture {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list
- API reference
- Examples section
- TypeScript definitions

### QUICKSTART Updates

Add practical examples for new features:
- Step-by-step instructions
- Complete working code
- Common use cases
- Troubleshooting tips

## Bug Reports

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test with latest version
4. Check browser console for errors

### Issue Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Create shader with...
2. Set uniform to...
3. Observe error...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- glsl-react version: X.Y.Z
- React version: X.Y.Z
- Browser: Chrome 120
- OS: macOS 14

**Code Sample**
```tsx
// Minimal reproducible example
```

**Error Messages**
```
Console error output
```
```

## Feature Requests

When requesting features:
- Explain the use case
- Provide example code of desired API
- Discuss potential implementation
- Consider backward compatibility

## Performance Improvements

When optimizing:
- Profile before and after
- Document performance gains
- Consider memory usage
- Test across different devices
- Avoid premature optimization

## Breaking Changes

If your PR includes breaking changes:
- Clearly mark as breaking change
- Provide migration guide
- Update version appropriately (major bump)
- Document in changelog

## Questions and Support

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Security**: Email security concerns privately
- **General**: Comment on existing issues/PRs

## Release Process

Maintainers handle releases:

1. Update version in `package.json`
2. Update changelog
3. Create git tag
4. Build and publish to npm
5. Create GitHub release

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project documentation

## Getting Help

If you need help contributing:
- Review existing PRs for examples
- Ask questions in GitHub Discussions
- Reach out to maintainers
- Consult WebGL/React documentation

Thank you for contributing to glsl-react! 🎨
