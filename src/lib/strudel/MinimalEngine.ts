// Ultra-minimal: no patterns, just raw WebAudio test
export class MinimalEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;

  async init() {
    if (!this.ctx) {
      // Manually create AudioContext (bypass Strudel's wrapper initially)
      this.ctx = new AudioContext();
    }
  }

  async playTone() {
    await this.init();
    if (this.ctx!.state === 'suspended') {
      await this.ctx!.resume();
    }
    
    // Raw WebAudio test - if this fails, it's a browser/audio issue
    this.osc = this.ctx!.createOscillator();
    this.osc.frequency.value = 440; // A4
    this.osc.connect(this.ctx!.destination);
    this.osc.start();
    
    setTimeout(() => this.stop(), 1000);
  }

  stop() {
    this.osc?.stop();
    this.osc = null;
  }

  getContextState() {
    return this.ctx?.state || 'closed';
  }
}

export const minimalEngine = new MinimalEngine();
