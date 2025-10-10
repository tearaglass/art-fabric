import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, Download } from 'lucide-react';

interface TransportControlsProps {
  playing: boolean;
  bpm: number;
  bars: number;
  masterVolume: number;
  onPlayPause: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onBarsChange: (bars: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onRender: () => void;
  onDownload: () => void;
  rendering: boolean;
  hasAudio: boolean;
}

export function TransportControls({
  playing,
  bpm,
  bars,
  masterVolume,
  onPlayPause,
  onStop,
  onBpmChange,
  onBarsChange,
  onMasterVolumeChange,
  onRender,
  onDownload,
  rendering,
  hasAudio,
}: TransportControlsProps) {
  return (
    <div className="grid grid-cols-12 gap-4 items-end">
      {/* Transport Buttons */}
      <div className="col-span-3 flex gap-2">
        <Button onClick={onPlayPause} variant={playing ? 'destructive' : 'default'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button onClick={onStop} variant="outline">
          <Square className="h-4 w-4" />
        </Button>
        <Button onClick={onRender} disabled={rendering} variant="outline">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button onClick={onDownload} disabled={!hasAudio} variant="outline">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* BPM */}
      <div className="col-span-3">
        <Label className="text-xs">BPM</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[bpm]}
            onValueChange={([val]) => onBpmChange(val)}
            min={60}
            max={200}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">{bpm}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="col-span-3">
        <Label className="text-xs">Bars</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[bars]}
            onValueChange={([val]) => onBarsChange(val)}
            min={1}
            max={16}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">{bars}</span>
        </div>
      </div>

      {/* Master Volume */}
      <div className="col-span-3">
        <Label className="text-xs">Master Volume</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[masterVolume * 100]}
            onValueChange={([val]) => onMasterVolumeChange(val / 100)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">{Math.round(masterVolume * 100)}</span>
        </div>
      </div>
    </div>
  );
}
