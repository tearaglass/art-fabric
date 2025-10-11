/**
 * Strudel Event Bus - BroadcastChannel for transport, tempo, macros
 */

export type LabMsg =
  | { type: "tempo"; bpm: number; cps: number }
  | { type: "beat"; bar: number; beat: number; tick16: number }
  | { type: "macro"; key: "Tone" | "Movement" | "Space" | "Grit"; value: number }
  | { type: "transport"; state: "start" | "stop" | "restart" };

type Listener = (msg: LabMsg) => void;

class StrudelBus {
  private listeners = new Set<Listener>();

  emit(msg: LabMsg) {
    this.listeners.forEach((fn) => fn(msg));
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  off(listener: Listener) {
    this.listeners.delete(listener);
  }

  clear() {
    this.listeners.clear();
  }
}

export const strudelBus = new StrudelBus();
