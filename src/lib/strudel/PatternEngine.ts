import { repl } from '@strudel/core';
import { getAudioContext, webaudioOutput } from '@strudel/webaudio';

// Import side-effects for pattern DSL
import '@strudel/mini';
import '@strudel/tonal';
import '@strudel/webaudio';

export class PatternEngine {
  private replInstance: any = null;
  private ctx: AudioContext | null = null;

  async init() {
    if (this.replInstance) return;

    // Use Strudel's getAudioContext helper
    this.ctx = getAudioContext();
    
    // Create output bound to context
    const output = typeof webaudioOutput === 'function'
      ? webaudioOutput({ context: this.ctx })
      : webaudioOutput;

    // Create REPL
    this.replInstance = repl({
      defaultOutput: output,
      getTime: () => this.ctx?.currentTime || 0,
    });

    console.log('[PatternEngine] Initialized', {
      hasEvaluate: !!this.replInstance?.evaluate,
      hasScheduler: !!this.replInstance?.scheduler,
    });
  }

  async playPattern(code: string) {
    await this.init();
    
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    // Evaluate pattern
    const evalFn = this.replInstance.evaluate || this.replInstance.eval;
    if (!evalFn) {
      throw new Error('No evaluator found on REPL instance');
    }

    let pattern = await evalFn.call(this.replInstance, code);
    if (typeof pattern === 'function') {
      pattern = pattern();
    }

    // Schedule it
    this.replInstance.scheduler?.setPattern?.(pattern, true);
    if (!this.replInstance.scheduler?.started) {
      this.replInstance.scheduler?.start?.();
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
