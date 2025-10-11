import { Trait, TraitClass } from '@/store/useProjectStore';
import { SHADER_PRESETS } from '@/lib/shaders/presets';
import seedrandom from 'seedrandom';

export type TraitSource = 
  | { type: 'image'; imageSrc: string }
  | { type: 'webgl'; presetId: string; params: Record<string, number | number[]> }
  | { type: 'p5'; presetId: string; params: Record<string, any> }
  | { type: 'strudel'; presetId: string; params: Record<string, any> }
  | { type: 'sd'; graphId: string; prompt: string; seed: number; params: Record<string, any> };

export class TraitRenderer {
  private canvasCache = new Map<string, HTMLCanvasElement>();

  async renderTrait(
    trait: Trait,
    width: number,
    height: number,
    seed: string
  ): Promise<HTMLCanvasElement> {
    const cacheKey = `${trait.id}-${seed}-${width}x${height}`;
    
    if (this.canvasCache.has(cacheKey)) {
      return this.canvasCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Parse trait source
    const source = this.parseTraitSource(trait);

    if (source.type === 'image') {
      await this.renderImageTrait(canvas, source.imageSrc);
    } else if (source.type === 'webgl') {
      await this.renderWebGLTrait(canvas, source.presetId, source.params, seed);
    } else if (source.type === 'p5') {
      await this.renderP5Trait(canvas, source.presetId, source.params, seed);
    } else if (source.type === 'strudel') {
      await this.renderStrudelTrait(canvas, source.presetId, source.params, seed);
    } else if (source.type === 'sd') {
      await this.renderSDTrait(canvas, source.graphId, source.prompt, source.seed, source.params);
    }

    this.canvasCache.set(cacheKey, canvas);
    return canvas;
  }

  private parseTraitSource(trait: Trait): TraitSource {
    try {
      // Check if trait has webgl data in imageSrc (format: "webgl:presetId:params")
      if (trait.imageSrc.startsWith('webgl:')) {
        const parts = trait.imageSrc.split(':');
        let presetId = parts[1];
        const paramsJson = parts.slice(2).join(':'); // Rejoin in case there are colons in JSON
        const params = paramsJson ? JSON.parse(paramsJson) : {};
        
        // Apply aliases for backward compatibility
        const webglAliases: Record<string, string> = {
          'crt': 'scanlines',
          'perlin-noise': 'perlin_noise'
        };
        presetId = webglAliases[presetId] || presetId;
        
        return { type: 'webgl', presetId, params };
      }
      
      // Check for p5.js source (format: "p5:presetId:params")
      if (trait.imageSrc.startsWith('p5:')) {
        const parts = trait.imageSrc.split(':');
        let presetId = parts[1];
        const paramsJson = parts.slice(2).join(':');
        const params = paramsJson ? JSON.parse(paramsJson) : {};
        
        // Apply aliases for backward compatibility
        const p5Aliases: Record<string, string> = {
          'circle-pack': 'circle_pack',
          'flow-field': 'flow_field',
          'geometric-shapes': 'chromatic_aberration'
        };
        presetId = p5Aliases[presetId] || presetId;
        
        return { type: 'p5', presetId, params };
      }
      
      // Check for Strudel source (format: "strudel:presetId:params")
      if (trait.imageSrc.startsWith('strudel:')) {
        const parts = trait.imageSrc.split(':');
        const presetId = parts[1];
        const paramsJson = parts.slice(2).join(':');
        const params = paramsJson ? JSON.parse(paramsJson) : {};
        return { type: 'strudel', presetId, params };
      }
      
      // Check for SD source (format: "sd:{json}" or legacy "sd:graphId:seed:params")
      if (trait.imageSrc.startsWith('sd:')) {
        const rest = trait.imageSrc.substring(3);
        let config: any;
        
        // Try canonical JSON format first
        if (rest.startsWith('{')) {
          config = JSON.parse(rest);
        } else {
          // Legacy format: "sd:graphId:seed:encodedParamsJson"
          const parts = rest.split(':');
          const graphId = parts[0];
          const seed = Number(parts[1]) || Math.floor(Math.random() * 1000000);
          const paramsJson = parts[2] ? decodeURIComponent(parts[2]) : '{}';
          const legacyParams = JSON.parse(paramsJson);
          config = {
            graphId,
            seed,
            prompt: legacyParams.customPrompt || '',
            params: {}
          };
        }
        
        // Apply alias and fallback for graphId
        const graphAliases: Record<string, string> = {
          'portrait': 'portrait_nft'
        };
        const graphId = graphAliases[config.graphId] || config.graphId || 'portrait_nft';
        
        return { 
          type: 'sd', 
          graphId,
          seed: config.seed || Math.floor(Math.random() * 1000000),
          prompt: config.prompt || '',
          params: config.params || {}
        };
      }
    } catch (error) {
      console.error('Error parsing trait source:', trait.imageSrc, error);
      // Return a default image type if parsing fails
      return { type: 'image', imageSrc: '' };
    }
    
    return { type: 'image', imageSrc: trait.imageSrc };
  }

  private async renderImageTrait(canvas: HTMLCanvasElement, imageSrc: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve();
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  private async renderWebGLTrait(
    canvas: HTMLCanvasElement,
    presetId: string,
    params: Record<string, number | number[]>,
    seed: string
  ): Promise<void> {
    const preset = SHADER_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Shader preset ${presetId} not found`);
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    // Create shader program
    const program = this.createShaderProgram(gl, preset.fragmentShader);
    if (!program) {
      throw new Error('Failed to create shader program');
    }

    gl.useProgram(program);

    // Set up geometry (fullscreen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'uResolution');
    gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

    const seedLoc = gl.getUniformLocation(program, 'uSeed');
    const rng = seedrandom(seed);
    gl.uniform1f(seedLoc, rng() * 1000);

    // Set preset-specific uniforms
    for (const [name, config] of Object.entries(preset.uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      const value = params[name] ?? config.default;

      if (config.type === 'float') {
        gl.uniform1f(loc, value as number);
      } else if (config.type === 'vec2') {
        const arr = Array.isArray(value) ? value : [value, value];
        gl.uniform2f(loc, arr[0], arr[1]);
      } else if (config.type === 'vec3') {
        const arr = Array.isArray(value) ? value : [value, value, value];
        gl.uniform3f(loc, arr[0], arr[1], arr[2]);
      }
    }

    // Render
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.deleteProgram(program);
    gl.deleteBuffer(positionBuffer);
  }

  private createShaderProgram(gl: WebGL2RenderingContext, fragmentSource: string): WebGLProgram | null {
    const vertexSource = `#version 300 es
      in vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Clean up fragment source: remove old precision, replace gl_FragColor
    let cleanFragSource = fragmentSource
      .replace(/precision\s+\w+\s+float;/g, '')
      .replace(/gl_FragColor/g, 'fragColor');
    
    // Build final fragment shader with version header
    const fragmentSourceWithVersion = `#version 300 es
      precision mediump float;
      out vec4 fragColor;
      ${cleanFragSource}
    `;

    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSourceWithVersion);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private async renderP5Trait(
    canvas: HTMLCanvasElement,
    presetId: string,
    params: Record<string, any>,
    seed: string
  ): Promise<void> {
    const { P5_PRESETS, P5Renderer } = await import('@/lib/p5/P5Renderer');
    
    const preset = P5_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`P5 preset ${presetId} not found`);
    }

    const renderer = new P5Renderer();
    const dataUrl = await renderer.render(preset, params);

    // Convert base64 to image and draw to canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private async renderStrudelTrait(
    canvas: HTMLCanvasElement,
    presetId: string,
    params: Record<string, any>,
    seed: string
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Deterministic visualization of Strudel pattern (piano-roll style)
    const pattern = params.pattern || 'c3 ~ e3 g3 ~ c3 ~ e3 g3';
    const root = params.root || 'c';
    const mode = params.mode || 'dorian';
    const steps = 16;
    const bars = params.bars || 1;
    
    // Background
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < steps * bars; i++) {
      const x = Math.floor((i / (steps * bars)) * canvas.width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r < 12; r++) {
      const y = Math.floor((r / 12) * canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, canvas.height - y);
      ctx.stroke();
    }
    
    // Parse pattern into cells
    const cells = this.parseCells(pattern);
    const onCol = this.colorFromSeed(seed, 0.9);
    const ghost = 'rgba(255,255,255,0.15)';
    
    const cellW = canvas.width / (steps * bars);
    const laneH = canvas.height / 12;
    
    cells.forEach((tok, i) => {
      const x = i * cellW;
      if (tok === '~') {
        // Rest
        ctx.fillStyle = ghost;
        ctx.fillRect(x + 1, canvas.height - laneH * 2, Math.max(1, cellW - 2), 2);
        return;
      }
      
      // Note lane by pitch
      const match = /^([a-g][#b]?)(\d)$/.exec(tok);
      if (!match) return;
      
      const [, name, octStr] = match;
      const oct = parseInt(octStr);
      const degreeMap: Record<string, number> = {
        'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4, 'f': 5,
        'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'b': 11
      };
      const idx = degreeMap[name] || 0;
      const lane = oct % 2 === 0 ? 11 - idx : idx;
      
      const y = lane * laneH;
      
      // Note body (rounded rect)
      ctx.fillStyle = onCol;
      const r = 8;
      const x2 = x + cellW - 1;
      const y2 = y + laneH - 2;
      
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x2, y, x2, y + r, r);
      ctx.arcTo(x2, y2, x2 - r, y2, r);
      ctx.arcTo(x, y2, x, y2 - r, r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
      
      // Vertical accent
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 2, y + 2, 2, laneH - 6);
    });
    
    // Legend
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`${root} ${mode} · ${steps}stp x ${bars}bar`, 10, canvas.height - 10);
  }
  
  private parseCells(pattern: string): string[] {
    const raw = pattern.trim().split(/\s+/);
    const out: string[] = [];
    
    for (const tok of raw) {
      const m = /^([a-g][#b]?\d)(?:\*(\d+))?$/.exec(tok);
      if (!m) {
        out.push(tok);
        continue;
      }
      const times = m[2] ? Math.max(1, +m[2]) : 1;
      for (let i = 0; i < times; i++) out.push(m[1]);
    }
    
    return out;
  }
  
  private colorFromSeed(seed: string, alpha = 1): string {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hue = ((h % 360) + 360) % 360;
    return `hsla(${hue}, 90%, 60%, ${alpha})`;
  }

  private async renderSDTrait(
    canvas: HTMLCanvasElement,
    graphId: string,
    prompt: string,
    seed: number,
    params: Record<string, any>
  ): Promise<void> {
    const { SD_GRAPH_PRESETS, SDAdapter } = await import('@/lib/sd/SDAdapter');
    
    let graph = SD_GRAPH_PRESETS.find(g => g.id === graphId);
    if (!graph) {
      console.warn(`SD graph ${graphId} not found, using default`);
      graph = SD_GRAPH_PRESETS[0]; // Fallback to first preset
    }

    const adapter = new SDAdapter();
    const fullPrompt = adapter.buildPrompt(graph, prompt, graph.params);

    const result = await adapter.generate({
      graph: graphId,
      params: graph.params,
      seed,
      prompt: fullPrompt,
      outSize: { w: canvas.width, h: canvas.height },
    });

    // Convert base64 to image and draw to canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve();
      };
      img.onerror = reject;
      img.src = result.b64;
    });
  }

  clearCache() {
    this.canvasCache.clear();
  }
}
