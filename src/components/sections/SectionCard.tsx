/**
 * SectionCard - Individual section card with controls
 */

import { Section } from '@/lib/sections/Section';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Play, Copy, Trash2, GripVertical, 
  Clock, Music2, Sliders 
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SectionCardProps {
  section: Section;
  isActive: boolean;
  onTrigger: (sectionId: string) => void;
  onUpdate: (sectionId: string, updates: Partial<Section['config']>) => void;
  onClone: (sectionId: string) => void;
  onRemove: (sectionId: string) => void;
}

export function SectionCard({
  section,
  isActive,
  onTrigger,
  onUpdate,
  onClone,
  onRemove,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { config } = section;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={`overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onTrigger(config.id)}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          
          <div 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{config.name}</h3>
              {isActive && (
                <Badge variant="default" className="text-xs">Active</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Music2 className="w-3 h-3" />
                {config.bpm} BPM
              </span>
              
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                {config.tracks.length} tracks
              </span>
              
              {config.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {config.duration} bars
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTrigger(config.id)}
            >
              <Play className="w-4 h-4" />
            </Button>
            
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost">
                <span className="text-xs">Edit</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t">
            {/* Name & Description */}
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={config.name}
                onChange={(e) => onUpdate(config.id, { name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={config.description || ''}
                onChange={(e) => onUpdate(config.id, { description: e.target.value })}
                className="text-xs min-h-[60px]"
                placeholder="Optional description..."
              />
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs">Auto-advance (bars)</Label>
              <Input
                type="number"
                value={config.duration || ''}
                onChange={(e) => onUpdate(config.id, { 
                  duration: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="h-8 text-sm"
                placeholder="Leave empty to disable"
              />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">BPM</div>
                <div className="font-mono">{config.bpm}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Tracks</div>
                <div className="font-mono">{config.tracks.length}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Macros</div>
                <div className="font-mono text-xs">
                  A:{config.macros.A.toFixed(2)} B:{config.macros.B.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Created</div>
                <div className="font-mono">
                  {new Date(config.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onClone(config.id)}
                className="flex-1"
              >
                <Copy className="w-3 h-3 mr-1" />
                Clone
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(config.id)}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
