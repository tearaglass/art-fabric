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
    
    this.replInstance = repl({
      defaultOutput: webaudioOutput,
      getTime: () => ctx?.currentTime || 0,
    });
    
    // Load default samples
    await samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/EmuSP12.json');
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
