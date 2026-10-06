/**
 * src/ui/mobile/tool/TrimEditor.tsx
 * ----------------------------------------------------------------------------
 * Visual trim editor for time-based tools (audio-cutter, video-cutter).
 *
 * Replaces the old start/duration number inputs with a drag-a-range timeline.
 * Writes to the same settings keys — no changes to tools.ts or FFmpeg args.
 *
 * For audio files: shows the decoded waveform.
 * For video files: shows a plain colored timeline (frame extraction is
 * too slow on mobile to render synchronously).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { haptic } from '../haptic';
import { fileKind } from './helpers';
import { extractWaveform, drawWaveform, type WaveformData } from './waveform';

interface Props {
  file: File;
  start: number;       // seconds
  duration: number;    // seconds
  onChange: (start: number, duration: number) => void;
  accent?: string;
}

export function TrimEditor({
  file, start, duration, onChange, accent = '#0284c7',
}: Props) {
  const kind = fileKind(file);
  const isAudio = kind === 'audio';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // Decode audio waveform
  useEffect(() => {
    if (!isAudio) return;
    let cancelled = false;
    setPeaks(null);
    (async () => {
      const wf: WaveformData | null = await extractWaveform(file, 500);
      if (cancelled) return;
      if (wf) {
        setPeaks(wf.peaks);
        setTotalDuration(wf.duration);
      }
    })();
    return () => { cancelled = true; };
  }, [file, isAudio]);

  // Probe video duration via a hidden element
  useEffect(() => {
    if (isAudio) return;
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () => {
      if (!cancelled && Number.isFinite(v.duration)) {
        setTotalDuration(v.duration);
      }
    };
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file, isAudio]);

  const safeTotal = totalDuration > 0 ? totalDuration : Math.max(duration, start + duration, 30);
  const end = Math.min(safeTotal, start + duration);

  // Draw waveform (audio) or plain bar (video)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = c.clientWidth || 300;
      const cssH = c.clientHeight || 96;
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Base layer — waveform or plain bar
      if (peaks) {
        drawWaveform(c, peaks, { fill: '#475569', bg: '#0A0E1A', barGap: 1 });
      } else {
        ctx.fillStyle = '#0A0E1A';
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, cssH / 2 - 2, cssW, 4);
      }

      // Selection overlay
      const startX = (start / safeTotal) * cssW;
      const endX = (end / safeTotal) * cssW;

      // Dim outside
      ctx.fillStyle = 'rgba(10,14,26,0.68)';
      ctx.fillRect(0, 0, startX, cssH);
      ctx.fillRect(endX, 0, cssW - endX, cssH);

      // Tint inside with accent
      ctx.fillStyle = `${accent}33`;
      ctx.fillRect(startX, 0, endX - startX, cssH);

      // Handles
      const handleW = 4;
      ctx.fillStyle = accent;
      ctx.fillRect(startX - handleW / 2, 0, handleW, cssH);
      ctx.fillRect(endX - handleW / 2, 0, handleW, cssH);

      // Knob circles
      const knobR = 10;
      for (const x of [startX, endX]) {
        ctx.beginPath();
        ctx.arc(x, cssH / 2, knobR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = accent;
        ctx.stroke();
      }

      // Time readouts
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';
      const fmt = (s: number) => {
        const m = Math.floor(s / 60);
        const r = Math.floor(s % 60);
        return `${m}:${String(r).padStart(2, '0')}`;
      };
      const leftLabel = fmt(start);
      const rightLabel = fmt(end);
      const leftW = ctx.measureText(leftLabel).width;
      const rightW = ctx.measureText(rightLabel).width;
      ctx.fillStyle = accent;
      ctx.fillRect(4, 4, leftW + 12, 20);
      ctx.fillRect(cssW - rightW - 16, 4, rightW + 12, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(leftLabel, 10, 8);
      ctx.fillText(rightLabel, cssW - rightW - 10, 8);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [peaks, start, end, safeTotal, accent]);

  // Drag handling
  const dragRef = useRef<{ which: 'start' | 'end' } | null>(null);

  function posToTime(clientX: number): number {
    const c = canvasRef.current;
    if (!c) return 0;
    const rect = c.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return frac * safeTotal;
  }

  function onPointerDown(e: PointerEvent) {
    const c = canvasRef.current;
    if (!c) return;
    const t = posToTime(e.clientX);
    const startDiff = Math.abs(t - start);
    const endDiff = Math.abs(t - end);
    const which: 'start' | 'end' = startDiff <= endDiff ? 'start' : 'end';
    dragRef.current = { which };
    try { c.setPointerCapture(e.pointerId); } catch {}
    haptic();
    applyDrag(t, which);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragRef.current) return;
    applyDrag(posToTime(e.clientX), dragRef.current.which);
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragRef.current) return;
    dragRef.current = null;
    const c = canvasRef.current;
    if (c) { try { c.releasePointerCapture(e.pointerId); } catch {} }
  }

  function applyDrag(t: number, which: 'start' | 'end') {
    const minDur = 1;
    if (which === 'start') {
      const newStart = Math.max(0, Math.min(end - minDur, t));
      onChange(Number(newStart.toFixed(2)), Number((end - newStart).toFixed(2)));
    } else {
      const newEnd = Math.min(safeTotal, Math.max(start + minDur, t));
      onChange(Number(start.toFixed(2)), Number((newEnd - start).toFixed(2)));
    }
  }

  function nudge(which: 'start' | 'end', delta: number) {
    haptic();
    if (which === 'start') {
      const newStart = Math.max(0, Math.min(end - 1, start + delta));
      onChange(Number(newStart.toFixed(2)), Number((end - newStart).toFixed(2)));
    } else {
      const newEnd = Math.min(safeTotal, Math.max(start + 1, end + delta));
      onChange(Number(start.toFixed(2)), Number((newEnd - start).toFixed(2)));
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Trim
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            opacity: 0.6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmt(start)} → {fmt(end)} · {fmt(duration)} long
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          borderRadius: '0.875rem',
          overflow: 'hidden',
          background: '#0A0E1A',
          position: 'relative',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            width: '100%',
            height: '96px',
            display: 'block',
            cursor: 'ew-resize',
          }}
        />
      </div>

      {/* Nudge row — 1s fine tuning */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '0.5rem',
          alignItems: 'center',
        }}
      >
        <NudgeBtn label="◀ 1s" onClick={() => nudge('start', -1)} />
        <NudgeBtn label="1s ▶" onClick={() => nudge('start', 1)} />
        <div style={{ flex: 1 }} />
        <NudgeBtn label="◀ 1s" onClick={() => nudge('end', -1)} />
        <NudgeBtn label="1s ▶" onClick={() => nudge('end', 1)} />
      </div>

      <p style={{ fontSize: '0.7rem', opacity: 0.55, margin: '0.5rem 0 0' }}>
        Drag the handles to set the range. Use 1s buttons for fine adjustments.
      </p>
    </div>
  );
}

function NudgeBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.4rem 0.7rem',
        borderRadius: '999px',
        border: '1px solid var(--line, rgba(148,163,184,0.35))',
        background: 'var(--bg-elev, #fff)',
        color: 'inherit',
        fontSize: '0.72rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}