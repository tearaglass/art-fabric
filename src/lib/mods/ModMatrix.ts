import type { FabricModulation } from '@/state/fabric';
import type { CosmosState } from '@/lib/events/CosmosBus';
import { toast } from 'sonner';

/**
 * ModMatrix: Cross-lab modulation routing engine
 * Connects sources (audio, macros, visual metrics) to targets (shader uniforms, p5 params, strudel params)
 */

export class ModMatrix {
  private routes = new Map<string, FabricModulation>();
  private smoothedValues = new Map<string, number>();
  private cycleDetected = new Set<string>();
  private targetCallbacks = new Map<string, (value: number) => void>();

  constructor() {
    console.log('[ModMatrix] Initialized');
  }

  /**
   * Add a modulation route
   */
  addRoute(mod: FabricModulation): void {
    if (this.detectsCycle(mod)) {
      console.warn(`[ModMatrix] Circular routing detected: ${mod.source} → ${mod.target}`);
      this.cycleDetected.add(mod.id);
      toast.error(`Circular mapping detected: ${mod.source} → ${mod.target}`);
      return;
    }
    this.routes.set(mod.id, mod);
    console.log(`[ModMatrix] Route added: ${mod.source} → ${mod.target}`);
  }

  /**
   * Remove a modulation route
   */
  removeRoute(id: string): void {
    this.routes.delete(id);
    this.cycleDetected.delete(id);
    this.smoothedValues.delete(id);
    console.log(`[ModMatrix] Route removed: ${id}`);
  }

  /**
   * Register a target callback (called by adapters)
   */
  registerTarget(path: string, callback: (value: number) => void): void {
    this.targetCallbacks.set(path, callback);
  }

  /**
   * Process all routes each frame
   */
  processFrame(cosmos: CosmosState): void {
    this.routes.forEach((mod) => {
      if (this.cycleDetected.has(mod.id)) return;

      try {
        const sourceValue = this.resolveSource(mod.source, cosmos);
        
        if (sourceValue === undefined || sourceValue === null) {
          // Use default if source unavailable
          if (mod.default !== undefined) {
            this.applyToTarget(mod.target, mod.default);
          }
          return;
        }

        const smoothed = this.smooth(mod.id, sourceValue, mod.smooth);
        const mapped = this.mapRange(smoothed, mod.range, mod.curve);
        const clamped = mod.clamp ? Math.max(mod.range[0], Math.min(mod.range[1], mapped)) : mapped;
        const final = mod.quantize ? this.quantize(clamped, mod.quantize) : clamped;

        this.applyToTarget(mod.target, final);
      } catch (error) {
        console.error(`[ModMatrix] Error processing route ${mod.id}:`, error);
      }
    });
  }

  /**
   * Resolve source value from cosmos state
   */
  private resolveSource(path: string, cosmos: CosmosState): number | undefined {
    const [module, ...rest] = path.split('.');
    
    switch (module) {
      case 'audio':
        if (rest[0] === 'rms') return cosmos.audioRMS;
        if (rest[0] === 'low' || rest[0] === 'mid' || rest[0] === 'high') {
          return cosmos.audioSpectrum?.[rest[0]] ?? 0;
        }
        if (rest[0]?.startsWith('band')) {
          const idx = parseInt(rest[0].substring(4));
          return cosmos.audioSpectrum?.[`band${idx}`] ?? 0;
        }
        return cosmos.audioRMS;

      case 'macro':
        const macroKey = rest[0] as 'A' | 'B' | 'C' | 'D';
        return cosmos.macros[macroKey];

      case 'shader':
        const layerId = rest[0];
        const metric = rest[1];
        return (cosmos as any).shader?.[layerId]?.[metric];

      case 'p5':
        const p5LayerId = rest[0];
        const p5Metric = rest[1];
        return (cosmos as any).p5?.[p5LayerId]?.[p5Metric];

      case 'cosmos':
        if (rest[0] === 'bpm') return cosmos.bpm;
        if (rest[0] === 'bar') return cosmos.bar;
        if (rest[0] === 'phase') return cosmos.phase;
        return undefined;

      case 'affect':
        if (rest[0] === 'hesitation') return cosmos.affect.hesitation;
        if (rest[0] === 'overactivity') return cosmos.affect.overactivity;
        if (rest[0] === 'entropy') return cosmos.affect.entropy;
        if (rest[0] === 'tone') {
          // Map emotional tone to numeric value
          const toneMap = { neutral: 0.5, anxious: 0.25, euphoric: 0.75, numb: 0 };
          return toneMap[cosmos.affect.emotionalTone];
        }
        return undefined;

      default:
        console.warn(`[ModMatrix] Unknown source module: ${module}`);
        return undefined;
    }
  }

  /**
   * Apply smoothing using one-pole filter
   */
  private smooth(id: string, value: number, alpha: number): number {
    const prev = this.smoothedValues.get(id) ?? value;
    const smoothed = prev + alpha * (value - prev);
    this.smoothedValues.set(id, smoothed);
    return smoothed;
  }

  /**
   * Map value through range and curve
   */
  private mapRange(value: number, range: [number, number], curve: string): number {
    const [min, max] = range;
    
    // Normalize input (assume 0-1)
    let normalized = Math.max(0, Math.min(1, value));
    let curved = normalized;

    switch (curve) {
      case 'exp':
        curved = Math.pow(normalized, 2);
        break;
      case 'log':
        curved = Math.sqrt(normalized);
        break;
      case 'sine':
        curved = Math.sin(normalized * Math.PI * 0.5);
        break;
      case 'linear':
      default:
        curved = normalized;
    }

    return min + curved * (max - min);
  }

  /**
   * Quantize value (for musical parameters)
   */
  private quantize(value: number, mode: string): number {
    if (mode === 'chromatic') {
      return Math.round(value);
    }
    // TODO: Add scale quantization
    return value;
  }

  /**
   * Apply value to target
   */
  private applyToTarget(path: string, value: number): void {
    const callback = this.targetCallbacks.get(path);
    if (callback) {
      callback(value);
    }
  }

  /**
   * Simple cycle detection
   */
  private detectsCycle(mod: FabricModulation): boolean {
    // Basic check: does the target appear in any existing source?
    for (const [, existingMod] of this.routes) {
      if (existingMod.target === mod.source && existingMod.source === mod.target) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all routes
   */
  getRoutes(): FabricModulation[] {
    return Array.from(this.routes.values());
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
    this.smoothedValues.clear();
    this.cycleDetected.clear();
    console.log('[ModMatrix] Cleared all routes');
  }
}

// Global instance
export const modMatrix = new ModMatrix();
