import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Stethoscope } from 'lucide-react';
import { simpleEngine } from '@/lib/strudel/SimpleStrudelEngine';
import { useToast } from '@/hooks/use-toast';

export default function SimpleStrudelTab() {
  const [code, setCode] = useState('note("c3 e3 g3").s("sine")');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePlay = async () => {
    try {
      setError(null);
      await simpleEngine.play(code);
      setIsPlaying(true);
      toast({ description: `Playing (${simpleEngine.getContextState()})` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play';
      setError(message);
      setIsPlaying(false);
      toast({ variant: 'destructive', description: message });
    }
  };

  const handleStop = () => {
    simpleEngine.stop();
    setIsPlaying(false);
    toast({ description: 'Stopped' });
  };

  const handleSelfTest = async () => {
    try {
      setError(null);
      await simpleEngine.selfTest();
      setIsPlaying(true);
      toast({ description: 'Self-test pattern playing' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Self-test failed';
      setError(message);
      setIsPlaying(false);
      toast({ variant: 'destructive', description: message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strudel Lab</CardTitle>
        <CardDescription>Minimal live coding music environment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button onClick={handlePlay} disabled={isPlaying}>
            <Play className="w-4 h-4 mr-2" />
            Play
          </Button>
          <Button onClick={handleStop} disabled={!isPlaying} variant="secondary">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
          <Button onClick={handleSelfTest} variant="outline">
            <Stethoscope className="w-4 h-4 mr-2" />
            Self-Test
          </Button>
          <div className="text-sm text-muted-foreground ml-4">
            Status: {isPlaying ? 'Playing' : 'Stopped'} ({simpleEngine.getContextState()})
          </div>
        </div>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder='Try: note("c3 e3 g3").s("sine")'
          className="font-mono min-h-[200px]"
        />

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Basic Examples:</strong></p>
          <p>• <code>note("c3 e3 g3").s("sine")</code> - simple chord</p>
          <p>• <code>note("c d e f g").s("triangle")</code> - melody</p>
          <p>• <code>note("c3*4").s("sawtooth")</code> - repetition</p>
        </div>
      </CardContent>
    </Card>
  );
}
