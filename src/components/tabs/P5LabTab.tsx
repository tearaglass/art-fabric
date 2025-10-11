import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Download, Copy, Plus, Image as ImageIcon } from 'lucide-react';
import { P5_PRESETS, P5Renderer } from '@/lib/p5/P5Renderer';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/store/useProjectStore';
import { Separator } from '@/components/ui/separator';
import { compressPNG, shouldCompress, getBase64SizeKB } from '@/lib/utils/imageCompression';
import { Badge } from '@/components/ui/badge';

export function P5LabTab() {
  const [selectedPresetId, setSelectedPresetId] = useState(P5_PRESETS[0].id);
  const [params, setParams] = useState<Record<string, any>>({});
  const [rendering, setRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [traitName, setTraitName] = useState('');
  const [traitWeight, setTraitWeight] = useState(100);
  const [exportMode, setExportMode] = useState<'static' | 'procedural' | 'hybrid'>('static');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { traitClasses, addTrait } = useProjectStore();

  const selectedPreset = P5_PRESETS.find(p => p.id === selectedPresetId) || P5_PRESETS[0];

  // Initialize params when preset changes
  useEffect(() => {
    const initialParams: Record<string, any> = {};
    Object.entries(selectedPreset.params).forEach(([key, param]) => {
      initialParams[key] = param.value;
    });
    setParams(initialParams);
  }, [selectedPresetId]);

  const handleRender = async () => {
    setRendering(true);
    try {
      const renderer = new P5Renderer();
      const dataUrl = await renderer.render(selectedPreset, params);
      setRenderedImage(dataUrl);

      // Draw to canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
          canvasRef.current!.width = img.width;
          canvasRef.current!.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
      }

      toast({
        title: 'Sketch rendered',
        description: `${selectedPreset.name} completed successfully`,
      });
    } catch (error) {
      toast({
        title: 'Render failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedImage) return;
    const link = document.createElement('a');
    link.download = `p5-${selectedPreset.id}-${Date.now()}.png`;
    link.href = renderedImage;
    link.click();
  };

  const handleCopySource = () => {
    const source = `p5:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(params))}`;
    navigator.clipboard.writeText(source);
    toast({
      title: 'Source copied',
      description: 'Paste into trait imageSrc field',
    });
  };

  const handleAddTrait = async () => {
    if (!selectedClassId) {
      toast({
        title: 'Select a class',
        description: 'Please choose a trait class first',
        variant: 'destructive',
      });
      return;
    }

    if (!traitName.trim()) {
      toast({
        title: 'Enter trait name',
        description: 'Please provide a name for this trait',
        variant: 'destructive',
      });
      return;
    }

    if (!renderedImage && exportMode !== 'procedural') {
      toast({
        title: 'Render first',
        description: 'Please render the sketch before adding as PNG/Hybrid',
        variant: 'destructive',
      });
      return;
    }

    const traitClass = traitClasses.find(tc => tc.id === selectedClassId);
    const proceduralSource = `p5:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(params))}`;

    let imageSrc = proceduralSource;
    
    // Handle different export modes
    if (exportMode === 'static' && renderedImage) {
      // Compress if needed
      let finalImage = renderedImage;
      if (shouldCompress(renderedImage, 500)) {
        try {
          finalImage = await compressPNG(renderedImage, { maxWidth: 1024, maxHeight: 1024, quality: 0.8 });
          const originalSize = getBase64SizeKB(renderedImage);
          const compressedSize = getBase64SizeKB(finalImage);
          
          toast({
            title: 'Image compressed',
            description: `Size reduced from ${originalSize.toFixed(0)}KB to ${compressedSize.toFixed(0)}KB`,
          });
        } catch (error) {
          console.error('Compression failed:', error);
        }
      }
      imageSrc = finalImage;
    } else if (exportMode === 'hybrid' && renderedImage) {
      // Store both: use procedural source with metadata
      imageSrc = `${proceduralSource}|thumbnail:${renderedImage.substring(0, 100)}`;
    }

    addTrait(selectedClassId, {
      id: `p5-${Date.now()}-${Math.random()}`,
      name: traitName,
      imageSrc,
      weight: traitWeight,
      className: traitClass?.name || '',
    });

    toast({
      title: 'Trait added',
      description: `"${traitName}" added to ${traitClass?.name} (${exportMode})`,
    });

    setTraitName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>p5.js Sketchpad</CardTitle>
            <CardDescription>
              Procedural generative art using p5.js
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preset</Label>
              <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {P5_PRESETS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedPreset.description}
              </p>
            </div>

            {/* Parameter Controls */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(selectedPreset.params).map(([key, param]) => (
                <div key={key}>
                  <Label className="text-xs">{param.label}</Label>
                  {key === 'text' ? (
                    <Input
                      value={params[key] || ''}
                      onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                      placeholder="Enter text..."
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[params[key] || param.value]}
                        onValueChange={([val]) => setParams({ ...params, [key]: val })}
                        min={param.min}
                        max={param.max}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-12 text-right">
                        {params[key] || param.value}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRender} disabled={rendering} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                {rendering ? 'Rendering...' : 'Render'}
              </Button>
              <Button onClick={handleDownload} disabled={!renderedImage} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleCopySource} disabled={!renderedImage} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add as Trait</CardTitle>
            <CardDescription>
              Add this p5.js sketch to your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Export Mode</Label>
              <Select value={exportMode} onValueChange={(v: any) => setExportMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Static PNG</div>
                        <div className="text-xs text-muted-foreground">Save as image</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="procedural">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Procedural</div>
                        <div className="text-xs text-muted-foreground">Infinite variations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Hybrid</div>
                        <div className="text-xs text-muted-foreground">Both PNG + code</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {exportMode === 'static' && 'Stores rendered image (larger file size)'}
                {exportMode === 'procedural' && 'Stores code reference (generates on demand)'}
                {exportMode === 'hybrid' && 'Best of both worlds'}
              </p>
            </div>

            <div>
              <Label>Trait Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {traitClasses.map(tc => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trait Name</Label>
              <Input
                value={traitName}
                onChange={(e) => setTraitName(e.target.value)}
                placeholder={`${selectedPreset.name} #1`}
              />
            </div>

            <div>
              <Label>Weight</Label>
              <Input
                type="number"
                value={traitWeight}
                onChange={(e) => setTraitWeight(parseInt(e.target.value) || 100)}
                min={1}
              />
            </div>

            {renderedImage && exportMode === 'static' && (
              <Badge variant="outline" className="w-full justify-center">
                Size: {getBase64SizeKB(renderedImage).toFixed(0)}KB
              </Badge>
            )}

            <Button 
              onClick={handleAddTrait} 
              disabled={!renderedImage && exportMode !== 'procedural'} 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Trait ({exportMode})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
              {renderedImage ? (
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              ) : (
                <p className="text-muted-foreground">Click Render to generate</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
