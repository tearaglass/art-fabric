import { repl } from '@strudel/repl';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel/webaudio';

// Import side-effects for pattern DSL
import '@strudel/mini';
import '@strudel/tonal';
import '@strudel/webaudio';

export class PatternEngine {
  private replInstance: any = null;
  private ctx: AudioContext | null = null;

  async init() {
    if (this.replInstance) return;

    // Initialize audio on user interaction
    await initAudioOnFirstClick();
    this.ctx = getAudioContext();
    
    // Create REPL with proper configuration
    this.replInstance = repl({
      defaultOutput: webaudioOutput,
      editPattern: (pattern) => pattern,
      onSchedulerError: (err) => {
        console.error('[Strudel Scheduler Error]', err);
      },
    });

    console.log('[PatternEngine] Initialized with @strudel/repl');
  }

  async playPattern(code: string) {
    await this.init();
    
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      // Use REPL's evaluate method
      await this.replInstance.evaluate(code);
    } catch (err) {
      console.error('[Pattern Error]', err);
      throw new Error(err instanceof Error ? err.message : 'Pattern evaluation failed');
    }
  }

  stop() {
    this.replInstance?.scheduler?.stop?.();
  }

  isPlaying() {
    return !!this.replInstance?.scheduler?.started;
  }

  getContextState() {
    return this.ctx?.state || 'closed';
  }
}

export const patternEngine = new PatternEngine();
