import { repl, Pattern, evaluate } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, samples } from '@strudel/webaudio';
import '@strudel/mini';
import '@strudel/tonal';
import { DEFAULT_SAMPLE_MAP_URL } from './sampleMaps';

export interface StrudelPattern {
  code: string;
  name: string;
}

export class StrudelEngine {
  private static instance: StrudelEngine;
  private scheduler: any = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private currentPattern: Pattern | null = null;
  private replInstance: any = null;

  private constructor() {}

  static getInstance(): StrudelEngine {
    if (!StrudelEngine.instance) {
      StrudelEngine.instance = new StrudelEngine();
    }
    return StrudelEngine.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('[Strudel] Initializing engine...');
      
      // Initialize audio on user interaction
      await initAudioOnFirstClick();
      this.audioContext = getAudioContext();
      
      // Create REPL instance - this gives us all Strudel functions (s, note, n, etc.)
      this.replInstance = repl({
        defaultOutput: webaudioOutput,
        getTime: () => this.audioContext?.currentTime || 0,
      });

      this.scheduler = this.replInstance.scheduler;
      
      // Load default sample map
      console.log('[Strudel] Loading default samples...');
      try {
        await samples(DEFAULT_SAMPLE_MAP_URL);
        console.log('[Strudel] Samples loaded');
      } catch (error) {
        console.warn('[Strudel] Failed to load samples:', error);
      }
      
      this.isInitialized = true;
      console.log('[Strudel] Engine ready');
    } catch (error) {
      console.error('[Strudel] Initialization error:', error);
      throw error;
    }
  }

  async evaluatePattern(code: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.replInstance) {
      throw new Error('REPL not initialized');
    }

    try {
      console.log('[Strudel] Evaluating:', code);

      // Clean up code - remove $: prefix if present (it's optional in REPL)
      const cleanCode = code.trim().replace(/^\$:\s*/, '');

      // Evaluate using REPL - this has all Strudel functions (s, note, n, etc.)
      const pattern = await this.replInstance.eval(cleanCode);

      if (!pattern || typeof pattern.queryArc !== 'function') {
        throw new Error('Code did not produce a valid pattern. Try: s("bd sd hh") or note("c e g").s("piano")');
      }

      this.currentPattern = pattern;

      // Set pattern on scheduler
      if (this.scheduler) {
        this.scheduler.setPattern(pattern, true);
        console.log('[Strudel] Pattern set');
      }
    } catch (error) {
      console.error('[Strudel] Evaluation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Pattern evaluation failed');
    }
  }

  async loadSampleMap(url: string) {
    try {
      console.log('[Strudel] Loading sample map:', url);
      await samples(url);
      console.log('[Strudel] Sample map loaded successfully');
    } catch (error) {
      console.error('[Strudel] Failed to load sample map:', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Strudel] Starting playback...');
      
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.scheduler) {
        this.scheduler.start();
        console.log('[Strudel] Playback started');
      } else {
        throw new Error('Scheduler not initialized');
      }
    } catch (error) {
      console.error('[Strudel] Start error:', error);
      throw error;
    }
  }

  pause() {
    try {
      console.log('[Strudel] Pausing playback...');
      if (this.scheduler) {
        this.scheduler.pause();
      }
    } catch (error) {
      console.error('[Strudel] Pause error:', error);
    }
  }

  stop() {
    try {
      console.log('[Strudel] Stopping playback...');
      if (this.scheduler) {
        this.scheduler.stop();
      }
    } catch (error) {
      console.error('[Strudel] Stop error:', error);
    }
  }

  setBPM(bpm: number) {
    try {
      console.log('[Strudel] Setting BPM to:', bpm);
      const cps = bpm / 60 / 4; // Convert BPM to cycles per second
      if (this.scheduler && typeof this.scheduler.setCPS === 'function') {
        this.scheduler.setCPS(cps);
      } else if (this.scheduler && typeof this.scheduler.setTempo === 'function') {
        this.scheduler.setTempo(bpm);
      } else {
        console.warn('[Strudel] Scheduler does not support tempo changes; ignoring');
      }
    } catch (error) {
      console.error('[Strudel] Set BPM error:', error);
    }
  }

  getCurrentPattern(): Pattern | null {
    return this.currentPattern;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  isPlaying(): boolean {
    try {
      return this.scheduler?.started || false;
    } catch {
      return false;
    }
  }

  destroy() {
    try {
      this.stop();
      this.scheduler = null;
      this.currentPattern = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('[Strudel] Destroy error:', error);
    }
  }
}

export const strudelEngine = StrudelEngine.getInstance();
