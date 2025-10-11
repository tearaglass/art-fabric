import { useState, useRef } from 'react';
import { useProjectStore, Trait } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Package, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import seedrandom from 'seedrandom';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { RulesEngine } from '@/lib/rules/RulesEngine';
import { VDMXExporter } from '@/lib/export/VDMXExporter';
import { ISFConverter } from '@/lib/shaders/ISFConverter';
import { SHADER_PRESETS } from '@/lib/shaders/presets';

export const ExportTab = () => {
  const { projectName, traitClasses, rules, seed, collectionSize, setCollectionSize, fxConfigs } = useProjectStore();
  const { toast } = useToast();
  const rendererRef = useRef(new TraitRenderer());
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState(0);
  const [exportMode, setExportMode] = useState<'nft' | 'vdmx-clips' | 'vdmx-template' | 'isf-shaders'>('nft');
  const [traitExportMode, setTraitExportMode] = useState<'static' | 'procedural' | 'hybrid'>('static');
  const [perClassExportModes, setPerClassExportModes] = useState<Record<string, 'static' | 'procedural' | 'hybrid'>>({});

  const getTraitModality = (imageSrc: string): 'image' | 'webgl' | 'p5' | 'strudel' | 'sd' => {
    if (imageSrc.startsWith('webgl:')) return 'webgl';
    if (imageSrc.startsWith('p5:')) return 'p5';
    if (imageSrc.startsWith('strudel:')) return 'strudel';
    if (imageSrc.startsWith('sd:')) return 'sd';
    return 'image';
  };

  const generateToken = async (edition: number, tokenSeed: string) => {
    const rng = seedrandom(tokenSeed);
    const selectedTraits: Trait[] = [];
    const attributes: any[] = [];

    // Generate traits for this token
    traitClasses.forEach((traitClass) => {
      if (traitClass.traits.length === 0) return;

      const totalWeight = traitClass.traits.reduce((sum, t) => sum + t.weight, 0);
      let random = rng() * totalWeight;

      for (const trait of traitClass.traits) {
        random -= trait.weight;
        if (random <= 0) {
          selectedTraits.push(trait);
          attributes.push({
            trait_type: traitClass.name,
            value: trait.name,
          });
          break;
        }
      }
    });

    // Validate and fix rules violations
    const validation = RulesEngine.validate(selectedTraits, rules);
    let finalTraits = selectedTraits;
    
    if (!validation.valid) {
      // Auto-fix violations by removing conflicting traits
      finalTraits = RulesEngine.autoFix(selectedTraits, rules);
      setValidationErrors((prev) => prev + 1);
    }

    // Convert to map for rendering
    const traits: Record<string, Trait> = {};
    finalTraits.forEach((trait) => {
      const traitClass = traitClasses.find((tc) => tc.name === trait.className);
      if (traitClass) {
        traits[traitClass.id] = trait;
      }
    });

    // Determine export mode for each trait
    const traitImages: Record<string, { src: string; mode: string }> = {};
    
    for (const traitClass of traitClasses) {
      const trait = traits[traitClass.id];
      if (!trait) continue;

      const classExportMode = perClassExportModes[traitClass.id] || traitExportMode;
      const modality = getTraitModality(trait.imageSrc);

      if (modality === 'image' || classExportMode === 'static') {
        // Render to canvas for static export
        const renderedCanvas = await rendererRef.current.renderTrait(
          trait,
          512,
          512,
          tokenSeed
        );
        traitImages[traitClass.id] = {
          src: renderedCanvas.toDataURL('image/png'),
          mode: 'static'
        };
      } else if (classExportMode === 'procedural') {
        // Store procedural reference only
        traitImages[traitClass.id] = {
          src: trait.imageSrc,
          mode: 'procedural'
        };
      } else if (classExportMode === 'hybrid') {
        // Store both procedural + thumbnail
        const renderedCanvas = await rendererRef.current.renderTrait(
          trait,
          256,
          256,
          tokenSeed
        );
        const thumbnail = renderedCanvas.toDataURL('image/png');
        traitImages[traitClass.id] = {
          src: `${trait.imageSrc}|thumbnail:${thumbnail}`,
          mode: 'hybrid'
        };
      }
    }

    // Render composite for static preview (only if at least one static layer)
    const hasStaticLayers = Object.values(traitImages).some(t => t.mode === 'static');
    let compositeBlob: Blob | null = null;
    
    if (hasStaticLayers) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      // Sort and render static layers only
      const sortedClasses = [...traitClasses].sort((a, b) => a.zIndex - b.zIndex);
      for (const traitClass of sortedClasses) {
        const traitImage = traitImages[traitClass.id];
        if (traitImage && traitImage.mode === 'static') {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = traitImage.src;
          });
          ctx.drawImage(img, 0, 0);
        }
      }

      compositeBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }

    // Create metadata with render mode info
    const dna = Object.entries(traits)
      .map(([classId, trait]) => `${classId}:${trait.id}`)
      .join('|');

    const metadata = {
      name: `${projectName} #${edition}`,
      description: `Generated with LaneyGen`,
      image: compositeBlob ? `images/${edition}.png` : 'procedural',
      renderMode: traitExportMode,
      proceduralSeed: tokenSeed,
      traits: traitImages,
      edition,
      attributes,
      dna,
      seed: tokenSeed,
      compiler: 'LaneyGen v1.0',
      date: new Date().toISOString(),
    };

    return { blob: compositeBlob, metadata };
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
      setValidationErrors(0);

      try {
        const zip = new JSZip();
        const imagesFolder = zip.folder('images');
        const metadataFolder = zip.folder('metadata');

        // Parallel processing with batches of 8
        const BATCH_SIZE = 8;
        const batches: number[][] = [];
        for (let i = 1; i <= collectionSize; i += BATCH_SIZE) {
          batches.push(
            Array.from({ length: Math.min(BATCH_SIZE, collectionSize - i + 1) }, (_, j) => i + j)
          );
        }

        let completed = 0;
        for (const batch of batches) {
          const results = await Promise.all(
            batch.map(async (edition) => {
              const tokenSeed = `${seed}-${edition}`;
              const { blob, metadata } = await generateToken(edition, tokenSeed);
              return { edition, blob, metadata };
            })
          );

          results.forEach(({ edition, blob, metadata }) => {
            if (blob) {
              imagesFolder?.file(`${edition}.png`, blob);
            }
            metadataFolder?.file(`${edition}.json`, JSON.stringify(metadata, null, 2));
          });

          completed += batch.length;
          setProgress((completed / collectionSize) * 100);
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
          description: validationErrors > 0 
            ? `${collectionSize} NFTs generated (8x parallel) with ${validationErrors} rule violations auto-fixed.`
            : `${collectionSize} NFTs generated successfully (8x parallel).`,
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
      {rules.length > 0 && (
        <Card className="p-4 border-warning/50 bg-warning/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-warning">Rules Engine Active</div>
              <p className="text-sm text-warning/80 mt-1">
                {rules.length} rule{rules.length > 1 ? 's' : ''} will be enforced during generation. 
                Violations will be auto-fixed by removing conflicting traits.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Export Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Mode</label>
            <Select value={exportMode} onValueChange={(v: any) => setExportMode(v)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nft">NFT Collection (PNG + JSON)</SelectItem>
                <SelectItem value="vdmx-clips">VDMX Clips (MOV per trait)</SelectItem>
                <SelectItem value="vdmx-template">VDMX Template (.vdmx)</SelectItem>
                <SelectItem value="isf-shaders">ISF Shader Pack (ZIP)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {exportMode === 'nft' && 'Standard NFT collection with images and metadata'}
              {exportMode === 'vdmx-clips' && 'Video clips optimized for VDMX layers'}
              {exportMode === 'vdmx-template' && 'Pre-configured VDMX project file'}
              {exportMode === 'isf-shaders' && 'All shaders in ISF format for VDMX'}
            </p>
          </div>

          {exportMode === 'nft' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Trait Export Mode</label>
              <Select value={traitExportMode} onValueChange={(v: any) => setTraitExportMode(v)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">
                    <div>
                      <div className="font-medium">Static PNG</div>
                      <div className="text-xs text-muted-foreground">Large files, fixed output (~500KB each)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="procedural">
                    <div>
                      <div className="font-medium">Procedural</div>
                      <div className="text-xs text-muted-foreground">Tiny files, infinite variations (~1KB each)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div>
                      <div className="font-medium">Hybrid</div>
                      <div className="text-xs text-muted-foreground">Thumbnails + procedural, best of both</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {traitExportMode === 'static' && 'Compatible with all platforms, large file size'}
                {traitExportMode === 'procedural' && '100x smaller exports, requires ProceduralRuntime to render'}
                {traitExportMode === 'hybrid' && 'Includes low-res previews + full procedural data'}
              </p>
            </div>
          )}

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
                  {exportMode === 'nft' && (
                    <>
                      <li>• /images/ - PNG files for all editions</li>
                      <li>• /metadata/ - ERC-721 JSON for each token</li>
                      <li>• manifest.json - Collection audit & provenance</li>
                    </>
                  )}
                  {exportMode === 'vdmx-clips' && (
                    <>
                      <li>• /clips/ - 5-second looping MOV files per trait</li>
                      <li>• Organized by trait class folders</li>
                      <li>• H.264 codec, 1920x1080, 60fps</li>
                    </>
                  )}
                  {exportMode === 'vdmx-template' && (
                    <>
                      <li>• Pre-configured .vdmx project file</li>
                      <li>• Layers for each trait class</li>
                      <li>• OSC mappings for live control</li>
                      <li>• Recommended blend modes & settings</li>
                    </>
                  )}
                  {exportMode === 'isf-shaders' && (
                    <>
                      <li>• {SHADER_PRESETS.length} ISF shader files (.fs)</li>
                      <li>• Compatible with VDMX, CoGe, MadMapper</li>
                      <li>• Installation instructions included</li>
                      <li>• OSC control schema documentation</li>
                    </>
                  )}
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
            onClick={() => {
              if (exportMode === 'vdmx-template') {
                VDMXExporter.downloadTemplate(projectName, traitClasses, SHADER_PRESETS);
                toast({
                  title: 'VDMX Template exported',
                  description: `${projectName}.vdmx ready for import`,
                });
              } else if (exportMode === 'isf-shaders') {
                ISFConverter.exportAllAsZip(SHADER_PRESETS).then(blob => {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'shaders-isf-pack.zip';
                  link.click();
                  URL.revokeObjectURL(url);
                  toast({
                    title: 'ISF Shaders exported',
                    description: `${SHADER_PRESETS.length} shaders ready for VDMX`,
                  });
                });
              } else {
                handleExport();
              }
            }}
            disabled={isExporting || traitClasses.length === 0}
            className="w-full gradient-primary text-lg py-6"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 
              exportMode === 'nft' ? 'Export Collection' :
              exportMode === 'vdmx-clips' ? 'Export VDMX Clips' :
              exportMode === 'vdmx-template' ? 'Export VDMX Template' :
              'Export ISF Shaders'}
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
