import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Sparkles, Download, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/store/useProjectStore';
import { DAWEngine, Track, MasterFX } from '@/lib/strudel/DAWEngine';
import { TrackLane } from '@/components/strudel/TrackLane';
import { TransportControls } from '@/components/strudel/TransportControls';
import { MasterFXPanel } from '@/components/strudel/MasterFXPanel';
import { AIPatternGenerator } from '@/components/strudel/AIPatternGenerator';

const initialTracks: Track[] = [
  { id: 'track-1', name: 'Drums', pattern: 'bd ~ sn ~', volume: 0.8, pan: 0, muted: false, solo: false, kitId: 'RolandTR808' },
  { id: 'track-2', name: 'Bass', pattern: 'c2 ~ e2 ~', volume: 0.7, pan: -0.2, muted: false, solo: false, kitId: 'synth' },
  { id: 'track-3', name: 'Melody', pattern: 'c4 e4 g4 ~', volume: 0.6, pan: 0.2, muted: false, solo: false, kitId: 'glockenspiel' },
  { id: 'track-4', name: 'FX', pattern: '~ ~ hh hh', volume: 0.5, pan: 0, muted: false, solo: false, kitId: 'RolandTR909' },
];

const initialMasterFX: MasterFX = {
  reverb: { enabled: false, amount: 0.3, decay: 2.0 },
  delay: { enabled: false, time: 0.25, feedback: 0.4 },
  eq: { enabled: false, low: 0, mid: 0, high: 0 },
  compressor: { enabled: false, threshold: -24, ratio: 4 },
};

export function StrudelLabTab() {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [bpm, setBpm] = useState(120);
  const [bars, setBars] = useState(4);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterFX, setMasterFX] = useState<MasterFX>(initialMasterFX);
  const [playing, setPlaying] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dawEngineRef = useRef(new DAWEngine());
  const { toast } = useToast();
  const { addTrait, traitClasses } = useProjectStore();

  const handleTrackUpdate = (trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
  };

  const handleRender = async () => {
    setRendering(true);
    try {
      const engine = dawEngineRef.current;
      const mixedBuffer = await engine.mixTracks(tracks, bpm, bars, masterVolume);
      const finalBuffer = engine.applyFX(mixedBuffer, masterFX);
      
      const wavData = engine.bufferToWav(finalBuffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
      }

      toast({
        title: 'DAW rendered',
        description: `${bars} bars at ${bpm} BPM`,
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
    if (!audioRef.current || !audioUrl) {
      handleRender().then(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setPlaying(true);
        }
      });
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.download = `strudel-daw-${Date.now()}.wav`;
    link.href = audioUrl;
    link.click();
  };

  const handleAIGenerate = (generatedTracks: Track[]) => {
    setTracks(generatedTracks);
    toast({
      title: 'AI patterns generated',
      description: 'All tracks updated with AI-generated patterns',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Strudel DAW
            <Badge variant="outline">4-Track</Badge>
          </CardTitle>
          <CardDescription>
            Multi-track generative audio workstation with AI pattern generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransportControls
            playing={playing}
            bpm={bpm}
            bars={bars}
            masterVolume={masterVolume}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onBpmChange={setBpm}
            onBarsChange={setBars}
            onMasterVolumeChange={setMasterVolume}
            onRender={handleRender}
            onDownload={handleDownload}
            rendering={rendering}
            hasAudio={!!audioUrl}
          />
        </CardContent>
      </Card>

      {/* AI Pattern Generator */}
      <AIPatternGenerator onGenerate={handleAIGenerate} currentBpm={bpm} />

      {/* Track Lanes */}
      <div className="space-y-3">
        {tracks.map(track => (
          <TrackLane
            key={track.id}
            track={track}
            onUpdate={(updates) => handleTrackUpdate(track.id, updates)}
          />
        ))}
      </div>

      {/* Master FX */}
      <MasterFXPanel fx={masterFX} onUpdate={setMasterFX} />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
