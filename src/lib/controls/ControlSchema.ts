/**
 * Portable Control Schema (PCS)
 * Allows any module to expose controls in a uniform way
 */

export type ControlType = 'slider' | 'toggle' | 'color' | 'select' | 'xy';
export type ControlUnit = 'norm' | 'Hz' | 'ms' | 'deg';
export type ControlTag = '#movement' | '#texture' | '#light' | '#tone' | '#space' | '#grit';

export interface ControlDef {
  id: string;
  label: string;
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for 'select' type
  default: any;
  unit?: ControlUnit;
  expose?: boolean; // show in UI or hide from clutter
  tags: ControlTag[];
}

export class ControlRegistry {
  private controls = new Map<string, ControlDef[]>();

  registerControl(moduleId: string, control: ControlDef): void {
    const existing = this.controls.get(moduleId) || [];
    existing.push(control);
    this.controls.set(moduleId, existing);
  }

  registerControls(moduleId: string, controls: ControlDef[]): void {
    this.controls.set(moduleId, controls);
  }

  getControlsByModule(moduleId: string): ControlDef[] {
    return this.controls.get(moduleId) || [];
  }

  getControlsByTag(tag: ControlTag): ControlDef[] {
    const result: ControlDef[] = [];
    this.controls.forEach((controls) => {
      controls.forEach((control) => {
        if (control.tags.includes(tag)) {
          result.push(control);
        }
      });
    });
    return result;
  }

  getAllControls(): Map<string, ControlDef[]> {
    return new Map(this.controls);
  }

  getControl(moduleId: string, controlId: string): ControlDef | undefined {
    const controls = this.controls.get(moduleId) || [];
    return controls.find((c) => c.id === controlId);
  }
}

// Global registry instance
export const controlRegistry = new ControlRegistry();
