import { eventBus, EventTopic } from './EventBus';

export interface AuditEntry {
  id: string;
  timestamp: number;
  topic: EventTopic;
  payload: any;
  edition?: number;
  metadata?: Record<string, any>;
}

export interface GenerationAudit {
  edition: number;
  dna: string;
  seeds: {
    token: number;
    byClass: Record<string, number>;
  };
  picks: Record<string, { trait: string; source: string }>;
  rules: {
    fired: string[];
    rejects: number;
  };
  renders: {
    sd: number;
    webgl: number;
    p5: number;
    fxPasses: number;
    ms: number;
  };
  hashes: {
    image: string;
    metadata: string;
  };
  timestamp: number;
}

class AuditLogger {
  private entries: AuditEntry[] = [];
  private generationAudits: Map<number, Partial<GenerationAudit>> = new Map();
  private maxEntries = 10000;
  private isEnabled = true;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Track all events
    const allTopics: EventTopic[] = [
      'project/loaded',
      'project/saved',
      'project/reset',
      'assets/added',
      'assets/renamed',
      'assets/weighted',
      'assets/removed',
      'rules/compiled',
      'rules/fired',
      'rules/rejected',
      'rng/seedChanged',
      'generate/requested',
      'generate/progress',
      'generate/done',
      'generate/failed',
      'sd/jobQueued',
      'sd/started',
      'sd/done',
      'sd/cached',
      'webgl/rendered',
      'webgl/cached',
      'p5/rendered',
      'p5/cached',
      'strudel/rendered',
      'strudel/cached',
      'fx/applied',
      'audit/record',
    ];

    allTopics.forEach(topic => {
      eventBus.on(topic, (payload) => {
        this.log(topic, payload);
      });
    });

    // Special handling for generation tracking
    eventBus.on('generate/requested', (payload) => {
      this.initGenerationAudit(payload.edition, payload.seed);
    });

    eventBus.on('generate/done', (payload) => {
      this.finalizeGenerationAudit(payload.edition, payload.duration);
    });

    eventBus.on('rules/fired', (payload) => {
      this.trackRuleFired(payload);
    });

    eventBus.on('rules/rejected', () => {
      this.incrementRuleRejects();
    });
  }

  private log(topic: EventTopic, payload: any) {
    if (!this.isEnabled) return;

    const entry: AuditEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      topic,
      payload,
    };

    this.entries.push(entry);

    // Trim if needed
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  private initGenerationAudit(edition: number, seed: string) {
    this.generationAudits.set(edition, {
      edition,
      seeds: { token: 0, byClass: {} },
      picks: {},
      rules: { fired: [], rejects: 0 },
      renders: { sd: 0, webgl: 0, p5: 0, fxPasses: 0, ms: 0 },
      hashes: { image: '', metadata: '' },
      timestamp: Date.now(),
    });
  }

  private finalizeGenerationAudit(edition: number, duration: number) {
    const audit = this.generationAudits.get(edition);
    if (audit) {
      audit.renders!.ms = duration;
      // Emit complete audit
      eventBus.emit('audit/record', { edition, data: audit });
    }
  }

  private trackRuleFired(payload: { rule: string; context: Record<string, any> }) {
    // Track in the most recent generation audit
    const latestEdition = Math.max(...Array.from(this.generationAudits.keys()));
    const audit = this.generationAudits.get(latestEdition);
    if (audit?.rules) {
      audit.rules.fired.push(payload.rule);
    }
  }

  private incrementRuleRejects() {
    const latestEdition = Math.max(...Array.from(this.generationAudits.keys()));
    const audit = this.generationAudits.get(latestEdition);
    if (audit?.rules) {
      audit.rules.rejects++;
    }
  }

  /**
   * Get all audit entries
   */
  getEntries(filter?: { topic?: EventTopic; limit?: number }): AuditEntry[] {
    let filtered = this.entries;

    if (filter?.topic) {
      filtered = filtered.filter(e => e.topic === filter.topic);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Get generation audits
   */
  getGenerationAudits(): GenerationAudit[] {
    return Array.from(this.generationAudits.values()).filter(
      (audit): audit is GenerationAudit => audit.edition !== undefined
    );
  }

  /**
   * Export audit log as CSV
   */
  exportAsCSV(): string {
    const headers = ['timestamp', 'topic', 'edition', 'payload'];
    const rows = this.entries.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.topic,
      entry.edition || '',
      JSON.stringify(entry.payload),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export generation audits as CSV
   */
  exportGenerationAuditsAsCSV(): string {
    const audits = this.getGenerationAudits();
    const headers = ['edition', 'dna', 'rules_fired', 'rules_rejected', 'render_ms', 'sd_renders', 'webgl_renders', 'p5_renders', 'fx_passes'];
    
    const rows = audits.map(audit => [
      audit.edition,
      audit.dna || '',
      audit.rules.fired.length,
      audit.rules.rejects,
      audit.renders.ms,
      audit.renders.sd,
      audit.renders.webgl,
      audit.renders.p5,
      audit.renders.fxPasses,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear all logs
   */
  clear() {
    this.entries = [];
    this.generationAudits.clear();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
