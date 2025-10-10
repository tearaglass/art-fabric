type EventHandler<T = any> = (payload: T) => void;

export type EventTopic =
  | 'project/loaded'
  | 'project/saved'
  | 'project/reset'
  | 'assets/added'
  | 'assets/renamed'
  | 'assets/weighted'
  | 'assets/removed'
  | 'rules/compiled'
  | 'rules/fired'
  | 'rules/rejected'
  | 'rng/seedChanged'
  | 'generate/requested'
  | 'generate/progress'
  | 'generate/done'
  | 'generate/failed'
  | 'sd/jobQueued'
  | 'sd/started'
  | 'sd/done'
  | 'sd/cached'
  | 'webgl/rendered'
  | 'webgl/cached'
  | 'p5/rendered'
  | 'p5/cached'
  | 'strudel/rendered'
  | 'strudel/cached'
  | 'fx/applied'
  | 'audit/record';

export interface EventPayloads {
  'project/loaded': { name: string; timestamp: number };
  'project/saved': { name: string; timestamp: number };
  'project/reset': { timestamp: number };
  'assets/added': { className: string; traitName: string; source: string };
  'assets/renamed': { className: string; oldName: string; newName: string };
  'assets/weighted': { className: string; traitName: string; weight: number };
  'assets/removed': { className: string; traitName: string };
  'rules/compiled': { ruleCount: number; timestamp: number };
  'rules/fired': { rule: string; context: Record<string, any> };
  'rules/rejected': { rule: string; reason: string };
  'rng/seedChanged': { oldSeed: string; newSeed: string };
  'generate/requested': { edition: number; seed: string };
  'generate/progress': { edition: number; progress: number; stage: string };
  'generate/done': { edition: number; duration: number };
  'generate/failed': { edition: number; error: string };
  'sd/jobQueued': { jobId: string; graph: string };
  'sd/started': { jobId: string; timestamp: number };
  'sd/done': { jobId: string; duration: number; cached: boolean };
  'sd/cached': { jobId: string; hash: string };
  'webgl/rendered': { preset: string; duration: number };
  'webgl/cached': { preset: string; hash: string };
  'p5/rendered': { sketchName: string; duration: number };
  'p5/cached': { sketchName: string; hash: string };
  'strudel/rendered': { pattern: string; duration: number };
  'strudel/cached': { pattern: string; hash: string };
  'fx/applied': { fxName: string; params: Record<string, any> };
  'audit/record': { edition: number; data: any };
}

class EventBus {
  private handlers: Map<EventTopic, Set<EventHandler>> = new Map();
  private eventHistory: Array<{ topic: EventTopic; payload: any; timestamp: number }> = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to an event topic
   */
  on<T extends EventTopic>(topic: T, handler: EventHandler<EventPayloads[T]>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(topic, handler);
    };
  }

  /**
   * Unsubscribe from an event topic
   */
  off<T extends EventTopic>(topic: T, handler: EventHandler<EventPayloads[T]>): void {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T extends EventTopic>(topic: T, payload: EventPayloads[T]): void {
    const handlers = this.handlers.get(topic);
    
    // Store in history
    this.eventHistory.push({
      topic,
      payload,
      timestamp: Date.now(),
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify all handlers
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${topic}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to multiple topics at once
   */
  onMultiple(subscriptions: Array<{ topic: EventTopic; handler: EventHandler }>): () => void {
    const unsubscribers = subscriptions.map(({ topic, handler }) => 
      this.on(topic, handler)
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Get event history filtered by topic
   */
  getHistory(topic?: EventTopic, limit = 100) {
    const filtered = topic 
      ? this.eventHistory.filter(e => e.topic === topic)
      : this.eventHistory;
    
    return filtered.slice(-limit);
  }

  /**
   * Clear all handlers (useful for cleanup)
   */
  clearAll(): void {
    this.handlers.clear();
  }

  /**
   * Get all active topics
   */
  getActiveTopics(): EventTopic[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
export const eventBus = new EventBus();
