import { initStrudel, evaluate, hush } from '@strudel/web';

export class PatternEngine {
  private initialized = false;

  async init() {
    if (this.initialized) return;

    // Initialize Strudel with all the required packages
    await initStrudel();
    this.initialized = true;
    
    console.log('[PatternEngine] Initialized with @strudel/web');
  }

  async playPattern(code: string) {
    await this.init();
    
    try {
      // Use evaluate to parse and play the pattern
      // evaluate handles mini-notation with double quotes
      await evaluate(code);
    } catch (err) {
      console.error('[Pattern Error]', err);
      throw new Error(err instanceof Error ? err.message : 'Pattern evaluation failed');
    }
  }

  stop() {
    // hush() stops all playing patterns
    hush();
  }

  isPlaying() {
    // @strudel/web doesn't expose playing state directly
    // We'll return a simple indicator based on initialization
    return this.initialized;
  }

  getContextState() {
    // Web Audio context state management is handled internally by @strudel/web
    return this.initialized ? 'running' : 'closed';
  }
}

export const patternEngine = new PatternEngine();
