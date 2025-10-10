import { useEffect, useRef, useState } from 'react';
import { useProjectStore, Trait } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shuffle, RefreshCw, AlertTriangle } from 'lucide-react';
import seedrandom from 'seedrandom';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { RulesEngine, RuleViolation } from '@/lib/rules/RulesEngine';

export const PreviewTab = () => {
  const { traitClasses, rules, seed, fxConfigs } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef(new TraitRenderer());
  const [currentSeed, setCurrentSeed] = useState(seed);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});
  const [violations, setViolations] = useState<RuleViolation[]>([]);

  const generateRandomTraits = (seedValue: string) => {
    const rng = seedrandom(seedValue);
    const selectedTraitObjects: Trait[] = [];
    const traits: Record<string, string> = {};

    traitClasses.forEach((traitClass) => {
      if (traitClass.traits.length === 0) return;

      // Weight-based selection
      const totalWeight = traitClass.traits.reduce((sum, t) => sum + t.weight, 0);
      let random = rng() * totalWeight;

      for (const trait of traitClass.traits) {
        random -= trait.weight;
        if (random <= 0) {
          selectedTraitObjects.push(trait);
          traits[traitClass.id] = trait.id;
          break;
        }
      }
    });

    // Validate rules
    const validation = RulesEngine.validate(selectedTraitObjects, rules);
    setViolations(validation.violations);

    // Auto-fix if violations exist
    if (!validation.valid) {
      const fixedTraits = RulesEngine.autoFix(selectedTraitObjects, rules);
      const fixedTraitsMap: Record<string, string> = {};
      fixedTraits.forEach((trait) => {
        const traitClass = traitClasses.find((tc) => tc.name === trait.className);
        if (traitClass) {
          fixedTraitsMap[traitClass.id] = trait.id;
        }
      });
      return fixedTraitsMap;
    }

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

    // Render each selected trait using TraitRenderer
    for (const traitClass of sortedClasses) {
      const selectedTraitId = selectedTraits[traitClass.id];
      const trait = traitClass.traits.find((t) => t.id === selectedTraitId);

      if (trait) {
        const renderedCanvas = await rendererRef.current.renderTrait(
          trait,
          canvas.width,
          canvas.height,
          currentSeed
        );
        ctx.drawImage(renderedCanvas, 0, 0);
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
        
        {violations.length > 0 && (
          <div className="mb-4 p-3 border border-warning/50 bg-warning/10 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-warning">Rule Violations Detected</div>
                <div className="text-xs text-warning/80 mt-1 space-y-1">
                  {violations.map((v, i) => (
                    <div key={i}>• {v.message}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
