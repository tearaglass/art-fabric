import { useEffect, useRef, useState } from 'react';
import { useProjectStore, Trait } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shuffle, RefreshCw, AlertTriangle, Sparkles, Copy, X } from 'lucide-react';
import seedrandom from 'seedrandom';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { RulesEngine, RuleViolation } from '@/lib/rules/RulesEngine';
import { useToast } from '@/hooks/use-toast';

export const PreviewTab = () => {
  const { traitClasses, rules, seed, fxConfigs } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef(new TraitRenderer());
  const [currentSeed, setCurrentSeed] = useState(seed);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});
  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renderProgress, setRenderProgress] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const { toast } = useToast();

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

    setIsLoading(true);
    setRenderProgress('Preparing canvas...');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort by z-index
    const sortedClasses = [...traitClasses].sort((a, b) => a.zIndex - b.zIndex);

    // Render each selected trait using TraitRenderer
    for (let i = 0; i < sortedClasses.length; i++) {
      const traitClass = sortedClasses[i];
      const selectedTraitId = selectedTraits[traitClass.id];
      const trait = traitClass.traits.find((t) => t.id === selectedTraitId);

      if (trait) {
        setRenderProgress(`Rendering ${traitClass.name}...`);
        const renderedCanvas = await rendererRef.current.renderTrait(
          trait,
          canvas.width,
          canvas.height,
          currentSeed
        );
        ctx.drawImage(renderedCanvas, 0, 0);
      }
    }

    // Apply FX if enabled
    setRenderProgress('Applying effects...');
    const crtFx = fxConfigs.find((fx) => fx.type === 'crt' && fx.enabled);
    if (crtFx) {
      applyCRTEffect(ctx, canvas.width, canvas.height, crtFx.params);
    }

    setIsLoading(false);
    setRenderProgress('');
    
    // Show welcome overlay on first render
    const hasSeenWelcome = localStorage.getItem('preview-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('preview-welcome-seen', 'true');
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

  const handleCopySeed = () => {
    navigator.clipboard.writeText(currentSeed);
    toast({
      title: 'Seed copied!',
      description: 'Share this seed to recreate this exact piece.',
    });
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
        <div 
          className="aspect-square bg-muted rounded border-2 border-border flex items-center justify-center relative group"
          data-tour="preview-canvas"
          onMouseEnter={() => setShowMetadata(true)}
          onMouseLeave={() => setShowMetadata(false)}
        >
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground animate-pulse">{renderProgress}</p>
            </div>
          )}

          {/* Metadata Overlay */}
          {showMetadata && !isLoading && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Seed</p>
                  <p className="text-sm font-mono text-foreground">{currentSeed}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopySeed}
                  className="gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Welcome Overlay */}
          {showWelcome && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
              <div className="max-w-md text-center space-y-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-4 right-4"
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse" />
                <h3 className="text-2xl font-bold gradient-text">Welcome to Your Generative Art Studio!</h3>
                
                <div className="text-left space-y-2 text-sm text-muted-foreground">
                  <p>Your first piece has been generated using:</p>
                  <ul className="space-y-1 ml-4">
                    <li>→ WebGL shaders for backgrounds</li>
                    <li>→ P5.js sketches for patterns</li>
                    <li>→ Procedural audio via Strudel</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => setShowWelcome(false)}
                  className="w-full gradient-primary"
                >
                  Let's Create!
                </Button>
              </div>
            </div>
          )}
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

          <Button 
            onClick={handleRandomize} 
            className="w-full gradient-primary relative group"
            data-tour="randomize-button"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Randomize
            {!localStorage.getItem('preview-welcome-seen') && (
              <span className="absolute -top-2 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
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
