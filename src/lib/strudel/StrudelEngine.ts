import { repl, Pattern } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from '@strudel/webaudio';
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
  private currentPattern: Pattern | null = null;

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
      
      // Create scheduler with proper configuration
      const replInstance = repl({
        defaultOutput: webaudioOutput,
        getTime: () => this.audioContext?.currentTime || 0,
      });

      this.scheduler = replInstance.scheduler;
      
      console.log('[Strudel] Audio context initialized:', this.audioContext?.state);
      console.log('[Strudel] Scheduler created');
      this.isInitialized = true;
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
      console.log('[Strudel] Evaluating pattern:', code);

      // Evaluate the code to get a pattern
      // Using Function constructor to evaluate the pattern code safely
      const evaluateCode = new Function(
        's', 'note', 'sound', 'stack', 'cat', 'seq', 'fastcat', 'slowcat',
        `return ${code}`
      );

      // Import pattern functions from @strudel/core
      const { s, note, sound, stack, cat, seq, fastcat, slowcat } = await import('@strudel/core');
      
      const pattern = evaluateCode(s, note, sound, stack, cat, seq, fastcat, slowcat);
      
      if (!pattern) {
        throw new Error('Pattern evaluation returned null');
      }

      this.currentPattern = pattern;

      // Set pattern on scheduler
      if (this.scheduler) {
        this.scheduler.setPattern(pattern, true); // true = evaluate immediately
        console.log('[Strudel] Pattern set on scheduler');
      }

      console.log('[Strudel] Pattern evaluated successfully');
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
      if (this.scheduler) {
        this.scheduler.setCPS(cps);
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
