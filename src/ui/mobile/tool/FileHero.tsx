/**
 * src/ui/mobile/tool/FileHero.tsx
 * ----------------------------------------------------------------------------
 * Full-width preview hero for single-file tools.
 *
 *   • Video  → inline <video>, tap to toggle play/pause
 *   • Audio  → canvas waveform + play/pause + scrubbable progress bar
 *   • Image  → <img>, contain-fit
 *   • Other  → icon + filename fallback
 *
 * Used by ToolScreenInner when exactly one file is picked. Multi-file
 * tools keep the FileChip row.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { haptic } from '../haptic';
import { fileKind, humanSize } from './helpers';
import { extractWaveform, drawWaveform, type WaveformData } from './waveform';
import type { Tool } from './types';

interface Props {
  file: File;
  tool: Tool;
  onRemove?: () => void;
  onPreview?: () => void;
  accent?: string;
}

const ACCENT = '#0284c7';

export function FileHero({ file, tool, onRemove, onPreview, accent = ACCENT }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const kind = fileKind(file);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) return null;

  const chrome = (
    <HeroChrome
      file={file}
      tool={tool}
      onRemove={onRemove}
      onPreview={onPreview}
    />
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '1rem',
        overflow: 'hidden',
        background: '#0A0E1A',
        marginBottom: '0.75rem',
      }}
    >
      {kind === 'video' ? (
        <VideoHero url={url} accent={accent} />
      ) : kind === 'image' ? (
        <ImageHero url={url} />
      ) : kind === 'audio' ? (
        <AudioHero url={url} accent={accent} />
      ) : (
        <FallbackHero icon={tool.icon} />
      )}
      {chrome}
    </div>
  );
}

/* ── Chrome: filename bar + remove button ── */
function HeroChrome({
  file, tool, onRemove, onPreview,
}: {
  file: File;
  tool: Tool;
  onRemove?: () => void;
  onPreview?: () => void;
}) {
  const kind = fileKind(file);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 0.875rem',
        background: 'linear-gradient(to top, rgba(10,14,26,0.95), rgba(10,14,26,0.6))',
        color: '#fff',
      }}
    >
      <button
        type="button"
        onClick={onPreview}
        aria-label="Preview file"
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          textAlign: 'left',
          padding: 0,
          cursor: onPreview ? 'pointer' : 'default',
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {file.name}
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
          {humanSize(file.size)} · {kind.toUpperCase()}
        </div>
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={() => { haptic(); onRemove(); }}
          style={{
            width: '32px',
            height: '32px',
            flexShrink: 0,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Video: tap-to-play inline ── */
function VideoHero({ url, accent }: { url: string; accent: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    haptic();
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000' }}>
      <video
        ref={ref}
        src={url}
        playsInline
        muted
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={toggle}
        style={{
          display: 'block',
          width: '100%',
          maxHeight: '46vh',
          objectFit: 'contain',
          background: '#000',
        }}
      />
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play preview"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${accent}66`,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Image ── */
function ImageHero({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt=""
      style={{
        display: 'block',
        width: '100%',
        maxHeight: '46vh',
        objectFit: 'contain',
        background: '#0A0E1A',
      }}
    />
  );
}

/* ── Audio: waveform + play + progress ── */
function AudioHero({ url, accent }: { url: string; accent: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Decode waveform once per URL change
  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    setDuration(0);
    setCurrent(0);
    (async () => {
      const audio = audioRef.current;
      if (!audio) return;
      const blob = await fetch(url).then((r) => r.blob());
      const wf: WaveformData | null = await extractWaveform(
        new File([blob], 'a', { type: blob.type }),
        400,
      );
      if (cancelled) return;
      if (wf) {
        setPeaks(wf.peaks);
        setDuration(wf.duration);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  // Draw canvas when peaks or current change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !peaks) return;
    const progress = duration > 0 ? current / duration : 0;
    drawWaveform(c, peaks, {
      fill: accent,
      bg: '#0A0E1A',
      progress,
      barGap: 1,
      dimOpacity: 0.32,
    });
  }, [peaks, current, duration, accent]);

  // Resize → redraw
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !peaks) return;
    const ro = new ResizeObserver(() => {
      const progress = duration > 0 ? current / duration : 0;
      drawWaveform(c, peaks, {
        fill: accent, bg: '#0A0E1A', progress, barGap: 1, dimOpacity: 0.32,
      });
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [peaks, current, duration, accent]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    haptic();
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  function seekFromEvent(e: MouseEvent | TouchEvent) {
    const a = audioRef.current;
    const c = canvasRef.current;
    if (!a || !c || !duration) return;
    const rect = c.getBoundingClientRect();
    const x = 'touches' in e
      ? (e.touches[0]?.clientX ?? 0) - rect.left
      : (e as MouseEvent).clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    a.currentTime = frac * duration;
  }

  return (
    <div
      style={{
        padding: '1.25rem 1rem 1rem',
        background: '#0A0E1A',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setCurrent(a.currentTime);
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a && Number.isFinite(a.duration)) setDuration(a.duration);
        }}
      />

      <div
        style={{
          height: '96px',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          background: '#0A0E1A',
          position: 'relative',
          cursor: 'pointer',
        }}
        onMouseDown={seekFromEvent}
        onTouchStart={seekFromEvent}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {!peaks && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.78rem',
            }}
          >
            Loading waveform…
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          color: '#fff',
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: accent,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 18px ${accent}66`,
            flexShrink: 0,
          }}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TimeBar current={current} duration={duration} accent={accent} />
        </div>
      </div>
    </div>
  );
}

function TimeBar({
  current, duration, accent,
}: { current: number; duration: number; accent: string }) {
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  return (
    <div>
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.18)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: accent,
            transition: 'width 80ms linear',
          }}
        />
      </div>
      <div
        style={{
          marginTop: '0.4rem',
          fontSize: '0.72rem',
          opacity: 0.75,
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{fmtTime(current)}</span>
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/* ── Fallback ── */
function FallbackHero({ icon }: { icon: string }) {
  return (
    <div
      style={{
        padding: '3rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        background: '#0A0E1A',
      }}
    >
      <span aria-hidden="true">{icon}</span>
    </div>
  );
}