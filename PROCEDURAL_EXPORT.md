# Procedural Export Guide

LaneyGen supports **three export modes** for NFT collections, each with different tradeoffs between file size, compatibility, and flexibility.

---

## 📦 Export Modes

### 1. **Static PNG** (Default)
- **File size**: ~500KB per trait (large)
- **Compatibility**: Works everywhere (OpenSea, etc.)
- **Rendering**: Pre-rendered, fixed output
- **Use case**: Maximum compatibility, traditional NFTs

**Example metadata**:
```json
{
  "name": "My NFT #1",
  "image": "images/1.png",
  "renderMode": "static",
  "traits": {
    "background": { "src": "data:image/png;base64,...", "mode": "static" }
  }
}
```

---

### 2. **Procedural** (100x smaller)
- **File size**: ~1KB per trait (tiny!)
- **Compatibility**: Requires ProceduralRuntime to render
- **Rendering**: Generated on-demand, infinite variations possible
- **Use case**: Efficient storage, creative flexibility, live generative art

**Example metadata**:
```json
{
  "name": "My NFT #1",
  "image": "procedural",
  "renderMode": "procedural",
  "proceduralSeed": "seed-12345",
  "traits": {
    "background": { 
      "src": "webgl:plasma:{\"speed\":2.5,\"colorShift\":0.8}", 
      "mode": "procedural" 
    }
  }
}
```

**File size comparison**:
- Static 10,000-token collection: ~5GB
- Procedural 10,000-token collection: ~10MB (**500x smaller!**)

---

### 3. **Hybrid** (Best of both worlds)
- **File size**: ~100KB per trait (medium)
- **Compatibility**: Thumbnails for platforms, procedural for full quality
- **Rendering**: Low-res preview included, full-res rendered on-demand
- **Use case**: Display previews on marketplaces, render full quality when needed

**Example metadata**:
```json
{
  "name": "My NFT #1",
  "image": "images/1.png",
  "renderMode": "hybrid",
  "proceduralSeed": "seed-12345",
  "traits": {
    "background": { 
      "src": "webgl:plasma:{...}|thumbnail:data:image/png;base64,...", 
      "mode": "hybrid" 
    }
  }
}
```

---

## 🔧 Using ProceduralRuntime

The `ProceduralRuntime` class allows you to render procedural traits on-demand in any JavaScript environment.

### Installation
```typescript
import { ProceduralRuntime } from '@/lib/export/ProceduralRuntime';

const runtime = new ProceduralRuntime();
```

### Basic Usage

**Render a single procedural trait**:
```typescript
const canvas = await runtime.render(
  'webgl:plasma:{"speed":2.5}',  // Procedural reference
  'seed-12345',                   // Deterministic seed
  1024,                           // Width
  1024                            // Height
);

// Display or save the canvas
document.body.appendChild(canvas);
```

**Render from metadata**:
```typescript
const metadata = {
  proceduralSeed: 'seed-12345',
  traits: {
    'background': { src: 'webgl:plasma:{}', mode: 'procedural' },
    'overlay': { src: 'p5:sketch1:{}', mode: 'procedural' },
    'border': { src: 'data:image/png;base64,...', mode: 'static' }
  }
};

const canvas = await runtime.renderToken(metadata, 2048, 2048);
```

**Batch rendering** (for gallery views):
```typescript
const metadataArray = [metadata1, metadata2, metadata3, ...];

const canvases = await runtime.batchRender(
  metadataArray,
  512,   // Width
  512,   // Height
  8      // Batch size (parallel renders)
);

// Display all canvases
canvases.forEach(canvas => gallery.appendChild(canvas));
```

---

## 🎨 Supported Modalities

The ProceduralRuntime supports all LaneyGen trait types:

| Modality | Format | Example |
|----------|--------|---------|
| **WebGL Shaders** | `webgl:presetId:params` | `webgl:plasma:{"speed":2.5}` |
| **p5.js Sketches** | `p5:sketchId:params` | `p5:particles:{"count":1000}` |
| **Strudel Patterns** | `strudel:pattern` | `strudel:note("c3 e3 g3")` |
| **AI Images** | `sd:prompt` | `sd:cyberpunk cat portrait` |
| **Static Images** | `data:image/png;base64,...` | (standard base64) |

---

## 🌐 Integration Examples

### NFT Marketplace Integration
```typescript
// Display thumbnail on marketplace
if (metadata.renderMode === 'hybrid') {
  const thumbnail = runtime.getThumbnail(metadata.traits.background.src);
  marketplaceCard.src = thumbnail;
}

// Render full quality on click
async function showFullQuality() {
  const canvas = await runtime.renderToken(metadata, 4096, 4096);
  modal.appendChild(canvas);
}
```

### Live Gallery Viewer
```typescript
// Fetch metadata from IPFS/Arweave
const metadataArray = await fetchAllMetadata();

// Render only visible tokens (lazy loading)
const visibleTokens = metadataArray.slice(0, 20);
const canvases = await runtime.batchRender(visibleTokens, 512, 512);

gallery.innerHTML = '';
canvases.forEach((canvas, i) => {
  const card = document.createElement('div');
  card.className = 'nft-card';
  card.appendChild(canvas);
  card.onclick = () => showFullQuality(metadataArray[i]);
  gallery.appendChild(card);
});
```

### Deterministic Re-rendering
```typescript
// Same seed always produces same output
const canvas1 = await runtime.render('webgl:plasma:{}', 'seed-123', 512, 512);
const canvas2 = await runtime.render('webgl:plasma:{}', 'seed-123', 512, 512);
// canvas1 and canvas2 are pixel-perfect identical ✅
```

---

## 🚀 Performance Optimization

### Caching
```typescript
const cache = new Map<string, HTMLCanvasElement>();

async function getCachedRender(ref: string, seed: string) {
  const key = `${ref}:${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  
  const canvas = await runtime.render(ref, seed, 512, 512);
  cache.set(key, canvas);
  return canvas;
}
```

### Progressive Rendering
```typescript
// Show low-res thumbnail first
const thumbnail = runtime.getThumbnail(metadata.traits.background.src);
previewImage.src = thumbnail;

// Render full quality in background
const fullCanvas = await runtime.renderToken(metadata, 4096, 4096);
previewImage.replaceWith(fullCanvas);
```

---

## 💡 Best Practices

### When to use each mode:

| Mode | Best for |
|------|----------|
| **Static** | Maximum compatibility, platforms that only support images |
| **Procedural** | Generative art, interactive installations, file size critical |
| **Hybrid** | Modern NFT platforms with viewer support, best UX |

### Recommendations:
- **Standard NFT drop**: Use **Static** for guaranteed marketplace support
- **Generative art project**: Use **Procedural** to enable infinite variations
- **High-end collection**: Use **Hybrid** for premium experience with fallbacks

---

## 🔐 Deterministic Rendering

All procedural renders are **100% deterministic**:

```typescript
// Same seed = same output, always
const seed = 'my-nft-seed-12345';

// These will be pixel-perfect identical
const render1 = await runtime.render('webgl:plasma:{}', seed, 1024, 1024);
const render2 = await runtime.render('webgl:plasma:{}', seed, 1024, 1024);

// Even across different browsers/devices!
```

This is critical for:
- ✅ Provenance and authenticity
- ✅ Consistent marketplace display
- ✅ Fair trait rarity distribution

---

## 📊 File Size Breakdown

### Example 10,000-token collection:

**Static Mode**:
- Images: 10,000 × 500KB = **5GB**
- Metadata: 10,000 × 2KB = **20MB**
- **Total: ~5.02GB**

**Procedural Mode**:
- Images: 0 (none!)
- Metadata: 10,000 × 1KB = **10MB**
- **Total: ~10MB** (500x smaller!)

**Hybrid Mode**:
- Thumbnails: 10,000 × 50KB = **500MB**
- Metadata: 10,000 × 1.5KB = **15MB**
- **Total: ~515MB** (10x smaller than static)

---

## 🛠️ Advanced: Custom Renderers

You can extend ProceduralRuntime to support custom modalities:

```typescript
class CustomRuntime extends ProceduralRuntime {
  async render(ref: string, seed: string, width: number, height: number) {
    if (ref.startsWith('custom:')) {
      return await this.renderCustomModality(ref, seed, width, height);
    }
    return super.render(ref, seed, width, height);
  }

  private async renderCustomModality(ref: string, seed: string, w: number, h: number) {
    // Your custom rendering logic
  }
}
```

---

## 📚 Resources

- [LaneyGen Documentation](./README.md)
- [TraitRenderer API](./src/lib/rendering/TraitRenderer.ts)
- [ProceduralRuntime Source](./src/lib/export/ProceduralRuntime.ts)
- [NFT Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

---

**Questions?** Open an issue or check the [Discord community](https://discord.gg/your-link).
