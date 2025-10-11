export type TileCategory = 'source' | 'sound' | 'filter' | 'effects' | 'modulation' | 'output';

export interface TileDefinition {
  id: string;
  category: TileCategory;
  fn: string;
  label: string;
  description: string;
  defaultParams: Record<string, any>;
}

export interface TileInstance {
  id: string;
  definitionId: string;
  params: Record<string, any>;
}

export interface StrudelChain {
  tiles: TileInstance[];
}

// Available tile definitions
export const TILE_DEFINITIONS: TileDefinition[] = [
  // Source
  { id: 'note', category: 'source', fn: 'note', label: 'Note', description: 'Musical notes', defaultParams: { pattern: 'c3 e3 g3' } },
  { id: 'n', category: 'source', fn: 'n', label: 'Note Numbers', description: 'MIDI note numbers', defaultParams: { pattern: '0 4 7' } },
  
  // Sound
  { id: 's-sine', category: 'sound', fn: 's', label: 'Sine', description: 'Sine wave', defaultParams: { sound: 'sine' } },
  { id: 's-sawtooth', category: 'sound', fn: 's', label: 'Sawtooth', description: 'Sawtooth wave', defaultParams: { sound: 'sawtooth' } },
  { id: 's-square', category: 'sound', fn: 's', label: 'Square', description: 'Square wave', defaultParams: { sound: 'square' } },
  { id: 's-triangle', category: 'sound', fn: 's', label: 'Triangle', description: 'Triangle wave', defaultParams: { sound: 'triangle' } },
  
  // Filter
  { id: 'lpf', category: 'filter', fn: 'lpf', label: 'Low Pass', description: 'Low pass filter', defaultParams: { cutoff: 1200 } },
  { id: 'hpf', category: 'filter', fn: 'hpf', label: 'High Pass', description: 'High pass filter', defaultParams: { cutoff: 500 } },
  { id: 'bpf', category: 'filter', fn: 'bpf', label: 'Band Pass', description: 'Band pass filter', defaultParams: { cutoff: 800 } },
  
  // Effects
  { id: 'reverb', category: 'effects', fn: 'room', label: 'Reverb', description: 'Reverb effect', defaultParams: { amount: 0.3 } },
  { id: 'delay', category: 'effects', fn: 'delay', label: 'Delay', description: 'Delay effect', defaultParams: { time: 0.25 } },
  { id: 'distort', category: 'effects', fn: 'distort', label: 'Distortion', description: 'Distortion', defaultParams: { amount: 0.5 } },
  { id: 'crush', category: 'effects', fn: 'crush', label: 'Bitcrush', description: 'Bit crushing', defaultParams: { bits: 8 } },
  
  // Modulation
  { id: 'slow', category: 'modulation', fn: 'slow', label: 'Slow Down', description: 'Slow pattern', defaultParams: { factor: 2 } },
  { id: 'fast', category: 'modulation', fn: 'fast', label: 'Speed Up', description: 'Speed pattern', defaultParams: { factor: 2 } },
  
  // Output
  { id: 'gain', category: 'output', fn: 'gain', label: 'Gain', description: 'Volume level', defaultParams: { level: 0.5 } },
];
