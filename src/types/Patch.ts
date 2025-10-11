export type WaveShape = "sine" | "saw" | "square" | "noise";
export type FilterType = "lp" | "bp" | "hp";
export type LFOShape = "sine" | "tri" | "saw" | "square";
export type ModSource = "LFO1" | "LFO2" | "EnvF";
export type ModDest = "cutoff" | "reso" | "pan" | "pitch" | "gain" | "wavemix";
export type ChordType = "triad" | "sus2" | "sus4" | "7" | "m7" | "maj7" | "9" | "m9" | "add9" | "6" | "m6";

export interface Step {
  on: boolean;
  vel: number;
  ratchets: number;
  prob: number;
  locks?: Record<string, number>;
}

export interface Route {
  src: ModSource;
  dst: ModDest;
  amt: number;
}

export interface Patch {
  // Global
  bpm: number;
  scale: { root: string; mode: string };
  
  // Oscillators
  osc1: { wave: WaveShape; semitone: number; detune: number; gain: number };
  osc2: { wave: WaveShape; semitone: number; detune: number; gain: number };
  subGain: number;
  noiseGain: number;
  wavemix: number;
  pan: number;
  glide: number;
  
  // Envelopes
  amp: { a: number; d: number; s: number; r: number };
  filtenv: { a: number; d: number; s: number; r: number; amt: number };
  
  // Filter
  ftype: FilterType;
  cutoff: number;
  reso: number;
  drive: number;
  keytrack: number;
  
  // LFOs
  lfo1: { shape: LFOShape; rate: number; phase: number };
  lfo2: { shape: LFOShape; rate: number; phase: number };
  routes: Route[];
  
  // Sequencing
  steps: Step[];
  chord: ChordType;
  octave: number;
  density: number;
  swing: number;
  
  // FX
  fx: { delay: number; room: number; crush: number; chorus: number };
  
  // Macros
  macros: { Tone: number; Movement: number; Space: number; Grit: number };
  
  // Compile hint
  __hotspot?: { arp?: string };
}

export const DEFAULT_PATCH: Patch = {
  bpm: 120,
  scale: { root: "c", mode: "dorian" },
  
  osc1: { wave: "saw", semitone: 0, detune: 7, gain: 0.7 },
  osc2: { wave: "square", semitone: 0, detune: -5, gain: 0.5 },
  subGain: 0.15,
  noiseGain: 0,
  wavemix: 0.5,
  pan: 0,
  glide: 0.02,
  
  amp: { a: 0.003, d: 0.12, s: 0.7, r: 0.2 },
  filtenv: { a: 0.005, d: 0.08, s: 0.2, r: 0.15, amt: 0.35 },
  
  ftype: "lp",
  cutoff: 1500,
  reso: 0.22,
  drive: 0.1,
  keytrack: 0.3,
  
  lfo1: { shape: "sine", rate: 0.25, phase: 0 },
  lfo2: { shape: "tri", rate: 0.125, phase: 0.25 },
  routes: [
    { src: "LFO1", dst: "cutoff", amt: 0.4 },
    { src: "LFO2", dst: "pan", amt: 0.3 }
  ],
  
  steps: Array.from({ length: 16 }, (_, i) => ({
    on: i % 2 === 0,
    vel: 0.95,
    ratchets: 1,
    prob: 1.0,
  })),
  chord: "triad",
  octave: 3,
  density: 1,
  swing: 0.54,
  
  fx: { delay: 0.26, room: 0.3, crush: 0, chorus: 0.2 },
  
  macros: { Tone: 0.6, Movement: 0.5, Space: 0.3, Grit: 0.1 },
};
