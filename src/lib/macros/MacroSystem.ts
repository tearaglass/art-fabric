/**
 * MacroSystem - Central macro state & broadcast
 * Phase 5: Standalone now, will integrate into CosmosBus Phase 4
 */

type MacroID = "A" | "B" | "C" | "D";

type MacroState = {
  A: number;
  B: number;
  C: number;
  D: number;
};

type MacroCurve = {
  id: string;
  name: string;
  values: MacroState;
  timestamp: number;
};

type MacroListener = (id: MacroID, value: number, allMacros: MacroState) => void;

class MacroSystem {
  private state: MacroState = { A: 0, B: 0, C: 0, D: 0 };
  private listeners = new Set<MacroListener>();
  private curves: MacroCurve[] = [];
  private locks: Set<MacroID> = new Set();

  // Subscribe to macro changes
  on(listener: MacroListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  off(listener: MacroListener): void {
    this.listeners.delete(listener);
  }

  // Set a single macro
  set(id: MacroID, value: number): void {
    if (this.locks.has(id)) return; // respect locks
    
    const clamped = Math.max(0, Math.min(1, value));
    if (this.state[id] === clamped) return;
    
    this.state[id] = clamped;
    this.emit(id, clamped);
  }

  // Set multiple macros at once
  setMultiple(values: Partial<MacroState>): void {
    let changed = false;
    Object.entries(values).forEach(([id, value]) => {
      const macroId = id as MacroID;
      if (this.locks.has(macroId)) return;
      
      const clamped = Math.max(0, Math.min(1, value!));
      if (this.state[macroId] !== clamped) {
        this.state[macroId] = clamped;
        changed = true;
      }
    });
    
    if (changed) {
      // Emit all changed macros
      Object.entries(values).forEach(([id, value]) => {
        const macroId = id as MacroID;
        if (!this.locks.has(macroId)) {
          this.emit(macroId, this.state[macroId]);
        }
      });
    }
  }

  // Get current state
  get(id: MacroID): number {
    return this.state[id];
  }

  getAll(): MacroState {
    return { ...this.state };
  }

  // Lock/unlock for param locks
  lock(id: MacroID): void {
    this.locks.add(id);
  }

  unlock(id: MacroID): void {
    this.locks.delete(id);
  }

  toggleLock(id: MacroID): boolean {
    if (this.locks.has(id)) {
      this.locks.delete(id);
      return false;
    } else {
      this.locks.add(id);
      return true;
    }
  }

  isLocked(id: MacroID): boolean {
    return this.locks.has(id);
  }

  // Curve snapshot system
  saveCurve(name: string): MacroCurve {
    const curve: MacroCurve = {
      id: `curve_${Date.now()}`,
      name,
      values: { ...this.state },
      timestamp: Date.now(),
    };
    this.curves.push(curve);
    if (this.curves.length > 8) {
      this.curves.shift(); // keep last 8
    }
    return curve;
  }

  loadCurve(curve: MacroCurve): void {
    this.setMultiple(curve.values);
  }

  getCurves(): MacroCurve[] {
    return [...this.curves];
  }

  deleteCurve(id: string): void {
    this.curves = this.curves.filter(c => c.id !== id);
  }

  // Randomize (respects locks)
  randomize(safe: boolean = true): void {
    const newValues: Partial<MacroState> = {};
    
    (["A", "B", "C", "D"] as MacroID[]).forEach(id => {
      if (this.locks.has(id)) return;
      
      if (safe) {
        // Safe range: 0.2 - 0.8
        newValues[id] = 0.2 + Math.random() * 0.6;
      } else {
        // Full chaos: 0 - 1
        newValues[id] = Math.random();
      }
    });
    
    this.setMultiple(newValues);
  }

  // Reset all to 0
  reset(): void {
    this.setMultiple({ A: 0, B: 0, C: 0, D: 0 });
  }

  // Clear all locks
  clearLocks(): void {
    this.locks.clear();
  }

  private emit(id: MacroID, value: number): void {
    this.listeners.forEach(fn => fn(id, value, { ...this.state }));
  }

  // For CosmosBus migration: expose state getter
  getState(): MacroState {
    return { ...this.state };
  }
}

export const macroSystem = new MacroSystem();
export type { MacroID, MacroState, MacroCurve };
