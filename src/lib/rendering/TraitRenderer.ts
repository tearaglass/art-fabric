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

    const fragmentSourceWithVersion = `#version 300 es
      ${fragmentSource.replace('precision mediump float;', '')}
      precision mediump float;
      out vec4 fragColor;
      ${fragmentSource.includes('gl_FragColor') ? '' : 'void main() { fragColor = vec4(1.0); }'}
    `.replace(/gl_FragColor/g, 'fragColor');

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
    const { STRUDEL_PRESETS, StrudelRenderer } = await import('@/lib/strudel/StrudelRenderer');
    
    const preset = STRUDEL_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Strudel preset ${presetId} not found`);
    }

    const renderer = new StrudelRenderer();
    const result = await renderer.render({
      pattern: params.pattern || preset.pattern,
      tempo: params.tempo || preset.tempo,
      bars: params.bars || preset.bars,
      kitId: params.kitId || preset.kitId,
      seed: parseInt(seed),
    });

    // Render waveform visualization
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create audio context to decode waveform
    const audioContext = new AudioContext();
    const response = await fetch(result.audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Draw waveform
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < canvas.width; i++) {
      const slice = channelData.slice(i * step, (i + 1) * step);
      const values = Array.from(slice);
      const min = Math.min(...values) as number;
      const max = Math.max(...values) as number;
      
      if (i === 0) {
        ctx.moveTo(i, amp + min * amp);
      }
      ctx.lineTo(i, amp + min * amp);
      ctx.lineTo(i, amp + max * amp);
    }

    ctx.stroke();

    // Add metadata overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px monospace';
    ctx.fillText(`🔊 ${result.metadata.tempo} BPM | ${result.metadata.bars} bars`, 10, 20);
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
