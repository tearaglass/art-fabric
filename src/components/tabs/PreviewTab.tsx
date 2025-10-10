import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shuffle, RefreshCw } from 'lucide-react';
import seedrandom from 'seedrandom';

export const PreviewTab = () => {
  const { traitClasses, seed, fxConfigs } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSeed, setCurrentSeed] = useState(seed);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});

  const generateRandomTraits = (seedValue: string) => {
    const rng = seedrandom(seedValue);
    const traits: Record<string, string> = {};

    traitClasses.forEach((traitClass) => {
      if (traitClass.traits.length === 0) return;

      // Weight-based selection
      const totalWeight = traitClass.traits.reduce((sum, t) => sum + t.weight, 0);
      let random = rng() * totalWeight;

      for (const trait of traitClass.traits) {
        random -= trait.weight;
        if (random <= 0) {
          traits[traitClass.id] = trait.id;
          break;
        }
      }
    });

    return traits;
  };

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort by z-index
    const sortedClasses = [...traitClasses].sort((a, b) => a.zIndex - b.zIndex);

    // Render each selected trait
    for (const traitClass of sortedClasses) {
      const selectedTraitId = selectedTraits[traitClass.id];
      const trait = traitClass.traits.find((t) => t.id === selectedTraitId);

      if (trait) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = trait.imageSrc;
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    // Apply FX if enabled (simplified - just CRT for now)
    const crtFx = fxConfigs.find((fx) => fx.type === 'crt' && fx.enabled);
    if (crtFx) {
      applyCRTEffect(ctx, canvas.width, canvas.height, crtFx.params);
    }
  };

  const applyCRTEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: Record<string, number>
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Simple scanline effect
    const intensity = params.intensity || 0.5;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        data[i] *= 1 - intensity;     // R
        data[i + 1] *= 1 - intensity; // G
        data[i + 2] *= 1 - intensity; // B
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleRandomize = () => {
    const newSeed = `${seed}-${Date.now()}`;
    setCurrentSeed(newSeed);
    const traits = generateRandomTraits(newSeed);
    setSelectedTraits(traits);
  };

  useEffect(() => {
    if (Object.keys(selectedTraits).length > 0) {
      renderPreview();
    }
  }, [selectedTraits, fxConfigs]);

  useEffect(() => {
    // Initial generation
    const traits = generateRandomTraits(currentSeed);
    setSelectedTraits(traits);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Canvas Preview */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Live Preview</h2>
        <div className="aspect-square bg-muted rounded border-2 border-border flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={currentSeed}
              onChange={(e) => setCurrentSeed(e.target.value)}
              placeholder="Seed value"
              className="bg-input border-border font-mono"
            />
            <Button
              onClick={() => {
                const traits = generateRandomTraits(currentSeed);
                setSelectedTraits(traits);
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleRandomize} className="w-full gradient-primary">
            <Shuffle className="w-4 h-4 mr-2" />
            Randomize
          </Button>
        </div>
      </Card>

      {/* Trait Selection */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Selected Traits</h2>
        <div className="space-y-4">
          {traitClasses.map((traitClass) => {
            const selectedTraitId = selectedTraits[traitClass.id];
            const selectedTrait = traitClass.traits.find((t) => t.id === selectedTraitId);

            return (
              <div key={traitClass.id} className="border border-border rounded p-3 bg-muted/30">
                <div className="text-sm font-semibold text-primary mb-2">
                  {traitClass.name}
                </div>
                <div className="text-sm font-mono">
                  {selectedTrait ? selectedTrait.name : 'None'}
                </div>
                {selectedTrait && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Weight: {selectedTrait.weight}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
