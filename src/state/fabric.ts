import { ulid } from 'ulid';

export interface FabricLayer {
  id: string; // ulid() for stable IDs
  kind: 'shader' | 'p5' | 'image' | 'video' | 'strudel-vis';
  src: string; // procedural reference or data URL
  params: Record<string, any>;
  blendMode: string;
  opacity: number;
  visible: boolean;
  colorspace?: 'srgb' | 'display-p3';
  timebase?: 'ticks' | 'seconds';
}

export interface FabricAudioLane {
  code: string;
  volume: number;
  mute: boolean;
  solo: boolean;
}

export interface FabricModulation {
  id: string;
  source: string; // "audio.rms" | "macro.A" | "shader.brightness" | "p5.cursor.x"
  target: string; // "shader.{layerId}.uScale" | "strudel.global.filter.cutoff"
  range: [number, number];
  curve: 'linear' | 'exp' | 'log' | 'sine';
  smooth: number; // 0-1, one-pole filter α
  quantize?: string; // 'chromatic' | 'scale' for MIDI notes
  clamp?: boolean; // prevent out-of-range values
  default?: number; // fallback when source unavailable
}

export interface FabricMeta {
  name: string;
  author?: string;
  createdAt: string;
}

export interface Fabric {
  version: string; // semver for migration
  meta: FabricMeta;
  seed: string;
  bpm: number;
  macros: { A: number; B: number; C: number; D: number };
  layers: FabricLayer[];
  audio: {
    lanes: Record<'A' | 'B' | 'C' | 'D', FabricAudioLane>;
  };
  fx: Array<{ id: string; type: string; params: Record<string, any> }>;
  modulations: FabricModulation[];
}

// Factory functions
export function createEmptyFabric(): Fabric {
  return {
    version: '1.0.0',
    meta: {
      name: 'Untitled Project',
      createdAt: new Date().toISOString(),
    },
    seed: ulid(),
    bpm: 120,
    macros: { A: 0.5, B: 0.5, C: 0.5, D: 0.5 },
    layers: [],
    audio: {
      lanes: {
        A: { code: '', volume: 0.8, mute: false, solo: false },
        B: { code: '', volume: 0.8, mute: false, solo: false },
        C: { code: '', volume: 0.8, mute: false, solo: false },
        D: { code: '', volume: 0.8, mute: false, solo: false },
      },
    },
    fx: [],
    modulations: [],
  };
}

export function createLayer(kind: FabricLayer['kind'], src: string): FabricLayer {
  return {
    id: ulid(),
    kind,
    src,
    params: {},
    blendMode: 'normal',
    opacity: 1,
    visible: true,
  };
}

export function createModulation(
  source: string,
  target: string,
  range: [number, number] = [0, 1]
): FabricModulation {
  return {
    id: ulid(),
    source,
    target,
    range,
    curve: 'linear',
    smooth: 0.2,
    clamp: true,
  };
}

// Persistence
export function saveFabric(fabric: Fabric): string {
  return JSON.stringify(fabric, null, 2);
}

export function loadFabric(json: string): Fabric {
  const data = JSON.parse(json);
  return migrateFabric(data);
}

export function exportFabric(fabric: Fabric, filename?: string): void {
  const json = saveFabric(fabric);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${fabric.meta.name}.fabric`;
  a.click();
  URL.revokeObjectURL(url);
}

// Migration
function migrateFabric(data: any): Fabric {
  // Handle version migrations here
  if (!data.version || data.version === '0.9') {
    // Upgrade from old format
    console.log('[Fabric] Migrating from v0.9 to v1.0');
    // Add migration logic as needed
  }
  return data as Fabric;
}

// Local storage
const AUTOSAVE_KEY = 'laneygen:autosave.fabric';

export function autoSaveFabric(fabric: Fabric): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, saveFabric(fabric));
  } catch (error) {
    console.warn('[Fabric] Autosave failed:', error);
  }
}

export function loadAutoSave(): Fabric | null {
  try {
    const json = localStorage.getItem(AUTOSAVE_KEY);
    return json ? loadFabric(json) : null;
  } catch (error) {
    console.warn('[Fabric] Load autosave failed:', error);
    return null;
  }
}

export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}
