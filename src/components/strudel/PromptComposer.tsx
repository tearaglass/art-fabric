import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/store/useProjectStore';
import { encodeMidi, MidiNote } from '@/lib/midi/MidiEncoder';
import { useToast } from '@/hooks/use-toast';
import { Download, Sparkles } from 'lucide-react';

const MODES_MAP: Record<string, number[]> = {
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'aeolian': [0, 2, 3, 5, 7, 8, 10],
  'ionian': [0, 2, 4, 5, 7, 9, 11],
  'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic minor': [0, 2, 3, 5, 7, 9, 11],
};

export function PromptComposer() {
  const { currentPatch, updatePatch } = useProjectStore();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('120 bpm, c dorian, arp, 2 bars');
  const [generatedPattern, setGeneratedPattern] = useState('');

  const parsePrompt = (text: string) => {
    const tokens = text.toLowerCase();
    
    // BPM
    const bpmMatch = /(\d+)\s*bpm/.exec(tokens);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 120;

    // Bars
    const barsMatch = /(\d+)\s*bar/.exec(tokens);
    const bars = barsMatch ? parseInt(barsMatch[1]) : 1;

    // Root
    const rootMatch = /\b([a-g][#b]?)\s+(dorian|phrygian|lydian|mixolydian|aeolian|ionian|harmonic minor|melodic minor)/.exec(tokens);
    const root = rootMatch ? rootMatch[1] : 'c';
    const mode = rootMatch ? rootMatch[2] : 'dorian';

    // Octave
    const octaveMatch = /octave\s+(\d+)/.exec(tokens);
    const octave = octaveMatch ? parseInt(octaveMatch[1]) : 3;

    // Style
    const isArp = /arp|arpeggio/.test(tokens);
    const isPad = /pad|chord/.test(tokens);
    
    // Density
    const density = /fast/.test(tokens) ? 2 : /slow/.test(tokens) ? 0.5 : 1;

    // Swing
    const swingMatch = /swing\s+(0\.\d+)/.exec(tokens);
    const swing = swingMatch ? parseFloat(swingMatch[1]) : 0.54;

    return { bpm, bars, root, mode, octave, isArp, isPad, density, swing };
  };

  const handleGenerate = () => {
    const parsed = parsePrompt(prompt);
    
    // Generate pattern
    let pattern: string;
    if (parsed.isArp) {
      pattern = 'c3 ~ e3 g3 ~ c3 ~ e3 g3';
    } else if (parsed.isPad) {
      pattern = 'c3 e3 g3';
    } else {
      pattern = 'c3 ~ e3 g3 ~ c3 ~ e3 g3';
    }

    setGeneratedPattern(pattern);

    // Update patch
    updatePatch({
      bpm: parsed.bpm,
      scale: { root: parsed.root, mode: parsed.mode },
      octave: parsed.octave,
      density: parsed.density,
      swing: parsed.swing,
      __hotspot: { arp: pattern }
    });

    toast({
      title: 'Pattern Generated',
      description: `${parsed.root} ${parsed.mode} @ ${parsed.bpm}bpm`,
    });
  };

  const handleExportMidi = () => {
    if (!generatedPattern) {
      toast({
        title: 'Generate first',
        description: 'Click Generate to create a pattern',
        variant: 'destructive',
      });
      return;
    }

    // Parse pattern into notes
    const cells = generatedPattern.split(/\s+/);
    const notes: MidiNote[] = [];
    const PPQ = 480;
    const sixteenthTicks = PPQ / 4;

    const rootOffset = { c: 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11 }[currentPatch.scale.root] || 0;
    const baseNote = 12 * (currentPatch.octave + 1) + rootOffset;

    cells.forEach((cell, i) => {
      if (cell === '~') return;
      
      const pitch = baseNote;
      notes.push({
        pitch,
        velocity: 95,
        start: i * sixteenthTicks,
        duration: Math.floor(sixteenthTicks * 0.95),
      });
    });

    const midiBytes = encodeMidi(notes, currentPatch.bpm);
    const blob = new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pattern-${currentPatch.scale.root}-${currentPatch.scale.mode}.mid`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'MIDI Exported',
      description: 'Pattern saved as MIDI file',
    });
  };

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Prompt Composer</h3>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="120 bpm, c dorian, arp, 2 bars"
            className="font-mono text-xs h-20"
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerate} className="flex-1">
            Generate Pattern
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportMidi}
            disabled={!generatedPattern}
            className="gap-2"
          >
            <Download className="w-3 h-3" />
            MIDI
          </Button>
        </div>

        {generatedPattern && (
          <div className="p-2 rounded bg-muted text-xs font-mono">
            {generatedPattern}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Keywords: bpm, bar, root (c-b), mode (dorian/lydian/etc), octave, arp/pad, fast/slow, swing
        </div>
      </div>
    </Card>
  );
}
