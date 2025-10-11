import { repl } from '@strudel/repl';
import { Pattern } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, samples } from '@strudel/webaudio';
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
  private evalCode: ((code: string) => Promise<Pattern>) | null = null;

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
      
      await initAudioOnFirstClick();
      this.audioContext = getAudioContext();
      
      const output = typeof webaudioOutput === 'function'
        ? webaudioOutput({ context: this.audioContext })
        : webaudioOutput;

      const replInstance = repl({
        defaultOutput: output,
        getTime: () => this.audioContext?.currentTime || 0,
      });

      this.evalCode = replInstance.evaluate ?? replInstance.eval;
      this.scheduler = replInstance.scheduler;
      
      console.log('[Strudel] REPL ready:', {
        hasEval: typeof this.evalCode === 'function',
        hasScheduler: !!this.scheduler,
      });
      
      // Try to load samples with fallback chain
      const sampleUrls = [
        'https://raw.githubusercontent.com/felixroos/dough-samples/main/EmuSP12.json',
        'https://raw.githubusercontent.com/felixroos/dough-samples/main/Dirt-Samples.json',
      ];
      
      for (const url of sampleUrls) {
        try {
          await samples(url);
          console.log('[Strudel] Samples loaded from:', url);
          break;
        } catch (error) {
          console.warn('[Strudel] Failed to load samples from:', url);
        }
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

    try {
      console.log('[Strudel] Evaluating:', code);

      const cleanCode = code.trim().replace(/^\$:\s*/, '');

      if (!this.evalCode) {
        throw new Error('[Strudel] Evaluator unavailable');
      }

      let pattern: any = await this.evalCode(cleanCode);
      if (typeof pattern === 'function') {
        pattern = pattern();
      }

      if (!pattern || typeof pattern.queryArc !== 'function') {
        throw new Error('Invalid pattern. Try: s("[bd sd, hh*8]") or note("c e g").s("sine")');
      }

      this.currentPattern = pattern;

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
