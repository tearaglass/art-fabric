import { useEffect, useRef, useState } from 'react';
import { strudelBus } from '@/lib/strudel/bus';

type Uniforms = Record<string, number | [number, number] | [number, number, number] | [number, number, number, number]>;

const DEFAULT_FS = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uBPM;
uniform vec4  uMacros;   // Tone, Movement, Space, Grit
uniform vec2  uMouse;    // 0..1

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.0,289.0))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = (uv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);

  // background gradient driven by scale-ish knobs
  float hue = fract(0.62 + 0.22 * uSeed + 0.15*uMacros.x + 0.07*sin(uTime*0.1));
  float sat = 0.85 - 0.25*uMacros.z;
  float val = 0.9;
  // quick HSV→RGB
  vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
  vec3 rgb = clamp(abs(mod(hue+K,1.0)*6.0-3.0)-1.0,0.0,1.0);
  rgb = mix(vec3(1.0), rgb, sat) * val;

  // halftone dots overlay (Movement=LFO)
  float cell = mix(6.0, 40.0, uMacros.y);
  vec2 gv = fract(uv*cell) - 0.5;
  float d = length(gv);
  float r = mix(0.08, 0.32, 0.5+0.5*sin(uTime*3.1415*(uBPM/60.0) + hash(floor(uv*cell))*6.283));
  float dotLayer = smoothstep(r, r-0.02, d);

  // scanlines (Space)
  float scan = 0.06 * sin((uv.y + uTime*0.3) * 1200.0) * uMacros.z;

  // mouse vignette
  float vign = smoothstep(0.85, 0.2, distance(uv, uMouse));

  vec3 col = rgb * (0.75 + 0.25*vign);
  col = mix(col, col*0.25, dotLayer);
  col += scan;

  // grit
  col = mix(col, pow(col, vec3(0.6)), uMacros.w*0.6);

  fragColor = vec4(col, 1.0);
}
`;

interface ShaderPreviewProps {
  fragmentSource?: string;
  seed?: number;
}

export function ShaderPreview({ fragmentSource, seed = 0.1234 }: ShaderPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
    if (!gl) {
      setErr('WebGL2 unavailable');
      return;
    }

    let raf = 0;
    let program: WebGLProgram | null = null;
    let mouse: [number, number] = [0.5, 0.5];
    let bpm = 120;
    let macros: [number, number, number, number] = [0.6, 0.5, 0.3, 0.1];

    const unsubBus = strudelBus.on((msg) => {
      if (msg.type === 'tempo') bpm = msg.bpm;
      if (msg.type === 'macro') {
        const idx = { Tone: 0, Movement: 1, Space: 2, Grit: 3 }[msg.key];
        if (idx !== undefined) macros[idx] = msg.value;
      }
    });

    // Mouse tracking
    const handlePointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    canvas.addEventListener('pointermove', handlePointerMove);

    function compile(fsSource: string) {
      const vs = `#version 300 es
        precision highp float;
        in vec2 aPos;
        void main(){ gl_Position = vec4(aPos,0.0,1.0); }`;
      
      const quad = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const vsObj = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vsObj, vs);
      gl.compileShader(vsObj);
      if (!gl.getShaderParameter(vsObj, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vsObj) || 'VS compile error');
      }

      const fsObj = gl.createShader(gl.FRAGMENT_SHADER)!;
      const fs = fragmentSource?.trim() ? fragmentSource : DEFAULT_FS;
      gl.shaderSource(fsObj, fs);
      gl.compileShader(fsObj);
      
      if (!gl.getShaderParameter(fsObj, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(fsObj) || 'FS compile error';
        // Fallback to default
        gl.shaderSource(fsObj, DEFAULT_FS);
        gl.compileShader(fsObj);
        if (!gl.getShaderParameter(fsObj, gl.COMPILE_STATUS)) {
          throw new Error(log);
        }
        setErr(log);
      } else {
        setErr(null);
      }

      const prog = gl.createProgram()!;
      gl.attachShader(prog, vsObj);
      gl.attachShader(prog, fsObj);
      gl.linkProgram(prog);
      
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || 'Link error');
      }

      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      
      return prog;
    }

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth | 0;
      const h = canvas.clientHeight | 0;
      const W = Math.max(2, Math.floor(w * dpr));
      const H = Math.max(2, Math.floor(h * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      gl.viewport(0, 0, W, H);
    }

    try {
      program = compile(fragmentSource || DEFAULT_FS);
    } catch (e: any) {
      setErr(e.message || String(e));
      program = compile(DEFAULT_FS);
    }

    const uRes = gl.getUniformLocation(program!, 'uResolution');
    const uTime = gl.getUniformLocation(program!, 'uTime');
    const uSeed = gl.getUniformLocation(program!, 'uSeed');
    const uBPM = gl.getUniformLocation(program!, 'uBPM');
    const uMac = gl.getUniformLocation(program!, 'uMacros');
    const uMouse = gl.getUniformLocation(program!, 'uMouse');

    const t0 = performance.now();
    const loop = () => {
      resize();
      const t = (performance.now() - t0) / 1000;
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uSeed, seed);
      gl.uniform1f(uBPM, bpm);
      gl.uniform4f(uMac, macros[0], macros[1], macros[2], macros[3]);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsubBus();
      canvas.removeEventListener('pointermove', handlePointerMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [fragmentSource, seed]);

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      <canvas ref={canvasRef} className="w-full aspect-video block" />
      {err && (
        <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-destructive/10 text-destructive-foreground border border-destructive/30 max-w-sm">
          shader error → showing fallback
          <br />
          {err.split('\n')[0]}
        </div>
      )}
    </div>
  );
}
