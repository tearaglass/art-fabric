/**
 * CosmosBus - Unified event bus for all modules
 * 
 * Combines:
 * - EventBus (project/lifecycle events)
 * - StrudelBus (audio/transport events)
 * - Global state sync
 * - Seeded RNG coordination
 * - BroadcastChannel for cross-tab sync
 */

import seedrandom from 'seedrandom';

// ========== Core Event Types ==========

export type CosmosEvent =
  // Project lifecycle
  | { type: 'project/loaded'; name: string; timestamp: number }
  | { type: 'project/saved'; name: string; timestamp: number }
  | { type: 'project/reset'; timestamp: number }
  
  // Assets
  | { type: 'assets/added'; className: string; traitName: string; source: string }
  | { type: 'assets/renamed'; className: string; oldName: string; newName: string }
  | { type: 'assets/weighted'; className: string; traitName: string; weight: number }
  | { type: 'assets/removed'; className: string; traitName: string }
  
  // Rules & Generation
  | { type: 'rules/compiled'; ruleCount: number; timestamp: number }
  | { type: 'rules/fired'; rule: string; context: Record<string, any> }
  | { type: 'rng/seedChanged'; oldSeed: string; newSeed: string }
  | { type: 'generate/requested'; edition: number; seed: string }
  | { type: 'generate/progress'; edition: number; progress: number; stage: string }
  | { type: 'generate/done'; edition: number; duration: number }
  
  // Transport & Timing (from Strudel)
  | { type: 'transport/start'; bpm: number; timestamp: number }
  | { type: 'transport/stop'; timestamp: number }
  | { type: 'transport/tempo'; bpm: number; cps: number }
  | { type: 'transport/tick'; bar: number; beat: number; tick16: number; phase: number }
  
  // Audio Analysis
  | { type: 'audio/fft'; bins: Float32Array; rms: number; peak: number }
  | { type: 'audio/beat'; confidence: number; bpm: number }
  | { type: 'audio/spectrum'; low: number; mid: number; high: number }
  
  // Macros (global performance params)
  | { type: 'macro/changed'; key: string; value: number; source: 'ui' | 'midi' | 'osc' | 'automation' }
  | { type: 'macro/snapshot'; snapshot: Record<string, number> }
  
  // Rendering
  | { type: 'render/frame'; frameNum: number; deltaTime: number; timestamp: number }
  | { type: 'render/layer'; layerId: string; canvas: HTMLCanvasElement }
  | { type: 'shader/compiled'; shaderId: string; success: boolean; error?: string }
  | { type: 'p5/sketch'; sketchName: string; duration: number }
  
  // FX & Modulation
  | { type: 'fx/applied'; fxName: string; params: Record<string, any> }
  | { type: 'mod/route'; source: string; target: string; amount: number }
  
  // Visual feedback sources (for cross-lab routing)
  | { type: 'shader/metrics'; layerId: string; brightness: number; hue: number; edge: number }
  | { type: 'p5/interaction'; layerId: string; x: number; y: number; speed: number }
  | { type: 'p5/metrics'; layerId: string; particleCount: number }
  
  // Affect (Shame Engine)
  | { type: 'affect/hesitation'; level: number; timestamp: number }
  | { type: 'affect/overactivity'; level: number; count: number; timestamp: number }
  | { type: 'affect/tone'; tone: 'neutral' | 'anxious' | 'euphoric' | 'numb'; hesitation: number; overactivity: number; timestamp: number }
  | { type: 'affect/mutation'; mutationType: 'blur' | 'glitch' | 'decay' | 'fracture'; affect: any; timestamp: number }
  
  // System
  | { type: 'system/error'; module: string; error: string; trace?: any }
  | { type: 'system/warning'; module: string; message: string };

type EventHandler<T = any> = (event: T) => void;
type Unsubscribe = () => void;

// ========== Global State ==========

export interface CosmosState {
  // Transport
  isPlaying: boolean;
  bpm: number;
  cps: number;
  bar: number;
  beat: number;
  tick16: number;
  phase: number; // 0-1 within current beat
  
  // Audio Analysis
  audioRMS: number;
  audioPeak: number;
  audioSpectrum: { low: number; mid: number; high: number };
  
  // Macros (global performance parameters)
  macros: Record<string, number>;
  
  // Visual feedback sources (for cross-lab routing)
  shader: Record<string, { brightness: number; hue: number; edge: number }>;
  p5: Record<string, { cursorX: number; cursorY: number; speed: number; particleCount: number }>;
  
  // Affect (Shame Engine state)
  affect: {
    hesitation: number;
    overactivity: number;
    emotionalTone: 'neutral' | 'anxious' | 'euphoric' | 'numb';
    entropy: number;
  };
  
  // RNG
  seed: string;
  rng: seedrandom.PRNG;
  
  // Performance
  frameCount: number;
  fps: number;
  deltaTime: number;
}

// ========== CosmosBus Class ==========

class CosmosBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private eventHistory: Array<{ event: CosmosEvent; timestamp: number }> = [];
  private maxHistorySize = 1000;
  private channel: BroadcastChannel | null = null;
  private state: CosmosState;
  
  constructor() {
    // Initialize state
    const initialSeed = Math.random().toString(36).substring(7);
    this.state = {
      isPlaying: false,
      bpm: 120,
      cps: 2,
      bar: 0,
      beat: 0,
      tick16: 0,
      phase: 0,
      audioRMS: 0,
      audioPeak: 0,
      audioSpectrum: { low: 0, mid: 0, high: 0 },
      macros: {
        Tone: 0.5,
        Movement: 0.5,
        Space: 0.5,
        Grit: 0.5,
        // Aliased for easier access (A=Tone, B=Movement, C=Space, D=Grit)
        A: 0.5,
        B: 0.5,
        C: 0.5,
        D: 0.5,
      },
      shader: {},
      p5: {},
      affect: {
        hesitation: 0,
        overactivity: 0,
        emotionalTone: 'neutral',
        entropy: 0,
      },
      seed: initialSeed,
      rng: seedrandom(initialSeed),
      frameCount: 0,
      fps: 60,
      deltaTime: 16.67,
    };
    
    // Setup BroadcastChannel for cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('cosmos');
      this.channel.onmessage = (e) => {
        if (e.data?.type) {
          this._handleEvent(e.data, true);
        }
      };
    }
    
    // Expose global debug helper
    if (typeof window !== 'undefined') {
      (window as any).cosmos = {
        state: () => this.getState(),
        history: (type?: string, limit = 20) => this.getHistory(type, limit),
        emit: (event: CosmosEvent) => this.emit(event),
        macros: () => this.state.macros,
        setMacro: (key: string, value: number) => 
          this.emit({ type: 'macro/changed', key, value, source: 'ui' }),
      };
    }
  }
  
  /**
   * Subscribe to an event type
   */
  on<T extends CosmosEvent['type']>(
    type: T,
    handler: EventHandler<Extract<CosmosEvent, { type: T }>>
  ): Unsubscribe {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);
    
    return () => this.off(type, handler);
  }
  
  /**
   * Unsubscribe from an event type
   */
  off<T extends CosmosEvent['type']>(
    type: T,
    handler: EventHandler<Extract<CosmosEvent, { type: T }>>
  ): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }
  
  /**
   * Emit an event to all subscribers
   */
  emit(event: CosmosEvent, skipBroadcast = false): void {
    this._handleEvent(event, false);
    
    // Broadcast to other tabs
    if (!skipBroadcast && this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('[CosmosBus] Broadcast failed:', err);
      }
    }
  }
  
  /**
   * Internal event handler - updates state and notifies subscribers
   */
  private _handleEvent(event: CosmosEvent, fromBroadcast: boolean): void {
    // Update global state based on event type
    switch (event.type) {
      case 'transport/start':
        this.state.isPlaying = true;
        this.state.bpm = event.bpm;
        this.state.cps = event.bpm / 60;
        break;
        
      case 'transport/stop':
        this.state.isPlaying = false;
        break;
        
      case 'transport/tempo':
        this.state.bpm = event.bpm;
        this.state.cps = event.cps;
        break;
        
      case 'transport/tick':
        this.state.bar = event.bar;
        this.state.beat = event.beat;
        this.state.tick16 = event.tick16;
        this.state.phase = event.phase;
        break;
        
      case 'audio/fft':
        this.state.audioRMS = event.rms;
        this.state.audioPeak = event.peak;
        break;
        
      case 'audio/spectrum':
        this.state.audioSpectrum = { low: event.low, mid: event.mid, high: event.high };
        break;
        
      case 'macro/changed':
        this.state.macros[event.key] = event.value;
        // Sync aliased macro values
        if (event.key === 'Tone') this.state.macros.A = event.value;
        if (event.key === 'Movement') this.state.macros.B = event.value;
        if (event.key === 'Space') this.state.macros.C = event.value;
        if (event.key === 'Grit') this.state.macros.D = event.value;
        if (event.key === 'A') this.state.macros.Tone = event.value;
        if (event.key === 'B') this.state.macros.Movement = event.value;
        if (event.key === 'C') this.state.macros.Space = event.value;
        if (event.key === 'D') this.state.macros.Grit = event.value;
        break;
        
      case 'macro/snapshot':
        this.state.macros = { ...event.snapshot };
        break;
        
      case 'shader/metrics':
        if (!this.state.shader[event.layerId]) {
          this.state.shader[event.layerId] = { brightness: 0, hue: 0, edge: 0 };
        }
        this.state.shader[event.layerId].brightness = event.brightness;
        this.state.shader[event.layerId].hue = event.hue;
        this.state.shader[event.layerId].edge = event.edge;
        break;
        
      case 'p5/interaction':
        if (!this.state.p5[event.layerId]) {
          this.state.p5[event.layerId] = { cursorX: 0, cursorY: 0, speed: 0, particleCount: 0 };
        }
        this.state.p5[event.layerId].cursorX = event.x;
        this.state.p5[event.layerId].cursorY = event.y;
        this.state.p5[event.layerId].speed = event.speed;
        break;
        
      case 'p5/metrics':
        if (!this.state.p5[event.layerId]) {
          this.state.p5[event.layerId] = { cursorX: 0, cursorY: 0, speed: 0, particleCount: 0 };
        }
        this.state.p5[event.layerId].particleCount = event.particleCount;
        break;
        
      case 'rng/seedChanged':
        this.state.seed = event.newSeed;
        this.state.rng = seedrandom(event.newSeed);
        break;
        
      case 'render/frame':
        this.state.frameCount = event.frameNum;
        this.state.deltaTime = event.deltaTime;
        this.state.fps = 1000 / event.deltaTime;
        break;
        
      case 'affect/hesitation':
        this.state.affect.hesitation = event.level;
        break;
        
      case 'affect/overactivity':
        this.state.affect.overactivity = event.level;
        break;
        
      case 'affect/tone':
        this.state.affect.emotionalTone = event.tone;
        break;
    }
    
    // Store in history
    this.eventHistory.push({ event, timestamp: Date.now() });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Notify handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[CosmosBus] Handler error for ${event.type}:`, error);
        }
      });
    }
  }
  
  /**
   * Get current global state (read-only)
   */
  getState(): Readonly<CosmosState> {
    return { ...this.state };
  }
  
  /**
   * Get specific state value
   */
  get<K extends keyof CosmosState>(key: K): CosmosState[K] {
    return this.state[key];
  }
  
  /**
   * Get macro value
   */
  getMacro(key: string): number {
    return this.state.macros[key] ?? 0.5;
  }
  
  /**
   * Get seeded random number
   */
  random(): number {
    return this.state.rng();
  }
  
  /**
   * Get event history
   */
  getHistory(type?: string, limit = 100): Array<{ event: CosmosEvent; timestamp: number }> {
    const filtered = type
      ? this.eventHistory.filter((e) => e.event.type === type)
      : this.eventHistory;
    
    return filtered.slice(-limit);
  }
  
  /**
   * Clear all handlers
   */
  clearAll(): void {
    this.handlers.clear();
  }
  
  /**
   * Get active event types
   */
  getActiveTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// ========== Singleton Export ==========

export const cosmosBus = new CosmosBus();
