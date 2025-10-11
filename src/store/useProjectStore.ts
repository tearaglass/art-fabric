import { create } from 'zustand';
import seedrandom from 'seedrandom';
import { eventBus } from '@/lib/events/EventBus';

export interface Trait {
  id: string;
  name: string;
  imageSrc: string;
  weight: number;
  className: string;
  folderId?: string;
}

export interface TraitFolder {
  id: string;
  name: string;
}

export interface TraitClass {
  id: string;
  name: string;
  zIndex: number;
  traits: Trait[];
  folders: TraitFolder[];
}

export interface Rule {
  id: string;
  type: 'require' | 'exclude' | 'mutex';
  condition: string;
  target: string;
}

export interface FXConfig {
  id: string;
  name: string;
  type: 'crt' | 'halftone' | 'glitch';
  enabled: boolean;
  params: Record<string, number>;
}

export interface ProjectState {
  projectName: string;
  traitClasses: TraitClass[];
  rules: Rule[];
  fxConfigs: FXConfig[];
  seed: string;
  collectionSize: number;
  powerUserMode: boolean;
  
  // Actions
  setProjectName: (name: string) => void;
  addTraitClass: (traitClass: TraitClass) => void;
  updateTraitClass: (id: string, updates: Partial<TraitClass>) => void;
  removeTraitClass: (id: string) => void;
  addTrait: (classId: string, trait: Trait) => void;
  updateTrait: (classId: string, traitId: string, updates: Partial<Trait>) => void;
  removeTrait: (classId: string, traitId: string) => void;
  addFolder: (classId: string, folder: TraitFolder) => void;
  removeFolder: (classId: string, folderId: string) => void;
  addRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
  addFXConfig: (fx: FXConfig) => void;
  updateFXConfig: (id: string, updates: Partial<FXConfig>) => void;
  removeFXConfig: (id: string) => void;
  setSeed: (seed: string) => void;
  setCollectionSize: (size: number) => void;
  setPowerUserMode: (enabled: boolean) => void;
  saveProject: () => string;
  loadProject: (json: string) => void;
  resetProject: () => void;
}

const initialState = {
  projectName: 'Sample Generative Collection',
  traitClasses: [
    {
      id: 'bg-class',
      name: 'Background',
      zIndex: 1,
      folders: [],
      traits: [
        {
          id: 'bg-1',
          name: 'Perlin Noise',
          imageSrc: 'webgl:perlin_noise:{"scale":2.5,"octaves":4,"speed":0.3}',
          weight: 30,
          className: 'Background'
        },
        {
          id: 'bg-2',
          name: 'Gradient Flow',
          imageSrc: 'webgl:gradient:{"color1":[0.2,0.4,0.8],"color2":[0.8,0.2,0.4],"angle":45}',
          weight: 25,
          className: 'Background'
        },
        {
          id: 'bg-3',
          name: 'Circle Pack',
          imageSrc: 'p5:circle_pack:{"count":50,"minRadius":5,"maxRadius":40,"colorMode":"vibrant"}',
          weight: 25,
          className: 'Background'
        },
        {
          id: 'bg-4',
          name: 'Voronoi Cells',
          imageSrc: 'webgl:voronoi:{"points":20,"colorScheme":"plasma","animate":true}',
          weight: 20,
          className: 'Background'
        }
      ]
    },
    {
      id: 'char-class',
      name: 'Character',
      zIndex: 2,
      folders: [],
      traits: [
        {
          id: 'char-1',
          name: 'Cyberpunk Cat',
          imageSrc: 'sd:{"graphId":"portrait_nft","prompt":"cyberpunk cat with neon eyes","seed":12345,"params":{}}',
          weight: 20,
          className: 'Character'
        },
        {
          id: 'char-2',
          name: 'Abstract Form',
          imageSrc: 'p5:flow_field:{"particles":1000,"noiseScale":0.01,"strokeWeight":2,"palette":"monochrome"}',
          weight: 30,
          className: 'Character'
        },
        {
          id: 'char-3',
          name: 'Geometric Being',
          imageSrc: 'p5:chromatic_aberration:{"shapes":"triangles","count":30,"symmetry":true}',
          weight: 25,
          className: 'Character'
        },
        {
          id: 'char-4',
          name: 'AI Portrait',
          imageSrc: 'sd:{"graphId":"portrait_nft","prompt":"futuristic robot portrait","seed":67890,"params":{}}',
          weight: 25,
          className: 'Character'
        }
      ]
    },
    {
      id: 'fx-class',
      name: 'Effects',
      zIndex: 3,
      folders: [],
      traits: [
        {
          id: 'fx-1',
          name: 'Halftone',
          imageSrc: 'webgl:halftone:{"dotSize":4,"angle":22.5,"contrast":1.2}',
          weight: 25,
          className: 'Effects'
        },
        {
          id: 'fx-2',
          name: 'CRT Scanlines',
          imageSrc: 'webgl:scanlines:{"lineWidth":2,"brightness":1.1,"distortion":0.1}',
          weight: 25,
          className: 'Effects'
        },
        {
          id: 'fx-3',
          name: 'Grid Overlay',
          imageSrc: 'webgl:grid:{"spacing":20,"lineWidth":1,"color":[1,1,1],"opacity":0.3}',
          weight: 30,
          className: 'Effects'
        },
        {
          id: 'fx-4',
          name: 'None',
          imageSrc: '',
          weight: 20,
          className: 'Effects'
        }
      ]
    },
    {
      id: 'audio-class',
      name: 'Audio',
      zIndex: 4,
      folders: [],
      traits: [
        {
          id: 'audio-1',
          name: 'Breakbeat',
          imageSrc: 'strudel:breakbeat:{"tempo":120,"pattern":"[bd sd, hh]*4"}',
          weight: 30,
          className: 'Audio'
        },
        {
          id: 'audio-2',
          name: 'Ambient',
          imageSrc: 'strudel:ambient:{"tempo":80,"pattern":"<c3 e3 g3 b3>.slow(4)"}',
          weight: 25,
          className: 'Audio'
        },
        {
          id: 'audio-3',
          name: 'Techno',
          imageSrc: 'strudel:techno:{"tempo":140,"pattern":"bd*4, [~ sd]*2"}',
          weight: 25,
          className: 'Audio'
        },
        {
          id: 'audio-4',
          name: 'Silent',
          imageSrc: '',
          weight: 20,
          className: 'Audio'
        }
      ]
    }
  ],
  rules: [
    {
      id: 'rule-1',
      type: 'require' as const,
      condition: 'bg-1',
      target: 'char-2'
    },
    {
      id: 'rule-2',
      type: 'exclude' as const,
      condition: 'char-1',
      target: 'fx-2'
    },
    {
      id: 'rule-3',
      type: 'mutex' as const,
      condition: 'audio-1',
      target: 'audio-2'
    }
  ],
  fxConfigs: [
    {
      id: 'fx-crt',
      name: 'CRT Effect',
      type: 'crt' as const,
      enabled: false,
      params: {
        lineWidth: 2,
        brightness: 1.1,
        distortion: 0.1
      }
    },
    {
      id: 'fx-halftone',
      name: 'Halftone',
      type: 'halftone' as const,
      enabled: false,
      params: {
        dotSize: 4,
        angle: 22.5,
        contrast: 1.2
      }
    },
    {
      id: 'fx-glitch',
      name: 'Glitch',
      type: 'glitch' as const,
      enabled: false,
      params: {
        intensity: 0.5,
        frequency: 0.1
      }
    }
  ],
  seed: 'sample-' + Date.now(),
  collectionSize: 100,
  powerUserMode: false,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setProjectName: (name) => {
    set({ projectName: name });
    eventBus.emit('project/saved', { name, timestamp: Date.now() });
  },

  addTraitClass: (traitClass) => {
    set((state) => ({
      traitClasses: [...state.traitClasses, traitClass],
    }));
    eventBus.emit('assets/added', {
      className: traitClass.name,
      traitName: 'class',
      source: 'manual',
    });
  },

  updateTraitClass: (id, updates) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === id ? { ...tc, ...updates } : tc
      ),
    })),

  removeTraitClass: (id) =>
    set((state) => ({
      traitClasses: state.traitClasses.filter((tc) => tc.id !== id),
    })),

  addTrait: (classId, trait) => {
    const traitClass = get().traitClasses.find((tc) => tc.id === classId);
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId ? { ...tc, traits: [...tc.traits, trait] } : tc
      ),
    }));
    if (traitClass) {
      eventBus.emit('assets/added', {
        className: traitClass.name,
        traitName: trait.name,
        source: trait.imageSrc || 'unknown',
      });
    }
  },

  updateTrait: (classId, traitId, updates) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId
          ? {
              ...tc,
              traits: tc.traits.map((t) =>
                t.id === traitId ? { ...t, ...updates } : t
              ),
            }
          : tc
      ),
    })),

  removeTrait: (classId, traitId) => {
    const traitClass = get().traitClasses.find((tc) => tc.id === classId);
    const trait = traitClass?.traits.find((t) => t.id === traitId);
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId
          ? { ...tc, traits: tc.traits.filter((t) => t.id !== traitId) }
          : tc
      ),
    }));
    if (traitClass && trait) {
      eventBus.emit('assets/removed', {
        className: traitClass.name,
        traitName: trait.name,
      });
    }
  },

  addFolder: (classId, folder) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId
          ? { ...tc, folders: [...tc.folders, folder] }
          : tc
      ),
    })),

  removeFolder: (classId, folderId) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId
          ? { 
              ...tc, 
              folders: tc.folders.filter((f) => f.id !== folderId),
              traits: tc.traits.map((t) => 
                t.folderId === folderId ? { ...t, folderId: undefined } : t
              )
            }
          : tc
      ),
    })),

  addRule: (rule) =>
    set((state) => ({
      rules: [...state.rules, rule],
    })),

  removeRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
    })),

  addFXConfig: (fx) =>
    set((state) => ({
      fxConfigs: [...state.fxConfigs, fx],
    })),

  updateFXConfig: (id, updates) =>
    set((state) => ({
      fxConfigs: state.fxConfigs.map((fx) =>
        fx.id === id ? { ...fx, ...updates } : fx
      ),
    })),

  removeFXConfig: (id) =>
    set((state) => ({
      fxConfigs: state.fxConfigs.filter((fx) => fx.id !== id),
    })),

  setSeed: (seed) => {
    const oldSeed = get().seed;
    set({ seed });
    eventBus.emit('rng/seedChanged', { oldSeed, newSeed: seed });
  },

  setCollectionSize: (size) => set({ collectionSize: size }),

  setPowerUserMode: (enabled) => set({ powerUserMode: enabled }),

  saveProject: () => {
    const state = get();
    const projectData = {
      projectName: state.projectName,
      traitClasses: state.traitClasses,
      rules: state.rules,
      fxConfigs: state.fxConfigs,
      seed: state.seed,
      collectionSize: state.collectionSize,
      version: '1.0',
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(projectData, null, 2);
  },

  loadProject: (json) => {
    try {
      const data = JSON.parse(json);
      const projectName = data.projectName || initialState.projectName;
      set({
        projectName,
        traitClasses: data.traitClasses || [],
        rules: data.rules || [],
        fxConfigs: data.fxConfigs || [],
        seed: data.seed || initialState.seed,
        collectionSize: data.collectionSize || initialState.collectionSize,
      });
      eventBus.emit('project/loaded', { name: projectName, timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  },

  resetProject: () => {
    set(initialState);
    eventBus.emit('project/reset', { timestamp: Date.now() });
  },
}));
