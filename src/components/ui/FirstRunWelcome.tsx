// src/components/ui/FirstRunWelcome.tsx
import { useEffect, useState } from 'preact/hooks';

const STORAGE_KEY = 'dayront:welcome-seen:v1';
const AUTO_DISMISS_MS = 20_000;

export default function FirstRunWelcome() {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    // Skip on server / SSR
    if (typeof window === 'undefined') return;

    // Skip if already seen
    let seen = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / storage disabled — just don't show it
      return;
    }

    if (seen) return;

    // Small delay so the page paints first
    const showTimer = setTimeout(() => setVisible(true), 800);

    // Auto-dismiss after 20s
    const autoTimer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoTimer);
    };
  }, []);

  function dismiss() {
    setDismissing(true);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
    // Wait for animation, then unmount
    setTimeout(() => setVisible(false), 250);
  }

  if (!visible) return null;

  return (
    <div
      class={`first-run-toast ${dismissing ? 'first-run-toast--out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div class="first-run-toast__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#2CB5F0" />
          <rect x="12" y="16" width="16" height="8" rx="1" fill="white" />
          <circle cx="20" cy="20" r="3" fill="#2CB5F0" />
        </svg>
      </div>

      <div class="first-run-toast__body">
        <div class="first-run-toast__title">Welcome to Dayront 👋</div>
        <ul class="first-run-toast__list">
          <li><span aria-hidden="true">🔒</span> Files never leave your device</li>
          <li><span aria-hidden="true">⚡</span> Processing happens in your browser</li>
          <li><span aria-hidden="true">📴</span> Works offline once loaded</li>
        </ul>
      </div>

      <button
        type="button"
        class="first-run-toast__close"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        type="button"
        class="first-run-toast__cta"
        onClick={dismiss}
      >
        Got it
      </button>
    </div>
  );
}