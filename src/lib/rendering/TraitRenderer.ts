import { Trait, TraitClass } from '@/store/useProjectStore';
import { SHADER_PRESETS } from '@/lib/shaders/presets';
import seedrandom from 'seedrandom';

export type TraitSource = 
  | { type: 'image'; imageSrc: string }
  | { type: 'webgl'; presetId: string; params: Record<string, number | number[]> };

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
    }

    this.canvasCache.set(cacheKey, canvas);
    return canvas;
  }

  private parseTraitSource(trait: Trait): TraitSource {
    // Check if trait has webgl data in imageSrc (format: "webgl:presetId:params")
    if (trait.imageSrc.startsWith('webgl:')) {
      const [, presetId, paramsJson] = trait.imageSrc.split(':');
      const params = paramsJson ? JSON.parse(decodeURIComponent(paramsJson)) : {};
      return { type: 'webgl', presetId, params };
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

  clearCache() {
    this.canvasCache.clear();
  }
}
