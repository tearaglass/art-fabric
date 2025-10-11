import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Code, Wand2 } from 'lucide-react';
import { patternEngine } from '@/lib/strudel/PatternEngine';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/store/useProjectStore';
import { compileStrudel } from '@/lib/strudel/compile';

export function StrudelPatternTab() {
  const { currentPatch } = useProjectStore();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-compile code from patch
  const compiledCode = useMemo(() => {
    return compileStrudel(currentPatch);
  }, [currentPatch]);

  // Use manual code in advanced mode, otherwise use auto-compiled
  const activeCode = advancedMode ? manualCode : compiledCode;

  const handlePlay = async () => {
    try {
      setError(null);
      await patternEngine.playPattern(activeCode);
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

  const toggleAdvancedMode = () => {
    if (!advancedMode) {
      // Switching to advanced: copy compiled code to manual editor
      setManualCode(compiledCode);
    }
    setAdvancedMode(!advancedMode);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Live Strudel Code
              {!advancedMode && (
                <Badge variant="secondary" className="ml-2">Auto-Generated</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {advancedMode 
                ? 'Manual editing enabled - changes won\'t affect controls' 
                : 'Code updates automatically when you change controls'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAdvancedMode}
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            {advancedMode ? 'Auto Mode' : 'Advanced'}
          </Button>
        </div>
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
          value={activeCode}
          onChange={(e) => advancedMode && setManualCode(e.target.value)}
          readOnly={!advancedMode}
          placeholder='Adjust controls to generate code...'
          className={`font-mono min-h-[200px] text-xs ${!advancedMode ? 'bg-muted/30' : ''}`}
        />

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded">
            <p className="font-semibold text-sm text-destructive mb-1">Error:</p>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap font-mono">
              {error}
            </pre>
          </div>
        )}

        {!advancedMode && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm border border-border">
            <p className="font-medium flex items-center gap-2">
              <Code className="w-4 h-4" />
              Live Control Mapping
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Move any slider or knob to see code update instantly</li>
              <li>BPM → <code>cps()</code> value</li>
              <li>Filter → <code>.lp()</code> or <code>.hp()</code> frequency</li>
              <li>Waveshape → <code>s("sine")</code>, <code>s("saw")</code>, etc.</li>
              <li>Switch to Advanced mode for manual editing</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
