// src/components/ui/PlatformGate.tsx
import { useEffect, useState } from 'preact/hooks';
import { getToolBySlug, detectPlatform } from '../../lib/tools';

interface Props {
  toolSlug: string;
  variant?: 'banner' | 'inline' | 'blocker';
  downloadUrl?: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function PlatformGate({
  toolSlug,
  variant = 'banner',
  downloadUrl = 'https://download.dayront.com',
}: Props) {
  const tool = getToolBySlug(toolSlug);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(() => detectPlatform());

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (!tool?.recommendApp) return;
    if (platform.engine === 'native') return;

    const dismissedAt = localStorage.getItem(`dg:${tool.slug}`);
    if (dismissedAt) {
      const age = Date.now() - parseInt(dismissedAt, 10);
      if (age < SEVEN_DAYS) return;
    }

    setVisible(true);
  }, [tool?.slug, tool?.recommendApp, platform.engine]);

  if (!tool?.recommendApp || !visible) return null;

  const isBlocker = variant === 'blocker';
  const message = tool.webNote ?? 'This tool runs best in the Dayront app.';
  const limitMB = tool.webMaxMB ?? 250;

  const dismiss = () => {
    localStorage.setItem(`dg:${tool.slug}`, Date.now().toString());
    setVisible(false);
  };

  return (
    <div
      class={`platform-gate platform-gate--${variant}`}
      role={isBlocker ? 'alert' : 'note'}
    >
      <div class="platform-gate__icon" aria-hidden="true">
        {isBlocker ? '⚠️' : '📱'}
      </div>

      <div class="platform-gate__body">
        <div class="platform-gate__title">
          {isBlocker ? 'App Recommended' : 'Faster in the Dayront App'}
        </div>

        <p class="platform-gate__message">{message}</p>

        <div class="platform-gate__meta">
          <span>
            You're on: <strong>{platform.label}</strong>
          </span>
          <span>
            Web limit: <strong>{limitMB} MB</strong>
          </span>
          {platform.engine === 'wasm' && (
            <span>
              App limit: <strong>5 GB</strong>
            </span>
          )}
        </div>

        <div class="platform-gate__actions">
          <a href={downloadUrl} class="pg-btn pg-btn--primary">
            Get the App
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          {!isBlocker && (
            <button type="button" class="pg-btn pg-btn--ghost" onClick={dismiss}>
              Continue on web
            </button>
          )}
        </div>
      </div>
    </div>
  );
}