import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Wand2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FXBuilderTab = () => {
  const { fxConfigs, addFXConfig, updateFXConfig, removeFXConfig } = useProjectStore();
  const { toast } = useToast();

  const handleAddFX = (type: 'crt' | 'halftone' | 'glitch') => {
    const fxPresets = {
      crt: {
        name: 'CRT Effect',
        params: { intensity: 0.3, curvature: 0.1 }
      },
      halftone: {
        name: 'Halftone',
        params: { dotSize: 4, angle: 22.5, contrast: 1.2 }
      },
      glitch: {
        name: 'Glitch',
        params: { intensity: 0.5, frequency: 0.1 }
      }
    };

    const preset = fxPresets[type];
    const newFx = {
      id: `fx-${Date.now()}`,
      name: preset.name,
      type,
      enabled: true,
      params: preset.params,
    };
    addFXConfig(newFx);
    toast({
      title: 'FX Added',
      description: `${preset.name} added to pipeline.`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">FX Builder</h2>
          <p className="text-sm text-muted-foreground">
            GPU-accelerated visual effects applied after layer compositing.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleAddFX('crt')} variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            CRT
          </Button>
          <Button onClick={() => handleAddFX('halftone')} variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Halftone
          </Button>
          <Button onClick={() => handleAddFX('glitch')} variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Glitch
          </Button>
        </div>
      </Card>

      {/* Active FX */}
      <div className="space-y-4">
        {fxConfigs.length === 0 ? (
          <Card className="p-12 border-border bg-card flex flex-col items-center justify-center text-center">
            <Wand2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No effects yet</h3>
            <p className="text-muted-foreground mb-4">Add your first shader effect to get started</p>
          </Card>
        ) : (
          fxConfigs.map((fx) => (
            <Card key={fx.id} className="p-6 border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={fx.enabled}
                    onCheckedChange={(enabled) => updateFXConfig(fx.id, { enabled })}
                  />
                  <div>
                    <h3 className="font-bold gradient-text">{fx.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {fx.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFXConfig(fx.id)}
                >
                  Remove
                </Button>
              </div>

              {fx.type === 'crt' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Intensity</label>
                      <span className="font-mono">{fx.params.intensity?.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[fx.params.intensity || 0.3]}
                      onValueChange={([intensity]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, intensity },
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Curvature</label>
                      <span className="font-mono">{fx.params.curvature?.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[fx.params.curvature || 0.1]}
                      onValueChange={([curvature]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, curvature },
                        })
                      }
                      min={0}
                      max={0.5}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {fx.type === 'halftone' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Dot Size</label>
                      <span className="font-mono">{fx.params.dotSize?.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[fx.params.dotSize || 4]}
                      onValueChange={([dotSize]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, dotSize },
                        })
                      }
                      min={1}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Angle</label>
                      <span className="font-mono">{fx.params.angle?.toFixed(1)}°</span>
                    </div>
                    <Slider
                      value={[fx.params.angle || 22.5]}
                      onValueChange={([angle]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, angle },
                        })
                      }
                      min={0}
                      max={360}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Contrast</label>
                      <span className="font-mono">{fx.params.contrast?.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[fx.params.contrast || 1.2]}
                      onValueChange={([contrast]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, contrast },
                        })
                      }
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {fx.type === 'glitch' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Intensity</label>
                      <span className="font-mono">{fx.params.intensity?.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[fx.params.intensity || 0.5]}
                      onValueChange={([intensity]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, intensity },
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label>Frequency</label>
                      <span className="font-mono">{fx.params.frequency?.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[fx.params.frequency || 0.1]}
                      onValueChange={([frequency]) =>
                        updateFXConfig(fx.id, {
                          params: { ...fx.params, frequency },
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
