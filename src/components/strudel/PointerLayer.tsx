import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { strudelBus } from '@/lib/strudel/bus';
import { Button } from '@/components/ui/button';
import { Hand, HandMetal } from 'lucide-react';

const MODES = ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'ionian', 'harmonic minor', 'melodic minor', 'locrian'];
const ROOTS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

interface GesturePoint {
  x: number;
  y: number;
  t: number;
}

export function PointerLayer() {
  const { currentPatch, updatePatch } = useProjectStore();
  const [enabled, setEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [gesture, setGesture] = useState<GesturePoint[]>([]);
  const [playbackGesture, setPlaybackGesture] = useState<GesturePoint[]>([]);
  const lastMoveRef = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0, t: 0 });
  const recordTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    
    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const now = performance.now();
      const dt = (now - lastMoveRef.current.t) / 1000;
      
      const vx = dt > 0 ? (x - lastMoveRef.current.x) / dt : 0;
      const vy = dt > 0 ? (y - lastMoveRef.current.y) / dt : 0;
      const speed = Math.sqrt(vx * vx + vy * vy);

      lastMoveRef.current = { x, y, vx, vy, t: now };

      // Map to macros
      const Tone = x;
      const Space = 1 - y;
      const Movement = Math.min(1, speed * 2);
      const Grit = e.pressure > 0 ? e.pressure : Math.min(1, speed);

      updatePatch({
        macros: { Tone, Movement, Space, Grit }
      });

      // Broadcast
      strudelBus.emit({ type: 'macro', key: 'Tone', value: Tone });
      strudelBus.emit({ type: 'macro', key: 'Movement', value: Movement });
      strudelBus.emit({ type: 'macro', key: 'Space', value: Space });
      strudelBus.emit({ type: 'macro', key: 'Grit', value: Grit });

      // Record gesture
      if (isRecording) {
        setGesture((prev) => [...prev, { x, y, t: now }]);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Check 3x3 grid for mode changes
      const gridX = Math.floor((e.clientX / window.innerWidth) * 3);
      const gridY = Math.floor((e.clientY / window.innerHeight) * 3);
      const modeIdx = gridY * 3 + gridX;

      if (modeIdx < MODES.length) {
        updatePatch({
          scale: { ...currentPatch.scale, mode: MODES[modeIdx] }
        });
      }

      // Start gesture recording
      setIsRecording(true);
      setGesture([{ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight, t: performance.now() }]);
      
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    };

    const handlePointerUp = () => {
      setIsRecording(false);
      
      // After 2 seconds, start playback loop
      recordTimeoutRef.current = window.setTimeout(() => {
        if (gesture.length > 2) {
          setPlaybackGesture(gesture);
        }
      }, 2000);
    };

    const handleDoubleClick = () => {
      // Rotate root
      const currentRootIdx = ROOTS.indexOf(currentPatch.scale.root);
      const nextRoot = ROOTS[(currentRootIdx + 1) % ROOTS.length];
      updatePatch({
        scale: { ...currentPatch.scale, root: nextRoot }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('dblclick', handleDoubleClick);
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    };
  }, [enabled, isRecording, gesture, currentPatch.scale, updatePatch]);

  // Playback loop
  useEffect(() => {
    if (!enabled || playbackGesture.length === 0) return;

    let animFrame = 0;
    const startTime = performance.now();
    const duration = playbackGesture[playbackGesture.length - 1].t - playbackGesture[0].t;

    const loop = () => {
      const elapsed = performance.now() - startTime;
      const t = (elapsed % duration) / duration;
      
      // Find interpolated position
      const totalTime = playbackGesture[playbackGesture.length - 1].t - playbackGesture[0].t;
      const targetTime = playbackGesture[0].t + t * totalTime;
      
      let idx = 0;
      for (let i = 0; i < playbackGesture.length - 1; i++) {
        if (playbackGesture[i].t <= targetTime && targetTime < playbackGesture[i + 1].t) {
          idx = i;
          break;
        }
      }

      const p0 = playbackGesture[idx];
      const p1 = playbackGesture[Math.min(idx + 1, playbackGesture.length - 1)];
      const localT = (targetTime - p0.t) / (p1.t - p0.t || 1);
      const x = p0.x + (p1.x - p0.x) * localT;
      const y = p0.y + (p1.y - p0.y) * localT;

      // Apply modulation
      const Tone = x;
      const Space = 1 - y;
      updatePatch({
        macros: { ...currentPatch.macros, Tone, Space }
      });

      strudelBus.emit({ type: 'macro', key: 'Tone', value: Tone });
      strudelBus.emit({ type: 'macro', key: 'Space', value: Space });

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrame);
  }, [enabled, playbackGesture, currentPatch.macros, updatePatch]);

  return (
    <>
      {/* Toggle button */}
      <Button
        size="sm"
        variant={enabled ? 'default' : 'outline'}
        className="fixed bottom-4 right-4 z-50 gap-2"
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? <Hand className="w-4 h-4" /> : <HandMetal className="w-4 h-4" />}
        {enabled ? 'XY Pad ON' : 'XY Pad OFF'}
      </Button>

      {!enabled && null}
      {enabled && (
        <div className="fixed inset-0 pointer-events-none z-40">
      {/* 3x3 grid overlay (visible on press) */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-0 hover:opacity-30 transition-opacity pointer-events-auto">
        {MODES.map((mode, i) => (
          <div
            key={i}
            className="border border-primary/20 flex items-center justify-center text-xs text-foreground/50 font-mono"
          >
            {mode}
          </div>
        ))}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold animate-pulse">
          Recording Gesture
        </div>
      )}

      {/* Playback indicator */}
      {playbackGesture.length > 0 && (
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-success text-foreground text-xs font-semibold">
          Loop Active
        </div>
      )}
    </div>
      )}
    </>
  );
}
