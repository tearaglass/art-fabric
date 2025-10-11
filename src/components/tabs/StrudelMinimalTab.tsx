import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { minimalEngine } from '@/lib/strudel/MinimalEngine';
import { Volume2 } from 'lucide-react';

export function StrudelMinimalTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strudel - Phase 2: Raw Audio Test</CardTitle>
        <CardDescription>Testing WebAudio API before adding Strudel patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => minimalEngine.playTone()} className="gap-2">
          <Volume2 className="w-4 h-4" />
          Play 440Hz Tone (1 second)
        </Button>
        
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-medium">What this test does:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Creates a raw AudioContext (no Strudel)</li>
            <li>Plays a simple 440Hz sine wave for 1 second</li>
            <li>Tests if browser audio permissions work</li>
          </ul>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-muted-foreground">
              <strong>Audio Context State:</strong> {minimalEngine.getContextState()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ✅ If you hear a beep: WebAudio works, ready for Phase 3<br />
              ❌ If no sound: Check browser permissions or volume
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
