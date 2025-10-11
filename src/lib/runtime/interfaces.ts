/**
 * RuntimeAdapter: Uniform API for different generative modules (shader/p5/strudel)
 */

export type ParamUnit = 'norm' | 'Hz' | 'ms' | 'deg';

export interface RuntimeAdapter {
  /**
   * Set a parameter value (normalized where possible)
   * @param path - Dot-notation path like "uScale" or "flow.speed"
   * @param value - Numeric value
   * @param unit - Unit type for proper scaling
   */
  setParam(path: string, value: number, unit?: ParamUnit): void;

  /**
   * Get current metrics (cheap, cached)
   * For shaders: brightness, hue, edge
   * For p5: cursorX, cursorY, speed, particleCount
   * For strudel: rms, low, mid, high
   */
  getMetrics(): Record<string, number>;

  /**
   * Get the canvas element for compositing
   * Returns null for audio-only modules (strudel)
   */
  getCanvas(): HTMLCanvasElement | null;

  /**
   * Clean up resources
   */
  dispose(): void;
}

export interface ShaderMetrics {
  brightness: number; // 0-1, average luminance
  hue: number; // 0-360, dominant hue
  edge: number; // 0-1, complexity/edge density
}

export interface P5Metrics {
  cursorX: number; // 0-1, normalized
  cursorY: number; // 0-1, normalized
  speed: number; // 0-1, cursor velocity
  particleCount?: number; // optional
}

export interface StrudelMetrics {
  rms: number; // 0-1, root mean square amplitude
  low: number; // 0-1, low frequency band
  mid: number; // 0-1, mid frequency band
  high: number; // 0-1, high frequency band
}
