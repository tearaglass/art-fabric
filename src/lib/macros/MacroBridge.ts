/**
 * MacroBridge - Bridge MacroSystem ↔ CosmosBus ↔ StrudelBus
 * Phase 4: Full bidirectional integration
 */

import { macroSystem, MacroID } from './MacroSystem';
import { strudelBus } from '@/lib/strudel/bus';
import { cosmosBus } from '@/lib/events/CosmosBus';

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

  // Listen for external macro changes from CosmosBus
  cosmosBus.on('macro/changed', (event) => {
    const idMap: Record<string, MacroID> = {
      Tone: "A",
      Movement: "B",
      Space: "C",
      Grit: "D",
    };
    
    const id = idMap[event.key];
    if (id && event.source !== 'ui') {
      // Only apply external changes (avoid feedback loop)
      macroSystem.set(id, event.value, event.source);
    }
  });

  console.log('[MacroBridge] Connected MacroSystem ↔ CosmosBus ↔ StrudelBus');
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
