// Default sample map and registry for Strudel
export const DEFAULT_SAMPLE_MAP_URL = 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/samples.json';

export interface SampleMap {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const SAMPLE_MAPS: SampleMap[] = [
  {
    id: 'default',
    name: 'Default (Dirt Samples)',
    description: 'Classic TidalCycles drum samples (bd, sd, hh, cp, etc.)',
    url: DEFAULT_SAMPLE_MAP_URL,
  },
  {
    id: 'vcsl',
    name: 'VCSL',
    description: 'Vintage drum machines and synths',
    url: 'https://raw.githubusercontent.com/ritchse/strudel-vcsl/main/samples.json',
  },
  {
    id: 'earthsounds',
    name: 'EarthSounds',
    description: 'Field recordings and nature sounds',
    url: 'https://raw.githubusercontent.com/earthsounds/strudel-earthsounds/main/samples.json',
  },
];
