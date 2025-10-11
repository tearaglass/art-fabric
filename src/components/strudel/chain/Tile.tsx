import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TileInstance } from '@/types/StrudelChain';
import { TILE_DEFINITIONS } from '@/types/StrudelChain';
import { TileEditor } from './TileEditor';

interface TileProps {
  tile: TileInstance;
  onRemove: () => void;
  onUpdate: (params: Record<string, any>) => void;
  isPlaying?: boolean;
}

const CATEGORY_COLORS = {
  source: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100',
  sound: 'bg-blue-500/20 border-blue-500/50 text-blue-100',
  filter: 'bg-orange-500/20 border-orange-500/50 text-orange-100',
  effects: 'bg-purple-500/20 border-purple-500/50 text-purple-100',
  modulation: 'bg-pink-500/20 border-pink-500/50 text-pink-100',
  output: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100',
};

export function Tile({ tile, onRemove, onUpdate, isPlaying = false }: TileProps) {
  const definition = TILE_DEFINITIONS.find(d => d.id === tile.definitionId);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!definition) return null;

  const colorClass = CATEGORY_COLORS[definition.category];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-2 p-3 rounded-lg border-2 ${colorClass} backdrop-blur-sm ${
        isPlaying ? 'animate-pulse-subtle ring-2 ring-primary/30' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 opacity-50" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{definition.label}</span>
          <Badge variant="outline" className="text-xs">
            {definition.fn}()
          </Badge>
        </div>
        <div className="text-xs opacity-70">
          {Object.entries(tile.params).map(([key, value]) => (
            <span key={key} className="mr-2">
              {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
            </span>
          ))}
        </div>
      </div>
      
      <TileEditor tile={tile} definition={definition} onUpdate={onUpdate} />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 hover:bg-destructive/20"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
