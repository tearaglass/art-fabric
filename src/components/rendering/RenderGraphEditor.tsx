/**
 * RenderGraphEditor - Visual editor for RenderGraph
 */

import { useEffect, useRef, useState } from 'react';
import { RenderGraph } from '@/lib/rendering/RenderGraph';
import { Layer, LayerType } from '@/lib/rendering/Layer';
import { LayerControls } from './LayerControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Plus, Layers } from 'lucide-react';

export function RenderGraphEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<RenderGraph | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ layerCount: 0, frameCount: 0 });
  
  // Initialize RenderGraph
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const graph = new RenderGraph({
      width: 800,
      height: 600,
      backgroundColor: '#000000',
      outputCanvas: canvasRef.current,
    });
    
    graphRef.current = graph;
    
    // Update stats periodically
    const interval = setInterval(() => {
      setStats(graph.getStats());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      graph.dispose();
    };
  }, []);
  
  // Sync layers state
  const refreshLayers = () => {
    if (graphRef.current) {
      setLayers([...graphRef.current.getLayers()]);
    }
  };
  
  const handleAddLayer = (type: LayerType) => {
    if (!graphRef.current) return;
    
    const layer = graphRef.current.addLayer({
      name: `${type} Layer ${layers.length + 1}`,
      type,
      opacity: 1,
      blendMode: 'normal',
    });
    
    refreshLayers();
    
    // Auto-start if not playing
    if (!isPlaying) {
      handlePlay();
    }
  };
  
  const handleUpdateLayer = (layerId: string, updates: Partial<Layer['config']>) => {
    const layer = graphRef.current?.getLayer(layerId);
    if (layer) {
      layer.update(updates);
      refreshLayers();
    }
  };
  
  const handleRemoveLayer = (layerId: string) => {
    graphRef.current?.removeLayer(layerId);
    refreshLayers();
  };
  
  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!graphRef.current) return;
    
    const currentLayers = graphRef.current.getLayers();
    const currentIndex = currentLayers.findIndex(l => l.config.id === layerId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < currentLayers.length) {
      graphRef.current.reorderLayer(layerId, newIndex);
      refreshLayers();
    }
  };
  
  const handlePlay = () => {
    graphRef.current?.start();
    setIsPlaying(true);
  };
  
  const handleStop = () => {
    graphRef.current?.stop();
    setIsPlaying(false);
  };
  
  return (
    <div className="grid grid-cols-[1fr_320px] gap-4 h-full">
      {/* Preview */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              RenderGraph Preview
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {stats.layerCount} layers • {stats.frameCount} frames
              </span>
              
              {!isPlaying ? (
                <Button size="sm" onClick={handlePlay}>
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleStop}>
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center bg-muted/20">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full border border-border rounded"
            style={{ imageRendering: 'auto' }}
          />
        </CardContent>
      </Card>
      
      {/* Layer Stack */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Layers</CardTitle>
            
            <Select onValueChange={(value) => handleAddLayer(value as LayerType)}>
              <SelectTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shader">Shader</SelectItem>
                <SelectItem value="p5">P5 Sketch</SelectItem>
                <SelectItem value="canvas">Canvas</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {layers.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No layers yet. Add one to get started!
              </div>
            ) : (
              layers.slice().reverse().map((layer) => (
                <LayerControls
                  key={layer.config.id}
                  layer={layer}
                  onUpdate={handleUpdateLayer}
                  onRemove={handleRemoveLayer}
                  onReorder={handleReorderLayer}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
