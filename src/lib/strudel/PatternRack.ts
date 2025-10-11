/**
 * PatternRack - Multi-track Strudel pattern manager
 * Manages multiple PatternTracks with transport sync
 */

import { PatternTrack, PatternTrackConfig } from './PatternTrack';
import { cosmosBus } from '@/lib/events/CosmosBus';
import { strudelEngine } from './engine';

export interface RackState {
  isPlaying: boolean;
  bpm: number;
  tracks: PatternTrackConfig[];
}

export class PatternRack {
  private tracks: Map<string, PatternTrack> = new Map();
  private trackOrder: string[] = [];
  private isPlaying = false;
  private listeners = new Set<() => void>();
  
  constructor() {
    // Listen for transport events
    cosmosBus.on('transport/start', () => {
      this.handleTransportStart();
    });
    
    cosmosBus.on('transport/stop', () => {
      this.handleTransportStop();
    });
  }
  
  /**
   * Add a track to the rack
   */
  addTrack(config?: Partial<PatternTrackConfig>): PatternTrack {
    const track = new PatternTrack({
      name: `Track ${this.tracks.size + 1}`,
      ...config,
    });
    
    this.tracks.set(track.config.id, track);
    this.trackOrder.push(track.config.id);
    
    // Subscribe to track changes
    track.on(() => this.notifyListeners());
    
    this.notifyListeners();
    console.log(`[PatternRack] Added track: ${track.config.name}`);
    
    return track;
  }
  
  /**
   * Remove a track
   */
  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    
    track.stop();
    this.tracks.delete(trackId);
    this.trackOrder = this.trackOrder.filter(id => id !== trackId);
    
    this.notifyListeners();
    console.log(`[PatternRack] Removed track: ${trackId}`);
  }
  
  /**
   * Get a track by ID
   */
  getTrack(trackId: string): PatternTrack | undefined {
    return this.tracks.get(trackId);
  }
  
  /**
   * Get all tracks in order
   */
  getTracks(): PatternTrack[] {
    return this.trackOrder.map(id => this.tracks.get(id)!).filter(Boolean);
  }
  
  /**
   * Reorder tracks
   */
  reorderTrack(trackId: string, newIndex: number): void {
    const oldIndex = this.trackOrder.indexOf(trackId);
    if (oldIndex === -1) return;
    
    this.trackOrder.splice(oldIndex, 1);
    this.trackOrder.splice(newIndex, 0, trackId);
    
    this.notifyListeners();
  }
  
  /**
   * Play all enabled, non-muted tracks
   */
  async playAll(): Promise<void> {
    // Initialize Strudel engine
    await strudelEngine.ensure();
    
    this.isPlaying = true;
    
    // Check for solo tracks
    const soloTracks = this.getTracks().filter(t => t.config.solo);
    const tracksToPlay = soloTracks.length > 0 
      ? soloTracks 
      : this.getTracks().filter(t => !t.config.muted);
    
    // Play each track
    const promises = tracksToPlay
      .filter(t => t.config.enabled)
      .map(track => track.play().catch(err => {
        console.error(`[PatternRack] Track ${track.config.name} error:`, err);
      }));
    
    await Promise.all(promises);
    
    // Start transport if not already started
    if (!cosmosBus.get('isPlaying')) {
      const bpm = cosmosBus.get('bpm');
      strudelEngine.setBpm(bpm);
      cosmosBus.emit({ 
        type: 'transport/start', 
        bpm, 
        timestamp: Date.now() 
      });
    }
    
    this.notifyListeners();
  }
  
  /**
   * Stop all tracks
   */
  stopAll(): void {
    this.isPlaying = false;
    this.getTracks().forEach(track => track.stop());
    strudelEngine.stop();
    this.notifyListeners();
  }
  
  /**
   * Toggle mute for a track
   */
  toggleMute(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    
    track.toggleMute();
    
    // Restart playing tracks if needed
    if (this.isPlaying) {
      this.playAll().catch(console.error);
    }
  }
  
  /**
   * Toggle solo for a track
   */
  toggleSolo(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    
    track.toggleSolo();
    
    // Restart playing tracks with new solo state
    if (this.isPlaying) {
      this.playAll().catch(console.error);
    }
  }
  
  /**
   * Update track code and restart if playing
   */
  async updateTrackCode(trackId: string, code: string): Promise<void> {
    const track = this.tracks.get(trackId);
    if (!track) return;
    
    track.update({ code });
    
    // If this track is currently playing, restart it
    if (this.isPlaying && track.getState() === 'playing') {
      await track.play();
    }
  }
  
  /**
   * Check if rack is playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Get rack state for serialization
   */
  getState(): RackState {
    return {
      isPlaying: this.isPlaying,
      bpm: cosmosBus.get('bpm'),
      tracks: this.getTracks().map(t => t.toJSON()),
    };
  }
  
  /**
   * Load rack state
   */
  loadState(state: RackState): void {
    // Clear existing tracks
    this.tracks.clear();
    this.trackOrder = [];
    
    // Load tracks
    state.tracks.forEach(config => {
      this.addTrack(config);
    });
    
    // Set BPM
    strudelEngine.setBpm(state.bpm);
    
    this.notifyListeners();
  }
  
  /**
   * Subscribe to rack changes
   */
  on(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Handle transport start from external source
   */
  private handleTransportStart(): void {
    if (!this.isPlaying) {
      this.playAll().catch(console.error);
    }
  }
  
  /**
   * Handle transport stop from external source
   */
  private handleTransportStop(): void {
    if (this.isPlaying) {
      this.stopAll();
    }
  }
  
  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const patternRack = new PatternRack();
