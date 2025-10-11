/**
 * PatternTrack - Individual Strudel pattern track
 * Manages a single pattern with controls (mute, solo, volume, etc.)
 */

import { evaluate, hush } from '@strudel/web';

export interface PatternTrackConfig {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  muted: boolean;
  solo: boolean;
  volume: number; // 0-1
  pan: number; // -1 to 1
  color: string;
}

export type TrackState = 'stopped' | 'playing' | 'error';

export class PatternTrack {
  config: PatternTrackConfig;
  private state: TrackState = 'stopped';
  private errorMessage: string | null = null;
  private listeners = new Set<(track: PatternTrack) => void>();
  
  constructor(config: Partial<PatternTrackConfig> = {}) {
    this.config = {
      id: config.id || `track_${Date.now()}`,
      name: config.name || 'Untitled Track',
      code: config.code || '// Enter pattern code here',
      enabled: config.enabled !== undefined ? config.enabled : true,
      muted: config.muted || false,
      solo: config.solo || false,
      volume: config.volume !== undefined ? config.volume : 0.8,
      pan: config.pan || 0,
      color: config.color || this.randomColor(),
    };
  }
  
  /**
   * Update track configuration
   */
  update(partial: Partial<PatternTrackConfig>): void {
    this.config = { ...this.config, ...partial };
    this.notifyListeners();
  }
  
  /**
   * Start playing the pattern
   */
  async play(): Promise<void> {
    if (!this.config.enabled) return;
    
    try {
      // Wrap code with volume/pan controls if provided
      let wrappedCode = this.config.code;
      
      if (this.config.volume !== 1) {
        wrappedCode = `(${wrappedCode}).gain(${this.config.volume})`;
      }
      
      if (this.config.pan !== 0) {
        wrappedCode = `(${wrappedCode}).pan(${this.config.pan})`;
      }
      
      await evaluate(wrappedCode);
      this.state = 'playing';
      this.errorMessage = null;
      this.notifyListeners();
    } catch (err) {
      this.state = 'error';
      this.errorMessage = err instanceof Error ? err.message : 'Pattern evaluation failed';
      this.notifyListeners();
      throw err;
    }
  }
  
  /**
   * Stop the pattern
   */
  stop(): void {
    hush();
    this.state = 'stopped';
    this.notifyListeners();
  }
  
  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.config.muted = !this.config.muted;
    this.notifyListeners();
    
    // If playing, restart with new mute state
    if (this.state === 'playing') {
      if (this.config.muted) {
        this.stop();
      } else {
        this.play().catch(console.error);
      }
    }
  }
  
  /**
   * Toggle solo
   */
  toggleSolo(): void {
    this.config.solo = !this.config.solo;
    this.notifyListeners();
  }
  
  /**
   * Get current state
   */
  getState(): TrackState {
    return this.state;
  }
  
  /**
   * Get error message if in error state
   */
  getError(): string | null {
    return this.errorMessage;
  }
  
  /**
   * Subscribe to track changes
   */
  on(listener: (track: PatternTrack) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Serialize track to JSON
   */
  toJSON(): PatternTrackConfig {
    return { ...this.config };
  }
  
  /**
   * Generate random track color
   */
  private randomColor(): string {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Notify listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this));
  }
}
