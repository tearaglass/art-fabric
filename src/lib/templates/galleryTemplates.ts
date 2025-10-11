import { ProjectState } from '@/store/useProjectStore';

export interface GalleryTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  projectData: Partial<ProjectState>;
}

export const GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    id: 'cyberpunk-portrait',
    name: 'Cyberpunk Portrait Series',
    description: 'Neon-soaked AI portraits with halftone and CRT effects',
    thumbnail: '🌃',
    projectData: {
      projectName: 'Cyberpunk Portrait Series',
      seed: 'cyber-' + Date.now(),
      traitClasses: [
        {
          id: 'bg-class',
          name: 'Background',
          zIndex: 1,
          folders: [],
          traits: [
            {
              id: 'bg-1',
              name: 'Neon Grid',
              imageSrc: 'webgl:grid:{"spacing":30,"lineWidth":2,"color":[0,1,1],"opacity":0.6}',
              weight: 40,
              className: 'Background'
            },
            {
              id: 'bg-2',
              name: 'Plasma Waves',
              imageSrc: 'webgl:perlin-noise:{"scale":3.5,"octaves":6,"speed":0.5}',
              weight: 30,
              className: 'Background'
            },
            {
              id: 'bg-3',
              name: 'Dark Gradient',
              imageSrc: 'webgl:gradient:{"color1":[0.05,0.05,0.15],"color2":[0.15,0.05,0.25],"angle":90}',
              weight: 30,
              className: 'Background'
            }
          ]
        },
        {
          id: 'char-class',
          name: 'Character',
          zIndex: 2,
          folders: [],
          traits: [
            {
              id: 'char-1',
              name: 'Cyberpunk Cat',
              imageSrc: 'sd:{"graphId":"portrait","prompt":"cyberpunk cat with neon eyes, vaporwave aesthetic","params":{"style":"vibrant","mood":"energetic"}}',
              weight: 33,
              className: 'Character'
            },
            {
              id: 'char-2',
              name: 'Robot Portrait',
              imageSrc: 'sd:{"graphId":"portrait","prompt":"futuristic android portrait, holographic display","params":{"style":"cinematic","mood":"mysterious"}}',
              weight: 33,
              className: 'Character'
            },
            {
              id: 'char-3',
              name: 'Neon Being',
              imageSrc: 'sd:{"graphId":"portrait","prompt":"person with glowing neon tattoos, cyberpunk city","params":{"style":"vibrant","mood":"edgy"}}',
              weight: 34,
              className: 'Character'
            }
          ]
        }
      ],
      fxConfigs: [
        {
          id: 'fx-halftone',
          name: 'Halftone',
          type: 'halftone' as const,
          enabled: true,
          params: { dotSize: 3, angle: 22.5, contrast: 1.3 }
        },
        {
          id: 'fx-crt',
          name: 'CRT Effect',
          type: 'crt' as const,
          enabled: true,
          params: { lineWidth: 1, brightness: 1.2, distortion: 0.15 }
        }
      ],
      rules: []
    }
  },
  {
    id: 'abstract-geometry',
    name: 'Abstract Geometry',
    description: 'Pure algorithmic art with P5.js and WebGL shaders',
    thumbnail: '🔷',
    projectData: {
      projectName: 'Abstract Geometry Collection',
      seed: 'geo-' + Date.now(),
      traitClasses: [
        {
          id: 'bg-class',
          name: 'Background',
          zIndex: 1,
          folders: [],
          traits: [
            {
              id: 'bg-1',
              name: 'Voronoi',
              imageSrc: 'webgl:voronoi:{"points":25,"colorScheme":"plasma","animate":false}',
              weight: 50,
              className: 'Background'
            },
            {
              id: 'bg-2',
              name: 'Gradient',
              imageSrc: 'webgl:gradient:{"color1":[0.1,0.1,0.2],"color2":[0.8,0.3,0.5],"angle":135}',
              weight: 50,
              className: 'Background'
            }
          ]
        },
        {
          id: 'pattern-class',
          name: 'Pattern',
          zIndex: 2,
          folders: [],
          traits: [
            {
              id: 'pat-1',
              name: 'Flow Field',
              imageSrc: 'p5:flow-field:{"particles":2000,"noiseScale":0.008,"strokeWeight":1.5,"palette":"vibrant"}',
              weight: 33,
              className: 'Pattern'
            },
            {
              id: 'pat-2',
              name: 'Circle Pack',
              imageSrc: 'p5:circle-pack:{"count":80,"minRadius":3,"maxRadius":60,"colorMode":"monochrome"}',
              weight: 33,
              className: 'Pattern'
            },
            {
              id: 'pat-3',
              name: 'Triangles',
              imageSrc: 'p5:geometric-shapes:{"shapes":"triangles","count":50,"symmetry":true}',
              weight: 34,
              className: 'Pattern'
            }
          ]
        }
      ],
      fxConfigs: [
        {
          id: 'fx-glitch',
          name: 'Glitch',
          type: 'glitch' as const,
          enabled: true,
          params: { intensity: 0.3, frequency: 0.05 }
        }
      ],
      rules: []
    }
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    description: 'Calm, meditative compositions with ambient soundscapes',
    thumbnail: '🧘',
    projectData: {
      projectName: 'Minimal Zen Collection',
      seed: 'zen-' + Date.now(),
      traitClasses: [
        {
          id: 'bg-class',
          name: 'Background',
          zIndex: 1,
          folders: [],
          traits: [
            {
              id: 'bg-1',
              name: 'Soft Gradient',
              imageSrc: 'webgl:gradient:{"color1":[0.9,0.9,0.95],"color2":[0.95,0.93,0.9],"angle":180}',
              weight: 60,
              className: 'Background'
            },
            {
              id: 'bg-2',
              name: 'Subtle Noise',
              imageSrc: 'webgl:perlin-noise:{"scale":1.5,"octaves":2,"speed":0.1}',
              weight: 40,
              className: 'Background'
            }
          ]
        },
        {
          id: 'element-class',
          name: 'Element',
          zIndex: 2,
          folders: [],
          traits: [
            {
              id: 'el-1',
              name: 'Single Circle',
              imageSrc: 'p5:circle-pack:{"count":1,"minRadius":100,"maxRadius":150,"colorMode":"monochrome"}',
              weight: 50,
              className: 'Element'
            },
            {
              id: 'el-2',
              name: 'Line Grid',
              imageSrc: 'webgl:grid:{"spacing":40,"lineWidth":1,"color":[0.2,0.2,0.2],"opacity":0.15}',
              weight: 50,
              className: 'Element'
            }
          ]
        },
        {
          id: 'audio-class',
          name: 'Audio',
          zIndex: 3,
          folders: [],
          traits: [
            {
              id: 'audio-1',
              name: 'Ambient Drone',
              imageSrc: 'strudel:ambient:{"tempo":60,"pattern":"<c2 e2 g2>.slow(8)"}',
              weight: 100,
              className: 'Audio'
            }
          ]
        }
      ],
      fxConfigs: [],
      rules: []
    }
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    description: 'Pixel art vibes with chiptune beats',
    thumbnail: '🕹️',
    projectData: {
      projectName: 'Retro Arcade Collection',
      seed: 'retro-' + Date.now(),
      traitClasses: [
        {
          id: 'bg-class',
          name: 'Background',
          zIndex: 1,
          folders: [],
          traits: [
            {
              id: 'bg-1',
              name: 'Grid Pattern',
              imageSrc: 'webgl:grid:{"spacing":16,"lineWidth":2,"color":[0,1,0.5],"opacity":0.8}',
              weight: 50,
              className: 'Background'
            },
            {
              id: 'bg-2',
              name: 'Halftone Dots',
              imageSrc: 'webgl:halftone:{"dotSize":8,"angle":0,"contrast":1.5}',
              weight: 50,
              className: 'Background'
            }
          ]
        },
        {
          id: 'sprite-class',
          name: 'Sprite',
          zIndex: 2,
          folders: [],
          traits: [
            {
              id: 'spr-1',
              name: 'Geometric Blocks',
              imageSrc: 'p5:geometric-shapes:{"shapes":"squares","count":20,"symmetry":false}',
              weight: 100,
              className: 'Sprite'
            }
          ]
        },
        {
          id: 'audio-class',
          name: 'Audio',
          zIndex: 3,
          folders: [],
          traits: [
            {
              id: 'audio-1',
              name: 'Chiptune Beat',
              imageSrc: 'strudel:breakbeat:{"tempo":160,"pattern":"[bd cp, hh*8]"}',
              weight: 100,
              className: 'Audio'
            }
          ]
        }
      ],
      fxConfigs: [
        {
          id: 'fx-crt',
          name: 'CRT Effect',
          type: 'crt' as const,
          enabled: true,
          params: { lineWidth: 3, brightness: 1.3, distortion: 0.2 }
        }
      ],
      rules: []
    }
  }
];
