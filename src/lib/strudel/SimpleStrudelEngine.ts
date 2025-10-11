import { repl } from '@strudel/core';
import { getAudioContext, webaudioOutput } from '@strudel/webaudio';
import '@strudel/mini';
import '@strudel/tonal';

class SimpleStrudelEngine {
  private replInstance: any = null;
  private ctx: AudioContext | null = null;

  private async ensure() {
    if (this.replInstance) return;
    this.ctx = getAudioContext();
    this.replInstance = repl({
      defaultOutput: webaudioOutput,
      getTime: () => this.ctx?.currentTime || 0,
    });
  }

  async evaluate(code: string) {
    await this.ensure();
    const r = this.replInstance;
    let pattern: any;

    if (typeof r.eval === 'function') {
      pattern = await r.eval(code);
    } else if (typeof r.evaluate === 'function') {
      pattern = await r.evaluate(code);
    } else {
      throw new Error('[SimpleStrudel] No REPL eval available');
    }

    if (typeof pattern === 'function') pattern = pattern();
    if (!pattern || typeof pattern.queryArc !== 'function') {
      throw new Error('Invalid pattern. Try: note("c3 e3 g3").s("sine")');
    }

    r.scheduler?.setPattern?.(pattern, true);
  }

  async start() {
    await this.ensure();
    try { await this.ctx?.resume?.(); } catch {}
    this.replInstance?.scheduler?.start?.();
  }

  stop() {
    this.replInstance?.scheduler?.stop?.();
  }

  isPlaying() {
    return !!this.replInstance?.scheduler?.started;
  }
}

export const simpleEngine = new SimpleStrudelEngine();
