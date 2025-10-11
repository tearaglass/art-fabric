import { useProjectStore } from '@/store/useProjectStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music } from 'lucide-react';

const CHORD_PADS = [
  { name: 'I', pattern: 'c3 e3 g3' },
  { name: 'ii', pattern: 'd3 f3 a3' },
  { name: 'iii', pattern: 'e3 g3 b3' },
  { name: 'IV', pattern: 'f3 a3 c4' },
  { name: 'V', pattern: 'g3 b3 d4' },
  { name: 'vi', pattern: 'a3 c4 e4' },
  { name: 'vii°', pattern: 'b3 d4 f4' },
  { name: 'Arp', pattern: 'c3 ~ e3 g3 ~ c3 ~ e3 g3' },
];

export function HotspotChords() {
  const { currentPatch, updatePatch } = useProjectStore();

  const applyChord = (pattern: string, idx: number) => {
    // Set hotspot arp
    updatePatch({
      __hotspot: { arp: pattern }
    });

    // Refresh steps to enable pattern
    const newSteps = currentPatch.steps.map((step, i) => ({
      ...step,
      on: true,
      ratchets: i % 4 === 3 ? 2 : 1, // Polite ratchets every 4th
    }));
    updatePatch({ steps: newSteps });
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    const key = e.key;
    if (key >= '1' && key <= '8') {
      const idx = parseInt(key) - 1;
      if (idx < CHORD_PADS.length) {
        applyChord(CHORD_PADS[idx].pattern, idx);
      }
    }
  };

  // Keyboard listener
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress as any);
    return () => window.removeEventListener('keydown', handleKeyPress as any);
  }, [currentPatch]);

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Hotspot Chords</h3>
        <span className="text-xs text-muted-foreground ml-auto">Press 1-8</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CHORD_PADS.map((pad, idx) => (
          <Button
            key={idx}
            size="sm"
            variant={currentPatch.__hotspot?.arp === pad.pattern ? 'default' : 'outline'}
            onClick={() => applyChord(pad.pattern, idx)}
            className="font-mono text-xs"
          >
            {pad.name}
          </Button>
        ))}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Click or use keys 1-8 to instantly change harmony
      </div>
    </Card>
  );
}

// Add React import
import * as React from 'react';
