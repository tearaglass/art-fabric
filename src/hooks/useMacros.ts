import { useEffect, useState } from 'react';
import { macroSystem, MacroID, MacroState } from '@/lib/macros/MacroSystem';

/**
 * Hook to subscribe to all macro changes
 */
export function useMacros() {
  const [macros, setMacros] = useState<MacroState>(macroSystem.getAll());

  useEffect(() => {
    const unsubscribe = macroSystem.on(() => {
      setMacros(macroSystem.getAll());
    });
    return unsubscribe;
  }, []);

  return macros;
}

/**
 * Hook to subscribe to a single macro
 */
export function useMacro(id: MacroID) {
  const [value, setValue] = useState<number>(macroSystem.get(id));

  useEffect(() => {
    const unsubscribe = macroSystem.on((changedId, changedValue) => {
      if (changedId === id) {
        setValue(changedValue);
      }
    });
    return unsubscribe;
  }, [id]);

  return value;
}

/**
 * Hook to get macro controls
 */
export function useMacroControls() {
  return {
    set: (id: MacroID, value: number) => macroSystem.set(id, value),
    setMultiple: (values: Partial<MacroState>) => macroSystem.setMultiple(values),
    randomize: (safe?: boolean) => macroSystem.randomize(safe),
    reset: () => macroSystem.reset(),
    saveCurve: (name: string) => macroSystem.saveCurve(name),
    loadCurve: (curve: any) => macroSystem.loadCurve(curve),
    lock: (id: MacroID) => macroSystem.lock(id),
    unlock: (id: MacroID) => macroSystem.unlock(id),
    toggleLock: (id: MacroID) => macroSystem.toggleLock(id),
  };
}
