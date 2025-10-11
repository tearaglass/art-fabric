import OSC from 'osc-js';

export interface OSCMessage {
  address: string;
  args: (number | string)[];
}

/**
 * OSC Client for communicating with VDMX
 * Uses WebSocket relay via Supabase Edge Function since browsers can't send UDP directly
 */
export class OSCClient {
  private osc: OSC;
  private connected: boolean = false;
  private wsUrl: string;
  private reconnectTimeout?: number;

  constructor(wsUrl?: string) {
    // Use environment variable for base URL, env-safe
    const base = import.meta.env.VITE_SUPABASE_URL || 'https://iflmreetonzzcdpdrupe.supabase.co';
    const wsBase = base.replace('https://', 'wss://');
    this.wsUrl = wsUrl || `${wsBase}/functions/v1/osc-relay`;
    
    this.osc = new OSC({
      plugin: new OSC.WebsocketClientPlugin({
        host: this.wsUrl,
      }),
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.osc.on('open', () => {
      console.log('[OSC] Connected to relay server');
      this.connected = true;
      // Clear any pending reconnection
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
    });

    this.osc.on('close', () => {
      console.log('[OSC] Disconnected from relay server');
      this.connected = false;
      // Auto-reconnect after 3 seconds
      if (!this.reconnectTimeout) {
        this.reconnectTimeout = window.setTimeout(() => {
          console.log('[OSC] Attempting to reconnect...');
          this.connect().catch(err => console.error('[OSC] Reconnect failed:', err));
        }, 3000);
      }
    });

    this.osc.on('error', (error) => {
      console.error('[OSC] Error:', error);
    });

    this.osc.on('*', (message: any) => {
      console.log('[OSC] Received:', message);
    });
  }

  async connect(): Promise<void> {
    try {
      this.osc.open();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for connection
    } catch (error) {
      console.error('[OSC] Connection failed:', error);
      throw error;
    }
  }

  disconnect() {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.osc.close();
    this.connected = false;
  }

  send(address: string, ...args: (number | string)[]) {
    if (!this.connected) {
      console.warn('[OSC] Not connected, message not sent:', address);
      return;
    }

    const message = new OSC.Message(address, ...args);
    this.osc.send(message);
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Convenience methods for common VDMX operations
  setShaderUniform(presetId: string, uniformName: string, value: number | number[]) {
    const address = `/shader/${presetId}/${uniformName}`;
    if (Array.isArray(value)) {
      this.send(address, ...value);
    } else {
      this.send(address, value);
    }
  }

  setStrudelParam(trackNumber: number, param: string, value: number) {
    this.send(`/strudel/track${trackNumber}/${param}`, value);
  }

  triggerExport() {
    this.send('/export/trigger');
  }

  randomize() {
    this.send('/randomize');
  }

  setBPM(bpm: number) {
    this.send('/bpm', bpm);
  }

  onMessage(callback: (message: OSCMessage) => void) {
    this.osc.on('*', (oscMessage: any) => {
      callback({
        address: oscMessage.address,
        args: oscMessage.args,
      });
    });
  }
}

// Singleton instance
let oscClientInstance: OSCClient | null = null;

export const getOSCClient = (): OSCClient => {
  if (!oscClientInstance) {
    oscClientInstance = new OSCClient();
  }
  return oscClientInstance;
};
