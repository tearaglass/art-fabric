import { useState, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Download, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import seedrandom from 'seedrandom';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';

export const ExportTab = () => {
  const { projectName, traitClasses, seed, collectionSize, setCollectionSize, fxConfigs } = useProjectStore();
  const { toast } = useToast();
  const rendererRef = useRef(new TraitRenderer());
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateToken = async (edition: number, tokenSeed: string) => {
    const rng = seedrandom(tokenSeed);
    const traits: Record<string, any> = {};
    const attributes: any[] = [];

    // Generate traits for this token
    traitClasses.forEach((traitClass) => {
      if (traitClass.traits.length === 0) return;

      const totalWeight = traitClass.traits.reduce((sum, t) => sum + t.weight, 0);
      let random = rng() * totalWeight;

      for (const trait of traitClass.traits) {
        random -= trait.weight;
        if (random <= 0) {
          traits[traitClass.id] = trait;
          attributes.push({
            trait_type: traitClass.name,
            value: trait.name,
          });
          break;
        }
      }
    });

    // Render to canvas using TraitRenderer
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');

    // Sort and render layers
    const sortedClasses = [...traitClasses].sort((a, b) => a.zIndex - b.zIndex);
    for (const traitClass of sortedClasses) {
      const trait = traits[traitClass.id];
      if (trait) {
        const renderedCanvas = await rendererRef.current.renderTrait(
          trait,
          canvas.width,
          canvas.height,
          tokenSeed
        );
        ctx.drawImage(renderedCanvas, 0, 0);
      }
    }

    // Get image blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // Create metadata
    const dna = Object.entries(traits)
      .map(([classId, trait]) => `${classId}:${trait.id}`)
      .join('|');

    const metadata = {
      name: `${projectName} #${edition}`,
      description: `Generated with LaneyGen`,
      image: `images/${edition}.png`,
      edition,
      attributes,
      dna,
      seed: tokenSeed,
      compiler: 'LaneyGen v1.0',
      date: new Date().toISOString(),
    };

    return { blob, metadata };
  };

  const handleExport = async () => {
    if (traitClasses.length === 0) {
      toast({
        title: 'No traits',
        description: 'Add some trait classes first.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const metadataFolder = zip.folder('metadata');

      for (let i = 1; i <= collectionSize; i++) {
        const tokenSeed = `${seed}-${i}`;
        const { blob, metadata } = await generateToken(i, tokenSeed);

        imagesFolder?.file(`${i}.png`, blob);
        metadataFolder?.file(`${i}.json`, JSON.stringify(metadata, null, 2));

        setProgress((i / collectionSize) * 100);
      }

      // Add manifest
      const manifest = {
        name: projectName,
        collection_size: collectionSize,
        seed,
        timestamp: new Date().toISOString(),
        engine: 'LaneyGen v1.0',
        trait_classes: traitClasses.map((tc) => ({
          name: tc.name,
          z_index: tc.zIndex,
          trait_count: tc.traits.length,
        })),
      };

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}_collection.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete!',
        description: `${collectionSize} NFTs generated successfully.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'An error occurred during export.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Export Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Collection Size</label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={collectionSize}
              onChange={(e) => setCollectionSize(parseInt(e.target.value) || 100)}
              className="bg-input border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Number of unique NFTs to generate (1-10,000)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Master Seed</label>
            <Input
              value={seed}
              disabled
              className="bg-input border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deterministic seed for reproducible generation
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Export Bundle</h2>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded p-4 border border-border">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">What's included:</div>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• /images/ - PNG files for all editions</li>
                  <li>• /metadata/ - ERC-721 JSON for each token</li>
                  <li>• manifest.json - Collection audit & provenance</li>
                </ul>
              </div>
            </div>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground font-mono">
                Generating... {Math.floor(progress)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={isExporting || traitClasses.length === 0}
            className="w-full gradient-primary text-lg py-6"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Collection'}
          </Button>

          {traitClasses.length === 0 && (
            <p className="text-sm text-warning text-center">
              Add trait classes in the Assets tab to enable export
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
