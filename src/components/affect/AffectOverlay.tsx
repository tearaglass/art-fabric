import { useEffect, useState, useMemo } from 'react';
import { useShameEngine } from '@/hooks/useShameEngine';
import { cosmosBus } from '@/lib/events/CosmosBus';
import { cn } from '@/lib/utils';

/**
 * Visual overlay that responds to affect mutations
 * Renders blur, glitch, decay, and fracture effects
 */
export function AffectOverlay() {
  const { affect } = useShameEngine();
  const [mutations, setMutations] = useState<Array<{
    type: 'blur' | 'glitch' | 'decay' | 'fracture';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const unsub = cosmosBus.on('affect/mutation', (event) => {
      setMutations((prev) => [
        ...prev.slice(-3), // Keep last 3 mutations
        { type: event.mutationType, timestamp: event.timestamp },
      ]);
    });

    return unsub;
  }, []);

  // Compute visual styles based on affect state
  const overlayStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      pointerEvents: 'none',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      mixBlendMode: 'overlay',
    };

    // Hesitation → blur
    if (affect.hesitation > 0.4) {
      styles.backdropFilter = `blur(${affect.hesitation * 3}px)`;
    }

    // Overactivity → red flash
    if (affect.overactivity > 0.6) {
      styles.backgroundColor = `hsl(var(--destructive) / ${affect.overactivity * 0.15})`;
    }

    // Entropy → grain/noise
    if (affect.entropy > 0.5) {
      styles.opacity = affect.entropy * 0.3;
      styles.backgroundImage = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")';
    }

    return styles;
  }, [affect.hesitation, affect.overactivity, affect.entropy]);

  // Emotional tone indicator
  const toneStyles = useMemo(() => {
    const toneColors = {
      neutral: 'hsl(var(--muted))',
      anxious: 'hsl(var(--destructive))',
      euphoric: 'hsl(var(--primary))',
      numb: 'hsl(var(--secondary))',
    };

    return {
      backgroundColor: toneColors[affect.emotionalTone],
      opacity: Math.max(affect.hesitation, affect.overactivity) * 0.2,
    };
  }, [affect.emotionalTone, affect.hesitation, affect.overactivity]);

  // Mutation effects (transient)
  const activeMutations = mutations.filter((m) => Date.now() - m.timestamp < 2000);

  if (affect.hesitation === 0 && affect.overactivity === 0 && affect.entropy === 0 && activeMutations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main affect overlay */}
      <div style={overlayStyles} className="transition-all duration-500" />

      {/* Emotional tone indicator */}
      <div
        className="fixed top-4 right-4 w-3 h-3 rounded-full transition-all duration-700 pointer-events-none z-[10000]"
        style={toneStyles}
        title={`Emotional tone: ${affect.emotionalTone}`}
      />

      {/* Mutation effects */}
      {activeMutations.map((mutation, i) => (
        <div
          key={`${mutation.type}-${mutation.timestamp}`}
          className={cn(
            "fixed inset-0 pointer-events-none z-[9998] animate-fade-out",
            mutation.type === 'glitch' && "bg-primary/10 animate-pulse",
            mutation.type === 'blur' && "backdrop-blur-xl",
            mutation.type === 'decay' && "bg-gradient-to-b from-transparent to-background/20",
            mutation.type === 'fracture' && "bg-[url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0L20 20M20 0L0 20\" stroke=\"currentColor\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/svg%3E')]"
          )}
        />
      ))}

      {/* Debug info (only visible in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-background/90 border border-border rounded p-2 text-xs font-mono pointer-events-none z-[10000]">
          <div>hesitation: {affect.hesitation.toFixed(2)}</div>
          <div>overactivity: {affect.overactivity.toFixed(2)}</div>
          <div>entropy: {affect.entropy.toFixed(2)}</div>
          <div>tone: {affect.emotionalTone}</div>
        </div>
      )}
    </>
  );
}
