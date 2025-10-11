import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TileInstance, TileDefinition } from '@/types/StrudelChain';

interface TileEditorProps {
  tile: TileInstance;
  definition: TileDefinition;
  onUpdate: (params: Record<string, any>) => void;
}

export function TileEditor({ tile, definition, onUpdate }: TileEditorProps) {
  const [localParams, setLocalParams] = useState(tile.params);

  const handleParamChange = (key: string, value: any) => {
    const updated = { ...localParams, [key]: value };
    setLocalParams(updated);
    onUpdate(updated);
  };

  const getParamControl = (key: string, value: any) => {
    if (typeof value === 'number') {
      // Determine max based on parameter name
      let max = 1;
      let step = 0.01;
      if (key === 'cutoff' || key.includes('freq')) {
        max = 5000;
        step = 10;
      } else if (key === 'gain' || key === 'amp') {
        max = 2;
        step = 0.05;
      } else if (key === 'speed' || key === 'rate') {
        max = 4;
        step = 0.1;
      }

      return (
        <Slider
          value={[value]}
          onValueChange={([v]) => handleParamChange(key, v)}
          min={0}
          max={max}
          step={step}
          className="w-full"
        />
      );
    }

    return (
      <Input
        value={String(value)}
        onChange={(e) => handleParamChange(key, e.target.value)}
        className="w-full"
      />
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-accent/50">
          <Settings className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">{definition.label}</h4>
            <p className="text-xs text-muted-foreground">{definition.description}</p>
          </div>
          <div className="space-y-3">
            {Object.entries(localParams).map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{key}</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </span>
                </div>
                {getParamControl(key, value)}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
