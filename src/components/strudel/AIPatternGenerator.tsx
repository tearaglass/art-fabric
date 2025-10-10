import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Track } from '@/lib/strudel/DAWEngine';
import { supabase } from '@/integrations/supabase/client';

interface AIPatternGeneratorProps {
  onGenerate: (tracks: Track[]) => void;
  currentBpm: number;
}

export function AIPatternGenerator({ onGenerate, currentBpm }: AIPatternGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Enter a prompt',
        description: 'Describe the kind of patterns you want to generate',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-patterns', {
        body: {
          prompt,
          bpm: currentBpm,
        },
      });

      if (error) throw error;

      const generatedTracks: Track[] = [
        {
          id: 'track-1',
          name: 'Drums',
          pattern: data.tracks[0] || 'bd ~ sn ~',
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          kitId: 'RolandTR808',
        },
        {
          id: 'track-2',
          name: 'Bass',
          pattern: data.tracks[1] || 'c2 ~ e2 ~',
          volume: 0.7,
          pan: -0.2,
          muted: false,
          solo: false,
          kitId: 'synth',
        },
        {
          id: 'track-3',
          name: 'Melody',
          pattern: data.tracks[2] || 'c4 e4 g4 ~',
          volume: 0.6,
          pan: 0.2,
          muted: false,
          solo: false,
          kitId: 'glockenspiel',
        },
        {
          id: 'track-4',
          name: 'FX',
          pattern: data.tracks[3] || '~ ~ hh hh',
          volume: 0.5,
          pan: 0,
          muted: false,
          solo: false,
          kitId: 'RolandTR909',
        },
      ];

      onGenerate(generatedTracks);
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Pattern Generator
        </CardTitle>
        <CardDescription>
          Describe what you want and AI will generate 4 complementary tracks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., upbeat techno with rolling bassline and crisp hi-hats"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={generating}
          />
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
