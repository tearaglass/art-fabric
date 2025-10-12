/**
 * Shame Engine - Tracks UI interaction patterns to derive affective state
 * Emits affect events to CosmosBus
 */

import { cosmosBus } from '@/lib/events/CosmosBus';
import type { FabricAffect } from '@/state/fabric';

export class ShameEngine {
  private hesitationTimer: number | null = null;
  private hesitationStart: number = 0;
  private activityWindow: number[] = []; // timestamps of recent changes
  private currentAffect: FabricAffect = {
    hesitation: 0,
    overactivity: 0,
    emotionalTone: 'neutral',
    entropy: 0,
  };

  /**
   * Track when user starts dwelling on a control
   */
  startHesitation(): void {
    this.hesitationStart = Date.now();
    if (this.hesitationTimer !== null) {
      clearTimeout(this.hesitationTimer);
    }

    // After 2 seconds of dwell, increase hesitation
    this.hesitationTimer = window.setTimeout(() => {
      const dwellTime = (Date.now() - this.hesitationStart) / 1000;
      this.currentAffect.hesitation = Math.min(1, dwellTime / 5); // max out at 5s
      
      cosmosBus.emit({
        type: 'affect/hesitation',
        level: this.currentAffect.hesitation,
        timestamp: Date.now(),
      });

      this.computeEmotionalTone();
    }, 2000);
  }

  /**
   * Track when user stops dwelling
   */
  endHesitation(): void {
    if (this.hesitationTimer !== null) {
      clearTimeout(this.hesitationTimer);
      this.hesitationTimer = null;
    }

    // Decay hesitation slowly
    this.currentAffect.hesitation = Math.max(0, this.currentAffect.hesitation - 0.1);
  }

  /**
   * Track rapid parameter changes (overactivity)
   */
  trackActivity(): void {
    const now = Date.now();
    this.activityWindow.push(now);

    // Keep only last 5 seconds of activity
    this.activityWindow = this.activityWindow.filter((t) => now - t < 5000);

    // Calculate overactivity (more than 10 changes in 5s = high)
    this.currentAffect.overactivity = Math.min(1, this.activityWindow.length / 10);

    cosmosBus.emit({
      type: 'affect/overactivity',
      level: this.currentAffect.overactivity,
      count: this.activityWindow.length,
      timestamp: now,
    });

    this.computeEmotionalTone();
  }

  /**
   * Compute emotional tone from hesitation + overactivity
   */
  private computeEmotionalTone(): void {
    const { hesitation, overactivity } = this.currentAffect;

    let tone: FabricAffect['emotionalTone'] = 'neutral';

    if (hesitation > 0.6 && overactivity > 0.6) {
      tone = 'anxious'; // high hesitation + high activity = anxious
    } else if (overactivity > 0.7) {
      tone = 'euphoric'; // pure high activity = euphoric
    } else if (hesitation > 0.7) {
      tone = 'numb'; // pure high hesitation = numb
    }

    if (tone !== this.currentAffect.emotionalTone) {
      this.currentAffect.emotionalTone = tone;
      
      cosmosBus.emit({
        type: 'affect/tone',
        tone,
        hesitation,
        overactivity,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Compute entropy from activity patterns
   */
  computeEntropy(timeSinceLastChange: number): number {
    const activityLevel = this.currentAffect.overactivity;
    
    // Entropy increases with overactivity, decreases with stillness
    const delta = (activityLevel * 0.05) - (timeSinceLastChange * 0.002);
    this.currentAffect.entropy = Math.max(0, Math.min(1, this.currentAffect.entropy + delta));

    return this.currentAffect.entropy;
  }

  /**
   * Emit affect mutation event (visual feedback)
   */
  emitMutation(mutationType: 'blur' | 'glitch' | 'decay' | 'fracture'): void {
    cosmosBus.emit({
      type: 'affect/mutation',
      mutationType,
      affect: { ...this.currentAffect },
      timestamp: Date.now(),
    });
  }

  /**
   * Get current affect state
   */
  getAffect(): FabricAffect {
    return { ...this.currentAffect };
  }

  /**
   * Set affect state (for loading from Fabric)
   */
  setAffect(affect: FabricAffect): void {
    this.currentAffect = { ...affect };
  }

  /**
   * Reset affect to neutral
   */
  reset(): void {
    if (this.hesitationTimer !== null) {
      clearTimeout(this.hesitationTimer);
      this.hesitationTimer = null;
    }
    this.activityWindow = [];
    this.currentAffect = {
      hesitation: 0,
      overactivity: 0,
      emotionalTone: 'neutral',
      entropy: 0,
    };
  }
}

// Global singleton
export const shameEngine = new ShameEngine();
