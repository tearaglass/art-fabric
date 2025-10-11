import { useState } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TileInstance, TileDefinition } from '@/types/StrudelChain';

// Parameter presets
const PARAM_PRESETS: Record<string, number[]> = {
  cutoff: [500, 1000, 2000, 4000],
  freq: [100, 440, 880, 1760],
  gain: [0.25, 0.5, 0.75, 1.0],
  amp: [0.25, 0.5, 0.75, 1.0],
  speed: [0.5, 1.0, 1.5, 2.0],
  rate: [0.5, 1.0, 1.5, 2.0],
};

// Parameter descriptions
const PARAM_DESCRIPTIONS: Record<string, string> = {
  cutoff: 'Filter cutoff frequency in Hz',
  freq: 'Oscillator frequency in Hz',
  gain: 'Amplitude/volume level (0-2)',
  amp: 'Amplitude/volume level (0-2)',
  speed: 'Playback speed multiplier',
  rate: 'Effect rate/speed',
  pattern: 'Pattern sequence (e.g., "c4 e4 g4")',
  sound: 'Sample bank name',
};

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

  const handleReset = () => {
    setLocalParams(definition.defaultParams);
    onUpdate(definition.defaultParams);
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

      const presets = PARAM_PRESETS[key];

      return (
        <div className="space-y-2">
          <Slider
            value={[value]}
            onValueChange={([v]) => handleParamChange(key, v)}
            min={0}
            max={max}
            step={step}
            className="w-full"
          />
          {presets && (
            <div className="flex gap-1">
              {presets.map(preset => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs flex-1"
                  onClick={() => handleParamChange(key, preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Input
        value={String(value)}
        onChange={(e) => handleParamChange(key, e.target.value)}
        className="w-full"
        placeholder={key === 'pattern' ? 'e.g., c4 e4 g4' : ''}
      />
    );
  };

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-accent/50">
            <Settings className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-sm mb-1">{definition.label}</h4>
                <p className="text-xs text-muted-foreground">{definition.description}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Reset to defaults</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-3">
              {Object.entries(localParams).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="text-xs cursor-help">
                          {key}
                          {PARAM_DESCRIPTIONS[key] && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">?</Badge>
                          )}
                        </Label>
                      </TooltipTrigger>
                      {PARAM_DESCRIPTIONS[key] && (
                        <TooltipContent side="right">
                          <p className="text-xs max-w-[200px]">{PARAM_DESCRIPTIONS[key]}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
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
    </TooltipProvider>
  );
}
