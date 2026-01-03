import React, { useRef, useCallback, useEffect } from "react";
import { ShaderTelemetry } from "../components/ShaderTelemetry";
import { ShaderTelemetryProps } from "../types";

/**
 * Hook to create telemetry tracking for ShaderCanvas
 * Returns onFrameRender callback and telemetry component
 * 
 * @example
 * const { onFrameRender, Telemetry } = useShaderTelemetry({ position: 'top-right' });
 * 
 * <ShaderCanvas onFrameRender={onFrameRender} fragmentShader={shader} />
 * <Telemetry />
 */
export function useShaderTelemetry(props?: ShaderTelemetryProps) {
  const frameTimeHistory = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const graphSamplesRef = useRef(props?.graphSamples || 60);

  // Update graphSamples ref when it changes
  useEffect(() => {
    graphSamplesRef.current = props?.graphSamples || 60;
  }, [props?.graphSamples]);

  // Stable callback that never recreates
  const onFrameRender = useCallback((frameTime: number) => {
    frameTimeHistory.current.push(frameTime);
    if (frameTimeHistory.current.length > graphSamplesRef.current) {
      frameTimeHistory.current.shift();
    }
    frameCountRef.current++;
  }, []);

  // Return a stable React element
  const Telemetry = React.useMemo(() => {
    return function TelemetryComponent() {
      return (
        <ShaderTelemetry 
          position={props?.position}
          updateInterval={props?.updateInterval}
          graphSamples={props?.graphSamples}
          frameTimeHistory={frameTimeHistory}
          frameCountRef={frameCountRef}
        />
      );
    };
  }, [props?.position, props?.updateInterval, props?.graphSamples]);

  return { onFrameRender, Telemetry };
}