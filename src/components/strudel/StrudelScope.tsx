import { useEffect, useRef } from 'react';
import { strudelEngine } from '@/lib/strudel/engine';
import { Card } from '@/components/ui/card';
import { Activity, BarChart3 } from 'lucide-react';

export function StrudelScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = strudelEngine.getAnalyser();
    if (!analyser) {
      // Show "waiting" state
      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9fb3c8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for audio...', canvas.width / 2, canvas.height / 2);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Background
      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#7bd3ff';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Center line
      ctx.strokeStyle = 'rgba(159,179,200,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">Live Audio Scope</h3>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={150}
        className="w-full rounded border border-border bg-ink"
      />
    </Card>
  );
}
