import { repl } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, samples } from '@strudel/webaudio';
import '@strudel/mini';
import '@strudel/tonal';

class SimpleStrudelEngine {
  private replInstance: any = null;
  
  async init() {
    console.log('[SimpleStrudel] Initializing...');
    await initAudioOnFirstClick();
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
    
    // Diagnostics
    console.log('[SimpleStrudel] REPL keys:', Object.keys(this.replInstance || {}));
    console.log('[SimpleStrudel] Has eval:', typeof this.replInstance?.eval === 'function', 'Has scheduler:', !!this.replInstance?.scheduler);
    
    // Load default samples (non-blocking)
    try {
      await samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/EmuSP12.json');
      console.log('[SimpleStrudel] Samples loaded');
    } catch (e) {
      console.warn('[SimpleStrudel] Sample map failed to load. Drums may be silent.', e);
    }
    
    console.log('[SimpleStrudel] Ready');
  }
  
  async evaluate(code: string) {
    if (!this.replInstance) await this.init();
    console.log('[SimpleStrudel] Evaluating:', code);
    return this.replInstance.eval(code);
  }
  
  start() {
    this.replInstance?.scheduler.start();
    console.log('[SimpleStrudel] Started');
  }
  
  stop() {
    this.replInstance?.scheduler.stop();
    console.log('[SimpleStrudel] Stopped');
  }
  
  isPlaying() {
    return this.replInstance?.scheduler.started || false;
  }
}

export const simpleEngine = new SimpleStrudelEngine();
