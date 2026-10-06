/**
 * src/ui/mobile/tool/file-ui.tsx
 * ----------------------------------------------------------------------------
 * File-aware UI:
 *
 *   • FileHero     full-width preview (single-file tools)   ← new
 *   • FileChip     compact chip row (multi-file, promos)
 *   • FilePreview  full-screen preview modal
 */
import { useFileThumbnail } from './hooks';
import { fileKind, humanSize } from './helpers';
import type { Tool } from './types';

export { FileHero } from './FileHero';

/* ── File chip with REAL thumbnail ────────────────────────── */

export function FileChip({
  file, tool, onRemove, onPreview,
}: {
  file: File;
  tool: Tool;
  onRemove?: () => void;
  onPreview?: () => void;
}) {
  const thumb = useFileThumbnail(file);
  const kind = fileKind(file);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem',
      borderRadius: '1rem',
      border: '1px solid var(--line, #e2e8f0)',
      background: 'var(--bg-elev, #fff)',
    }}>
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${file.name}`}
        style={{
          width: '80px',
          height: '80px',
          flexShrink: 0,
          borderRadius: '16px',
          background: kind === 'audio' ? 'var(--brand-soft, #e0f2fe)' : '#0A0E1A',
          color: '#fff',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}
      >
        {kind === 'video' && thumb ? (
          <>
            <video
              src={thumb}
              preload="metadata"
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.32)',
            }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </>
        ) : kind === 'image' && thumb ? (
          <img
            src={thumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : kind === 'audio' ? (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        ) : (
          <span>{tool.icon}</span>
        )}
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          lineHeight: 1.35,
          wordBreak: 'break-all',
          overflowWrap: 'anywhere',
        }}>
          {file.name}
        </div>
        <div style={{
          fontSize: '0.78rem',
          opacity: 0.6,
          marginTop: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}>
          <span>{humanSize(file.size)}</span>
          <span>·</span>
          <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', fontWeight: 700 }}>
            {kind}
          </span>
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          style={{
            width: '32px', height: '32px', flexShrink: 0,
            borderRadius: '50%', border: 'none',
            background: 'rgba(120,120,120,0.12)',
            color: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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

/* ── Full-screen file preview ───────────────────────────── */

export function FilePreview({
  file, open, onClose,
}: { file: File | null; open: boolean; onClose: () => void }) {
  const thumb = useFileThumbnail(file);
  if (!open || !file || !thumb) return null;
  const kind = fileKind(file);

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-swipe-block
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1rem', color: '#fff', flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div style={{
          fontSize: '0.85rem', fontWeight: 700,
          opacity: 0.75, maxWidth: '70%',
          textAlign: 'center', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.name}
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 1rem 1rem',
        minHeight: 0,
      }}>
        {kind === 'video' ? (
          <video
            src={thumb}
            controls
            autoPlay
            playsInline
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '1rem' }}
          />
        ) : kind === 'image' ? (
          <img
            src={thumb}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '1rem', objectFit: 'contain' }}
          />
        ) : null}
      </div>

      <div style={{
        padding: '0.875rem 1.5rem 1.25rem',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.78rem',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {humanSize(file.size)} · {file.type || 'unknown type'}
      </div>
    </div>
  );
}