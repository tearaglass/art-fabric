import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Download, Copy, Loader2, Plus } from 'lucide-react';
import { SD_GRAPH_PRESETS, SDAdapter } from '@/lib/sd/SDAdapter';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/store/useProjectStore';

export function SDLabTab() {
  const [selectedGraphId, setSelectedGraphId] = useState(SD_GRAPH_PRESETS[0].id);
  const [customPrompt, setCustomPrompt] = useState('');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999));
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [traitName, setTraitName] = useState('');
  const [traitWeight, setTraitWeight] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { traitClasses, addTrait } = useProjectStore();

  const selectedGraph = SD_GRAPH_PRESETS.find(g => g.id === selectedGraphId) || SD_GRAPH_PRESETS[0];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const adapter = new SDAdapter();
      const fullPrompt = adapter.buildPrompt(selectedGraph, customPrompt, selectedGraph.params);

      const result = await adapter.generate({
        graph: selectedGraph.id,
        params: selectedGraph.params,
        seed,
        prompt: fullPrompt,
        outSize: { w: 1024, h: 1024 },
      });

      setGeneratedImage(result.b64);
      setMetadata({
        prompt: fullPrompt,
        seed,
        duration: result.ms,
        cached: result.cached,
        hash: result.sha256,
      });

      // Draw to canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
          canvasRef.current!.width = img.width;
          canvasRef.current!.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = result.b64;
      }

      toast({
        title: result.cached ? 'Image loaded from cache' : 'Image generated',
        description: `${selectedGraph.name} - ${result.ms.toFixed(0)}ms`,
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `sd-${selectedGraph.id}-${seed}.png`;
    link.href = generatedImage;
    link.click();
  };

  const handleCopySource = () => {
    const sourceParams = {
      customPrompt,
      seed,
    };
    const source = `sd:${selectedGraph.id}:${seed}:${encodeURIComponent(JSON.stringify(sourceParams))}`;
    navigator.clipboard.writeText(source);
    toast({
      title: 'Source copied',
      description: 'Paste into trait imageSrc field',
    });
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999));
  };

  const handleAddTrait = () => {
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

    const traitClass = traitClasses.find(tc => tc.id === selectedClassId);
    const sourceParams = { customPrompt, seed };
    const source = `sd:${selectedGraph.id}:${seed}:${encodeURIComponent(JSON.stringify(sourceParams))}`;

    addTrait(selectedClassId, {
      id: `sd-${Date.now()}-${Math.random()}`,
      name: traitName,
      imageSrc: source,
      weight: traitWeight,
      className: traitClass?.name || '',
    });

    toast({
      title: 'Trait added',
      description: `"${traitName}" added to ${traitClass?.name}`,
    });

    setTraitName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Stable Diffusion Lab</CardTitle>
            <CardDescription>
              AI-powered image generation with deterministic seeds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Graph Preset</Label>
              <Select value={selectedGraphId} onValueChange={setSelectedGraphId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SD_GRAPH_PRESETS.map(graph => (
                    <SelectItem key={graph.id} value={graph.id}>
                      <div className="flex items-center gap-2">
                        {graph.name}
                        <Badge variant="outline" className="text-xs">
                          {graph.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedGraph.description}
              </p>
            </div>

            <div>
              <Label>Custom Prompt</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add custom details to the base prompt..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Base: {selectedGraph.basePrompt}
              </p>
            </div>

            <div>
              <Label>Seed</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  placeholder="Random seed"
                />
                <Button onClick={handleRandomSeed} variant="outline">
                  Random
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Same seed = same output (deterministic)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Aspect:</span>
                <Badge variant="outline" className="ml-1">
                  {selectedGraph.params.aspectRatio || '1:1'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Quality:</span>
                <Badge variant="outline" className="ml-1">
                  {selectedGraph.params.quality || 'medium'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Style:</span>
                <Badge variant="outline" className="ml-1">
                  {selectedGraph.params.style || 'auto'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
              <Button onClick={handleDownload} disabled={!generatedImage} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleCopySource} disabled={!generatedImage} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview & Metadata */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
              {generatedImage ? (
                <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
              ) : (
                <p className="text-muted-foreground">Click Generate to create image</p>
              )}
            </div>
          </CardContent>
        </Card>

        {metadata && (
          <Card>
            <CardHeader>
              <CardTitle>Generation Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seed:</span>
                <Badge variant="outline">{metadata.seed}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="outline">{metadata.duration?.toFixed(0)}ms</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cached:</span>
                <Badge variant={metadata.cached ? 'default' : 'outline'}>
                  {metadata.cached ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hash:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {metadata.hash?.substring(0, 8)}...
                </Badge>
              </div>
              <div className="mt-4">
                <Label className="text-xs">Full Prompt</Label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                  {metadata.prompt}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add as Trait</CardTitle>
            <CardDescription>
              Add this generated image to your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                placeholder={`${selectedGraph.name} #1`}
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

            <Button onClick={handleAddTrait} disabled={!generatedImage} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Trait
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
