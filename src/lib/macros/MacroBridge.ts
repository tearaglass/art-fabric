/**
 * MacroBridge - Bridge MacroSystem to StrudelBus
 * Temporary until CosmosBus Phase 4 unifies everything
 */

import { macroSystem, MacroID } from './MacroSystem';
import { strudelBus } from '@/lib/strudel/bus';

let bridgeActive = false;

export function initMacroBridge() {
  if (bridgeActive) return;
  bridgeActive = true;

  // Forward macro changes to strudelBus for backward compat
  macroSystem.on((id, value) => {
    const keyMap: Record<MacroID, "Tone" | "Movement" | "Space" | "Grit"> = {
      A: "Tone",
      B: "Movement", 
      C: "Space",
      D: "Grit",
    };
    
    strudelBus.emit({
      type: "macro",
      key: keyMap[id],
      value,
    });
  });

  console.log('[MacroBridge] Connected MacroSystem → StrudelBus');
}

export function setMacroFromStrudelBus(key: "Tone" | "Movement" | "Space" | "Grit", value: number) {
  const idMap: Record<string, MacroID> = {
    Tone: "A",
    Movement: "B",
    Space: "C",
    Grit: "D",
  };
  
  const id = idMap[key];
  if (id) {
    macroSystem.set(id, value);
  }
}
