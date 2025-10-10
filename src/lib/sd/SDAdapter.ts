import { renderCache } from '@/lib/cache/RenderCache';
import { eventBus } from '@/lib/events/EventBus';
import { supabase } from '@/integrations/supabase/client';

export interface SDGraphSpec {
  id: string;
  name: string;
  description: string;
  category: 'portrait' | 'background' | 'object' | 'abstract';
  basePrompt: string;
  params: {
    aspectRatio?: '1:1' | '16:9' | '9:16';
    style?: string;
    quality?: 'high' | 'medium' | 'low';
  };
}

export const SD_GRAPH_PRESETS: SDGraphSpec[] = [
  {
    id: 'portrait_nft',
    name: 'NFT Portrait',
    description: 'Character portrait optimized for PFP collections',
    category: 'portrait',
    basePrompt: 'professional digital portrait, centered composition, clean background, high detail',
    params: {
      aspectRatio: '1:1',
      quality: 'high',
      style: 'digital art',
    },
  },
  {
    id: 'abstract_bg',
    name: 'Abstract Background',
    description: 'Generative abstract background layer',
    category: 'background',
    basePrompt: 'abstract geometric pattern, vibrant colors, seamless texture',
    params: {
      aspectRatio: '1:1',
      quality: 'medium',
      style: 'abstract',
    },
  },
  {
    id: 'accessory_item',
    name: 'Accessory Item',
    description: 'Isolated accessory or item on transparent background',
    category: 'object',
    basePrompt: 'isolated object, transparent background, high detail, studio lighting',
    params: {
      aspectRatio: '1:1',
      quality: 'high',
      style: 'product photo',
    },
  },
  {
    id: 'texture_overlay',
    name: 'Texture Overlay',
    description: 'Tileable texture for compositing',
    category: 'abstract',
    basePrompt: 'seamless tileable texture, subtle pattern, neutral tones',
    params: {
      aspectRatio: '1:1',
      quality: 'medium',
      style: 'texture',
    },
  },
];

export interface SDJob {
  graph: string;
  params: Record<string, any>;
  seed: number;
  prompt: string;
  outSize: { w: number; h: number };
}

export interface SDResult {
  b64: string;
  sha256: string;
  ms: number;
  cached: boolean;
}

export class SDAdapter {
  /**
   * Generate image using Lovable AI (Gemini image generation)
   */
  async generate(job: SDJob): Promise<SDResult> {
    const cacheKey = { job, type: 'sd' };
    
    // Check cache first
    const cached = await renderCache.get(cacheKey);
    if (cached) {
      const parsedResult = JSON.parse(cached);
      eventBus.emit('sd/cached', { jobId: job.graph, hash: parsedResult.sha256 });
      return { ...parsedResult, cached: true };
    }

    const startTime = performance.now();

    // Emit start event
    eventBus.emit('sd/started', { jobId: job.graph, timestamp: Date.now() });

    try {
      // Call Lovable AI edge function for image generation
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: job.prompt,
          seed: job.seed,
          aspectRatio: this.calculateAspectRatio(job.outSize),
        },
      });

      if (error) {
        throw new Error(`SD generation failed: ${error.message}`);
      }

      if (!data?.image) {
        throw new Error('No image data returned from generation');
      }

      const duration = performance.now() - startTime;

      // Generate hash
      const hash = await this.hashString(JSON.stringify(job));

      const result: SDResult = {
        b64: data.image,
        sha256: hash,
        ms: duration,
        cached: false,
      };

      // Cache result
      await renderCache.set('sd', cacheKey, JSON.stringify(result), { 
        name: job.graph 
      });

      // Emit done event
      eventBus.emit('sd/done', { jobId: job.graph, duration, cached: false });

      return result;
    } catch (error) {
      console.error('SD generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate aspect ratio string from dimensions
   */
  private calculateAspectRatio(size: { w: number; h: number }): string {
    const ratio = size.w / size.h;
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
    if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
    return '1:1'; // default
  }

  /**
   * Generate SHA-256 hash
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Build full prompt from graph and params
   */
  buildPrompt(graphSpec: SDGraphSpec, customPrompt: string, params: Record<string, any>): string {
    let prompt = graphSpec.basePrompt;
    
    if (customPrompt) {
      prompt = `${customPrompt}, ${prompt}`;
    }

    if (params.style) {
      prompt = `${prompt}, ${params.style} style`;
    }

    if (graphSpec.params.quality === 'high') {
      prompt = `${prompt}, ultra high resolution, highly detailed`;
    }

    return prompt;
  }
}

export const sdAdapter = new SDAdapter();
