import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';
import { ShaderTelemetryProps } from '../types';
import { darken, desaturate, hexStringToHex, hexToHexString } from '../utils/colors';

type PanelType = 'fps' | 'ms'

interface PanelProps {
  ref: RefObject<HTMLCanvasElement>;
  type: PanelType;
  text: string;
  wrapperStyle?: CSSProperties;
  panelStyle?: CSSProperties;
}

const panelBaseColors: Record<PanelType, string> = {
  'fps': '#0bf1f1',
  'ms': '#6bf10b'
}

const getGraphBGColor = (base: string) => hexToHexString(desaturate(darken(hexStringToHex(base), .4), .2))
const getPanelBGColor = (base: string) => hexToHexString(darken(hexStringToHex(base), .6))

export const Panel = React.forwardRef<HTMLCanvasElement, Omit<PanelProps, 'ref'>>(({
  type,
  text,
  wrapperStyle,
  panelStyle
}, ref) => (
  <div style={{
    ...wrapperStyle,
    width: '80px',
    background: getPanelBGColor(panelBaseColors[type]),
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '.65rem ',
    fontWeight: 'bold',
    lineHeight: '15px',
    padding: '4px',
    //cursor: 'pointer',
    userSelect: 'none',
  }}>
    <div style={{
      ...panelStyle,
      color: panelBaseColors[type],
      textAlign: 'left',
      fontWeight: 'bold',
      paddingBottom: '4px'
    }}>
      {text}
    </div>
    <canvas
      ref={ref}
      width={80}
      height={30}
      style={{ width: '80px', height: '30px', display: 'block' }}
    />
  </div>
));

export interface InternalTelemetryProps extends ShaderTelemetryProps {
  frameTimeHistory: React.MutableRefObject<number[]>;
  frameCountRef: React.MutableRefObject<number>;
}

/**
 * ShaderTelemetry component - Displays shader performance metrics with graphs
 * 
 * Note: Use the useShaderTelemetry hook for easier integration
 */
export const ShaderTelemetry: React.FC<InternalTelemetryProps> = ({
  position = 'top-left',
  updateInterval = 100,
  graphSamples = 60,
  frameTimeHistory,
  frameCountRef
}) => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  
  const fpsHistory = useRef<number[]>([]);
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);
  const msCanvasRef = useRef<HTMLCanvasElement>(null);

  const lastTimeRef = useRef(performance.now());

  // Update metrics periodically
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentTime = performance.now();
      const elapsed = (currentTime - lastTimeRef.current) / 1000;
      const frameCount = frameCountRef.current;
      
      const currentFps = elapsed > 0 ? Math.round(frameCount / elapsed) : 0;
      const avgFrameTime = frameTimeHistory.current.length > 0
        ? frameTimeHistory.current.reduce((a, b) => a + b, 0) / frameTimeHistory.current.length
        : 0;

      setFps(currentFps);
      setFrameTime(Number(avgFrameTime.toFixed(1)));

      // Store FPS for graph
      fpsHistory.current.push(currentFps);
      if (fpsHistory.current.length > graphSamples) {
        fpsHistory.current.shift();
      }

      // Draw graphs
      drawGraph(fpsCanvasRef.current, fpsHistory.current, 0, 100, panelBaseColors.fps, getGraphBGColor(panelBaseColors.fps));

      // Dynamic range for frame time graph - show at least 0-20ms, or scale to max value
      const maxFrameTime = Math.max(...frameTimeHistory.current, 0);
      const frameTimeMax = Math.max(20, maxFrameTime * 1.2); // At least 20ms or 120% of max
      drawGraph(msCanvasRef.current, frameTimeHistory.current, 0, frameTimeMax, panelBaseColors.ms, getGraphBGColor(panelBaseColors.ms));

      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [updateInterval, graphSamples]);

  // Draw graph on canvas
  const drawGraph = (
    canvas: HTMLCanvasElement | null,
    data: number[],
    min: number,
    max: number,
    color: string,
    bgColor: string
  ) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) return;

    // Draw graph
    ctx.fillStyle = color;
    const barWidth = width / graphSamples;
    
    data.forEach((value, i) => {
      const normalizedValue = Math.min(Math.max((value - min) / (max - min), 0), 1);
      const barHeight = normalizedValue * height;
      const x = i * barWidth;
      const y = height - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  };

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      padding: 3
    };

    switch (position) {
      case 'top-right':
        return { ...base, top: 0, right: 0 };
      case 'bottom-left':
        return { ...base, bottom: 0, left: 0 };
      case 'bottom-right':
        return { ...base, bottom: 0, right: 0 };
      case 'top-left':
      default:
        return { ...base, top: 0, left: 0 };
    }
  };

  return (
    <div style={getPositionStyles()}>
      <Panel type='fps' ref={fpsCanvasRef} text={`${fps} FPS`}/>
      <Panel type='ms' ref={msCanvasRef} text={`${frameTime} MS`} wrapperStyle={{ marginTop: '3px' }}/>
    </div>
  );
};
