import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Plus, RefreshCw, Download, Image as ImageIcon, Play } from 'lucide-react';
import { SHADER_PRESETS, ShaderPreset } from '@/lib/shaders/presets';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { ISFConverter } from '@/lib/shaders/ISFConverter';
import { useToast } from '@/hooks/use-toast';
import { compressPNG, shouldCompress, getBase64SizeKB } from '@/lib/utils/imageCompression';
import { Badge } from '@/components/ui/badge';

export const ShaderLabTab = () => {
  const { traitClasses, addTrait, seed } = useProjectStore();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<ShaderPreset | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [traitName, setTraitName] = useState('');
  const [traitWeight, setTraitWeight] = useState(100);
  const [exportMode, setExportMode] = useState<'static' | 'procedural' | 'hybrid'>('static');
  const [uniformValues, setUniformValues] = useState<Record<string, number | number[]>>({});
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef(new TraitRenderer());

  useEffect(() => {
    if (selectedPreset) {
      // Initialize uniform values from defaults
      const defaults: Record<string, number | number[]> = {};
      for (const [name, config] of Object.entries(selectedPreset.uniforms)) {
        defaults[name] = config.default;
      }
      setUniformValues(defaults);
    }
  }, [selectedPreset]);

  useEffect(() => {
    if (selectedPreset && canvasRef.current) {
      renderPreview();
    }
  }, [selectedPreset, uniformValues]);

  const renderPreview = async () => {
    if (!selectedPreset || !canvasRef.current) return;

    try {
      const gl = canvasRef.current.getContext('webgl2');
      if (!gl) {
        toast({
          title: 'WebGL not supported',
          description: 'Your browser does not support WebGL2',
          variant: 'destructive',
        });
        return;
      }

      // Use renderer to generate preview
      const tempTrait = {
        id: 'preview',
        name: 'Preview',
        imageSrc: `webgl:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(uniformValues))}`,
        weight: 100,
        className: '',
      };

      const canvas = await renderer.current.renderTrait(tempTrait, 512, 512, seed);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(canvas, 0, 0);
        
        // Store rendered image for static export
        setRenderedImage(canvasRef.current.toDataURL('image/png'));
      }
    } catch (error) {
      console.error('Render error:', error);
      toast({
        title: 'Render failed',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const handleAddTrait = async () => {
    if (!selectedPreset || !selectedClass || !traitName) {
      toast({
        title: 'Missing information',
        description: 'Select a preset, class, and enter a trait name',
        variant: 'destructive',
      });
      return;
    }

    if (!renderedImage && exportMode !== 'procedural') {
      toast({
        title: 'Render first',
        description: 'Please render the shader before adding as PNG/Hybrid',
        variant: 'destructive',
      });
      return;
    }

    const traitClass = traitClasses.find(tc => tc.id === selectedClass);
    if (!traitClass) return;

    const proceduralSource = `webgl:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(uniformValues))}`;
    let imageSrc = proceduralSource;

    // Handle different export modes
    if (exportMode === 'static' && renderedImage) {
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
      imageSrc = `${proceduralSource}|thumbnail:${renderedImage.substring(0, 100)}`;
    }

    const trait = {
      id: `${selectedClass}-${Date.now()}`,
      name: traitName,
      imageSrc,
      weight: traitWeight,
      className: traitClass.name,
    };

    addTrait(selectedClass, trait);

    toast({
      title: 'Shader trait added',
      description: `"${traitName}" added to ${traitClass.name} (${exportMode})`,
    });

    setTraitName('');
  };

  const handleExportISF = async () => {
    if (!selectedPreset) {
      toast({
        title: 'No preset selected',
        description: 'Select a shader preset to export',
        variant: 'destructive',
      });
      return;
    }

    const blob = ISFConverter.exportAsFile(selectedPreset);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPreset.id}.fs`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ISF Shader exported',
      description: `${selectedPreset.name} exported for VDMX`,
    });
  };

  const handleExportAllISF = async () => {
    const blob = await ISFConverter.exportAllAsZip(SHADER_PRESETS);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shaders-isf-pack.zip';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'All shaders exported',
      description: `${SHADER_PRESETS.length} ISF shaders ready for VDMX`,
    });
  };

  const renderUniformControl = (name: string, config: ShaderPreset['uniforms'][string]) => {
    const value = uniformValues[name] ?? config.default;

    if (config.type === 'float') {
      return (
        <div key={name} className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">{config.label}</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {typeof value === 'number' ? value.toFixed(2) : ''}
            </span>
          </div>
          <Slider
            value={[typeof value === 'number' ? value : config.default as number]}
            min={config.min ?? 0}
            max={config.max ?? 100}
            step={0.1}
            onValueChange={([v]) => setUniformValues({ ...uniformValues, [name]: v })}
            className="w-full"
          />
        </div>
      );
    }

    if (config.type === 'vec3') {
      const arr = Array.isArray(value) ? value : [value, value, value];
      return (
        <div key={name} className="space-y-2">
          <Label className="text-sm">{config.label} (RGB)</Label>
          <div className="grid grid-cols-3 gap-2">
            {['R', 'G', 'B'].map((channel, i) => (
              <div key={channel}>
                <Label className="text-xs text-muted-foreground">{channel}</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={arr[i]}
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[i] = parseFloat(e.target.value) || 0;
                    setUniformValues({ ...uniformValues, [name]: newArr });
                  }}
                  className="text-xs font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const categoryGroups = SHADER_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, ShaderPreset[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preset Gallery */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Shader Presets</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllISF}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export All (VDMX)
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(categoryGroups).map(([category, presets]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset?.id === preset.id ? 'default' : 'outline'}
                    className={selectedPreset?.id === preset.id ? 'gradient-primary' : ''}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="text-left w-full">
                      <div className="font-semibold text-xs">{preset.name}</div>
                      <div className="text-xs opacity-70">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview & Controls */}
      <div className="space-y-4">
        {/* Preview */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Live Preview</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportISF}
                disabled={!selectedPreset}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export ISF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={renderPreview}
                disabled={!selectedPreset}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="aspect-square bg-muted rounded border-2 border-border flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="w-full h-full object-contain"
            />
          </div>
        </Card>

        {/* Uniform Controls */}
        {selectedPreset && (
          <Card className="p-6 border-border bg-card">
            <h2 className="text-xl font-bold mb-4">Parameters</h2>
            <div className="space-y-4">
              {Object.entries(selectedPreset.uniforms).map(([name, config]) =>
                renderUniformControl(name, config)
              )}
            </div>
          </Card>
        )}

        {/* Add to Collection */}
        <Card className="p-6 border-border bg-card">
          <h2 className="text-xl font-bold mb-4">Add to Collection</h2>
          <div className="space-y-4">
            <div>
              <Label>Export Mode</Label>
              <Select value={exportMode} onValueChange={(v: any) => setExportMode(v)}>
                <SelectTrigger className="bg-input border-border">
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
            </div>

            <div>
              <Label>Trait Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select a trait class" />
                </SelectTrigger>
                <SelectContent>
                  {traitClasses.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.name} (z-index: {tc.zIndex})
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
                placeholder="e.g., Neon Gradient"
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label>Weight</Label>
              <Input
                type="number"
                min={1}
                value={traitWeight}
                onChange={(e) => setTraitWeight(parseInt(e.target.value) || 100)}
                className="bg-input border-border font-mono"
              />
            </div>

            {renderedImage && exportMode === 'static' && (
              <Badge variant="outline" className="w-full justify-center">
                Size: {getBase64SizeKB(renderedImage).toFixed(0)}KB
              </Badge>
            )}

            <Button
              onClick={handleAddTrait}
              disabled={!selectedPreset || !selectedClass || !traitName || (!renderedImage && exportMode !== 'procedural')}
              className="w-full gradient-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Shader Trait ({exportMode})
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
