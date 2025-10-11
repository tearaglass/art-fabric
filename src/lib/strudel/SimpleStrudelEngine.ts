import { repl } from '@strudel/core';
import { getAudioContext, webaudioOutput, samples } from '@strudel/webaudio';
import '@strudel/mini';
import '@strudel/tonal';

class SimpleStrudelEngine {
  private replInstance: any = null;
  
  async init() {
    
    
    const ctx = getAudioContext();
    
    // Explicitly resume audio context
    try {
      await ctx?.resume?.();
    } catch (e) {
      console.warn('[SimpleStrudel] Audio context resume failed:', e);
    }
    
    this.replInstance = repl({
      defaultOutput: webaudioOutput,
      getTime: () => ctx?.currentTime || 0,
    });
    
    
    // Load default samples (non-blocking)
    try {
      await samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/EmuSP12.json');
      
    } catch (e) {
      console.warn('[SimpleStrudel] Sample map failed to load. Drums may be silent.', e);
    }
    
    
  }
  
  async evaluate(code: string) {
    if (!this.replInstance) await this.init();
    const r: any = this.replInstance;
    if (typeof r.setCode === 'function') {
      await r.setCode(code);
    } else if (typeof r.eval === 'function') {
      await r.eval(code);
    } else if (typeof r.evaluate === 'function') {
      await r.evaluate(code);
    } else {
      throw new Error('[SimpleStrudel] No REPL evaluation method available');
    }
  }
  
  start() {
    try { getAudioContext()?.resume?.(); } catch {}
    this.replInstance?.scheduler?.start?.();
  }
  
  stop() {
    this.replInstance?.scheduler.stop();
    
  }
  
  isPlaying() {
    return this.replInstance?.scheduler.started || false;
  }
}

export const simpleEngine = new SimpleStrudelEngine();
