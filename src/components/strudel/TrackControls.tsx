/**
 * TrackControls - Individual track controls UI
 */

import { PatternTrack } from '@/lib/strudel/PatternTrack';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Volume2, VolumeX, Circle, GripVertical, 
  Trash2, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TrackControlsProps {
  track: PatternTrack;
  onUpdate: (trackId: string, updates: Partial<PatternTrack['config']>) => void;
  onRemove: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onReorder?: (trackId: string, direction: 'up' | 'down') => void;
}

export function TrackControls({
  track,
  onUpdate,
  onRemove,
  onToggleMute,
  onToggleSolo,
  onReorder,
}: TrackControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { config } = track;
  const state = track.getState();
  const error = track.getError();
  
  const stateColor = {
    stopped: 'text-muted-foreground',
    playing: 'text-green-500',
    error: 'text-destructive',
  }[state];
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 bg-muted/30">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          
          <div 
            className="w-1 h-8 rounded-full" 
            style={{ backgroundColor: config.color }}
          />
          
          <Input
            value={config.name}
            onChange={(e) => onUpdate(config.id, { name: e.target.value })}
            className="flex-1 h-8 text-sm font-medium"
          />
          
          {/* State indicator */}
          <Circle className={`w-3 h-3 fill-current ${stateColor}`} />
          
          {/* Mute */}
          <Button
            size="sm"
            variant={config.muted ? 'destructive' : 'ghost'}
            onClick={() => onToggleMute(config.id)}
            title="Mute"
          >
            {config.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          {/* Solo */}
          <Button
            size="sm"
            variant={config.solo ? 'default' : 'ghost'}
            onClick={() => onToggleSolo(config.id)}
            title="Solo"
          >
            S
          </Button>
          
          {/* Expand/Collapse */}
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          
          {/* Remove */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(config.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded text-xs">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-destructive">{error}</span>
              </div>
            )}
            
            {/* Code editor */}
            <div className="space-y-2">
              <Label className="text-xs">Pattern Code</Label>
              <Textarea
                value={config.code}
                onChange={(e) => onUpdate(config.id, { code: e.target.value })}
                className="font-mono text-xs min-h-[120px]"
                placeholder="sound('bd').euclidean(3,8)"
              />
            </div>
            
            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Volume</Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(config.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[config.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([volume]) => onUpdate(config.id, { volume })}
              />
            </div>
            
            {/* Pan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pan</Label>
                <span className="text-xs text-muted-foreground">
                  {config.pan > 0 ? 'R' : config.pan < 0 ? 'L' : 'C'} {Math.abs(Math.round(config.pan * 100))}
                </span>
              </div>
              <Slider
                value={[config.pan]}
                min={-1}
                max={1}
                step={0.01}
                onValueChange={([pan]) => onUpdate(config.id, { pan })}
              />
            </div>
            
            {/* Reorder buttons */}
            {onReorder && (
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onReorder(config.id, 'up')}
                  className="flex-1"
                >
                  Move Up
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onReorder(config.id, 'down')}
                  className="flex-1"
                >
                  Move Down
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
