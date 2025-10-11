import { repl } from '@strudel/repl';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from '@strudel/webaudio';

class SimpleStrudelEngine {
  private r: any = null;
  private ctx: AudioContext | null = null;

  private async ensure() {
    if (this.r) return;
    await initAudioOnFirstClick();
    this.ctx = getAudioContext();

    // Bind output to this AudioContext (supports both factory and legacy value)
    const output = typeof webaudioOutput === 'function'
      ? webaudioOutput({ context: this.ctx })
      : webaudioOutput;

    this.r = repl({
      defaultOutput: output,
      getTime: () => this.ctx?.currentTime || 0,
    });

    // Small debug in case of future regressions
    console.debug('[SimpleStrudel] REPL ready', {
      hasEvaluate: typeof this.r?.evaluate === 'function',
      hasEval: typeof this.r?.eval === 'function',
      scheduler: !!this.r?.scheduler,
    });
  }

  async play(code: string) {
    await this.ensure();
    try { await this.ctx?.resume?.(); } catch {}

    const clean = code.trim().replace(/^\$:\s*/, '');

    let pattern: any;
    if (typeof this.r?.evaluate === 'function') {
      pattern = await this.r.evaluate(clean);
    } else if (typeof this.r?.eval === 'function') {
      pattern = await this.r.eval(clean);
    } else {
      throw new Error('[Strudel] No REPL evaluator available');
    }
    if (typeof pattern === 'function') pattern = pattern();

    if (!pattern || typeof pattern.queryArc !== 'function') {
      throw new Error('Invalid pattern. Try: note("c3 e3 g3").s("sine")');
    }

    this.r.scheduler?.setPattern?.(pattern, true);
    if (!this.r.scheduler?.started) this.r.scheduler?.start?.();
  }

  stop() {
    this.r?.scheduler?.stop?.();
  }

  isPlaying() {
    return !!this.r?.scheduler?.started;
  }

  getContextState() {
    return this.ctx?.state || 'closed';
  }

  // Known-good diag path (bypasses user code)
  async selfTest() {
    await this.ensure();
    try { await this.ctx?.resume?.(); } catch {}
    let pat = await (this.r?.evaluate?.(`note("c3 e3 g3").s("sine").fast(2)`) ?? this.r?.eval?.(`note("c3 e3 g3").s("sine").fast(2)`));
    if (typeof pat === 'function') pat = pat();
    this.r?.scheduler?.setPattern?.(pat, true);
    if (!this.r?.scheduler?.started) this.r?.scheduler?.start?.();
  }
}

export const simpleEngine = new SimpleStrudelEngine();
