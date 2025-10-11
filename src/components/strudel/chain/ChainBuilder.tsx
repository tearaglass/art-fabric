import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { ChevronRight, Music, Waves, Zap } from 'lucide-react';
import { Tile } from './Tile';
import { TileInstance, TILE_DEFINITIONS } from '@/types/StrudelChain';
import { Badge } from '@/components/ui/badge';

interface ChainBuilderProps {
  tiles: TileInstance[];
  onTilesChange: (tiles: TileInstance[]) => void;
  isPlaying?: boolean;
}

export function ChainBuilder({ tiles, onTilesChange, isPlaying = false }: ChainBuilderProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'chain-builder' });

  const handleRemove = (tileId: string) => {
    onTilesChange(tiles.filter(t => t.id !== tileId));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const oldIndex = tiles.findIndex(t => t.id === active.id);
      const newIndex = tiles.findIndex(t => t.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onTilesChange(arrayMove(tiles, oldIndex, newIndex));
      }
    }
  };

  // Validation: check if chain has source tile
  const hasSource = tiles.some(t => {
    const def = TILE_DEFINITIONS.find(d => d.id === t.definitionId);
    return def?.category === 'source';
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 bg-background/50 backdrop-blur-sm rounded-lg border-2 border-dashed min-h-[400px] transition-colors ${
        isOver 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
          : 'border-border'
      }`}
    >
      {tiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Build Your Pattern</h3>
            <p className="text-sm mb-4">
              Drag tiles from the library to create a sound chain
            </p>
          </div>
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Note</span>
              </div>
              <ChevronRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">Sawtooth</span>
              </div>
              <ChevronRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-medium">Reverb</span>
              </div>
            </div>
            <p className="text-xs text-center opacity-70">Try dragging these tiles to get started</p>
          </div>
        </div>
      ) : (
        <>
          {!hasSource && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
              <Badge variant="destructive" className="mb-1">⚠ Missing Source</Badge>
              <p className="text-xs text-muted-foreground">Add a source tile (Note, Sound) to play audio</p>
            </div>
          )}
          <SortableContext items={tiles.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tiles.map((tile, index) => (
                <div key={tile.id} className="flex items-center gap-3">
                  <Tile
                    tile={tile}
                    isPlaying={isPlaying}
                    onRemove={() => handleRemove(tile.id)}
                    onUpdate={(params) => {
                      const updatedTiles = tiles.map(t =>
                        t.id === tile.id ? { ...t, params } : t
                      );
                      onTilesChange(updatedTiles);
                    }}
                  />
                  {index < tiles.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </>
      )}
    </div>
  );
}
