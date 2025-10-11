import { initStrudel, evaluate, hush } from '@strudel/web';
import { strudelBus } from './bus';

export class StrudelEngine {
  private initialized = false;
  private currentBpm = 120;
  private analyser: AnalyserNode | null = null;
  private tickInterval: number | null = null;
  private currentTick16 = 0;
  private audioContext: AudioContext | null = null;

  async ensure() {
    if (this.initialized) return;

    await initStrudel();
    this.initialized = true;

    // Try to get audio context (Strudel creates it internally)
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.connect(this.audioContext.destination);
      } catch (err) {
        console.warn('[StrudelEngine] AudioContext creation failed:', err);
      }
    }

    console.log('[StrudelEngine] Initialized with @strudel/web');
  }

  async run(code: string): Promise<void> {
    await this.ensure();

    try {
      // Stop previous pattern
      hush();
      
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Evaluate new code
      await evaluate(code);
      
      // Start transport ticks
      this.startTransport();
      
      strudelBus.emit({ type: "transport", state: "start" });
    } catch (err) {
      console.error('[StrudelEngine] Eval error:', err);
      throw new Error(err instanceof Error ? err.message : 'Pattern evaluation failed');
    }
  }

  stop() {
    hush();
    this.stopTransport();
    strudelBus.emit({ type: "transport", state: "stop" });
  }

  setBpm(bpm: number) {
    this.currentBpm = bpm;
    const cps = bpm / 60;
    strudelBus.emit({ type: "tempo", bpm, cps });
    
    // Restart transport with new tempo
    if (this.tickInterval !== null) {
      this.stopTransport();
      this.startTransport();
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  private startTransport() {
    this.stopTransport();
    
    // 16th note interval in ms
    const interval = (60000 / this.currentBpm) / 4;
    
    this.currentTick16 = 0;
    this.tickInterval = window.setInterval(() => {
      this.currentTick16++;
      const bar = Math.floor(this.currentTick16 / 16);
      const beat = Math.floor((this.currentTick16 % 16) / 4);
      
      strudelBus.emit({
        type: "beat",
        bar,
        beat,
        tick16: this.currentTick16 % 16,
      });
    }, interval);
  }

  private stopTransport() {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

export const strudelEngine = new StrudelEngine();
