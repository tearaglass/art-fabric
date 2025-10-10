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
    id: 'ribbon_text',
    name: 'Ribbon Text',
    description: 'Flowing ribbon with text overlay',
    code: `
function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  noiseSeed(params.seed);
}

function draw() {
  background(params.bgColor);
  
  // Draw flowing ribbons
  noFill();
  stroke(params.ribbonColor);
  strokeWeight(params.ribbonWidth);
  
  for (let i = 0; i < 5; i++) {
    beginShape();
    for (let x = 0; x < width; x += 10) {
      let y = height/2 + sin((x + i * 50) * 0.01) * params.amplitude;
      let n = noise(x * 0.01, i) * params.noiseScale;
      vertex(x, y + n);
    }
    endShape();
  }
  
  // Draw text
  fill(params.textColor);
  noStroke();
  textSize(params.textSize);
  textAlign(CENTER, CENTER);
  text(params.text, width/2, height/2);
  
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      amplitude: { value: 50, min: 10, max: 200, label: 'Wave Amplitude' },
      noiseScale: { value: 20, min: 5, max: 100, label: 'Noise Scale' },
      ribbonWidth: { value: 3, min: 1, max: 10, label: 'Ribbon Width' },
      ribbonColor: { value: 200, min: 0, max: 255, label: 'Ribbon Color' },
      bgColor: { value: 240, min: 0, max: 255, label: 'Background' },
      textColor: { value: 0, min: 0, max: 255, label: 'Text Color' },
      textSize: { value: 48, min: 12, max: 120, label: 'Text Size' },
      text: { value: 0, min: 0, max: 0, label: 'Text (string)' },
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
  
  // Generate packed circles
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
      strokeWidth: { value: 2, min: 0, max: 10, label: 'Stroke Width' },
    },
  },
  {
    id: 'particles',
    name: 'Particle Field',
    description: 'Animated particle system snapshot',
    code: `
const particles = [];

function setup() {
  createCanvas(params.width, params.height);
  randomSeed(params.seed);
  
  for (let i = 0; i < params.count; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(params.minSize, params.maxSize),
      alpha: random(params.minAlpha, params.maxAlpha)
    });
  }
}

function draw() {
  background(params.bgColor);
  
  noStroke();
  for (const p of particles) {
    fill(params.particleColor, p.alpha);
    circle(p.x, p.y, p.size);
  }
  
  noLoop();
}
    `,
    params: {
      width: { value: 512, min: 256, max: 2048, label: 'Width' },
      height: { value: 512, min: 256, max: 2048, label: 'Height' },
      seed: { value: 42, min: 0, max: 999999, label: 'Seed' },
      count: { value: 200, min: 50, max: 1000, label: 'Particle Count' },
      minSize: { value: 2, min: 1, max: 20, label: 'Min Size' },
      maxSize: { value: 8, min: 2, max: 50, label: 'Max Size' },
      minAlpha: { value: 50, min: 10, max: 200, label: 'Min Alpha' },
      maxAlpha: { value: 200, min: 50, max: 255, label: 'Max Alpha' },
      particleColor: { value: 100, min: 0, max: 255, label: 'Particle Color' },
      bgColor: { value: 20, min: 0, max: 255, label: 'Background' },
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
