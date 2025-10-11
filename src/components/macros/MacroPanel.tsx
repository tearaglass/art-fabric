import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMacros, useMacroControls } from '@/hooks/useMacros';
import { macroSystem, MacroID, MacroCurve } from '@/lib/macros/MacroSystem';
import { Shuffle, RotateCcw, Save, Lock, Unlock } from 'lucide-react';

export function MacroPanel() {
  const macros = useMacros();
  const controls = useMacroControls();
  const [locks, setLocks] = useState<Set<MacroID>>(new Set());
  const [curves, setCurves] = useState<MacroCurve[]>([]);

  useEffect(() => {
    setCurves(macroSystem.getCurves());
  }, []);

  const handleLockToggle = (id: MacroID) => {
    const isLocked = controls.toggleLock(id);
    const newLocks = new Set(locks);
    if (isLocked) {
      newLocks.add(id);
    } else {
      newLocks.delete(id);
    }
    setLocks(newLocks);
  };

  const handleSaveCurve = () => {
    const name = `Curve ${curves.length + 1}`;
    const curve = controls.saveCurve(name);
    setCurves([...macroSystem.getCurves()]);
  };

  const handleLoadCurve = (curve: MacroCurve) => {
    controls.loadCurve(curve);
  };

  const macroIDs: MacroID[] = ["A", "B", "C", "D"];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Macro Control</h3>
          <p className="text-sm text-muted-foreground">
            Global performance parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => controls.randomize(true)}
            title="Safe Randomize (0.2-0.8)"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => controls.randomize(false)}
            title="Chaos Randomize (0-1)"
          >
            <Shuffle className="w-4 h-4 text-destructive" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => controls.reset()}
            title="Reset All"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Macro Sliders */}
      <div className="space-y-4">
        {macroIDs.map((id) => (
          <div key={id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleLockToggle(id)}
                  title={locks.has(id) ? "Unlock" : "Lock"}
                >
                  {locks.has(id) ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3 opacity-40" />
                  )}
                </Button>
                <span className="font-medium text-sm">Macro {id}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {macros[id].toFixed(3)}
              </Badge>
            </div>
            <Slider
              value={[macros[id]]}
              min={0}
              max={1}
              step={0.001}
              onValueChange={([value]) => controls.set(id, value)}
              disabled={locks.has(id)}
              className={locks.has(id) ? "opacity-50" : ""}
            />
          </div>
        ))}
      </div>

      {/* Curve Snapshots */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Snapshots</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurve}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
        
        {curves.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {curves.map((curve) => (
              <Button
                key={curve.id}
                variant="outline"
                size="sm"
                onClick={() => handleLoadCurve(curve)}
                className="justify-start text-xs"
              >
                {curve.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No saved snapshots
          </p>
        )}
      </div>
    </Card>
  );
}
