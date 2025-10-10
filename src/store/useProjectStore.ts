import { create } from 'zustand';
import seedrandom from 'seedrandom';

export interface Trait {
  id: string;
  name: string;
  imageSrc: string;
  weight: number;
  className: string;
}

export interface TraitClass {
  id: string;
  name: string;
  zIndex: number;
  traits: Trait[];
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
  
  // Actions
  setProjectName: (name: string) => void;
  addTraitClass: (traitClass: TraitClass) => void;
  updateTraitClass: (id: string, updates: Partial<TraitClass>) => void;
  removeTraitClass: (id: string) => void;
  addTrait: (classId: string, trait: Trait) => void;
  updateTrait: (classId: string, traitId: string, updates: Partial<Trait>) => void;
  removeTrait: (classId: string, traitId: string) => void;
  addRule: (rule: Rule) => void;
  removeRule: (id: string) => void;
  addFXConfig: (fx: FXConfig) => void;
  updateFXConfig: (id: string, updates: Partial<FXConfig>) => void;
  removeFXConfig: (id: string) => void;
  setSeed: (seed: string) => void;
  setCollectionSize: (size: number) => void;
  saveProject: () => string;
  loadProject: (json: string) => void;
  resetProject: () => void;
}

const initialState = {
  projectName: 'Untitled Collection',
  traitClasses: [],
  rules: [],
  fxConfigs: [],
  seed: 'laney-' + Date.now(),
  collectionSize: 100,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setProjectName: (name) => set({ projectName: name }),

  addTraitClass: (traitClass) =>
    set((state) => ({
      traitClasses: [...state.traitClasses, traitClass],
    })),

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

  addTrait: (classId, trait) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId ? { ...tc, traits: [...tc.traits, trait] } : tc
      ),
    })),

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

  removeTrait: (classId, traitId) =>
    set((state) => ({
      traitClasses: state.traitClasses.map((tc) =>
        tc.id === classId
          ? { ...tc, traits: tc.traits.filter((t) => t.id !== traitId) }
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

  setSeed: (seed) => set({ seed }),

  setCollectionSize: (size) => set({ collectionSize: size }),

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
      set({
        projectName: data.projectName || initialState.projectName,
        traitClasses: data.traitClasses || [],
        rules: data.rules || [],
        fxConfigs: data.fxConfigs || [],
        seed: data.seed || initialState.seed,
        collectionSize: data.collectionSize || initialState.collectionSize,
      });
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  },

  resetProject: () => set(initialState),
}));
