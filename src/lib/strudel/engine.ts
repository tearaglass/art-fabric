import { initStrudel, evaluate, hush } from '@strudel/web';
import { strudelBus } from './bus';
import { cosmosBus } from '@/lib/events/CosmosBus';

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
      
      // Emit to both buses for backward compat
      strudelBus.emit({ type: "transport", state: "start" });
      cosmosBus.emit({ 
        type: "transport/start", 
        bpm: this.currentBpm, 
        timestamp: Date.now() 
      });
      
      // Start audio analysis
      this.startAudioAnalysis();
    } catch (err) {
      console.error('[StrudelEngine] Eval error:', err);
      throw new Error(err instanceof Error ? err.message : 'Pattern evaluation failed');
    }
  }

  stop() {
    hush();
    this.stopTransport();
    this.stopAudioAnalysis();
    
    // Emit to both buses
    strudelBus.emit({ type: "transport", state: "stop" });
    cosmosBus.emit({ type: "transport/stop", timestamp: Date.now() });
  }

  setBpm(bpm: number) {
    this.currentBpm = bpm;
    const cps = bpm / 60;
    
    // Emit to both buses
    strudelBus.emit({ type: "tempo", bpm, cps });
    cosmosBus.emit({ type: "transport/tempo", bpm, cps });
    
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
      const tick16 = this.currentTick16 % 16;
      const phase = (tick16 % 4) / 4; // 0-1 within current beat
      
      // Emit to legacy bus
      strudelBus.emit({
        type: "beat",
        bar,
        beat,
        tick16,
      });
      
      // Emit to CosmosBus with enhanced data
      cosmosBus.emit({
        type: "transport/tick",
        bar,
        beat,
        tick16,
        phase,
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

  private audioAnalysisRAF: number | null = null;

  private startAudioAnalysis() {
    this.stopAudioAnalysis();
    
    if (!this.analyser) return;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!this.analyser) return;
      
      // Time-domain data for RMS/peak
      this.analyser.getByteTimeDomainData(dataArray);
      
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
        peak = Math.max(peak, Math.abs(normalized));
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Frequency data for spectrum
      this.analyser.getByteFrequencyData(freqArray);
      
      // Split into low/mid/high bands
      const third = Math.floor(bufferLength / 3);
      let low = 0, mid = 0, high = 0;
      
      for (let i = 0; i < third; i++) {
        low += freqArray[i];
      }
      for (let i = third; i < third * 2; i++) {
        mid += freqArray[i];
      }
      for (let i = third * 2; i < bufferLength; i++) {
        high += freqArray[i];
      }
      
      // Normalize to 0-1
      low = low / (third * 255);
      mid = mid / (third * 255);
      high = high / (third * 255);
      
      // Emit FFT event
      cosmosBus.emit({
        type: "audio/fft",
        bins: new Float32Array(freqArray.map(v => v / 255)),
        rms,
        peak,
      });
      
      // Emit spectrum event
      cosmosBus.emit({
        type: "audio/spectrum",
        low,
        mid,
        high,
      });
      
      this.audioAnalysisRAF = requestAnimationFrame(analyze);
    };
    
    this.audioAnalysisRAF = requestAnimationFrame(analyze);
  }

  private stopAudioAnalysis() {
    if (this.audioAnalysisRAF !== null) {
      cancelAnimationFrame(this.audioAnalysisRAF);
      this.audioAnalysisRAF = null;
    }
  }
}

export const strudelEngine = new StrudelEngine();
