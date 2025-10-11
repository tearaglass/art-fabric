import type { FabricModulation } from '@/state/fabric';

/**
 * Ready-made modulation mapping presets
 * Use {layerId} as placeholder for current layer selection
 */

export const MAPPING_PRESETS: Record<string, FabricModulation[]> = {
  'audio-reactive-shader': [
    {
      id: 'audio-shader-distort',
      source: 'audio.rms',
      target: 'shader.{layerId}.uDistort',
      range: [0.02, 0.35],
      curve: 'sine',
      smooth: 0.18,
      clamp: true,
    },
    {
      id: 'audio-shader-hue',
      source: 'audio.low',
      target: 'shader.{layerId}.uHue',
      range: [-0.1, 0.1],
      curve: 'exp',
      smooth: 0.2,
      clamp: true,
    },
    {
      id: 'audio-shader-scale',
      source: 'audio.high',
      target: 'shader.{layerId}.uScale',
      range: [1.0, 3.0],
      curve: 'exp',
      smooth: 0.15,
      clamp: true,
    },
  ],

  'shader-drives-audio': [
    {
      id: 'shader-audio-filter',
      source: 'shader.{layerId}.brightness',
      target: 'strudel.global.filter.cutoff',
      range: [800, 5200],
      curve: 'exp',
      smooth: 0.25,
      clamp: true,
    },
    {
      id: 'shader-audio-reverb',
      source: 'shader.{layerId}.edge',
      target: 'strudel.global.reverb.size',
      range: [0.1, 0.9],
      curve: 'linear',
      smooth: 0.3,
      clamp: true,
    },
  ],

  'p5-draws-notes': [
    {
      id: 'p5-strudel-note',
      source: 'p5.{layerId}.cursorX',
      target: 'strudel.global.note',
      range: [48, 84],
      curve: 'linear',
      smooth: 0.1,
      quantize: 'chromatic',
      clamp: true,
    },
    {
      id: 'p5-strudel-dur',
      source: 'p5.{layerId}.cursorSpeed',
      target: 'strudel.global.dur',
      range: [0.125, 1],
      curve: 'log',
      smooth: 0.3,
      clamp: true,
    },
  ],

  'macro-to-everything': [
    {
      id: 'macro-a-shader-hue',
      source: 'macro.A',
      target: 'shader.{layerId}.uHue',
      range: [-0.5, 0.5],
      curve: 'linear',
      smooth: 0.05,
      clamp: true,
    },
    {
      id: 'macro-b-p5-flow',
      source: 'macro.B',
      target: 'p5.{layerId}.flow.speed',
      range: [10, 90],
      curve: 'sine',
      smooth: 0.1,
      clamp: true,
    },
    {
      id: 'macro-c-audio-filter',
      source: 'macro.C',
      target: 'strudel.global.filter.cutoff',
      range: [200, 8000],
      curve: 'exp',
      smooth: 0.15,
      clamp: true,
    },
    {
      id: 'macro-d-fx-amount',
      source: 'macro.D',
      target: 'fx.{fxId}.amount',
      range: [0, 1],
      curve: 'linear',
      smooth: 0.1,
      clamp: true,
    },
  ],
};

/**
 * Apply a preset, replacing placeholders with actual IDs
 */
export function applyPreset(
  presetName: keyof typeof MAPPING_PRESETS,
  replacements: Record<string, string> = {}
): FabricModulation[] {
  const preset = MAPPING_PRESETS[presetName];
  if (!preset) {
    console.warn(`[ModPresets] Unknown preset: ${presetName}`);
    return [];
  }

  return preset.map((mod) => ({
    ...mod,
    target: Object.entries(replacements).reduce(
      (target, [placeholder, value]) => target.replace(`{${placeholder}}`, value),
      mod.target
    ),
    source: Object.entries(replacements).reduce(
      (source, [placeholder, value]) => source.replace(`{${placeholder}}`, value),
      mod.source
    ),
  }));
}

export function getPresetNames(): string[] {
  return Object.keys(MAPPING_PRESETS);
}
