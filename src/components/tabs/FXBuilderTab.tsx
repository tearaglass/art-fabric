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

  const handleAddCRT = () => {
    const newFx = {
      id: `fx-${Date.now()}`,
      name: 'CRT Effect',
      type: 'crt' as const,
      enabled: true,
      params: {
        intensity: 0.3,
        curvature: 0.1,
      },
    };
    addFXConfig(newFx);
    toast({
      title: 'FX Added',
      description: 'CRT effect added to pipeline.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Available Effects</h2>
          <Button onClick={handleAddCRT} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add CRT Effect
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          GPU-accelerated visual effects applied after layer compositing.
        </p>
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
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
