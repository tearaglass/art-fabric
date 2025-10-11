import { renderCache } from '@/lib/cache/RenderCache';
import { eventBus } from '@/lib/events/EventBus';

export interface StrudelPreset {
  id: string;
  name: string;
  description: string;
  pattern: string;
  tempo: number;
  bars: number;
  kitId: string;
  scale?: string;
}

export const STRUDEL_PRESETS: StrudelPreset[] = [
  {
    id: 'minimal_kick',
    name: 'Minimal Kick',
    description: 'Simple 4/4 kick pattern',
    pattern: 'bd bd bd bd',
    tempo: 120,
    bars: 4,
    kitId: 'RolandTR808',
    scale: 'C minor',
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    description: 'Classic breakbeat groove',
    pattern: 'bd ~ [sn cp] ~ bd sn ~ [bd sn]',
    tempo: 140,
    bars: 8,
    kitId: 'RolandTR909',
    scale: 'D dorian',
  },
  {
    id: 'ambient_bells',
    name: 'Ambient Bells',
    description: 'Ethereal bell tones',
    pattern: 'note("<c4 e4 g4 b4>").sound("glockenspiel")',
    tempo: 80,
    bars: 8,
    kitId: 'casio',
    scale: 'E major',
  },
  {
    id: 'glitch_perc',
    name: 'Glitch Percussion',
  description: 'Scattered percussion hits',
  pattern: 's("~ cp ~ hh, bd ~ ~ ~").sometimes(fast(2))',
  tempo: 160,
    bars: 4,
    kitId: 'RolandTR808',
    scale: 'chromatic',
  },
  {
    id: 'melodic_sequence',
    name: 'Melodic Sequence',
    description: 'Arpeggiated melody',
    pattern: 'note("c3 e3 g3 c4 e4 g4 e4 c4".slow(2)).sound("sawtooth")',
    tempo: 100,
    bars: 8,
    kitId: 'synth',
    scale: 'C major',
  },
];

export interface StrudelRenderParams {
  pattern: string;
  tempo: number;
  bars: number;
  kitId: string;
  seed?: number;
}

export class StrudelRenderer {
  private static audioContext: AudioContext | null = null;

  /**
   * Initialize audio context (lazy)
   */
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Render Strudel pattern to audio buffer
   */
  async render(params: StrudelRenderParams): Promise<{ audioUrl: string; metadata: any }> {
    const cacheKey = { ...params, type: 'strudel' };
    
    // Check cache first
    const cached = await renderCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startTime = performance.now();

    try {
      // For now, we'll create a simple synthetic audio pattern
      // In production, this would integrate with actual Strudel/TidalCycles
      const audioData = await this.synthesizePattern(params);
      
      const duration = performance.now() - startTime;

      const metadata = {
        pattern: params.pattern,
        tempo: params.tempo,
        bars: params.bars,
        scale: this.detectScale(params.pattern),
        duration: audioData.duration,
        kitId: params.kitId,
      };

      const result = {
        audioUrl: audioData.url,
        metadata,
      };

      // Cache result
      await renderCache.set('strudel', cacheKey, JSON.stringify(result), { 
        name: params.pattern.substring(0, 30) 
      });

      // Emit event
      eventBus.emit('strudel/rendered', { pattern: params.pattern, duration });

      return result;
    } catch (error) {
      console.error('Strudel render error:', error);
      throw new Error(`Failed to render pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Synthesize a simple pattern (placeholder for actual Strudel integration)
   */
  private async synthesizePattern(params: StrudelRenderParams): Promise<{ url: string; duration: number }> {
    const ctx = StrudelRenderer.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const beatDuration = 60 / params.tempo; // seconds per beat
    const duration = beatDuration * 4 * params.bars; // 4 beats per bar
    const bufferSize = Math.floor(duration * sampleRate);
    
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Generate simple pattern based on text
    const beats = this.parseSimplePattern(params.pattern);
    const samplesPerBeat = Math.floor(beatDuration * sampleRate);

    beats.forEach((beat, index) => {
      if (beat && index * samplesPerBeat < bufferSize) {
        const beatType = this.detectBeatType(beat);
        this.addBeat(leftChannel, rightChannel, index * samplesPerBeat, beatType, sampleRate);
      }
    });

    // Convert buffer to WAV
    const wav = this.bufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    return { url, duration };
  }

  /**
   * Parse simple pattern string (bd, sn, hh, etc.)
   */
  private parseSimplePattern(pattern: string): string[] {
    // Very simple parser - just looks for bd, sn, hh, cp patterns
    const tokens = pattern.match(/\b(bd|sn|hh|cp|~|note)\b/g) || [];
    const beats: string[] = [];
    
    for (let i = 0; i < 16; i++) {
      beats.push(tokens[i % tokens.length] || '~');
    }
    
    return beats;
  }

  /**
   * Detect beat type
   */
  private detectBeatType(beat: string): 'kick' | 'snare' | 'hihat' | 'clap' | 'none' {
    if (beat === 'bd') return 'kick';
    if (beat === 'sn') return 'snare';
    if (beat === 'hh') return 'hihat';
    if (beat === 'cp') return 'clap';
    return 'none';
  }

  /**
   * Add a beat to the buffer
   */
  private addBeat(
    left: Float32Array,
    right: Float32Array,
    startSample: number,
    type: 'kick' | 'snare' | 'hihat' | 'clap' | 'none',
    sampleRate: number
  ) {
    if (type === 'none') return;

    const duration = type === 'kick' ? 0.15 : type === 'snare' ? 0.1 : 0.05;
    const samples = Math.floor(duration * sampleRate);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10);
      let sample = 0;

      switch (type) {
        case 'kick':
          sample = Math.sin(2 * Math.PI * 60 * Math.exp(-t * 15)) * envelope;
          break;
        case 'snare':
          sample = (Math.random() * 2 - 1) * envelope * 0.5;
          break;
        case 'hihat':
          sample = (Math.random() * 2 - 1) * envelope * 0.3;
          break;
        case 'clap':
          sample = (Math.random() * 2 - 1) * envelope * 0.4;
          break;
      }

      const index = startSample + i;
      if (index < left.length) {
        left[index] += sample * 0.5;
        right[index] += sample * 0.5;
      }
    }
  }

  /**
   * Convert AudioBuffer to WAV
   */
  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  /**
   * Detect scale from pattern
   */
  private detectScale(pattern: string): string {
    // Simple heuristic
    if (pattern.includes('note')) {
      if (pattern.includes('minor') || pattern.includes('m')) return 'minor';
      if (pattern.includes('major')) return 'major';
      return 'chromatic';
    }
    return 'percussive';
  }
}

export const strudelRenderer = new StrudelRenderer();
