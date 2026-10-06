/**
 * src/ui/mobile/tool/CropEditor.tsx
 * ----------------------------------------------------------------------------
 * Visual crop editor for crop-video.
 *
 * Replaces the four x/y/w/h number inputs with a drag-rectangle over a
 * paused video preview. Rule-of-thirds guides + corner handles + aspect
 * ratio presets. Writes to the same settings keys.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { haptic } from '../haptic';

interface Props {
  file: File;
  x: number;
  y: number;
  w: number;
  h: number;
  onChange: (patch: { x?: number; y?: number; w?: number; h?: number }) => void;
  accent?: string;
}

const RATIOS: Array<{ key: string; label: string; r: number | null }> = [
  { key: 'free', label: 'Free', r: null },
  { key: '9:16', label: '9:16', r: 9 / 16 },
  { key: '16:9', label: '16:9', r: 16 / 9 },
  { key: '1:1',  label: '1:1',  r: 1 },
  { key: '4:3',  label: '4:3',  r: 4 / 3 },
  { key: '2:1',  label: '2:1',  r: 2 },
];

export function CropEditor({
  file, x, y, w, h, onChange, accent = '#0284c7',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [ratio, setRatio] = useState<string>('free');
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Read video intrinsic size
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = url;
    const onMeta = () => {
      setVw(v.videoWidth);
      setVh(v.videoHeight);
      try { v.currentTime = 0.1; } catch {}
    };
    v.addEventListener('loadedmetadata', onMeta);
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, [url]);

  // Aspect ratio constraint
  useEffect(() => {
    const r = RATIOS.find((x) => x.key === ratio)?.r;
    if (r == null || !vw || !vh) return;
    // Fit the largest rect with this ratio inside vw×vh
    let nw = vw;
    let nh = vw / r;
    if (nh > vh) { nh = vh; nw = vh * r; }
    const nx = Math.max(0, Math.round((vw - nw) / 2));
    const ny = Math.max(0, Math.round((vh - nh) / 2));
    onChange({ x: nx, y: ny, w: Math.round(nw), h: Math.round(nh) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, vw, vh]);

  // Pointer drag — moves or resizes the crop rect
  const drag = useRef<{
    kind: 'move' | 'tl' | 'tr' | 'bl' | 'br';
    startX: number; startY: number;
    orig: { x: number; y: number; w: number; h: number };
  } | null>(null);

  function clampCrop(c: { x: number; y: number; w: number; h: number }) {
    const minSize = 32;
    c.w = Math.max(minSize, Math.min(vw, c.w));
    c.h = Math.max(minSize, Math.min(vh, c.h));
    c.x = Math.max(0, Math.min(vw - c.w, c.x));
    c.y = Math.max(0, Math.min(vh - c.h, c.y));
    return c;
  }

  function clientToVideo(clientX: number, clientY: number) {
    const wrap = wrapRef.current;
    if (!wrap) return { vx: 0, vy: 0 };
    const rect = wrap.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * vw;
    const vy = ((clientY - rect.top) / rect.height) * vh;
    return { vx, vy };
  }

  function onDown(e: PointerEvent, kind: 'move' | 'tl' | 'tr' | 'bl' | 'br') {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { vx, vy } = clientToVideo(e.clientX, e.clientY);
    drag.current = {
      kind,
      startX: vx,
      startY: vy,
      orig: { x, y, w, h },
    };
    haptic();
  }

  function onMove(e: PointerEvent) {
    if (!drag.current) return;
    const { vx, vy } = clientToVideo(e.clientX, e.clientY);
    const dx = vx - drag.current.startX;
    const dy = vy - drag.current.startY;
    const o = drag.current.orig;
    const k = drag.current.kind;

    let next = { ...o };
    if (k === 'move') {
      next.x = o.x + dx;
      next.y = o.y + dy;
    } else {
      // Corner resize
      const left = o.x;
      const right = o.x + o.w;
      const top = o.y;
      const bottom = o.y + o.h;
      const nx1 = k === 'tl' || k === 'bl' ? left + dx : left;
      const nx2 = k === 'tr' || k === 'br' ? right + dx : right;
      const ny1 = k === 'tl' || k === 'tr' ? top + dy : top;
      const ny2 = k === 'bl' || k === 'br' ? bottom + dy : bottom;
      next.x = Math.min(nx1, nx2);
      next.y = Math.min(ny1, ny2);
      next.w = Math.abs(nx2 - nx1);
      next.h = Math.abs(ny2 - ny1);
    }

    next = clampCrop(next);
    onChange({
      x: Math.round(next.x),
      y: Math.round(next.y),
      w: Math.round(next.w),
      h: Math.round(next.h),
    });
  }

  function onUp(e: PointerEvent) {
    drag.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }

  const wrapPct = vw && vh ? { w: (w / vw) * 100, h: (h / vh) * 100, x: (x / vw) * 100, y: (y / vh) * 100 } : { w: 0, h: 0, x: 0, y: 0 };

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
          Crop region
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            opacity: 0.6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(w)} × {Math.round(h)}
        </span>
      </div>

      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          borderRadius: '0.875rem',
          overflow: 'hidden',
          background: '#0A0E1A',
          aspectRatio: vw && vh ? `${vw} / ${vh}` : '16 / 9',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />

        {/* Dim outside crop */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,26,0.6)' }} />
          <div
            style={{
              position: 'absolute',
              left: `${wrapPct.x}%`,
              top: `${wrapPct.y}%`,
              width: `${wrapPct.w}%`,
              height: `${wrapPct.h}%`,
              boxShadow: '0 0 0 9999px rgba(10,14,26,0.6)',
              background: 'transparent',
            }}
          />
        </div>

        {/* The crop rect itself */}
        <div
          onPointerDown={(e) => onDown(e, 'move')}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            position: 'absolute',
            left: `${wrapPct.x}%`,
            top: `${wrapPct.y}%`,
            width: `${wrapPct.w}%`,
            height: `${wrapPct.h}%`,
            border: `2px solid ${accent}`,
            boxSizing: 'border-box',
            cursor: 'move',
            touchAction: 'none',
          }}
        >
          {/* Rule-of-thirds guides */}
          <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)' }} />

          <Corner pos="tl" onPointerDown={(e) => onDown(e, 'tl')} onMove={onMove} onUp={onUp} accent={accent} />
          <Corner pos="tr" onPointerDown={(e) => onDown(e, 'tr')} onMove={onMove} onUp={onUp} accent={accent} />
          <Corner pos="bl" onPointerDown={(e) => onDown(e, 'bl')} onMove={onMove} onUp={onUp} accent={accent} />
          <Corner pos="br" onPointerDown={(e) => onDown(e, 'br')} onMove={onMove} onUp={onUp} accent={accent} />
        </div>
      </div>

      {/* Aspect ratio row */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          marginTop: '0.75rem',
          paddingBottom: '0.25rem',
          scrollbarWidth: 'none',
        }}
      >
        {RATIOS.map((r) => {
          const active = ratio === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => { haptic(); setRatio(r.key); }}
              style={{
                flexShrink: 0,
                padding: '0.5rem 0.85rem',
                borderRadius: '999px',
                border: active ? 'none' : '1px solid var(--line, rgba(148,163,184,0.35))',
                background: active ? accent : 'var(--bg-elev, #fff)',
                color: active ? '#fff' : 'inherit',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Corner({
  pos, onPointerDown, onMove, onUp, accent,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  onPointerDown: (e: PointerEvent) => void;
  onMove: (e: PointerEvent) => void;
  onUp: (e: PointerEvent) => void;
  accent: string;
}) {
  const posStyle: Record<string, any> = {
    tl: { left: -10, top: -10, cursor: 'nwse-resize' },
    tr: { right: -10, top: -10, cursor: 'nesw-resize' },
    bl: { left: -10, bottom: -10, cursor: 'nesw-resize' },
    br: { right: -10, bottom: -10, cursor: 'nwse-resize' },
  };
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: '#fff',
        border: `2px solid ${accent}`,
        boxSizing: 'border-box',
        touchAction: 'none',
        ...posStyle[pos],
      }}
    />
  );
}