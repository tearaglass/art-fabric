import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Brain, RotateCcw, Zap, Wind } from 'lucide-react';
import { shameEngine } from '@/lib/affect/ShameEngine';
import { useShameEngine } from '@/hooks/useShameEngine';
import { toast } from 'sonner';

/**
 * Settings panel for affect tracking and dream cycle controls
 */
export function AffectSettingsPanel() {
  const { affect } = useShameEngine();
  const [affectIntensity, setAffectIntensity] = useState(1.0);
  const [dreamCycleEnabled, setDreamCycleEnabled] = useState(false);
  const [driftSpeed, setDriftSpeed] = useState(0.5);
  const [entropyThreshold, setEntropyThreshold] = useState(0.7);

  const handleReset = () => {
    shameEngine.reset();
    toast.success('Affect state reset to neutral');
  };

  const handleCalibrate = () => {
    // Reset and recalibrate affect tracking
    shameEngine.reset();
    setAffectIntensity(1.0);
    setDreamCycleEnabled(false);
    toast.success('Affect tracking calibrated');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Affect Tracking & Dream Cycle
        </CardTitle>
        <CardDescription>
          Configure how the system responds to your interaction patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Affect State */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Current State</Label>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Hesitation</div>
              <div className="text-lg font-mono">{(affect.hesitation * 100).toFixed(0)}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Overactivity</div>
              <div className="text-lg font-mono">{(affect.overactivity * 100).toFixed(0)}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Entropy</div>
              <div className="text-lg font-mono">{(affect.entropy * 100).toFixed(0)}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Emotional Tone</div>
              <div className="text-lg font-mono capitalize">{affect.emotionalTone}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Affect Intensity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="affect-intensity" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Affect Intensity
            </Label>
            <span className="text-sm text-muted-foreground">{affectIntensity.toFixed(1)}x</span>
          </div>
          <Slider
            id="affect-intensity"
            min={0}
            max={2}
            step={0.1}
            value={[affectIntensity]}
            onValueChange={([value]) => setAffectIntensity(value)}
          />
          <p className="text-xs text-muted-foreground">
            Multiplier for all affect responses (hesitation, overactivity, visual feedback)
          </p>
        </div>

        <Separator />

        {/* Dream Cycle Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dream-cycle" className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              Dream Cycle
            </Label>
            <Switch
              id="dream-cycle"
              checked={dreamCycleEnabled}
              onCheckedChange={setDreamCycleEnabled}
            />
          </div>
          
          {dreamCycleEnabled && (
            <div className="space-y-4 pl-6 border-l-2 border-primary/20">
              {/* Drift Speed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="drift-speed" className="text-sm">
                    Drift Speed
                  </Label>
                  <span className="text-sm text-muted-foreground">{driftSpeed.toFixed(2)}</span>
                </div>
                <Slider
                  id="drift-speed"
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[driftSpeed]}
                  onValueChange={([value]) => setDriftSpeed(value)}
                />
                <p className="text-xs text-muted-foreground">
                  How fast parameters drift when entropy is high
                </p>
              </div>

              {/* Entropy Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="entropy-threshold" className="text-sm">
                    Entropy Threshold
                  </Label>
                  <span className="text-sm text-muted-foreground">{(entropyThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  id="entropy-threshold"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[entropyThreshold]}
                  onValueChange={([value]) => setEntropyThreshold(value)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum entropy level required to trigger dream cycle drift
                </p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Automatically drift <code className="text-xs bg-muted px-1 rounded">#dreamable</code> parameters 
            based on entropy and emotional tone
          </p>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset State
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCalibrate}
            className="flex-1"
          >
            <Brain className="w-4 h-4 mr-2" />
            Calibrate
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Affect tracking monitors your interaction patterns 
            (hovering, rapid changes, dwell time) to derive emotional state. This can be used 
            to modulate any parameter via the ModMatrix, or trigger autonomous drift via Dream Cycle.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
