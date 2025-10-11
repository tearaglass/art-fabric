/**
 * RenderGraph - Composable visual pipeline
 * Manages layers, compositing, and output routing
 */

import { Layer, LayerConfig } from './Layer';
import { Compositor } from './Compositor';
import { cosmosBus } from '@/lib/events/CosmosBus';

export interface RenderGraphConfig {
  width: number;
  height: number;
  backgroundColor: string;
  outputCanvas?: HTMLCanvasElement;
}

export class RenderGraph {
  private config: RenderGraphConfig;
  private layers: Map<string, Layer> = new Map();
  private layerOrder: string[] = []; // Bottom to top
  private compositor: Compositor;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private isRunning = false;
  private rafId: number | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  
  constructor(config: RenderGraphConfig) {
    this.config = config;
    this.compositor = new Compositor();
    
    // Setup output canvas
    this.outputCanvas = config.outputCanvas || document.createElement('canvas');
    this.outputCtx = this.outputCanvas.getContext('2d', { alpha: false, willReadFrequently: false })!;
    
    this.resize(config.width, config.height);
  }
  
  /**
   * Add a layer to the graph
   */
  addLayer(config: Partial<LayerConfig>, index?: number): Layer {
    const layer = new Layer(config);
    this.layers.set(layer.config.id, layer);
    
    if (index !== undefined && index >= 0 && index <= this.layerOrder.length) {
      this.layerOrder.splice(index, 0, layer.config.id);
    } else {
      this.layerOrder.push(layer.config.id);
    }
    
    layer.setSize(this.config.width, this.config.height);
    
    console.log(`[RenderGraph] Added layer: ${layer.config.name} (${layer.config.type})`);
    return layer;
  }
  
  /**
   * Remove a layer from the graph
   */
  removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.dispose();
      this.layers.delete(layerId);
      this.layerOrder = this.layerOrder.filter(id => id !== layerId);
      console.log(`[RenderGraph] Removed layer: ${layerId}`);
    }
  }
  
  /**
   * Get a layer by ID
   */
  getLayer(layerId: string): Layer | undefined {
    return this.layers.get(layerId);
  }
  
  /**
   * Get all layers in order (bottom to top)
   */
  getLayers(): Layer[] {
    return this.layerOrder.map(id => this.layers.get(id)!).filter(Boolean);
  }
  
  /**
   * Reorder layers
   */
  reorderLayer(layerId: string, newIndex: number): void {
    const oldIndex = this.layerOrder.indexOf(layerId);
    if (oldIndex === -1) return;
    
    this.layerOrder.splice(oldIndex, 1);
    this.layerOrder.splice(newIndex, 0, layerId);
  }
  
  /**
   * Resize the render graph
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    this.outputCanvas.width = width;
    this.outputCanvas.height = height;
    this.compositor.setSize(width, height);
    
    this.layers.forEach(layer => layer.setSize(width, height));
  }
  
  /**
   * Render a single frame
   */
  renderFrame(): void {
    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? now - this.lastFrameTime : 16.67;
    this.lastFrameTime = now;
    this.frameCount++;
    
    // Clear compositor
    this.compositor.clear();
    
    // Clear output with background color
    this.outputCtx.fillStyle = this.config.backgroundColor;
    this.outputCtx.fillRect(0, 0, this.config.width, this.config.height);
    
    // Render each layer in order (bottom to top)
    for (const layerId of this.layerOrder) {
      const layer = this.layers.get(layerId);
      if (!layer || !layer.config.enabled) continue;
      
      // Render layer to its internal canvas
      layer.render();
      
      // Composite onto output
      this.compositor.composite(
        layer.getCanvas(),
        layer.config.blendMode,
        layer.config.opacity
      );
      
      // Emit layer event
      cosmosBus.emit({
        type: 'render/layer',
        layerId: layer.config.id,
        canvas: layer.getCanvas(),
      });
    }
    
    // Draw compositor output to final canvas
    this.outputCtx.drawImage(this.compositor.getCanvas(), 0, 0);
    
    // Emit frame event
    cosmosBus.emit({
      type: 'render/frame',
      frameNum: this.frameCount,
      deltaTime,
      timestamp: now,
    });
  }
  
  /**
   * Start continuous rendering
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = 0;
    
    const loop = () => {
      if (!this.isRunning) return;
      
      this.renderFrame();
      this.rafId = requestAnimationFrame(loop);
    };
    
    this.rafId = requestAnimationFrame(loop);
    console.log('[RenderGraph] Started rendering');
  }
  
  /**
   * Stop continuous rendering
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    console.log('[RenderGraph] Stopped rendering');
  }
  
  /**
   * Get the output canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.outputCanvas;
  }
  
  /**
   * Get graph stats
   */
  getStats() {
    return {
      layerCount: this.layers.size,
      frameCount: this.frameCount,
      isRunning: this.isRunning,
      dimensions: { width: this.config.width, height: this.config.height },
    };
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stop();
    this.layers.forEach(layer => layer.dispose());
    this.layers.clear();
    this.layerOrder = [];
    this.compositor.dispose();
  }
}
