import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import { Track } from '@/lib/strudel/DAWEngine';
import Editor from '@monaco-editor/react';

interface TrackLaneProps {
  track: Track;
  onUpdate: (updates: Partial<Track>) => void;
}

export function TrackLane({ track, onUpdate }: TrackLaneProps) {
  return (
    <Card className={track.muted ? 'opacity-50' : ''}>
      <CardContent className="p-4">
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* Track Name & Controls */}
          <div className="col-span-2 space-y-2">
            <Label className="font-semibold">{track.name}</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={track.muted ? 'default' : 'outline'}
                onClick={() => onUpdate({ muted: !track.muted })}
                className="flex-1"
              >
                {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant={track.solo ? 'default' : 'outline'}
                onClick={() => onUpdate({ solo: !track.solo })}
                className="flex-1"
              >
                <Radio className="h-3 w-3" />
              </Button>
            </div>
            <div>
              <Label className="text-xs">Kit</Label>
              <Select value={track.kitId} onValueChange={(kitId) => onUpdate({ kitId })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RolandTR808">TR-808</SelectItem>
                  <SelectItem value="RolandTR909">TR-909</SelectItem>
                  <SelectItem value="casio">Casio</SelectItem>
                  <SelectItem value="glockenspiel">Glockenspiel</SelectItem>
                  <SelectItem value="synth">Synth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pattern Editor */}
          <div className="col-span-6">
            <Label className="text-xs mb-1 block">Pattern</Label>
            <div className="border rounded-md overflow-hidden">
              <Editor
                height="60px"
                defaultLanguage="javascript"
                value={track.pattern}
                onChange={(value) => onUpdate({ pattern: value || '' })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  wordWrap: 'on',
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              bd=kick, sn=snare, hh=hihat, cp=clap, ~=rest
            </p>
          </div>

          {/* Volume & Pan */}
          <div className="col-span-4 space-y-3">
            <div>
              <Label className="text-xs">Volume</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[track.volume * 100]}
                  onValueChange={([val]) => onUpdate({ volume: val / 100 })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{Math.round(track.volume * 100)}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Pan</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs w-4">L</span>
                <Slider
                  value={[track.pan * 100]}
                  onValueChange={([val]) => onUpdate({ pan: val / 100 })}
                  min={-100}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-4">R</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
