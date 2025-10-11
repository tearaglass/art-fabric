import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  BookOpen,
  Code,
  Zap,
  Music,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { strudelEngine } from '@/lib/strudel/StrudelEngine';
import { STRUDEL_PRESETS, MINI_NOTATION_EXAMPLES, StrudelPreset } from '@/lib/strudel/presets';
import { SAMPLE_MAPS, DEFAULT_SAMPLE_MAP_URL } from '@/lib/strudel/sampleMaps';

export function StrudelLabTab() {
  const { toast } = useToast();
  const [code, setCode] = useState('s("[bd sd, hh*8]")');
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSampleMap, setSelectedSampleMap] = useState<string>('default');
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      strudelEngine.stop();
    };
  }, []);

  const handleInitialize = async () => {
    try {
      await strudelEngine.initialize();
      audioContextRef.current = strudelEngine.getAudioContext();
      setIsInitialized(true);
      
      toast({
        title: 'Strudel Initialized',
        description: 'Ready to live code!',
      });
    } catch (error) {
      console.error('Init error:', error);
      toast({
        title: 'Initialization Failed',
        description: error instanceof Error ? error.message : 'Could not initialize audio',
        variant: 'destructive',
      });
    }
  };

  const handleEvaluate = async () => {
    if (!isInitialized) {
      await handleInitialize();
    }

    try {
      setError(null);
      await strudelEngine.evaluatePattern(code);
      
      toast({
        title: 'Pattern Evaluated',
        description: 'Pattern ready to play',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Pattern error';
      setError(errorMsg);
      
      // Check if it's a sample-related error
      const isUnknownSample = errorMsg.toLowerCase().includes('unknown') || 
                              errorMsg.toLowerCase().includes('sample');
      
      toast({
        title: 'Pattern Error',
        description: errorMsg,
        variant: 'destructive',
        action: isUnknownSample ? (
          <Button
            size="sm"
            onClick={async () => {
              await strudelEngine.loadSampleMap(DEFAULT_SAMPLE_MAP_URL);
              toast({
                title: 'Sample map loaded',
                description: 'Default samples are now available',
              });
            }}
          >
            Load Default Samples
          </Button>
        ) : undefined,
      });
    }
  };

  const handleLoadSampleMap = async (mapId: string) => {
    const map = SAMPLE_MAPS.find(m => m.id === mapId);
    if (!map) return;

    try {
      await strudelEngine.loadSampleMap(map.url);
      setSelectedSampleMap(mapId);
      localStorage.setItem('strudel-sample-map', mapId);
      
      toast({
        title: 'Sample map loaded',
        description: `${map.name} samples are now available`,
      });
    } catch (error) {
      toast({
        title: 'Failed to load sample map',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handlePlay = async () => {
    if (!isInitialized) {
      await handleInitialize();
    }

    try {
      if (isPlaying) {
        strudelEngine.pause();
        setIsPlaying(false);
      } else {
        // Evaluate current pattern before playing
        await strudelEngine.evaluatePattern(code);
        await strudelEngine.start();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play error:', error);
      toast({
        title: 'Playback Error',
        description: error instanceof Error ? error.message : 'Could not start playback',
        variant: 'destructive',
      });
    }
  };

  const handleStop = () => {
    strudelEngine.stop();
    setIsPlaying(false);
  };

  const handleBPMChange = (value: number[]) => {
    const newBpm = value[0];
    setBpm(newBpm);
    if (isInitialized) {
      strudelEngine.setBPM(newBpm);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioContextRef.current) {
      // This would require access to the master gain node
      // For now, we'll just store the value
    }
  };

  const loadPreset = (preset: StrudelPreset) => {
    setCode(preset.code);
    setBpm(preset.bpm);
    setSelectedPreset(preset.id);
    setError(null);
    
    toast({
      title: 'Preset Loaded',
      description: preset.name,
    });
  };

  const quickEvaluate = async () => {
    if (!isInitialized) {
      await handleInitialize();
    }
    await handleEvaluate();
    
    if (!isPlaying) {
      await strudelEngine.start();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold gradient-text">Strudel Live Coding Lab</h2>
              <p className="text-sm text-muted-foreground">
                Real-time algorithmic pattern language
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isInitialized ? "default" : "secondary"}>
              {isInitialized ? 'Ready' : 'Not Initialized'}
            </Badge>
            <Badge variant={isPlaying ? "default" : "outline"}>
              {isPlaying ? 'Playing' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={handlePlay}
            className="gradient-primary gap-2"
            disabled={!isInitialized && !code.trim()}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <Button
            onClick={handleStop}
            variant="outline"
            disabled={!isPlaying}
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>

          <Button
            onClick={quickEvaluate}
            variant="secondary"
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Evaluate (Ctrl+Enter)
          </Button>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-3 flex-1">
            <Label className="text-sm whitespace-nowrap">BPM</Label>
            <div className="w-32">
              <Slider
                value={[bpm]}
                onValueChange={handleBPMChange}
                min={60}
                max={200}
                step={1}
                className="flex-1"
              />
            </div>
            <span className="text-sm font-mono text-muted-foreground w-12">{bpm}</span>
          </div>

          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div className="w-24">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Sample Map</Label>
            <Select value={selectedSampleMap} onValueChange={handleLoadSampleMap}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_MAPS.map(map => (
                  <SelectItem key={map.id} value={map.id} className="text-xs">
                    {map.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Editor */}
        <Card className="lg:col-span-2 p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Live Code Editor</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to evaluate
            </p>
          </div>

          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                quickEvaluate();
              }
            }}
            className="font-mono text-sm bg-background border-border min-h-[300px] resize-none"
            placeholder='s("[bd sd, hh*8]")'
          />

          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCode(code + '.fast(2)')}
            >
              .fast(2)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCode(code + '.slow(2)')}
            >
              .slow(2)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCode(code + '.rev()')}
            >
              .rev()
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCode(code + '.sometimes(fast(2))')}
            >
              .sometimes()
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCode(code + '.lpf(800)')}
            >
              .lpf()
            </Button>
          </div>
        </Card>

        {/* Sidebar */}
        <Card className="p-6 border-border bg-card">
          <Tabs defaultValue="presets">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">
                <Sparkles className="w-4 h-4 mr-2" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="docs">
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {Object.entries(
                    STRUDEL_PRESETS.reduce((acc, preset) => {
                      if (!acc[preset.category]) acc[preset.category] = [];
                      acc[preset.category].push(preset);
                      return acc;
                    }, {} as Record<string, StrudelPreset[]>)
                  ).map(([category, presets]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-semibold text-primary mb-2 capitalize">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => loadPreset(preset)}
                            className={`w-full text-left p-3 rounded border transition-colors ${
                              selectedPreset === preset.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-muted/30 hover:bg-muted/50'
                            }`}
                          >
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {preset.description}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-2 bg-background/50 p-1 rounded">
                              {preset.code.length > 40 
                                ? preset.code.substring(0, 40) + '...' 
                                : preset.code}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Docs Tab */}
            <TabsContent value="docs" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {MINI_NOTATION_EXAMPLES.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-semibold text-primary mb-2">
                        {section.title}
                      </h4>
                      <div className="space-y-2">
                        {section.examples.map((example, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-3 rounded border border-border bg-muted/30"
                          >
                            <code className="text-xs font-mono text-foreground block mb-1">
                              {example.code}
                            </code>
                            <p className="text-xs text-muted-foreground">
                              {example.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 border border-primary/30 bg-primary/5 rounded">
                    <h4 className="text-sm font-semibold text-primary mb-2">
                      Quick Reference
                    </h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• <code className="font-mono">s("bd")</code> - Play sample</li>
                      <li>• <code className="font-mono">note("c3")</code> - Play note</li>
                      <li>• <code className="font-mono">*4</code> - Repeat 4 times</li>
                      <li>• <code className="font-mono">/2</code> - Every 2nd cycle</li>
                      <li>• <code className="font-mono">[a, b]</code> - Stack patterns</li>
                      <li>• <code className="font-mono">&lt;a b&gt;</code> - Alternate</li>
                      <li>• <code className="font-mono">~</code> - Rest/silence</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
