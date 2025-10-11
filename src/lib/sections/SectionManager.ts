/**
 * SectionManager - Manage performance sections and transitions
 * Handles section switching, transitions, and auto-advance
 */

import { Section, SectionConfig, TransitionConfig } from './Section';
import { cosmosBus } from '@/lib/events/CosmosBus';
import { patternRack } from '@/lib/strudel/PatternRack';
import { macroSystem } from '@/lib/macros/MacroSystem';

export class SectionManager {
  private sections: Map<string, Section> = new Map();
  private sectionOrder: string[] = [];
  private currentSectionId: string | null = null;
  private isTransitioning = false;
  private autoAdvanceTimeout: number | null = null;
  private listeners = new Set<() => void>();
  
  constructor() {
    // Listen for transport beats to handle auto-advance
    cosmosBus.on('transport/tick', (event) => {
      if (event.tick16 === 0) {
        this.handleBeat(event.bar, event.beat);
      }
    });
  }
  
  /**
   * Add a section
   */
  addSection(config?: Partial<SectionConfig>): Section {
    const section = new Section(config);
    this.sections.set(section.config.id, section);
    this.sectionOrder.push(section.config.id);
    
    this.notifyListeners();
    console.log(`[SectionManager] Added section: ${section.config.name}`);
    
    return section;
  }
  
  /**
   * Remove a section
   */
  removeSection(sectionId: string): void {
    if (this.currentSectionId === sectionId) {
      this.currentSectionId = null;
    }
    
    this.sections.delete(sectionId);
    this.sectionOrder = this.sectionOrder.filter(id => id !== sectionId);
    
    this.notifyListeners();
    console.log(`[SectionManager] Removed section: ${sectionId}`);
  }
  
  /**
   * Get a section by ID
   */
  getSection(sectionId: string): Section | undefined {
    return this.sections.get(sectionId);
  }
  
  /**
   * Get all sections in order
   */
  getSections(): Section[] {
    return this.sectionOrder.map(id => this.sections.get(id)!).filter(Boolean);
  }
  
  /**
   * Get current section
   */
  getCurrentSection(): Section | null {
    return this.currentSectionId ? this.sections.get(this.currentSectionId) || null : null;
  }
  
  /**
   * Reorder sections
   */
  reorderSection(sectionId: string, newIndex: number): void {
    const oldIndex = this.sectionOrder.indexOf(sectionId);
    if (oldIndex === -1) return;
    
    this.sectionOrder.splice(oldIndex, 1);
    this.sectionOrder.splice(newIndex, 0, sectionId);
    
    this.notifyListeners();
  }
  
  /**
   * Capture current state as a new section
   */
  captureCurrentState(name?: string): Section {
    const section = this.addSection({
      name: name || `Section ${this.sections.size}`,
      bpm: cosmosBus.get('bpm'),
      macros: macroSystem.getAll(),
      tracks: patternRack.getState().tracks,
    });
    
    return section;
  }
  
  /**
   * Trigger a section transition
   */
  async triggerSection(
    sectionId: string,
    transition: TransitionConfig = { type: 'cut', duration: 0 }
  ): Promise<void> {
    const section = this.sections.get(sectionId);
    if (!section) {
      console.warn(`[SectionManager] Section not found: ${sectionId}`);
      return;
    }
    
    if (this.isTransitioning) {
      console.warn('[SectionManager] Transition already in progress');
      return;
    }
    
    this.isTransitioning = true;
    this.clearAutoAdvance();
    
    try {
      switch (transition.type) {
        case 'cut':
          await this.applySectionState(section);
          break;
          
        case 'fade':
        case 'crossfade':
          await this.transitionToSection(section, transition);
          break;
      }
      
      this.currentSectionId = sectionId;
      
      // Setup auto-advance if configured
      if (section.config.duration) {
        this.scheduleAutoAdvance(section.config.duration);
      }
      
      this.notifyListeners();
      console.log(`[SectionManager] Triggered section: ${section.config.name}`);
    } catch (err) {
      console.error('[SectionManager] Transition error:', err);
    } finally {
      this.isTransitioning = false;
    }
  }
  
  /**
   * Immediately apply section state (cut transition)
   */
  private async applySectionState(section: Section): Promise<void> {
    const { config } = section;
    
    // Stop current playback
    patternRack.stopAll();
    
    // Apply BPM
    const { strudelEngine } = require('@/lib/strudel/engine');
    strudelEngine.setBpm(config.bpm);
    
    // Apply macros
    macroSystem.setMultiple(config.macros);
    
    // Load tracks
    patternRack.loadState({
      isPlaying: false,
      bpm: config.bpm,
      tracks: config.tracks,
    });
    
    // Start playback if transport is running
    if (cosmosBus.get('isPlaying')) {
      await patternRack.playAll();
    }
  }
  
  /**
   * Transition to section with fade/crossfade
   */
  private async transitionToSection(
    section: Section,
    transition: TransitionConfig
  ): Promise<void> {
    // For now, implement as a simple fade
    // Future: implement proper crossfade with volume automation
    
    const steps = Math.max(1, Math.floor(transition.duration * 4)); // 4 steps per beat
    const stepDuration = (transition.duration * 1000) / steps;
    
    // Fade out current
    for (let i = steps; i >= 0; i--) {
      const progress = i / steps;
      // Apply fade curve (future enhancement)
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    // Apply new section state
    await this.applySectionState(section);
    
    // Fade in new
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // Apply fade curve (future enhancement)
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }
  
  /**
   * Navigate to next section
   */
  async nextSection(transition?: TransitionConfig): Promise<void> {
    if (!this.currentSectionId) {
      // No current section, trigger first
      if (this.sectionOrder.length > 0) {
        await this.triggerSection(this.sectionOrder[0], transition);
      }
      return;
    }
    
    const currentIndex = this.sectionOrder.indexOf(this.currentSectionId);
    const nextIndex = (currentIndex + 1) % this.sectionOrder.length;
    
    await this.triggerSection(this.sectionOrder[nextIndex], transition);
  }
  
  /**
   * Navigate to previous section
   */
  async previousSection(transition?: TransitionConfig): Promise<void> {
    if (!this.currentSectionId) {
      // No current section, trigger last
      if (this.sectionOrder.length > 0) {
        await this.triggerSection(this.sectionOrder[this.sectionOrder.length - 1], transition);
      }
      return;
    }
    
    const currentIndex = this.sectionOrder.indexOf(this.currentSectionId);
    const prevIndex = currentIndex === 0 ? this.sectionOrder.length - 1 : currentIndex - 1;
    
    await this.triggerSection(this.sectionOrder[prevIndex], transition);
  }
  
  /**
   * Schedule auto-advance to next section
   */
  private scheduleAutoAdvance(bars: number): void {
    this.clearAutoAdvance();
    
    const bpm = cosmosBus.get('bpm');
    const beatsPerBar = 4;
    const msPerBeat = (60 / bpm) * 1000;
    const duration = bars * beatsPerBar * msPerBeat;
    
    this.autoAdvanceTimeout = window.setTimeout(() => {
      console.log('[SectionManager] Auto-advancing to next section');
      this.nextSection({ type: 'crossfade', duration: 4 });
    }, duration);
  }
  
  /**
   * Clear auto-advance timer
   */
  private clearAutoAdvance(): void {
    if (this.autoAdvanceTimeout !== null) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }
  }
  
  /**
   * Handle beat events (for future quantized transitions)
   */
  private handleBeat(bar: number, beat: number): void {
    // Future: implement quantized section triggers
  }
  
  /**
   * Export all sections
   */
  exportSections(): string {
    const data = {
      version: 1,
      sections: this.getSections().map(s => s.toJSON()),
      order: this.sectionOrder,
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Import sections from JSON
   */
  importSections(json: string): void {
    try {
      const data = JSON.parse(json);
      
      this.sections.clear();
      this.sectionOrder = [];
      
      data.sections.forEach((config: SectionConfig) => {
        const section = new Section(config);
        this.sections.set(section.config.id, section);
      });
      
      this.sectionOrder = data.order || Array.from(this.sections.keys());
      
      this.notifyListeners();
      console.log(`[SectionManager] Imported ${this.sections.size} sections`);
    } catch (err) {
      console.error('[SectionManager] Import failed:', err);
      throw new Error('Invalid section data');
    }
  }
  
  /**
   * Subscribe to changes
   */
  on(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Get manager stats
   */
  getStats() {
    return {
      sectionCount: this.sections.size,
      currentSection: this.getCurrentSection()?.config.name || null,
      isTransitioning: this.isTransitioning,
    };
  }
}

export const sectionManager = new SectionManager();
