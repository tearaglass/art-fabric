import { repl, controls } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, samples } from '@strudel/webaudio';
import '@strudel/mini';
import '@strudel/tonal';

export interface StrudelPattern {
  code: string;
  name: string;
}

export class StrudelEngine {
  private static instance: StrudelEngine;
  private scheduler: any = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private currentPattern: string = '';

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
      
      console.log('[Strudel] Audio context initialized:', this.audioContext?.state);
      this.isInitialized = true;
    } catch (error) {
      console.error('[Strudel] Initialization error:', error);
      throw error;
    }
  }

  async loadSamples(sampleUrls?: Record<string, string>) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Strudel] Loading samples...');
      
      // Load default samples if no custom URLs provided
      if (!sampleUrls) {
        // Strudel comes with default samples loaded
        console.log('[Strudel] Using default sample library');
      } else {
        // Load custom samples
        await Promise.all(
          Object.entries(sampleUrls).map(([name, url]) =>
            samples(url, { name })
          )
        );
      }
    } catch (error) {
      console.error('[Strudel] Sample loading error:', error);
    }
  }

  async evaluatePattern(code: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Strudel] Evaluating pattern:', code);
      this.currentPattern = code;

      // Evaluate the pattern using Strudel's REPL
      const result = await repl({
        code,
        autodraw: false, // We'll handle drawing separately
      });

      // Start the scheduler if not already running
      if (!this.scheduler) {
        this.scheduler = controls.start();
      }

      console.log('[Strudel] Pattern evaluated successfully');
      return result;
    } catch (error) {
      console.error('[Strudel] Pattern evaluation error:', error);
      throw new Error(`Pattern error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      controls.start();
      console.log('[Strudel] Playback started');
    } catch (error) {
      console.error('[Strudel] Start error:', error);
      throw error;
    }
  }

  pause() {
    try {
      console.log('[Strudel] Pausing playback...');
      controls.pause();
    } catch (error) {
      console.error('[Strudel] Pause error:', error);
    }
  }

  stop() {
    try {
      console.log('[Strudel] Stopping playback...');
      controls.stop();
      this.scheduler = null;
    } catch (error) {
      console.error('[Strudel] Stop error:', error);
    }
  }

  setBPM(bpm: number) {
    try {
      console.log('[Strudel] Setting BPM to:', bpm);
      controls.setcps(bpm / 60 / 4); // Convert BPM to cycles per second
    } catch (error) {
      console.error('[Strudel] Set BPM error:', error);
    }
  }

  getCurrentPattern(): string {
    return this.currentPattern;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  isPlaying(): boolean {
    try {
      return controls.started;
    } catch {
      return false;
    }
  }

  destroy() {
    try {
      this.stop();
      this.scheduler = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('[Strudel] Destroy error:', error);
    }
  }
}

export const strudelEngine = StrudelEngine.getInstance();
