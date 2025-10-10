import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MasterFX } from '@/lib/strudel/DAWEngine';

interface MasterFXPanelProps {
  fx: MasterFX;
  onUpdate: (fx: MasterFX) => void;
}

export function MasterFXPanel({ fx, onUpdate }: MasterFXPanelProps) {
  const updateReverb = (updates: Partial<typeof fx.reverb>) => {
    onUpdate({ ...fx, reverb: { ...fx.reverb, ...updates } });
  };

  const updateDelay = (updates: Partial<typeof fx.delay>) => {
    onUpdate({ ...fx, delay: { ...fx.delay, ...updates } });
  };

  const updateEQ = (updates: Partial<typeof fx.eq>) => {
    onUpdate({ ...fx, eq: { ...fx.eq, ...updates } });
  };

  const updateCompressor = (updates: Partial<typeof fx.compressor>) => {
    onUpdate({ ...fx, compressor: { ...fx.compressor, ...updates } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Master FX</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-6">
          {/* Reverb */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Reverb</Label>
              <Switch
                checked={fx.reverb.enabled}
                onCheckedChange={(enabled) => updateReverb({ enabled })}
              />
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Slider
                value={[fx.reverb.amount * 100]}
                onValueChange={([val]) => updateReverb({ amount: val / 100 })}
                min={0}
                max={100}
                disabled={!fx.reverb.enabled}
              />
            </div>
            <div>
              <Label className="text-xs">Decay</Label>
              <Slider
                value={[fx.reverb.decay * 10]}
                onValueChange={([val]) => updateReverb({ decay: val / 10 })}
                min={1}
                max={50}
                disabled={!fx.reverb.enabled}
              />
            </div>
          </div>

          {/* Delay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Delay</Label>
              <Switch
                checked={fx.delay.enabled}
                onCheckedChange={(enabled) => updateDelay({ enabled })}
              />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Slider
                value={[fx.delay.time * 100]}
                onValueChange={([val]) => updateDelay({ time: val / 100 })}
                min={1}
                max={100}
                disabled={!fx.delay.enabled}
              />
            </div>
            <div>
              <Label className="text-xs">Feedback</Label>
              <Slider
                value={[fx.delay.feedback * 100]}
                onValueChange={([val]) => updateDelay({ feedback: val / 100 })}
                min={0}
                max={90}
                disabled={!fx.delay.enabled}
              />
            </div>
          </div>

          {/* EQ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">EQ</Label>
              <Switch
                checked={fx.eq.enabled}
                onCheckedChange={(enabled) => updateEQ({ enabled })}
              />
            </div>
            <div>
              <Label className="text-xs">Low</Label>
              <Slider
                value={[fx.eq.low]}
                onValueChange={([val]) => updateEQ({ low: val })}
                min={-12}
                max={12}
                disabled={!fx.eq.enabled}
              />
            </div>
            <div>
              <Label className="text-xs">Mid</Label>
              <Slider
                value={[fx.eq.mid]}
                onValueChange={([val]) => updateEQ({ mid: val })}
                min={-12}
                max={12}
                disabled={!fx.eq.enabled}
              />
            </div>
            <div>
              <Label className="text-xs">High</Label>
              <Slider
                value={[fx.eq.high]}
                onValueChange={([val]) => updateEQ({ high: val })}
                min={-12}
                max={12}
                disabled={!fx.eq.enabled}
              />
            </div>
          </div>

          {/* Compressor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Compressor</Label>
              <Switch
                checked={fx.compressor.enabled}
                onCheckedChange={(enabled) => updateCompressor({ enabled })}
              />
            </div>
            <div>
              <Label className="text-xs">Threshold</Label>
              <Slider
                value={[fx.compressor.threshold]}
                onValueChange={([val]) => updateCompressor({ threshold: val })}
                min={-60}
                max={0}
                disabled={!fx.compressor.enabled}
              />
            </div>
            <div>
              <Label className="text-xs">Ratio</Label>
              <Slider
                value={[fx.compressor.ratio]}
                onValueChange={([val]) => updateCompressor({ ratio: val })}
                min={1}
                max={20}
                disabled={!fx.compressor.enabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
