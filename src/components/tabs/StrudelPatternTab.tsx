import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Code, Grid3x3, RefreshCw, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { strudelEngine } from '@/lib/strudel/engine';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/store/useProjectStore';
import { compileStrudel } from '@/lib/strudel/compile';
import { TileLibrary } from '../strudel/chain/TileLibrary';
import { ChainBuilder } from '../strudel/chain/ChainBuilder';
import { TileInstance } from '@/types/StrudelChain';
import { TILE_DEFINITIONS } from '@/types/StrudelChain';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function StrudelPatternTab() {
  const { currentPatch } = useProjectStore();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'tiles' | 'code'>('tiles');
  const [tiles, setTiles] = useState<TileInstance[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [lastPlayedCode, setLastPlayedCode] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Compile current patch to Strudel code
  const compiledCode = useMemo(() => compileStrudel(currentPatch), [currentPatch]);

  // Compile tiles to Strudel code
  const tilesCode = useMemo(() => {
    if (tiles.length === 0) return '';
    
    // Ensure we have a source tile
    const hasSource = tiles.some(t => {
      const def = TILE_DEFINITIONS.find(d => d.id === t.definitionId);
      return def?.category === 'source';
    });
    
    if (!hasSource) return ''; // Invalid chain
    
    // Build code with proper tempo
    const bpm = currentPatch.bpm || 120;
    const cps = (bpm / 60 / 4).toFixed(2);
    let code = `cps(${cps})\n\n`;
    
    // Build chain with proper parameter serialization
    const chain = tiles.map(tile => {
      const def = TILE_DEFINITIONS.find(d => d.id === tile.definitionId);
      if (!def) return '';
      
      const params = Object.values(tile.params).map(v => {
        if (typeof v === 'string') return `"${v}"`;
        if (Array.isArray(v)) return `[${v.join(', ')}]`;
        return String(v);
      });
      
      return `${def.fn}(${params.join(', ')})`;
    }).filter(Boolean).join('.');
    
    return code + chain;
  }, [tiles, currentPatch.bpm]);

  // Use tiles code in tiles mode, manual code in code mode
  const activeCode = viewMode === 'tiles' ? tilesCode : manualCode;

  // Auto-play on component mount
  useEffect(() => {
    const autoPlay = async () => {
      if (!strudelEngine.isInitialized()) {
        try {
          await strudelEngine.run(activeCode);
          strudelEngine.setBpm(currentPatch.bpm);
          setIsPlaying(true);
        } catch (err) {
          console.error('[StrudelPatternTab] Auto-play failed:', err);
        }
      } else {
        setIsPlaying(true);
      }
    };
    
    autoPlay();
  }, []); // Run once on mount

  const handlePlay = async () => {
    try {
      setError(null);
      if (!activeCode || activeCode.trim() === '') {
        toast({ 
          variant: 'destructive',
          description: 'Add tiles or write code to play a pattern' 
        });
        return;
      }
      await strudelEngine.run(activeCode);
      strudelEngine.setBpm(currentPatch.bpm);
      setIsPlaying(true);
      setLastPlayedCode(activeCode);
      toast({ description: 'Pattern playing' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play';
      setError(message);
      toast({
        variant: 'destructive',
        description: message,
      });
    }
  };

  const handleStop = () => {
    strudelEngine.stop();
    setIsPlaying(false);
    setError(null);
  };

  const handleUpdate = async () => {
    try {
      setError(null);
      if (!activeCode || activeCode.trim() === '') {
        toast({ 
          variant: 'destructive',
          description: 'No code to update' 
        });
        return;
      }
      await strudelEngine.run(activeCode);
      strudelEngine.setBpm(currentPatch.bpm);
      setLastPlayedCode(activeCode);
      toast({ description: 'Pattern updated!' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update';
      setError(message);
      toast({
        variant: 'destructive',
        description: message,
      });
      // Keep playing last working pattern instead of stopping
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    toast({ description: 'Code copied to clipboard' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Dragging from library to chain
    if (active.id.toString().startsWith('library-') && over.id === 'chain-builder') {
      const definition = active.data.current?.definition;
      if (definition) {
        const newTile: TileInstance = {
          id: `${definition.id}-${Date.now()}`,
          definitionId: definition.id,
          params: { ...definition.defaultParams },
        };
        setTiles([...tiles, newTile]);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Strudel Pattern</CardTitle>
              <CardDescription>
                Magnetic poetry-style pattern builder
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'tiles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tiles')}
              >
                <Grid3x3 className="w-4 h-4 mr-2" /> Tiles
              </Button>
              <Button
                variant={viewMode === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (viewMode === 'tiles') {
                    setManualCode(tilesCode || compiledCode);
                  }
                  setViewMode('code');
                }}
              >
                <Code className="w-4 h-4 mr-2" /> Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-4 p-4">
          {!isPlaying ? (
            <Button onClick={handlePlay} variant="default" size="sm">
              <Play className="w-4 h-4 mr-2" /> Play
            </Button>
          ) : (
            <Button onClick={handleUpdate} variant="default" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Update
            </Button>
          )}
          <Button onClick={handleStop} disabled={!isPlaying} variant="outline" size="sm">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
          <div className="text-sm text-muted-foreground ml-4">
            Status: {isPlaying ? 'Playing' : 'Stopped'}
          </div>
          {error && (
            <Badge variant="destructive" className="ml-auto">
              Error
            </Badge>
          )}
        </CardContent>
      </Card>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
          <div className="flex-1 flex gap-4 min-h-0">
            {viewMode === 'tiles' ? (
              <>
                <TileLibrary />
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <ChainBuilder tiles={tiles} onTilesChange={setTiles} isPlaying={isPlaying} />
                  
                  {/* Code Preview Panel */}
                  {tilesCode && (
                    <Collapsible open={showCodePreview} onOpenChange={setShowCodePreview}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-between">
                          <span className="flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Generated Code Preview
                            {activeCode !== lastPlayedCode && isPlaying && (
                              <Badge variant="outline" className="text-xs">Changes pending</Badge>
                            )}
                          </span>
                          {showCodePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="relative">
                          <pre className="p-4 bg-muted/50 rounded-lg border text-xs font-mono overflow-x-auto">
                            {tilesCode}
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={handleCopyCode}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <Textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Write Strudel code here..."
                  className="flex-1 font-mono text-sm"
                />
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                    <p className="text-sm text-destructive font-mono">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
