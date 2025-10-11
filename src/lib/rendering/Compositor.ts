/**
 * Compositor - Blend mode compositor for layer composition
 * Implements various blend modes using canvas globalCompositeOperation
 */

import { BlendMode } from './Layer';

export class Compositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true, willReadFrequently: false })!;
  }
  
  /**
   * Set compositor output size
   */
  setSize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  /**
   * Clear the compositor canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Composite a layer onto the output canvas
   */
  composite(
    layerCanvas: HTMLCanvasElement,
    blendMode: BlendMode,
    opacity: number
  ): void {
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.globalCompositeOperation = this.getCompositeOperation(blendMode);
    
    try {
      this.ctx.drawImage(layerCanvas, 0, 0, this.canvas.width, this.canvas.height);
    } catch (err) {
      console.warn('[Compositor] Failed to composite layer:', err);
    }
    
    this.ctx.restore();
  }
  
  /**
   * Get the output canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Map blend mode to canvas composite operation
   */
  private getCompositeOperation(mode: BlendMode): GlobalCompositeOperation {
    const modeMap: Record<BlendMode, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'add': 'lighter',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
    };
    
    return modeMap[mode] || 'source-over';
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}
