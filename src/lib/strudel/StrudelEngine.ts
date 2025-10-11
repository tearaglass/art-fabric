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
      
      // Create REPL instance with proper configuration
      this.replInstance = repl({
        defaultOutput: webaudioOutput,
        getTime: () => this.audioContext?.currentTime || 0,
      });

      this.scheduler = this.replInstance.scheduler;
      
      // Load default sample map for bd, sd, hh, cp, etc.
      console.log('[Strudel] Loading default sample map...');
      try {
        await samples(DEFAULT_SAMPLE_MAP_URL);
        console.log('[Strudel] Sample map loaded');
      } catch (error) {
        console.warn('[Strudel] Failed to load default sample map, continuing without samples:', error);
        // Continue initialization even if sample loading fails
      }
      
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

      // Strip optional "$:" and normalize helpers
      let expr = code.trim().replace(/^\$:\s*/, '');

      // Temporary alias: support "sound(...)" by rewriting to "s(...)"
      expr = expr.replace(/^sound\s*\(/, 's(');

      // If it's a bare quoted mini-notation, wrap with s("...")
      const isQuoted = (expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"));
      if (isQuoted) {
        expr = `s(${expr})`;
      }

      // Evaluate in REPL scope first
      let patternCandidate: any = null;
      if (this.replInstance && typeof this.replInstance.eval === 'function') {
        patternCandidate = await this.replInstance.eval(expr);
      } else {
        patternCandidate = await evaluate(expr);
      }

      if (!patternCandidate || typeof patternCandidate.queryArc !== 'function') {
        throw new Error('Your code did not produce a Strudel Pattern. Try s("bd sd"), note("c e g"), etc.');
      }

      const pattern = patternCandidate as Pattern;
      this.currentPattern = pattern;

      // Set pattern on scheduler
      if (this.scheduler) {
        this.scheduler.setPattern(pattern, true);
        console.log('[Strudel] Pattern set on scheduler');
      }

      console.log('[Strudel] Pattern evaluated successfully');
    } catch (error) {
      console.error('[Strudel] Pattern evaluation error:', error);
      
      // Provide helpful error messages
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('not defined') || errorMsg.includes('is not a function')) {
        throw new Error(`Function not found: ${errorMsg}. Make sure you're using valid Strudel functions.`);
      }
      if (errorMsg.includes('unknown') || errorMsg.includes('sample')) {
        throw new Error(`Unknown sample: ${errorMsg}. Try loading the default sample map or use known samples like bd, sd, hh, cp.`);
      }
      
      throw new Error(`Pattern error: ${errorMsg}`);
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
