import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { ChevronRight } from 'lucide-react';
import { Tile } from './Tile';
import { TileInstance } from '@/types/StrudelChain';

interface ChainBuilderProps {
  tiles: TileInstance[];
  onTilesChange: (tiles: TileInstance[]) => void;
}

export function ChainBuilder({ tiles, onTilesChange }: ChainBuilderProps) {
  const { setNodeRef } = useDroppable({ id: 'chain-builder' });

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

  return (
    <div
      ref={setNodeRef}
      className="flex-1 p-6 bg-background/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-border min-h-[400px]"
    >
      {tiles.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-center">
            Drag tiles from the library to build your pattern chain
          </p>
        </div>
      ) : (
        <SortableContext items={tiles.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tiles.map((tile, index) => (
              <div key={tile.id} className="flex items-center gap-3">
                <Tile tile={tile} onRemove={() => handleRemove(tile.id)} />
                {index < tiles.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
