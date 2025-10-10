import { renderCache } from '@/lib/cache/RenderCache';
import { eventBus } from '@/lib/events/EventBus';

export interface P5Preset {
  id: string;
  name: string;
  description: string;
  code: string;
  params: Record<string, { value: number; min: number; max: number; label: string }>;
}

export const P5_PRESETS: P5Preset[] = [
  {
    id: 'spiral_vortex',
    name: 'Spiral Vortex',
    description: 'Hypnotic rotating spirals',
    code: `
function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  angleMode(DEGREES);
}

function draw() {
  background(params.bgColor);
  translate(width/2, height/2);
  
  for (let i = 0; i < params.layers; i++) {
    push();
    rotate(i * params.rotation);
    noFill();
    stroke(params.color1 + i * params.colorShift, 100, 200, params.opacity);
    strokeWeight(params.strokeW);
    
    beginShape();
    for (let a = 0; a < 360; a += params.step) {
      let r = params.radius + i * params.spacing + sin(a * params.frequency) * params.amplitude;
      let x = r * cos(a);
      let y = r * sin(a);
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
  }
  
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      layers: { value: 20, min: 5, max: 50, label: 'Layers' },
      rotation: { value: 15, min: 1, max: 45, label: 'Rotation' },
      radius: { value: 50, min: 20, max: 150, label: 'Base Radius' },
      spacing: { value: 8, min: 2, max: 20, label: 'Layer Spacing' },
      amplitude: { value: 30, min: 5, max: 100, label: 'Wave Amplitude' },
      frequency: { value: 3, min: 1, max: 10, label: 'Wave Frequency' },
      step: { value: 5, min: 1, max: 20, label: 'Step Size' },
      strokeW: { value: 2, min: 1, max: 8, label: 'Stroke Weight' },
      color1: { value: 180, min: 0, max: 360, label: 'Hue Start' },
      colorShift: { value: 5, min: 0, max: 50, label: 'Hue Shift' },
      opacity: { value: 150, min: 50, max: 255, label: 'Opacity' },
      bgColor: { value: 10, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'fractal_tree',
    name: 'Fractal Tree',
    description: 'Recursive branching structure',
    code: `
function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  colorMode(HSB);
}

function branch(len, depth) {
  if (depth > params.maxDepth) return;
  
  const hue = map(depth, 0, params.maxDepth, params.hueStart, params.hueEnd);
  stroke(hue, params.saturation, params.brightness, params.opacity);
  strokeWeight(map(depth, 0, params.maxDepth, params.maxThickness, 1));
  
  line(0, 0, 0, -len);
  translate(0, -len);
  
  push();
  rotate(radians(params.angleLeft + random(-params.randomAngle, params.randomAngle)));
  branch(len * params.lengthRatio, depth + 1);
  pop();
  
  push();
  rotate(radians(-params.angleRight + random(-params.randomAngle, params.randomAngle)));
  branch(len * params.lengthRatio, depth + 1);
  pop();
}

function draw() {
  background(params.bgColor);
  translate(width/2, height);
  branch(params.trunkLength, 0);
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      maxDepth: { value: 9, min: 3, max: 12, label: 'Max Depth' },
      trunkLength: { value: 120, min: 50, max: 200, label: 'Trunk Length' },
      lengthRatio: { value: 0.67, min: 0.5, max: 0.9, label: 'Length Ratio' },
      angleLeft: { value: 25, min: 10, max: 60, label: 'Angle Left' },
      angleRight: { value: 25, min: 10, max: 60, label: 'Angle Right' },
      randomAngle: { value: 10, min: 0, max: 30, label: 'Random Angle' },
      maxThickness: { value: 10, min: 1, max: 20, label: 'Max Thickness' },
      hueStart: { value: 120, min: 0, max: 360, label: 'Hue Start' },
      hueEnd: { value: 280, min: 0, max: 360, label: 'Hue End' },
      saturation: { value: 70, min: 0, max: 100, label: 'Saturation' },
      brightness: { value: 90, min: 0, max: 100, label: 'Brightness' },
      opacity: { value: 200, min: 100, max: 255, label: 'Opacity' },
      bgColor: { value: 10, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'flow_field',
    name: 'Flow Field',
    description: 'Perlin noise-driven particle trails',
    code: `
const particles = [];

function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  noiseSeed(params.seed);
  background(params.bgColor);
  
  for (let i = 0; i < params.particleCount; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      prevX: 0,
      prevY: 0
    });
  }
}

function draw() {
  for (let i = 0; i < params.steps; i++) {
    for (const p of particles) {
      p.prevX = p.x;
      p.prevY = p.y;
      
      const angle = noise(p.x * params.noiseScale, p.y * params.noiseScale) * TWO_PI * params.noiseStrength;
      p.x += cos(angle) * params.stepSize;
      p.y += sin(angle) * params.stepSize;
      
      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      stroke(params.strokeColor, params.opacity);
      strokeWeight(params.strokeWeight);
      line(p.prevX, p.prevY, p.x, p.y);
    }
  }
  
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      particleCount: { value: 1000, min: 100, max: 5000, label: 'Particles' },
      steps: { value: 50, min: 10, max: 200, label: 'Steps' },
      stepSize: { value: 2, min: 0.5, max: 10, label: 'Step Size' },
      noiseScale: { value: 0.01, min: 0.001, max: 0.05, label: 'Noise Scale' },
      noiseStrength: { value: 4, min: 1, max: 10, label: 'Noise Strength' },
      strokeWeight: { value: 1, min: 0.5, max: 5, label: 'Stroke Weight' },
      strokeColor: { value: 255, min: 0, max: 255, label: 'Stroke Color' },
      opacity: { value: 30, min: 5, max: 100, label: 'Opacity' },
      bgColor: { value: 0, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'moire_interference',
    name: 'Moiré Interference',
    description: 'Overlapping wave interference patterns',
    code: `
function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
}

function draw() {
  background(params.bgColor);
  loadPixels();
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const d1 = dist(x, y, width * 0.3, height * 0.3);
      const d2 = dist(x, y, width * 0.7, height * 0.7);
      
      const wave1 = sin(d1 * params.frequency1) * params.amplitude;
      const wave2 = sin(d2 * params.frequency2) * params.amplitude;
      const interference = wave1 + wave2;
      
      const idx = (x + y * width) * 4;
      const val = map(interference, -params.amplitude * 2, params.amplitude * 2, 0, 255);
      pixels[idx] = val * params.r;
      pixels[idx + 1] = val * params.g;
      pixels[idx + 2] = val * params.b;
      pixels[idx + 3] = 255;
    }
  }
  
  updatePixels();
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 1024, label: 'Width' },
      height: { value: 512, min: 256, max: 1024, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      frequency1: { value: 0.05, min: 0.01, max: 0.2, label: 'Frequency 1' },
      frequency2: { value: 0.07, min: 0.01, max: 0.2, label: 'Frequency 2' },
      amplitude: { value: 100, min: 50, max: 200, label: 'Amplitude' },
      r: { value: 1, min: 0, max: 1, label: 'Red' },
      g: { value: 0.5, min: 0, max: 1, label: 'Green' },
      b: { value: 0.8, min: 0, max: 1, label: 'Blue' },
      bgColor: { value: 0, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'recursive_subdivision',
    name: 'Recursive Subdivision',
    description: 'Mondrian-style recursive splits',
    code: `
function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  colorMode(HSB);
}

function subdivide(x, y, w, h, depth) {
  if (depth > params.maxDepth || w < params.minSize || h < params.minSize) {
    const hue = random(params.hueMin, params.hueMax);
    fill(hue, params.saturation, params.brightness, params.fillOpacity);
    stroke(params.strokeColor);
    strokeWeight(params.strokeWeight);
    rect(x, y, w, h);
    return;
  }
  
  if (random() < params.splitProb) {
    if (random() < 0.5) {
      // Vertical split
      const splitX = random(w * 0.3, w * 0.7);
      subdivide(x, y, splitX, h, depth + 1);
      subdivide(x + splitX, y, w - splitX, h, depth + 1);
    } else {
      // Horizontal split
      const splitY = random(h * 0.3, h * 0.7);
      subdivide(x, y, w, splitY, depth + 1);
      subdivide(x, y + splitY, w, h - splitY, depth + 1);
    }
  } else {
    const hue = random(params.hueMin, params.hueMax);
    fill(hue, params.saturation, params.brightness, params.fillOpacity);
    stroke(params.strokeColor);
    strokeWeight(params.strokeWeight);
    rect(x, y, w, h);
  }
}

function draw() {
  background(params.bgColor);
  subdivide(0, 0, width, height, 0);
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      maxDepth: { value: 5, min: 2, max: 8, label: 'Max Depth' },
      minSize: { value: 40, min: 20, max: 100, label: 'Min Size' },
      splitProb: { value: 0.7, min: 0.3, max: 0.95, label: 'Split Probability' },
      hueMin: { value: 0, min: 0, max: 360, label: 'Hue Min' },
      hueMax: { value: 360, min: 0, max: 360, label: 'Hue Max' },
      saturation: { value: 80, min: 0, max: 100, label: 'Saturation' },
      brightness: { value: 90, min: 0, max: 100, label: 'Brightness' },
      fillOpacity: { value: 200, min: 100, max: 255, label: 'Fill Opacity' },
      strokeColor: { value: 0, min: 0, max: 255, label: 'Stroke Color' },
      strokeWeight: { value: 3, min: 1, max: 8, label: 'Stroke Weight' },
      bgColor: { value: 255, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'chromatic_aberration',
    name: 'Chromatic Aberration',
    description: 'RGB channel offset glitch effect',
    code: `
const shapes = [];

function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  
  for (let i = 0; i < params.shapeCount; i++) {
    shapes.push({
      x: random(width),
      y: random(height),
      size: random(params.minSize, params.maxSize),
      type: floor(random(3))
    });
  }
}

function draw() {
  background(params.bgColor);
  
  // Draw red channel
  drawShapes(params.offsetR, 0, [255, 0, 0, params.opacity]);
  
  // Draw green channel
  drawShapes(0, params.offsetG, [0, 255, 0, params.opacity]);
  
  // Draw blue channel
  drawShapes(-params.offsetR, -params.offsetG, [0, 0, 255, params.opacity]);
  
  noLoop();
}

function drawShapes(offsetX, offsetY, col) {
  blendMode(ADD);
  noStroke();
  fill(col[0], col[1], col[2], col[3]);
  
  for (const s of shapes) {
    const x = s.x + offsetX;
    const y = s.y + offsetY;
    
    if (s.type === 0) {
      circle(x, y, s.size);
    } else if (s.type === 1) {
      rectMode(CENTER);
      rect(x, y, s.size, s.size);
    } else {
      triangle(x, y - s.size/2, x - s.size/2, y + s.size/2, x + s.size/2, y + s.size/2);
    }
  }
  
  blendMode(BLEND);
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      shapeCount: { value: 30, min: 10, max: 100, label: 'Shape Count' },
      minSize: { value: 30, min: 10, max: 100, label: 'Min Size' },
      maxSize: { value: 100, min: 30, max: 200, label: 'Max Size' },
      offsetR: { value: 8, min: 0, max: 30, label: 'Red Offset' },
      offsetG: { value: 5, min: 0, max: 30, label: 'Green Offset' },
      opacity: { value: 180, min: 50, max: 255, label: 'Opacity' },
      bgColor: { value: 0, min: 0, max: 255, label: 'Background' },
    },
  },
  {
    id: 'circle_pack',
    name: 'Circle Packing',
    description: 'Organic circle packing pattern',
    code: `
const circles = [];

function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  
  for (let i = 0; i < params.attempts; i++) {
    const newCircle = {
      x: random(width),
      y: random(height),
      r: random(params.minRadius, params.maxRadius)
    };
    
    let overlapping = false;
    for (const c of circles) {
      const d = dist(newCircle.x, newCircle.y, c.x, c.y);
      if (d < newCircle.r + c.r + params.spacing) {
        overlapping = true;
        break;
      }
    }
    
    if (!overlapping) {
      circles.push(newCircle);
    }
  }
}

function draw() {
  background(params.bgColor);
  
  for (const c of circles) {
    fill(params.fillColor, params.opacity);
    stroke(params.strokeColor);
    strokeWeight(params.strokeWidth);
    circle(c.x, c.y, c.r * 2);
  }
  
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      attempts: { value: 500, min: 100, max: 2000, label: 'Attempts' },
      minRadius: { value: 5, min: 2, max: 50, label: 'Min Radius' },
      maxRadius: { value: 40, min: 10, max: 200, label: 'Max Radius' },
      spacing: { value: 2, min: 0, max: 20, label: 'Spacing' },
      fillColor: { value: 100, min: 0, max: 255, label: 'Fill Color' },
      strokeColor: { value: 0, min: 0, max: 255, label: 'Stroke Color' },
      bgColor: { value: 255, min: 0, max: 255, label: 'Background' },
      opacity: { value: 200, min: 0, max: 255, label: 'Opacity' },
      strokeWidth: { value: 2, min: 0, max: 10, label: 'Stroke Weight' },
    },
  },
];

export class P5Renderer {
  /**
   * Render p5.js sketch to canvas
   */
  async render(
    preset: P5Preset,
    params: Record<string, any>
  ): Promise<string> {
    const cacheKey = { preset: preset.id, params };
    
    // Check cache first
    const cached = await renderCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = performance.now();

    // Create offscreen iframe for p5
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const iframeDoc = iframe.contentDocument!;
        
        // Inject p5.js
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
            </head>
            <body>
              <script>
                const params = ${JSON.stringify(params)};
                ${preset.code}
                
                // Send canvas data back when done
                setTimeout(() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    parent.postMessage({
                      type: 'p5-render-complete',
                      data: canvas.toDataURL('image/png')
                    }, '*');
                  }
                }, 500);
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'p5-render-complete') {
            window.removeEventListener('message', handleMessage);
            resolve(event.data.data);
          }
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('p5 render timeout'));
        }, 5000);
      });

      const duration = performance.now() - startTime;

      // Cache result
      await renderCache.set('p5', cacheKey, result, { name: preset.name });

      // Emit event
      eventBus.emit('p5/rendered', { sketchName: preset.name, duration });

      return result;
    } finally {
      document.body.removeChild(iframe);
    }
  }
}

export const p5Renderer = new P5Renderer();
