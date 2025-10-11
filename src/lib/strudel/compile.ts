import { Patch } from '@/types/Patch';

/**
 * Compile a Patch into Strudel code
 */
export function compileStrudel(patch: Patch): string {
  const lines: string[] = [];

  // Set global tempo
  lines.push(`cps(${(patch.bpm / 60).toFixed(2)})`);
  lines.push('');

  // Generate note pattern from steps
  const pattern = patch.__hotspot?.arp || generatePatternFromSteps(patch.steps);
  
  // Map wave shapes to Strudel sound names
  const soundMap: Record<string, string> = {
    sine: 'sine',
    sawtooth: 'sawtooth',
    square: 'square',
    triangle: 'triangle'
  };
  
  const sound1 = soundMap[patch.osc1.wave] || 'sawtooth';
  const sound2 = soundMap[patch.osc2.wave] || 'square';
  
  // Build main pattern with wavemix between oscillators
  const wavemix = patch.wavemix;
  const mainGain = 0.6;
  
  lines.push(`note("${pattern}")`);
  lines.push(`  .sound("${sound1}:${sound2}")`);
  lines.push(`  .gain("${(1 - wavemix).toFixed(2)} ${wavemix.toFixed(2)}")`);
  
  // Add sub oscillator if gain > 0
  if (patch.subGain > 0.01) {
    lines.push(`  .add(note("${pattern}").sound("sine").octave(-1).gain(${patch.subGain.toFixed(2)}))`);
  }
  
  // Add noise if gain > 0
  if (patch.noiseGain > 0.01) {
    lines.push(`  .add(sound("white").gain(${patch.noiseGain.toFixed(2)}))`);
  }
  
  // Apply filter with modulation
  const filterMethod = patch.ftype === 'lp' ? 'lpf' : patch.ftype === 'hp' ? 'hpf' : 'bpf';
  const baseCutoff = patch.cutoff + (patch.macros.Tone * 800);
  
  // Build cutoff modulation
  const lfo1Route = patch.routes.find(r => r.src === 'LFO1' && r.dst === 'cutoff');
  const lfo2Route = patch.routes.find(r => r.src === 'LFO2' && r.dst === 'cutoff');
  
  let cutoffLine = `  .${filterMethod}(${baseCutoff.toFixed(0)}`;
  
  if (lfo1Route && lfo1Route.amt > 0.01) {
    const lfoShape = patch.lfo1.shape === 'sine' ? 'sine' : patch.lfo1.shape === 'saw' ? 'saw' : 'tri';
    const lfoMin = baseCutoff - (lfo1Route.amt * 1000);
    const lfoMax = baseCutoff + (lfo1Route.amt * 1000);
    cutoffLine = `  .${filterMethod}(${lfoShape}.slow(${patch.lfo1.rate}).range(${lfoMin.toFixed(0)}, ${lfoMax.toFixed(0)})`;
  } else if (lfo2Route && lfo2Route.amt > 0.01) {
    const lfoShape = patch.lfo2.shape === 'sine' ? 'sine' : patch.lfo2.shape === 'saw' ? 'saw' : 'tri';
    const lfoMin = baseCutoff - (lfo2Route.amt * 1000);
    const lfoMax = baseCutoff + (lfo2Route.amt * 1000);
    cutoffLine = `  .${filterMethod}(${lfoShape}.slow(${patch.lfo2.rate}).range(${lfoMin.toFixed(0)}, ${lfoMax.toFixed(0)})`;
  }
  
  lines.push(`${cutoffLine})`);
  lines.push(`  .resonance(${patch.reso.toFixed(2)})`);
  
  // Pan modulation
  const panRoute = patch.routes.find(r => (r.src === 'LFO1' || r.src === 'LFO2') && r.dst === 'pan');
  if (panRoute && panRoute.amt > 0.01) {
    const lfo = panRoute.src === 'LFO1' ? patch.lfo1 : patch.lfo2;
    const lfoShape = lfo.shape === 'sine' ? 'sine' : lfo.shape === 'saw' ? 'saw' : 'tri';
    lines.push(`  .pan(${lfoShape}.slow(${lfo.rate}).range(-${panRoute.amt.toFixed(2)}, ${panRoute.amt.toFixed(2)}))`);
  } else {
    lines.push(`  .pan(${patch.pan.toFixed(2)})`);
  }
  
  // Envelope
  lines.push(`  .adsr(${patch.amp.a}:${patch.amp.d}:${patch.amp.s}:${patch.amp.r})`);
  
  // Glide
  if (patch.glide > 0.01) {
    lines.push(`  .glide(${patch.glide.toFixed(3)})`);
  }
  
  // Effects chain
  const gritDrive = Math.min(0.6, patch.drive + patch.macros.Grit * 0.4);
  const spaceMod = Math.min(0.7, patch.fx.room + patch.macros.Space * 0.3);
  const moveMod = Math.min(0.6, patch.fx.chorus + patch.macros.Movement * 0.3);
  const gritCrush = Math.min(8, patch.fx.crush * 8 + patch.macros.Grit * 4);
  
  if (gritDrive > 0.01) {
    lines.push(`  .distort(${gritDrive.toFixed(2)})`);
  }
  
  if (spaceMod > 0.01) {
    lines.push(`  .room(${spaceMod.toFixed(2)})`);
  }
  
  if (patch.fx.delay > 0.01) {
    lines.push(`  .delay(${patch.fx.delay.toFixed(2)})`);
  }
  
  if (gritCrush > 0.5) {
    lines.push(`  .crush(${gritCrush.toFixed(1)})`);
  }
  
  if (moveMod > 0.01) {
    lines.push(`  .phaser(${moveMod.toFixed(2)})`);
  }
  
  // Density and swing
  if (patch.density !== 1) {
    lines.push(`  .fast(${patch.density})`);
  }
  
  if (patch.swing > 0.01) {
    lines.push(`  .swing(${patch.swing.toFixed(2)})`);
  }
  
  // Final gain
  lines.push(`  .gain(${mainGain.toFixed(2)})`);

  return lines.join('\n');
}

function generatePatternFromSteps(steps: Patch['steps']): string {
  const cells: string[] = [];
  
  steps.forEach((step) => {
    if (!step.on) {
      cells.push('~');
      return;
    }
    
    const note = 'c3'; // base note (will be quantized by scale())
    const ratchet = step.ratchets > 1 ? `*${step.ratchets}` : '';
    cells.push(`${note}${ratchet}`);
  });

  return cells.join(' ');
}
