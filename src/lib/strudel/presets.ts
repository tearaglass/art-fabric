export interface StrudelPreset {
  id: string;
  name: string;
  description: string;
  code: string;
  bpm: number;
  category: 'drums' | 'melody' | 'bass' | 'ambient' | 'experimental';
}

export const STRUDEL_PRESETS: StrudelPreset[] = [
  {
    id: 'basic_kick',
    name: 'Basic Kick',
    description: '4/4 kick drum pattern',
    code: 's("bd*4")',
    bpm: 120,
    category: 'drums'
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    description: 'Classic breakbeat groove',
    code: 's("[bd sd, hh*8]").fast(1)',
    bpm: 140,
    category: 'drums'
  },
  {
    id: 'techno_pattern',
    name: 'Techno Pattern',
    description: 'Driving techno rhythm',
    code: 'stack(s("bd*4"), s("~ sd ~ sd"), s("hh*8").gain(0.4))',
    bpm: 130,
    category: 'drums'
  },
  {
    id: 'euclidean',
    name: 'Euclidean Rhythm',
    description: 'Euclidean algorithm pattern',
    code: 's("bd(5,8), sd(3,8,1), hh(7,8,2)").fast(2)',
    bpm: 120,
    category: 'drums'
  },
  {
    id: 'melodic_sequence',
    name: 'Melodic Sequence',
    description: 'Simple melodic pattern',
    code: 'note("c3 e3 g3 c4").s("sawtooth").lpf(1000)',
    bpm: 100,
    category: 'melody'
  },
  {
    id: 'arp',
    name: 'Arpeggiator',
    description: 'Arpeggiated chord progression',
    code: 'note("<[c e g b] [d f a c] [e g b d]>").s("triangle").fast(4)',
    bpm: 120,
    category: 'melody'
  },
  {
    id: 'pentatonic',
    name: 'Pentatonic Scale',
    description: 'Pentatonic melody generator',
    code: 'note("0 2 4 5 7".scale("C:minor")).s("piano").slow(2)',
    bpm: 90,
    category: 'melody'
  },
  {
    id: 'bass_line',
    name: 'Bass Line',
    description: 'Driving bassline',
    code: 'note("c2 c2 [~ g1] [~ c2]").s("sawtooth").lpf(300)',
    bpm: 128,
    category: 'bass'
  },
  {
    id: 'sub_bass',
    name: 'Sub Bass',
    description: 'Deep sub bass pattern',
    code: 'note("c1 ~ ~ ~ c1 ~ g1 ~").s("sine").gain(1.2)',
    bpm: 140,
    category: 'bass'
  },
  {
    id: 'ambient_pad',
    name: 'Ambient Pad',
    description: 'Atmospheric pad texture',
    code: 'note("<c3 eb3 g3 bb3>").s("sawtooth").lpf(500).slow(4).room(0.9)',
    bpm: 60,
    category: 'ambient'
  },
  {
    id: 'field_recording',
    name: 'Textural Loop',
    description: 'Evolving texture',
    code: 's("birds*4").slow(2).sometimes(rev).gain(0.6)',
    bpm: 80,
    category: 'ambient'
  },
  {
    id: 'glitch',
    name: 'Glitch Pattern',
    description: 'Glitchy, stuttering rhythm',
    code: 's("bd sd").sometimes(fast(2)).sometimes(slow(2)).degradeBy(0.3)',
    bpm: 160,
    category: 'experimental'
  },
  {
    id: 'polyrhythm',
    name: 'Polyrhythm',
    description: 'Overlapping rhythms',
    code: 'stack(s("bd").fast(3), s("sd").fast(4), s("hh").fast(5))',
    bpm: 100,
    category: 'experimental'
  },
  {
    id: 'generative',
    name: 'Generative Pattern',
    description: 'Self-evolving pattern',
    code: 'note("c d e f g a b".choose()).s("piano").struct("x x ~ x ~ x ~ ~")',
    bpm: 110,
    category: 'experimental'
  },
  {
    id: 'sample_chop',
    name: 'Sample Chopping',
    description: 'Chopped sample manipulation',
    code: 's("breaks165*8").chop(8).sometimes(rev)',
    bpm: 165,
    category: 'drums'
  }
];

export const MINI_NOTATION_EXAMPLES = [
  {
    title: 'Sequences',
    examples: [
      { code: 's("bd sd bd sd")', description: 'Simple sequence' },
      { code: 's("bd*4")', description: 'Repeat 4 times' },
      { code: 's("bd/2")', description: 'Play every 2nd cycle' },
    ]
  },
  {
    title: 'Polyphony',
    examples: [
      { code: 's("[bd sd, hh*4]")', description: 'Stack patterns' },
      { code: 's("bd, sd")', description: 'Parallel patterns' },
    ]
  },
  {
    title: 'Transformations',
    examples: [
      { code: 's("bd sd").fast(2)', description: 'Speed up 2x' },
      { code: 's("bd sd").slow(2)', description: 'Slow down 2x' },
      { code: 's("bd sd").rev()', description: 'Reverse' },
    ]
  },
  {
    title: 'Effects',
    examples: [
      { code: 's("bd").gain(0.8)', description: 'Volume control' },
      { code: 's("bd").lpf(800)', description: 'Low-pass filter' },
      { code: 's("bd").room(0.5)', description: 'Reverb' },
      { code: 's("bd").delay(0.25)', description: 'Delay effect' },
    ]
  }
];
