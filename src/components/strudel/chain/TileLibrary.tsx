import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { TILE_DEFINITIONS, TileDefinition, TileCategory } from '@/types/StrudelChain';
import { Music, Waves, Filter, Sparkles, Repeat, Volume2, Search } from 'lucide-react';

const CATEGORY_ICONS: Record<TileCategory, any> = {
  source: Music,
  sound: Waves,
  filter: Filter,
  effects: Sparkles,
  modulation: Repeat,
  output: Volume2,
};

const CATEGORY_COLORS = {
  source: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100',
  sound: 'bg-blue-500/20 border-blue-500/50 text-blue-100',
  filter: 'bg-orange-500/20 border-orange-500/50 text-orange-100',
  effects: 'bg-purple-500/20 border-purple-500/50 text-purple-100',
  modulation: 'bg-pink-500/20 border-pink-500/50 text-pink-100',
  output: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100',
};

function DraggableTile({ definition }: { definition: TileDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${definition.id}`,
    data: { definition },
  });

  const colorClass = CATEGORY_COLORS[definition.category];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-lg border-2 cursor-grab active:cursor-grabbing ${colorClass} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm">{definition.label}</span>
        <Badge variant="outline" className="text-xs">
          {definition.fn}()
        </Badge>
      </div>
      <p className="text-xs opacity-70">{definition.description}</p>
    </div>
  );
}

export function TileLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = Array.from(new Set(TILE_DEFINITIONS.map(t => t.category)));

  // Filter tiles based on search
  const filteredTiles = TILE_DEFINITIONS.filter(tile => 
    tile.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tile.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tile.fn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="p-4 border-b border-border space-y-3">
        <div>
          <h3 className="font-semibold">Tile Library</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag tiles to build your pattern
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search tiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="p-4 space-y-4">
          {searchQuery ? (
            // Show filtered search results
            filteredTiles.length > 0 ? (
              <div className="space-y-2">
                {filteredTiles.map(tile => (
                  <DraggableTile key={tile.id} definition={tile} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No tiles found
              </div>
            )
          ) : (
            // Show categorized view
            categories.map(category => {
              const Icon = CATEGORY_ICONS[category];
              const tiles = TILE_DEFINITIONS.filter(t => t.category === category);
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <h4 className="text-sm font-medium capitalize">{category}</h4>
                  </div>
                  <div className="space-y-2">
                    {tiles.map(tile => (
                      <DraggableTile key={tile.id} definition={tile} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
