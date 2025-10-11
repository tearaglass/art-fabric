import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Square } from 'lucide-react';
import { patternEngine } from '@/lib/strudel/PatternEngine';
import { useToast } from '@/hooks/use-toast';

export function StrudelPatternTab() {
  const [code, setCode] = useState('note("c3 e3 g3").s("sine")');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePlay = async () => {
    try {
      setError(null);
      await patternEngine.playPattern(code);
      setIsPlaying(true);
      toast({ description: 'Pattern playing' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play';
      setError(message);
      toast({
        variant: 'destructive',
        description: message,
      });
    }
  };

  const handleStop = () => {
    patternEngine.stop();
    setIsPlaying(false);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strudel - Phase 3: Pattern Evaluation</CardTitle>
        <CardDescription>Testing Strudel REPL and pattern playback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button onClick={handlePlay} disabled={isPlaying}>
            <Play className="w-4 h-4 mr-2" /> Play
          </Button>
          <Button onClick={handleStop} disabled={!isPlaying} variant="secondary">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
          <div className="text-sm text-muted-foreground ml-4">
            Status: {isPlaying ? 'Playing' : 'Stopped'} ({patternEngine.getContextState()})
          </div>
        </div>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder='Try: note("c3 e3 g3").s("sine")'
          className="font-mono min-h-[200px]"
        />

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded">
            <p className="font-semibold text-sm text-destructive mb-1">Error:</p>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap font-mono">
              {error}
            </pre>
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-medium">Try these examples:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><code>note("c e g").s("triangle")</code> - simple chord</li>
            <li><code>note("c d e f").s("sawtooth").slow(2)</code> - slow melody</li>
            <li><code>note("c3*4").s("sine").fast(2)</code> - repetition</li>
            <li><code>s("bd sd").speed(2)</code> - drum pattern (needs samples)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
