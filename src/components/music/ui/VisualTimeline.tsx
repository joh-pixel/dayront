import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  audioFile: File;
  duration: number;
  trimStart: number;
  trimEnd: number;
  currentTime: number;
  onChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
}

export function VisualTimeline({ audioFile, duration, trimStart, trimEnd, currentTime, onChange, onSeek }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // 1. Draw the static waveform
  useEffect(() => {
    async function drawWaveform() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use fixed resolution for the canvas
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = 100;
      
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0); // Left channel
      const step = Math.ceil(rawData.length / canvas.width);
      const amp = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8'; // Gray-400

      for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = rawData[(i * step) + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        // Draw a bar for this slice
        const h = Math.max(2, (max - min) * amp);
        ctx.fillRect(i, amp - h / 2, 1, h);
      }
    }
    drawWaveform();
  }, [audioFile]);

  // 2. Handle Dragging Handles
  function handlePointerDown(e: any, type: 'start' | 'end') {
    e.stopPropagation();
    setIsDragging(type);
  }

  function handlePointerMove(e: any) {
    if (!isDragging || !containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;

    if (isDragging === 'start') {
      onChange(Math.min(time, trimEnd - 0.5), trimEnd);
    } else {
      onChange(trimStart, Math.max(time, trimStart + 0.5));
    }
  }

  function handlePointerUp() {
    setIsDragging(null);
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, trimStart, trimEnd]);

  const startPercent = (trimStart / (duration || 1)) * 100;
  const endPercent = (trimEnd / (duration || 1)) * 100;
  const playheadPercent = (currentTime / (duration || 1)) * 100;

  return (
    <div class="space-y-4">
      <div 
        ref={containerRef}
        class="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden touch-none select-none cursor-crosshair"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          onSeek((x / rect.width) * duration);
        }}
      >
        <canvas ref={canvasRef} class="absolute inset-0 w-full h-full opacity-50" />
        
        {/* Dimmed areas outside trim */}
        <div class="absolute top-0 bottom-0 left-0 bg-black/40 backdrop-blur-sm" style={{ width: `${startPercent}%` }} />
        <div class="absolute top-0 bottom-0 right-0 bg-black/40 backdrop-blur-sm" style={{ width: `${100 - endPercent}%` }} />

        {/* Trim Handles */}
        <div 
          onPointerDown={(e) => handlePointerDown(e, 'start')}
          class="absolute top-0 bottom-0 w-4 bg-sky-500 rounded-l cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(14,165,233,0.5)] z-20"
          style={{ left: `calc(${startPercent}% - 8px)` }}
        >
          <div class="w-1 h-4 bg-white/50 rounded-full" />
        </div>
        <div 
          onPointerDown={(e) => handlePointerDown(e, 'end')}
          class="absolute top-0 bottom-0 w-4 bg-sky-500 rounded-r cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(14,165,233,0.5)] z-20"
          style={{ left: `calc(${endPercent}% - 8px)` }}
        >
          <div class="w-1 h-4 bg-white/50 rounded-full" />
        </div>

        {/* Playhead */}
        <div class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none" style={{ left: `${playheadPercent}%` }} />
      </div>
    </div>
  );
}