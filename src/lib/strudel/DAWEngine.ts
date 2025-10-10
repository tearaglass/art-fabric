import { eventBus } from '../events/EventBus';

export interface Track {
  id: string;
  name: string;
  pattern: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  kitId: string;
}

export interface MasterFX {
  reverb: {
    enabled: boolean;
    amount: number;
    decay: number;
  };
  delay: {
    enabled: boolean;
    time: number;
    feedback: number;
  };
  eq: {
    enabled: boolean;
    low: number;
    mid: number;
    high: number;
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
  };
}

export interface DAWState {
  tracks: Track[];
  bpm: number;
  bars: number;
  masterVolume: number;
  masterFX: MasterFX;
}

export class DAWEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private delay: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private eq: BiquadFilterNode[] = [];

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Initialize reverb
    this.reverb = this.audioContext.createConvolver();
    
    // Initialize delay
    this.delay = this.audioContext.createDelay(5.0);
    this.delayFeedback = this.audioContext.createGain();
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    // Initialize compressor
    this.compressor = this.audioContext.createDynamicsCompressor();

    // Initialize EQ (low, mid, high)
    const lowShelf = this.audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    
    const midPeak = this.audioContext.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.value = 1000;
    midPeak.Q.value = 1;
    
    const highShelf = this.audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 5000;

    this.eq = [lowShelf, midPeak, highShelf];
  }

  async renderTrack(track: Track, bpm: number, bars: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    // Parse pattern and synthesize audio
    const beatDuration = 60 / bpm / 4; // Quarter note duration
    const totalBeats = bars * 4;
    const duration = totalBeats * beatDuration;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const channelData = buffer.getChannelData(0);

    const beats = this.parsePattern(track.pattern, totalBeats);

    beats.forEach((beat, index) => {
      if (beat.type !== 'none') {
        const startTime = index * beatDuration;
        this.addBeat(channelData, beat.type, startTime, sampleRate, track.volume);
      }
    });

    return buffer;
  }

  async mixTracks(tracks: Track[], bpm: number, bars: number, masterVolume: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const soloTracks = tracks.filter(t => t.solo);
    const activeTracks = soloTracks.length > 0 ? soloTracks : tracks.filter(t => !t.muted);

    const trackBuffers = await Promise.all(
      activeTracks.map(track => this.renderTrack(track, bpm, bars))
    );

    if (trackBuffers.length === 0) {
      return this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
    }

    const maxLength = Math.max(...trackBuffers.map(b => b.length));
    const mixedBuffer = this.audioContext.createBuffer(2, maxLength, this.audioContext.sampleRate);
    const leftChannel = mixedBuffer.getChannelData(0);
    const rightChannel = mixedBuffer.getChannelData(1);

    trackBuffers.forEach((buffer, trackIndex) => {
      const track = activeTracks[trackIndex];
      const data = buffer.getChannelData(0);
      const pan = track.pan; // -1 (left) to 1 (right)
      const leftGain = pan <= 0 ? 1 : 1 - pan;
      const rightGain = pan >= 0 ? 1 : 1 + pan;

      for (let i = 0; i < data.length; i++) {
        leftChannel[i] += data[i] * leftGain * masterVolume;
        rightChannel[i] += data[i] * rightGain * masterVolume;
      }
    });

    return mixedBuffer;
  }

  applyFX(buffer: AudioBuffer, fx: MasterFX): AudioBuffer {
    // For now, return the buffer as-is
    // Full FX implementation would require offline audio context processing
    return buffer;
  }

  private parsePattern(pattern: string, totalBeats: number): Array<{ type: string }> {
    const tokens = pattern.trim().split(/\s+/);
    const beats: Array<{ type: string }> = [];

    for (let i = 0; i < totalBeats; i++) {
      const token = tokens[i % tokens.length] || '~';
      beats.push({ type: this.detectBeatType(token) });
    }

    return beats;
  }

  private detectBeatType(beat: string): string {
    if (beat.includes('bd')) return 'kick';
    if (beat.includes('sn')) return 'snare';
    if (beat.includes('hh')) return 'hihat';
    if (beat.includes('cp')) return 'clap';
    return 'none';
  }

  private addBeat(
    channelData: Float32Array,
    beatType: string,
    startTime: number,
    sampleRate: number,
    volume: number
  ) {
    const startSample = Math.floor(startTime * sampleRate);
    const duration = 0.1;
    const samples = Math.floor(duration * sampleRate);

    for (let i = 0; i < samples && startSample + i < channelData.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (beatType) {
        case 'kick':
          sample = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 20);
          break;
        case 'snare':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 30);
          break;
        case 'hihat':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.5;
          break;
        case 'clap':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.7;
          break;
      }

      channelData[startSample + i] += sample * volume;
    }
  }

  bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const data = new Float32Array(buffer.length * numChannels);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        data[i * numChannels + channel] = channelData[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const dawEngine = new DAWEngine();
