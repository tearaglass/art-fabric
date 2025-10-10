export type ShaderPreset = {
  id: string;
  name: string;
  description: string;
  category: 'background' | 'overlay' | 'effect';
  fragmentShader: string;
  uniforms: Record<string, { type: 'float' | 'vec2' | 'vec3'; default: number | number[]; min?: number; max?: number; label: string }>;
};

export const SHADER_PRESETS: ShaderPreset[] = [
  {
    id: 'perlin_noise',
    name: 'Perlin Noise',
    description: 'Organic noise background',
    category: 'background',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uScale;
uniform vec3 uColor;

// Hash function for noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1 + uSeed, 311.7 + uSeed))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float n = noise(uv * uScale);
  gl_FragColor = vec4(uColor * n, 1.0);
}
    `,
    uniforms: {
      uScale: { type: 'float', default: 5.0, min: 1.0, max: 20.0, label: 'Scale' },
      uColor: { type: 'vec3', default: [0.2, 0.8, 0.9], label: 'Color' },
    },
  },
  {
    id: 'voronoi',
    name: 'Voronoi Cells',
    description: 'Cellular pattern',
    category: 'background',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uScale;
uniform vec3 uColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1 + uSeed, 311.7)), dot(p, vec2(269.5, 183.3 + uSeed)));
  return fract(sin(p) * 43758.5453);
}

float voronoi(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  
  float minDist = 1.0;
  for(int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
      vec2 b = vec2(float(i), float(j));
      vec2 r = b - f + hash2(n + b);
      float d = length(r);
      minDist = min(minDist, d);
    }
  }
  return minDist;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float v = voronoi(uv * uScale);
  gl_FragColor = vec4(uColor * v, 1.0);
}
    `,
    uniforms: {
      uScale: { type: 'float', default: 8.0, min: 2.0, max: 20.0, label: 'Cell Count' },
      uColor: { type: 'vec3', default: [0.5, 0.2, 0.8], label: 'Color' },
    },
  },
  {
    id: 'halftone',
    name: 'Halftone Dots',
    description: 'Retro print effect',
    category: 'overlay',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uDotSize;
uniform float uIntensity;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 grid = fract(uv * uResolution / uDotSize);
  float dist = length(grid - 0.5);
  float dots = smoothstep(0.4, 0.5, dist);
  gl_FragColor = vec4(vec3(dots * uIntensity), 1.0 - dots * uIntensity);
}
    `,
    uniforms: {
      uDotSize: { type: 'float', default: 8.0, min: 2.0, max: 32.0, label: 'Dot Size' },
      uIntensity: { type: 'float', default: 0.3, min: 0.0, max: 1.0, label: 'Intensity' },
    },
  },
  {
    id: 'scanlines',
    name: 'CRT Scanlines',
    description: 'Old monitor effect',
    category: 'overlay',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uLineHeight;
uniform float uIntensity;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float scanline = sin(uv.y * uResolution.y / uLineHeight) * 0.5 + 0.5;
  float alpha = scanline * uIntensity;
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
    `,
    uniforms: {
      uLineHeight: { type: 'float', default: 2.0, min: 1.0, max: 8.0, label: 'Line Height' },
      uIntensity: { type: 'float', default: 0.4, min: 0.0, max: 1.0, label: 'Intensity' },
    },
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Smooth color gradient',
    category: 'background',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uAngle;
uniform vec3 uColorA;
uniform vec3 uColorB;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float angle = radians(uAngle);
  vec2 dir = vec2(cos(angle), sin(angle));
  float t = dot(uv - 0.5, dir) + 0.5;
  vec3 color = mix(uColorA, uColorB, t);
  gl_FragColor = vec4(color, 1.0);
}
    `,
    uniforms: {
      uAngle: { type: 'float', default: 45.0, min: 0.0, max: 360.0, label: 'Angle' },
      uColorA: { type: 'vec3', default: [0.1, 0.8, 0.9], label: 'Color A' },
      uColorB: { type: 'vec3', default: [0.5, 0.2, 0.8], label: 'Color B' },
    },
  },
  {
    id: 'grid',
    name: 'Grid Pattern',
    description: 'Geometric grid lines',
    category: 'overlay',
    fragmentShader: `
precision mediump float;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uGridSize;
uniform float uLineWidth;
uniform vec3 uColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 grid = fract(uv * uGridSize);
  float lines = step(1.0 - uLineWidth, grid.x) + step(1.0 - uLineWidth, grid.y);
  gl_FragColor = vec4(uColor, lines);
}
    `,
    uniforms: {
      uGridSize: { type: 'float', default: 10.0, min: 2.0, max: 50.0, label: 'Grid Size' },
      uLineWidth: { type: 'float', default: 0.05, min: 0.01, max: 0.2, label: 'Line Width' },
      uColor: { type: 'vec3', default: [0.2, 0.8, 0.9], label: 'Line Color' },
    },
  },
];
