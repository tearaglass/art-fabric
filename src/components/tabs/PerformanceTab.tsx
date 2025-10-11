import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Circle, Radio, Shuffle, Download, Package } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';
import { getOSCClient } from '@/lib/osc/OSCClient';
import { useToast } from '@/hooks/use-toast';
import { exportPerformanceBundle } from '@/lib/export/PerformanceBundleExporter';

export const PerformanceTab = () => {
  const { traitClasses, seed, currentPatch } = useProjectStore();
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TraitRenderer>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [oscConnected, setOscConnected] = useState(false);
  const [bpmSync, setBpmSync] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentTokenId, setCurrentTokenId] = useState(1);

  const handleExportBundle = async () => {
    const blob = await exportPerformanceBundle(currentPatch, undefined, canvasRef.current || undefined);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Performance Bundle Exported',
      description: 'ZIP contains patch, code, MIDI, viz, and checksums',
    });
  };

  const oscClient = getOSCClient();

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new TraitRenderer();
    }
  }, []);

  useEffect(() => {
    // Connect to OSC on mount
    oscClient.connect()
      .then(() => setOscConnected(true))
      .catch(() => setOscConnected(false));

    return () => {
      oscClient.disconnect();
    };
  }, []);

  const getRandomTraitFromClass = (traitClass: any, tokenSeed: string) => {
    const rng = Math.random(); // Simplified - would use seedrandom in production
    const totalWeight = traitClass.traits.reduce((sum: number, t: any) => sum + t.weight, 0);
    let random = rng * totalWeight;
    
    for (const trait of traitClass.traits) {
      random -= trait.weight;
      if (random <= 0) return trait;
    }
    return traitClass.traits[0];
  };

  const renderCurrentToken = async () => {
    if (!rendererRef.current || !canvasRef.current || traitClasses.length === 0) return;

    const tokenSeed = `${seed}-${currentTokenId}`;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each trait layer
    for (const traitClass of traitClasses) {
      const trait = getRandomTraitFromClass(traitClass, tokenSeed);
      if (trait.imageSrc) {
        const traitCanvas = await rendererRef.current.renderTrait(trait, canvas.width, canvas.height, tokenSeed);
        ctx.drawImage(traitCanvas, 0, 0);
      }
    }
  };

  const handleRandomize = async () => {
    const newTokenId = Math.floor(Math.random() * 10000);
    setCurrentTokenId(newTokenId);
    await renderCurrentToken();

    if (oscConnected) {
      oscClient.randomize();
    }

    // Removed toast - too noisy during live performance
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying && bpmSync) {
      const intervalMs = (60 / bpm) * 1000 * 4; // Change every 4 beats
      const interval = setInterval(handleRandomize, intervalMs);
      return () => clearInterval(interval);
    }
  };

  const startRecording = async () => {
    if (!canvasRef.current) return;

    const stream = canvasRef.current.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000,
    });

    recordedChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-${Date.now()}.webm`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Recording saved',
        description: 'Performance exported as video',
      });
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    toast({
      title: 'Recording started',
      description: 'Capturing canvas to video...',
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    renderCurrentToken();
  }, [currentTokenId, traitClasses]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="gradient-text">Performance Mode</CardTitle>
          <CardDescription>Live VJ interface with VDMX integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OSC Status */}
          <div className="flex items-center gap-4">
            <Badge variant={oscConnected ? 'default' : 'secondary'} className="gap-2">
              <Circle className={`w-2 h-2 ${oscConnected ? 'fill-success animate-pulse' : 'fill-muted'}`} />
              OSC {oscConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant="outline">Token #{currentTokenId}</Badge>
          </div>

          {/* Large Canvas Preview */}
          <div className="relative aspect-square w-full max-w-2xl mx-auto bg-background/50 rounded-lg overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              className="w-full h-full object-contain"
            />
            {isRecording && (
              <div className="absolute top-4 right-4">
                <Badge variant="destructive" className="gap-2 animate-pulse">
                  <Radio className="w-3 h-3" />
                  REC
                </Badge>
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handlePlayPause}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button
              size="lg"
              onClick={() => setIsPlaying(false)}
              variant="outline"
            >
              <Square className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              onClick={handleRandomize}
              className="bg-gradient-primary text-primary-foreground gap-2"
            >
              <Shuffle className="w-5 h-5" />
              Randomize (Space)
            </Button>

            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'secondary'}
              className="gap-2"
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  Record
                </>
              )}
            </Button>

            <Button size="lg" onClick={handleExportBundle} variant="outline" className="gap-2">
              <Package className="w-4 h-4" />
              Export Bundle
            </Button>
          </div>

          {/* BPM Sync Controls */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bpm-sync">BPM Sync (Auto-randomize on beat)</Label>
                <Switch
                  id="bpm-sync"
                  checked={bpmSync}
                  onCheckedChange={setBpmSync}
                />
              </div>

              {bpmSync && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>BPM: {bpm}</Label>
                    <span className="text-sm text-muted-foreground">
                      Change every {((60 / bpm) * 4).toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[bpm]}
                    onValueChange={([value]) => {
                      setBpm(value);
                      if (oscConnected) {
                        oscClient.setBPM(value);
                      }
                    }}
                    min={60}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div><kbd className="px-2 py-1 bg-background rounded">Space</kbd> Randomize</div>
              <div><kbd className="px-2 py-1 bg-background rounded">P</kbd> Play/Pause</div>
              <div><kbd className="px-2 py-1 bg-background rounded">R</kbd> Record</div>
              <div><kbd className="px-2 py-1 bg-background rounded">F</kbd> Fullscreen</div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
