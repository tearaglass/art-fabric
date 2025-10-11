/**
 * LayerControls - UI for managing individual layers
 */

import { Layer, BlendMode } from '@/lib/rendering/Layer';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';

interface LayerControlsProps {
  layer: Layer;
  onUpdate: (layerId: string, updates: Partial<Layer['config']>) => void;
  onRemove: (layerId: string) => void;
  onReorder?: (layerId: string, direction: 'up' | 'down') => void;
}

const BLEND_MODES: BlendMode[] = [
  'normal', 'add', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion'
];

export function LayerControls({ layer, onUpdate, onRemove, onReorder }: LayerControlsProps) {
  const { config } = layer;
  
  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        
        <Input
          value={config.name}
          onChange={(e) => onUpdate(config.id, { name: e.target.value })}
          className="flex-1 h-8 text-sm"
        />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUpdate(config.id, { enabled: !config.enabled })}
        >
          {config.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(config.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Type Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
          {config.type}
        </span>
        
        <div className="flex-1" />
        
        {onReorder && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onReorder(config.id, 'up')}>
              ↑
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReorder(config.id, 'down')}>
              ↓
            </Button>
          </div>
        )}
      </div>
      
      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Opacity</Label>
          <span className="text-xs text-muted-foreground">
            {Math.round(config.opacity * 100)}%
          </span>
        </div>
        <Slider
          value={[config.opacity]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={([value]) => onUpdate(config.id, { opacity: value })}
        />
      </div>
      
      {/* Blend Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Blend Mode</Label>
        <Select
          value={config.blendMode}
          onValueChange={(value) => onUpdate(config.id, { blendMode: value as BlendMode })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLEND_MODES.map((mode) => (
              <SelectItem key={mode} value={mode} className="text-xs">
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Transform */}
      <div className="space-y-2">
        <Label className="text-xs">Scale</Label>
        <div className="flex gap-2">
          <Slider
            value={[config.scale.x]}
            min={0.1}
            max={3}
            step={0.1}
            onValueChange={([x]) => onUpdate(config.id, { 
              scale: { ...config.scale, x } 
            })}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12 text-right">
            {config.scale.x.toFixed(1)}x
          </span>
        </div>
      </div>
      
      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Rotation</Label>
          <span className="text-xs text-muted-foreground">
            {Math.round((config.rotation * 180) / Math.PI)}°
          </span>
        </div>
        <Slider
          value={[config.rotation]}
          min={0}
          max={Math.PI * 2}
          step={0.01}
          onValueChange={([rotation]) => onUpdate(config.id, { rotation })}
        />
      </div>
    </Card>
  );
}
