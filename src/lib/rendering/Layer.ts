/**
 * Layer - Individual visual layer abstraction
 * Supports shaders, p5 sketches, videos, images, and canvases
 */

export type LayerType = 'shader' | 'p5' | 'video' | 'image' | 'canvas' | 'empty';

export type BlendMode = 
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface LayerConfig {
  id: string;
  name: string;
  type: LayerType;
  enabled: boolean;
  opacity: number; // 0-1
  blendMode: BlendMode;
  
  // Source-specific config
  shaderSource?: string;
  p5SketchId?: string;
  videoSource?: string;
  imageSource?: string;
  canvasSource?: HTMLCanvasElement;
  
  // Transform
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number; // radians
  
  // FX Chain (future)
  fxChain?: string[];
}

export class Layer {
  config: LayerConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sourceElement: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement | null = null;
  
  constructor(config: Partial<LayerConfig> = {}) {
    this.config = {
      id: config.id || `layer_${Date.now()}`,
      name: config.name || 'Untitled Layer',
      type: config.type || 'empty',
      enabled: config.enabled !== undefined ? config.enabled : true,
      opacity: config.opacity !== undefined ? config.opacity : 1,
      blendMode: config.blendMode || 'normal',
      position: config.position || { x: 0, y: 0 },
      scale: config.scale || { x: 1, y: 1 },
      rotation: config.rotation || 0,
      ...config,
    };
    
    // Create internal canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true, willReadFrequently: false })!;
  }
  
  /**
   * Set layer dimensions
   */
  setSize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  /**
   * Set the source element (canvas, video, or image)
   */
  setSource(element: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement): void {
    this.sourceElement = element;
  }
  
  /**
   * Render the layer to its internal canvas
   */
  render(): void {
    if (!this.config.enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!this.sourceElement) return;
    
    this.ctx.save();
    
    // Apply transformations
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.translate(this.config.position.x, this.config.position.y);
    this.ctx.rotate(this.config.rotation);
    this.ctx.scale(this.config.scale.x, this.config.scale.y);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    
    // Apply opacity
    this.ctx.globalAlpha = this.config.opacity;
    
    // Draw source
    try {
      this.ctx.drawImage(this.sourceElement, 0, 0, this.canvas.width, this.canvas.height);
    } catch (err) {
      console.warn(`[Layer] Failed to draw source for ${this.config.name}:`, err);
    }
    
    this.ctx.restore();
  }
  
  /**
   * Get the layer's output canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Update layer config
   */
  update(partial: Partial<LayerConfig>): void {
    this.config = { ...this.config, ...partial };
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.sourceElement = null;
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}
