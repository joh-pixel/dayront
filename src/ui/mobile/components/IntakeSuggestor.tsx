/**
 * src/ui/mobile/components/IntakeSuggestor.tsx
 * ----------------------------------------------------------------------------
 * Watches the clipboard for URLs and shows a smart suggestion banner.
 * Tapping routes to the matched tool (or shows a coming-soon message).
 *
 * Auto-hides after 8s. Dismisses permanently for the same URL in this session.
 */
import { useEffect, useState } from 'preact/hooks';
import { classify, type IntakeSuggestion } from '../../../core/intake';
import { haptic } from '../haptic';

const SESSION_KEY = 'dayront:intake-dismissed';
const AUTO_HIDE_MS = 8000;

function readDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<string>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {}
}

export default function IntakeSuggestor() {
  const [suggestion, setSuggestion] = useState<IntakeSuggestion | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkClipboard() {
      // Skip on native app for now — the WebView clipboard API is unreliable.
      // On web it works everywhere.
      try {
        if (!('clipboard' in navigator) || !navigator.clipboard.readText) return;
        const text = await navigator.clipboard.readText();
        if (!text || cancelled) return;

        const trimmed = text.trim();
        if (!trimmed || trimmed.length > 2000) return;
        if (!/^(https?:\/\/|www\.)/i.test(trimmed)) return;

        // Skip if user already dismissed this URL
        const dismissed = readDismissed();
        if (dismissed.has(trimmed)) return;

        const s = classify(trimmed);
        if (s.confidence >= 0.5 && !cancelled) {
          setSuggestion(s);
          setHidden(false);
        }
      } catch {
        // Clipboard permission denied or API unavailable — silently skip
      }
    }

    // Check on mount
    checkClipboard();

    // Check again when the tab regains focus (user copied outside → came back)
    const onFocus = () => checkClipboard();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (!suggestion) return;
    const t = setTimeout(() => setHidden(true), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [suggestion]);

  function dismiss() {
    if (suggestion) {
      const d = readDismissed();
      d.add(suggestion.detection.source);
      writeDismissed(d);
    }
    setHidden(true);
    haptic(4);
  }

  function open() {
    if (!suggestion) return;
    haptic(10);

    if (suggestion.slug) {
      // Tool exists — route to it
      window.location.href = `/app/tool/${suggestion.slug}`;
    } else {
      // No tool yet — show coming-soon alert (toast-style)
      dismiss();
      // Fallback: open the tools list
      window.location.href = '/app/tools';
    }
  }

  if (!suggestion || hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        margin: '0 0 0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 0.95rem',
        borderRadius: '1rem',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(2,132,199,0.14))',
        border: '1px solid var(--line, rgba(56,189,248,0.35))',
        animation: 'd-slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '38px', height: '38px',
          borderRadius: '12px',
          background: 'var(--bg-elev, #fff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(2,132,199,0.12)',
        }}
      >
        {suggestion.icon}
      </span>

      <button
        type="button"
        onClick={open}
        style={{
          flex: 1, minWidth: 0,
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        <div style={{
          fontSize: '0.9rem',
          fontWeight: 800,
          lineHeight: 1.25,
          marginBottom: '0.15rem',
        }}>
          {suggestion.title}
        </div>
        <div style={{
          fontSize: '0.75rem',
          opacity: 0.7,
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {suggestion.reason}
        </div>
      </button>

      <button
        type="button"
        aria-label="Dismiss suggestion"
        onClick={dismiss}
        style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(120,120,120,0.12)',
          color: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}