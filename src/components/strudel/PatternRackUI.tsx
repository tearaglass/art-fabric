/**
 * PatternRackUI - Multi-track Strudel pattern rack interface
 */

import { useEffect, useState } from 'react';
import { patternRack } from '@/lib/strudel/PatternRack';
import { PatternTrack } from '@/lib/strudel/PatternTrack';
import { TrackControls } from './TrackControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Square, Plus, Music, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PatternRackUI() {
  const [tracks, setTracks] = useState<PatternTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const { toast } = useToast();
  
  // Subscribe to rack changes
  useEffect(() => {
    const refreshTracks = () => {
      setTracks([...patternRack.getTracks()]);
      setIsPlaying(patternRack.getIsPlaying());
    };
    
    const unsub = patternRack.on(refreshTracks);
    refreshTracks();
    
    return unsub;
  }, []);
  
  const handleAddTrack = () => {
    const track = patternRack.addTrack({
      code: `// Track ${tracks.length + 1}\nsound('bd').euclidean(3,8)`,
    });
    
    toast({
      title: 'Track Added',
      description: `Added ${track.config.name}`,
    });
  };
  
  const handlePlay = () => {
    patternRack.playAll().catch(err => {
      toast({
        title: 'Playback Error',
        description: err.message,
        variant: 'destructive',
      });
    });
  };
  
  const handleStop = () => {
    patternRack.stopAll();
  };
  
  const handleUpdateTrack = (trackId: string, updates: Partial<PatternTrack['config']>) => {
    const track = patternRack.getTrack(trackId);
    if (track) {
      track.update(updates);
      
      // If code changed, update and restart
      if (updates.code) {
        patternRack.updateTrackCode(trackId, updates.code).catch(console.error);
      }
    }
  };
  
  const handleRemoveTrack = (trackId: string) => {
    patternRack.removeTrack(trackId);
    toast({
      title: 'Track Removed',
    });
  };
  
  const handleToggleMute = (trackId: string) => {
    patternRack.toggleMute(trackId);
  };
  
  const handleToggleSolo = (trackId: string) => {
    patternRack.toggleSolo(trackId);
  };
  
  const handleReorder = (trackId: string, direction: 'up' | 'down') => {
    const currentIndex = tracks.findIndex(t => t.config.id === trackId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < tracks.length) {
      patternRack.reorderTrack(trackId, newIndex);
    }
  };
  
  const handleBpmChange = (value: number) => {
    setBpm(value);
    const { strudelEngine } = require('@/lib/strudel/engine');
    strudelEngine.setBpm(value);
  };
  
  const handleExport = () => {
    const state = patternRack.getState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-rack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Rack Exported',
      description: 'Saved rack state to JSON',
    });
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const state = JSON.parse(json);
          patternRack.loadState(state);
          setBpm(state.bpm);
          
          toast({
            title: 'Rack Imported',
            description: `Loaded ${state.tracks.length} tracks`,
          });
        } catch (err) {
          toast({
            title: 'Import Failed',
            description: 'Invalid rack file',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Transport & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Pattern Rack
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleAddTrack}>
                <Plus className="w-4 h-4 mr-1" />
                Add Track
              </Button>
              
              {!isPlaying ? (
                <Button size="sm" onClick={handlePlay}>
                  <Play className="w-4 h-4 mr-1" />
                  Play All
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleStop}>
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">BPM</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {bpm}
                </span>
              </div>
              <Slider
                value={[bpm]}
                min={40}
                max={200}
                step={1}
                onValueChange={([value]) => handleBpmChange(value)}
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Track List */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tracks</CardTitle>
        </CardHeader>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {tracks.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12">
                No tracks yet. Click "Add Track" to get started!
              </div>
            ) : (
              tracks.map((track) => (
                <TrackControls
                  key={track.config.id}
                  track={track}
                  onUpdate={handleUpdateTrack}
                  onRemove={handleRemoveTrack}
                  onToggleMute={handleToggleMute}
                  onToggleSolo={handleToggleSolo}
                  onReorder={handleReorder}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
