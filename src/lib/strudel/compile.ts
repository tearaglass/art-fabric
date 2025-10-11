import { Patch } from '@/types/Patch';

/**
 * Compile a Patch into Strudel code
 */
export function compileStrudel(patch: Patch): string {
  const lines: string[] = [];

  // Global tempo and scale
  lines.push(`cps(${patch.bpm / 60})`);
  lines.push(`scale("${patch.scale.root} ${patch.scale.mode}")`);
  lines.push('');

  // LFOs
  lines.push(`~ lfo1 = slow(${patch.lfo1.rate}).${patch.lfo1.shape}${patch.lfo1.phase > 0 ? `.phase(${patch.lfo1.phase})` : ''}`);
  lines.push(`~ lfo2 = slow(${patch.lfo2.rate}).${patch.lfo2.shape}${patch.lfo2.phase > 0 ? `.phase(${patch.lfo2.phase})` : ''}`);
  
  // Filter envelope
  const { a, d, s, r } = patch.filtenv;
  lines.push(`~ envf = env(${a},${d},${s},${r})`);

  // Route modulators
  const routesByDst: Record<string, string[]> = {};
  patch.routes.forEach((route) => {
    if (!routesByDst[route.dst]) routesByDst[route.dst] = [];
    const srcVar = route.src === 'LFO1' ? 'lfo1' : route.src === 'LFO2' ? 'lfo2' : 'envf';
    routesByDst[route.dst].push(`${srcVar} * ${route.amt}`);
  });

  // Generate route helpers
  Object.entries(routesByDst).forEach(([dst, sources], idx) => {
    const min = dst === 'cutoff' ? 900 : dst === 'pan' ? -0.3 : 0;
    const max = dst === 'cutoff' ? 2400 : dst === 'pan' ? 0.3 : 1;
    lines.push(`~ mod_${dst}_${idx} = lmap(${min}, ${max}, ${sources.join(' + ')})`);
  });

  lines.push('');

  // Pattern source (prefer hotspot arp)
  const pattern = patch.__hotspot?.arp || generatePatternFromSteps(patch.steps);

  // Oscillators
  lines.push(`~ oscA = s("${patch.osc1.wave}").n("${pattern}").detune(${patch.osc1.detune}).gain(${patch.osc1.gain.toFixed(2)})`);
  lines.push(`~ oscB = s("${patch.osc2.wave}").n("${pattern}").detune(${patch.osc2.detune}).gain(${patch.osc2.gain.toFixed(2)})`);
  lines.push(`~ sub  = s("sine").n("${pattern}").octave(${patch.octave - 1}).gain(${patch.subGain.toFixed(2)})`);
  lines.push(`~ noi  = s("noise").n("${pattern}").gain(${patch.noiseGain.toFixed(2)})`);
  lines.push(`~ mixed = (oscA*(1-${patch.wavemix.toFixed(2)}) + oscB*${patch.wavemix.toFixed(2)})`);
  lines.push('');

  // Voice chain with FX
  const cutoffBase = patch.cutoff;
  const cutoffMod = routesByDst.cutoff ? ` + (mod_cutoff_0 - ${cutoffBase})` : '';
  const panMod = routesByDst.pan ? ` + mod_pan_1` : '';
  const resoMod = routesByDst.reso ? ` + mod_reso_0` : '';

  // Macro mappings
  const toneMod = patch.macros.Tone * 800; // boost cutoff
  const spaceMod = Math.min(0.7, patch.fx.room + patch.macros.Space * 0.3);
  const moveMod = patch.fx.chorus + patch.macros.Movement * 0.3;
  const gritDrive = Math.min(0.6, patch.drive + patch.macros.Grit * 0.4);
  const gritCrush = Math.min(0.6, patch.fx.crush + patch.macros.Grit * 0.3);

  lines.push('withFX(');
  lines.push('  (mixed | sub | noi)');
  lines.push(`    .glide(${patch.glide.toFixed(3)})`);
  lines.push(`    .pan(${patch.pan}${panMod})`);
  lines.push(`    .adsr(${patch.amp.a},${patch.amp.d},${patch.amp.s},${patch.amp.r})`);
  
  const filtEnvAmt = patch.filtenv.amt * 2800;
  lines.push(`    .${patch.ftype}( (${cutoffBase + toneMod} + envf*${filtEnvAmt})${cutoffMod}, ${patch.reso}${resoMod})`);
  
  lines.push(`    .gain(1)`);
  lines.push(`    .fast(${patch.density})`);
  lines.push(`    .swing(${patch.swing.toFixed(2)})`);
  lines.push(')');
  lines.push('where');
  lines.push('  withFX = _ => _');
  lines.push(`    .drive(${gritDrive.toFixed(2)})`);
  lines.push(`    .room(${spaceMod.toFixed(2)})`);
  lines.push(`    .delay(${patch.fx.delay.toFixed(2)})`);
  lines.push(`    .crush(${gritCrush.toFixed(2)})`);
  lines.push(`    .chorus(${moveMod.toFixed(2)})`);

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
