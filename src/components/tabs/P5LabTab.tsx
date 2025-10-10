import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Download, Copy } from 'lucide-react';
import { P5_PRESETS, P5Renderer } from '@/lib/p5/P5Renderer';
import { useToast } from '@/hooks/use-toast';

export function P5LabTab() {
  const [selectedPresetId, setSelectedPresetId] = useState(P5_PRESETS[0].id);
  const [params, setParams] = useState<Record<string, any>>({});
  const [rendering, setRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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
    const source = `webgl:p5:${selectedPreset.id}:${JSON.stringify(params)}`;
    navigator.clipboard.writeText(source);
    toast({
      title: 'Source copied',
      description: 'Paste into trait imageSrc field',
    });
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
