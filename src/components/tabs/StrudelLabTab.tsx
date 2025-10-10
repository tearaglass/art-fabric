import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Download, Copy, Pause, Volume2, Plus } from 'lucide-react';
import { STRUDEL_PRESETS, StrudelRenderer } from '@/lib/strudel/StrudelRenderer';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/store/useProjectStore';

export function StrudelLabTab() {
  const [selectedPresetId, setSelectedPresetId] = useState(STRUDEL_PRESETS[0].id);
  const [pattern, setPattern] = useState(STRUDEL_PRESETS[0].pattern);
  const [tempo, setTempo] = useState(STRUDEL_PRESETS[0].tempo);
  const [bars, setBars] = useState(STRUDEL_PRESETS[0].bars);
  const [kitId, setKitId] = useState(STRUDEL_PRESETS[0].kitId);
  const [rendering, setRendering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [traitName, setTraitName] = useState('');
  const [traitWeight, setTraitWeight] = useState(100);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { traitClasses, addTrait } = useProjectStore();

  const selectedPreset = STRUDEL_PRESETS.find(p => p.id === selectedPresetId) || STRUDEL_PRESETS[0];

  // Update controls when preset changes
  useEffect(() => {
    setPattern(selectedPreset.pattern);
    setTempo(selectedPreset.tempo);
    setBars(selectedPreset.bars);
    setKitId(selectedPreset.kitId);
  }, [selectedPresetId]);

  const handleRender = async () => {
    setRendering(true);
    try {
      const renderer = new StrudelRenderer();
      const result = await renderer.render({
        pattern,
        tempo,
        bars,
        kitId,
        seed: Date.now(),
      });

      setAudioUrl(result.audioUrl);
      setMetadata(result.metadata);

      if (audioRef.current) {
        audioRef.current.src = result.audioUrl;
      }

      toast({
        title: 'Pattern rendered',
        description: `${bars} bars at ${tempo} BPM`,
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

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.download = `strudel-${Date.now()}.wav`;
    link.href = audioUrl;
    link.click();
  };

  const handleCopySource = () => {
    const sourceParams = {
      pattern,
      tempo,
      bars,
      kitId,
    };
    const source = `strudel:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(sourceParams))}`;
    navigator.clipboard.writeText(source);
    toast({
      title: 'Source copied',
      description: 'Paste into trait imageSrc field',
    });
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
    const sourceParams = { pattern, tempo, bars, kitId };
    const source = `strudel:${selectedPreset.id}:${encodeURIComponent(JSON.stringify(sourceParams))}`;

    addTrait(selectedClassId, {
      id: `strudel-${Date.now()}-${Math.random()}`,
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
            <CardTitle>Strudel Studio</CardTitle>
            <CardDescription>
              Generative audio patterns with deterministic seeds
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
                  {STRUDEL_PRESETS.map(preset => (
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

            <div>
              <Label>Pattern</Label>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="bd ~ sn ~"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                bd=kick, sn=snare, hh=hihat, cp=clap, ~=rest
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tempo (BPM)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[tempo]}
                    onValueChange={([val]) => setTempo(val)}
                    min={60}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{tempo}</span>
                </div>
              </div>

              <div>
                <Label>Bars</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[bars]}
                    onValueChange={([val]) => setBars(val)}
                    min={1}
                    max={16}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{bars}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Kit</Label>
              <Select value={kitId} onValueChange={setKitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RolandTR808">Roland TR-808</SelectItem>
                  <SelectItem value="RolandTR909">Roland TR-909</SelectItem>
                  <SelectItem value="casio">Casio</SelectItem>
                  <SelectItem value="glockenspiel">Glockenspiel</SelectItem>
                  <SelectItem value="synth">Synth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRender} disabled={rendering} className="flex-1">
                <Volume2 className="mr-2 h-4 w-4" />
                {rendering ? 'Rendering...' : 'Render'}
              </Button>
              <Button onClick={handleDownload} disabled={!audioUrl} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleCopySource} disabled={!audioUrl} variant="outline">
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
            <CardTitle>Audio Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] space-y-4">
              {audioUrl ? (
                <>
                  <Button
                    onClick={handlePlayPause}
                    size="lg"
                    variant={playing ? 'destructive' : 'default'}
                  >
                    {playing ? (
                      <>
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Play
                      </>
                    )}
                  </Button>
                  <audio
                    ref={audioRef}
                    onEnded={() => setPlaying(false)}
                    className="w-full"
                  />
                </>
              ) : (
                <p className="text-muted-foreground">Click Render to generate audio</p>
              )}
            </div>
          </CardContent>
        </Card>

        {metadata && (
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tempo:</span>
                <Badge variant="outline">{metadata.tempo} BPM</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bars:</span>
                <Badge variant="outline">{metadata.bars}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scale:</span>
                <Badge variant="outline">{metadata.scale}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="outline">{metadata.duration?.toFixed(2)}s</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kit:</span>
                <Badge variant="outline">{metadata.kitId}</Badge>
              </div>
              <div className="mt-4">
                <Label className="text-xs">Pattern</Label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {metadata.pattern}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add as Trait</CardTitle>
            <CardDescription>
              Add this audio pattern to your collection
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

            <Button onClick={handleAddTrait} disabled={!audioUrl} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Trait
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
