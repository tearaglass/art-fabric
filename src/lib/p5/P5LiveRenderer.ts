/**
 * P5LiveRenderer - p5.js sketches with CosmosBus integration
 * Provides live access to transport, macros, and audio analysis
 */

import { cosmosBus, CosmosState } from '@/lib/events/CosmosBus';

export interface P5SketchAPI {
  // p5.js instance
  p: any;
  
  // Live cosmos state
  cosmos: Readonly<CosmosState>;
  
  // Convenience accessors
  bpm: number;
  beat: number;
  bar: number;
  phase: number; // 0-1 within current beat
  
  // Macros
  tone: number;
  movement: number;
  space: number;
  grit: number;
  
  // Audio
  rms: number;
  peak: number;
  low: number;
  mid: number;
  high: number;
  
  // RNG
  random(): number;
}

export type P5Setup = (api: P5SketchAPI) => void;
export type P5Draw = (api: P5SketchAPI) => void;

export interface P5LiveSketch {
  setup?: P5Setup;
  draw?: P5Draw;
}

/**
 * Create a p5.js sketch with live CosmosBus integration
 * 
 * @example
 * const sketch = createP5Sketch({
 *   setup: ({ p, cosmos }) => {
 *     p.createCanvas(400, 400);
 *   },
 *   draw: ({ p, beat, tone, low }) => {
 *     p.background(beat % 4 === 0 ? 255 : 0);
 *     p.fill(tone * 255, low * 255, 100);
 *     p.ellipse(200, 200, 100 + low * 200);
 *   }
 * });
 */
export function createP5Sketch(userSketch: P5LiveSketch) {
  return (p: any) => {
    let api: P5SketchAPI;
    
    const updateAPI = () => {
      const state = cosmosBus.getState();
      
      api = {
        p,
        cosmos: state,
        bpm: state.bpm,
        beat: state.beat,
        bar: state.bar,
        phase: state.phase,
        tone: state.macros.Tone ?? 0.5,
        movement: state.macros.Movement ?? 0.5,
        space: state.macros.Space ?? 0.5,
        grit: state.macros.Grit ?? 0.5,
        rms: state.audioRMS,
        peak: state.audioPeak,
        low: state.audioSpectrum.low,
        mid: state.audioSpectrum.mid,
        high: state.audioSpectrum.high,
        random: () => cosmosBus.random(),
      };
    };
    
    p.setup = () => {
      updateAPI();
      userSketch.setup?.(api);
    };
    
    p.draw = () => {
      updateAPI();
      userSketch.draw?.(api);
    };
  };
}

/**
 * Example: Audio-reactive circle
 */
export const exampleSketch = createP5Sketch({
  setup: ({ p }) => {
    p.createCanvas(600, 600);
    p.colorMode(p.HSB, 360, 100, 100);
  },
  
  draw: ({ p, beat, tone, movement, low, mid, high, phase }) => {
    // Background pulse on beat
    const bgBrightness = beat % 4 === 0 ? 20 + low * 30 : 10;
    p.background(220, 20, bgBrightness);
    
    p.translate(p.width / 2, p.height / 2);
    
    // Rotating based on movement macro
    p.rotate(p.frameCount * 0.01 * movement);
    
    // Audio-reactive size
    const baseSize = 100;
    const lowSize = baseSize + low * 150;
    const midSize = baseSize + mid * 200;
    const highSize = baseSize + high * 100;
    
    // Multiple circles
    p.noStroke();
    
    // Low frequencies - large outer circle
    p.fill(tone * 360, 70, 80, 0.3);
    p.ellipse(0, 0, lowSize);
    
    // Mid frequencies - medium circle
    p.fill((tone * 360 + 60) % 360, 80, 90, 0.5);
    p.ellipse(0, 0, midSize);
    
    // High frequencies - small inner circle
    p.fill((tone * 360 + 120) % 360, 90, 100, 0.7);
    p.ellipse(0, 0, highSize);
    
    // Beat indicator
    if (phase < 0.1) {
      p.stroke(0, 0, 100);
      p.strokeWeight(4);
      p.noFill();
      p.ellipse(0, 0, 200);
    }
  },
});
