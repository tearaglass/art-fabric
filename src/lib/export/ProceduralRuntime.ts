/**
 * ProceduralRuntime - Lightweight runtime for rendering procedural traits on-demand
 * 
 * This allows procedural exports (webgl, p5, strudel) to be rendered at any time
 * with deterministic output based on the stored seed.
 */

import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { Trait } from '@/store/useProjectStore';

export class ProceduralRuntime {
  private renderer: TraitRenderer;

  constructor() {
    this.renderer = new TraitRenderer();
  }

  /**
   * Parse a procedural reference string
   * Format: "webgl:presetId:params" | "p5:sketchId:params" | "strudel:pattern"
   */
  private parseProceduralRef(ref: string): { type: string; id: string; params: string } {
    const parts = ref.split(':');
    if (parts.length < 2) {
      throw new Error(`Invalid procedural reference: ${ref}`);
    }

    return {
      type: parts[0],
      id: parts[1],
      params: parts.slice(2).join(':'),
    };
  }

  /**
   * Render a procedural trait to a canvas
   * 
   * @param proceduralRef - The procedural reference string (e.g., "webgl:plasma:params")
   * @param seed - Deterministic seed for reproducible output
   * @param width - Output canvas width
   * @param height - Output canvas height
   * @returns Rendered canvas element
   */
  async render(
    proceduralRef: string,
    seed: string,
    width: number = 512,
    height: number = 512
  ): Promise<HTMLCanvasElement> {
    const { type, id, params } = this.parseProceduralRef(proceduralRef);

    // Create a temporary trait object for rendering
    const trait: Trait = {
      id: `runtime-${Date.now()}`,
      name: `Runtime ${type}:${id}`,
      imageSrc: proceduralRef,
      weight: 100,
      className: 'runtime',
    };

    // Use TraitRenderer to handle all modalities
    return await this.renderer.renderTrait(trait, width, height, seed);
  }

  /**
   * Render a hybrid trait (procedural + thumbnail)
   * Extracts the procedural reference and renders it, ignoring the thumbnail
   * 
   * @param hybridRef - Hybrid reference string (e.g., "webgl:plasma:params|thumbnail:data:image...")
   * @param seed - Deterministic seed
   * @param width - Output width
   * @param height - Output height
   * @returns Rendered canvas element
   */
  async renderHybrid(
    hybridRef: string,
    seed: string,
    width: number = 512,
    height: number = 512
  ): Promise<HTMLCanvasElement> {
    // Extract procedural reference before the thumbnail marker
    const proceduralRef = hybridRef.split('|thumbnail:')[0];
    return await this.render(proceduralRef, seed, width, height);
  }

  /**
   * Get thumbnail from hybrid reference
   * 
   * @param hybridRef - Hybrid reference string
   * @returns Base64 thumbnail data URL or null
   */
  getThumbnail(hybridRef: string): string | null {
    const parts = hybridRef.split('|thumbnail:');
    return parts.length > 1 ? parts[1] : null;
  }

  /**
   * Render a complete token from metadata
   * 
   * @param metadata - Token metadata object with traits
   * @param width - Output width
   * @param height - Output height
   * @returns Composite canvas
   */
  async renderToken(
    metadata: {
      proceduralSeed: string;
      traits: Record<string, { src: string; mode: string }>;
    },
    width: number = 512,
    height: number = 512
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');

    // Render each trait in order
    for (const [classId, traitData] of Object.entries(metadata.traits)) {
      let layerCanvas: HTMLCanvasElement;

      if (traitData.mode === 'static') {
        // Static image - just draw directly
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = traitData.src;
        });
        ctx.drawImage(img, 0, 0, width, height);
        continue;
      } else if (traitData.mode === 'procedural') {
        // Render procedural
        layerCanvas = await this.render(traitData.src, metadata.proceduralSeed, width, height);
      } else if (traitData.mode === 'hybrid') {
        // Render from procedural ref in hybrid
        layerCanvas = await this.renderHybrid(traitData.src, metadata.proceduralSeed, width, height);
      } else {
        continue;
      }

      ctx.drawImage(layerCanvas, 0, 0);
    }

    return canvas;
  }

  /**
   * Batch render multiple tokens in parallel
   * 
   * @param metadataArray - Array of token metadata
   * @param width - Output width
   * @param height - Output height
   * @param batchSize - Number of tokens to render in parallel
   * @returns Array of rendered canvases
   */
  async batchRender(
    metadataArray: Array<{
      proceduralSeed: string;
      traits: Record<string, { src: string; mode: string }>;
    }>,
    width: number = 512,
    height: number = 512,
    batchSize: number = 8
  ): Promise<HTMLCanvasElement[]> {
    const results: HTMLCanvasElement[] = [];

    for (let i = 0; i < metadataArray.length; i += batchSize) {
      const batch = metadataArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(metadata => this.renderToken(metadata, width, height))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * const runtime = new ProceduralRuntime();
 * 
 * // Render a single procedural trait
 * const canvas = await runtime.render(
 *   'webgl:plasma:{"speed":2.5}',
 *   'seed-12345',
 *   1024,
 *   1024
 * );
 * document.body.appendChild(canvas);
 * 
 * // Render from metadata
 * const metadata = {
 *   proceduralSeed: 'seed-12345',
 *   traits: {
 *     'background': { src: 'webgl:plasma:{}', mode: 'procedural' },
 *     'overlay': { src: 'data:image/png...', mode: 'static' }
 *   }
 * };
 * const tokenCanvas = await runtime.renderToken(metadata);
 * ```
 */
