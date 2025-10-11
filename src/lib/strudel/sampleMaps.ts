// Default sample map and registry for Strudel
export const DEFAULT_SAMPLE_MAP_URL = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/EmuSP12.json';

export interface SampleMap {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const SAMPLE_MAPS: SampleMap[] = [
  {
    id: 'default',
    name: 'Default (EmuSP12)',
    description: 'Classic TidalCycles drum samples (bd, sd, hh, cp, etc.)',
    url: DEFAULT_SAMPLE_MAP_URL,
  },
  {
    id: 'dirt',
    name: 'Dirt Samples',
    description: 'Complete Dirt sample collection',
    url: 'https://raw.githubusercontent.com/felixroos/dough-samples/main/Dirt-Samples.json',
  },
  {
    id: 'drums',
    name: 'Drum Machines',
    description: 'Classic drum machine samples',
    url: 'https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json',
  },
  {
    id: 'piano',
    name: 'Piano',
    description: 'Piano samples',
    url: 'https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json',
  },
];
