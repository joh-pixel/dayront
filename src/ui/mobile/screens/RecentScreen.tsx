/**
 * src/ui/mobile/screens/RecentScreen.tsx
 * Recently processed files. Reads from src/core/storage.ts.
 */
import { useEffect, useState } from 'preact/hooks';
import { getRecent, clearRecent, type RecentEntry } from '../../../core/storage';

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecentScreen() {
  const [entries, setEntries] = useState<RecentEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getRecent());
    setMounted(true);
  }, []);

  function handleClear() {
    haptic(15);
    clearRecent();
    setEntries([]);
  }

  if (!mounted) {
    return <div class="d-recent" />;
  }

  if (entries.length === 0) {
    return (
      <div class="d-recent">
        <div class="d-recent__empty">
          <div class="d-recent__empty-icon">🗂️</div>
          <p class="d-recent__empty-title">No recent activity</p>
          <p class="d-recent__empty-sub">
            Files you process will show up here so you can quickly do it again.
          </p>
          <a href="/app/tools" class="d-home__browse" style="max-width:320px;margin:0 auto;">
            <span>Browse all tools</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="d-recent">
      <div class="d-recent__list">
        {entries.map((entry, i) => (
          <div key={`${entry.ts}-${i}`} class="d-recent__item">
            <span class="d-recent__item-icon" aria-hidden="true">{entry.icon}</span>
            <div class="d-recent__item-body">
              <div class="d-recent__item-title">{entry.fileName}</div>
              <div class="d-recent__item-meta">
                {entry.toolName} · {humanSize(entry.fileSize)} · {timeAgo(entry.ts)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" class="d-recent__clear" onClick={handleClear}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
        Clear history
      </button>

      <p class="d-settings__footer" style="margin-top:1.5rem;">
        Files stay on your device — nothing is uploaded.
      </p>
    </div>
  );
}