import JSZip from 'jszip';
import { Patch } from '@/types/Patch';
import { compileStrudel } from '../strudel/compile';
import { encodeMidi, MidiNote } from '../midi/MidiEncoder';

export interface PerformanceBundle {
  patch: Patch;
  pattern: string;
  code: string;
  midi?: Uint8Array;
  viz?: string; // base64 PNG
  gesturePath?: Array<{ x: number; y: number; t: number }>;
  checksums: Record<string, string>;
  meta: {
    seed: string;
    version: string;
    createdAt: string;
    bpm: number;
    root: string;
    mode: string;
  };
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function exportPerformanceBundle(
  patch: Patch,
  gesturePath?: Array<{ x: number; y: number; t: number }>,
  vizCanvas?: HTMLCanvasElement
): Promise<Blob> {
  const zip = new JSZip();

  // Generate code
  const code = compileStrudel(patch);
  const pattern = patch.__hotspot?.arp || 'c3 ~ e3 g3 ~ c3 ~ e3 g3';

  // Generate MIDI if pattern exists
  let midiBytes: Uint8Array | undefined;
  if (pattern) {
    const cells = pattern.split(/\s+/);
    const notes: MidiNote[] = [];
    const PPQ = 480;
    const sixteenthTicks = PPQ / 4;

    const rootOffset = { c: 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11 }[patch.scale.root] || 0;
    const baseNote = 12 * (patch.octave + 1) + rootOffset;

    cells.forEach((cell, i) => {
      if (cell === '~') return;
      notes.push({
        pitch: baseNote,
        velocity: 95,
        start: i * sixteenthTicks,
        duration: Math.floor(sixteenthTicks * 0.95),
      });
    });

    midiBytes = encodeMidi(notes, patch.bpm);
  }

  // Get viz PNG
  let vizB64: string | undefined;
  if (vizCanvas) {
    vizB64 = vizCanvas.toDataURL('image/png');
  }

  // Build checksums
  const checksums: Record<string, string> = {};
  const patchJson = JSON.stringify(patch, null, 2);
  checksums['patch.json'] = await sha256(patchJson);
  checksums['pattern.txt'] = await sha256(pattern);
  checksums['code.txt'] = await sha256(code);
  if (midiBytes) checksums['midi.mid'] = await sha256(new TextDecoder().decode(midiBytes));
  if (gesturePath) checksums['gesturePath.json'] = await sha256(JSON.stringify(gesturePath));

  // Metadata
  const meta = {
    seed: `perf-${Date.now()}`,
    version: 'LaneyGen v1.0',
    createdAt: new Date().toISOString(),
    bpm: patch.bpm,
    root: patch.scale.root,
    mode: patch.scale.mode,
  };

  // Add files to ZIP
  zip.file('patch.json', patchJson);
  zip.file('pattern.txt', pattern);
  zip.file('code.txt', code);
  if (midiBytes) zip.file('midi.mid', new Uint8Array(midiBytes));
  if (vizB64) {
    const vizData = vizB64.split(',')[1];
    zip.file('viz.png', vizData, { base64: true });
  }
  if (gesturePath) zip.file('gesturePath.json', JSON.stringify(gesturePath, null, 2));
  zip.file('checksums.json', JSON.stringify(checksums, null, 2));
  zip.file('meta.json', JSON.stringify(meta, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}
