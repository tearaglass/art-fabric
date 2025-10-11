/**
 * Section - Performance section/scene with complete state snapshot
 * Captures patterns, macros, visual layers, and other settings
 */

import { PatternTrackConfig } from '@/lib/strudel/PatternTrack';
import { LayerConfig } from '@/lib/rendering/Layer';
import { MacroState } from '@/lib/macros/MacroSystem';

export interface SectionConfig {
  id: string;
  name: string;
  description?: string;
  color: string;
  duration?: number; // Optional auto-advance duration in bars
  
  // State snapshots
  bpm: number;
  macros: MacroState;
  tracks: PatternTrackConfig[];
  layers?: LayerConfig[];
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export type TransitionType = 'cut' | 'fade' | 'crossfade';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // in beats
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class Section {
  config: SectionConfig;
  
  constructor(config: Partial<SectionConfig> = {}) {
    const now = Date.now();
    
    this.config = {
      id: config.id || `section_${now}`,
      name: config.name || 'Untitled Section',
      description: config.description,
      color: config.color || this.randomColor(),
      duration: config.duration,
      bpm: config.bpm || 120,
      macros: config.macros || { A: 0.5, B: 0.5, C: 0.5, D: 0.5 },
      tracks: config.tracks || [],
      layers: config.layers,
      createdAt: config.createdAt || now,
      updatedAt: config.updatedAt || now,
      tags: config.tags || [],
    };
  }
  
  /**
   * Update section config
   */
  update(partial: Partial<SectionConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
      updatedAt: Date.now(),
    };
  }
  
  /**
   * Clone section with new ID
   */
  clone(name?: string): Section {
    return new Section({
      ...this.config,
      id: `section_${Date.now()}`,
      name: name || `${this.config.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  /**
   * Serialize to JSON
   */
  toJSON(): SectionConfig {
    return { ...this.config };
  }
  
  /**
   * Generate random section color
   */
  private randomColor(): string {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
      '#f43f5e', '#fb923c', '#14b8a6', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
