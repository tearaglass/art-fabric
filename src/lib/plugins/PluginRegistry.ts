/**
 * Plugin Registry - Capability-gated extensibility system
 * Allows any module to register as a Lab, FX, Modulator, Input, Agent, Ritual, or Exporter
 */

export type PluginType = 'Lab' | 'FX' | 'Modulator' | 'Input' | 'Agent' | 'Ritual' | 'Exporter';

export type PluginCapability = 
  | 'clock' 
  | 'audio' 
  | 'video' 
  | 'text' 
  | 'affect' 
  | 'entropy'
  | 'modulation'
  | 'network';

export interface PluginManifest {
  name: string; // e.g., "@laney/modulator-shame"
  version: string; // semver
  type: PluginType;
  capabilities: PluginCapability[];
  params?: Record<string, any>; // zod schema as JSON
  inlets?: string[]; // e.g., ["mod", "clock", "audio.low", "affect.hesitation"]
  outlets?: string[]; // e.g., ["video.frame", "audio.busA", "affect.delta"]
  ui?: {
    panel?: string; // component path
    icon?: string; // icon path or name
  };
}

export interface Plugin {
  manifest: PluginManifest;
  init?: (ctx: PluginContext) => void | Promise<void>;
  connect?: (bus: any) => void; // connects to CosmosBus
  tick?: (dt: number) => void; // called each frame
  handle?: (event: any) => void; // handle events
  serialize?: () => any; // save state
  dispose?: () => void; // cleanup
}

export interface PluginContext {
  capabilities: PluginCapability[];
  requestCapability: (cap: PluginCapability) => boolean;
  emit: (event: string, payload: any) => void;
  subscribe: (topic: string, handler: (payload: any) => void) => () => void;
}

class PluginRegistryClass {
  private plugins = new Map<string, Plugin>();
  private capabilities = new Map<string, Set<PluginCapability>>();

  /**
   * Register a plugin with capability checks
   */
  register(plugin: Plugin): boolean {
    const { name, capabilities } = plugin.manifest;

    // Check if capabilities are valid
    const validCaps: PluginCapability[] = [
      'clock', 'audio', 'video', 'text', 'affect', 'entropy', 'modulation', 'network'
    ];
    
    for (const cap of capabilities) {
      if (!validCaps.includes(cap)) {
        console.warn(`[PluginRegistry] Invalid capability "${cap}" for plugin ${name}`);
        return false;
      }
    }

    // Store plugin
    this.plugins.set(name, plugin);
    this.capabilities.set(name, new Set(capabilities));

    console.log(`[PluginRegistry] Registered ${name} (${capabilities.join(', ')})`);
    return true;
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin?.dispose) {
      plugin.dispose();
    }
    this.plugins.delete(name);
    this.capabilities.delete(name);
    console.log(`[PluginRegistry] Unregistered ${name}`);
  }

  /**
   * Get a plugin by name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins of a specific type
   */
  getByType(type: PluginType): Plugin[] {
    return Array.from(this.plugins.values()).filter(
      (p) => p.manifest.type === type
    );
  }

  /**
   * Get all plugins with a specific capability
   */
  getByCapability(capability: PluginCapability): Plugin[] {
    return Array.from(this.plugins.entries())
      .filter(([name]) => this.capabilities.get(name)?.has(capability))
      .map(([, plugin]) => plugin);
  }

  /**
   * Check if a plugin has a capability
   */
  hasCapability(name: string, capability: PluginCapability): boolean {
    return this.capabilities.get(name)?.has(capability) ?? false;
  }

  /**
   * Get all registered plugins
   */
  getAll(): Map<string, Plugin> {
    return new Map(this.plugins);
  }

  /**
   * Initialize all plugins
   */
  async initAll(ctx: PluginContext): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.init) {
        await plugin.init(ctx);
      }
    }
  }

  /**
   * Tick all plugins
   */
  tickAll(dt: number): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.tick) {
        plugin.tick(dt);
      }
    }
  }

  /**
   * Dispose all plugins
   */
  disposeAll(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
    this.plugins.clear();
    this.capabilities.clear();
  }
}

// Global singleton
export const pluginRegistry = new PluginRegistryClass();
