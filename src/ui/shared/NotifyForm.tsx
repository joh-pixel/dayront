/**
 * src/ui/shared/NotifyForm.tsx
 * Shared email capture form — used on web + mobile.
 */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  platform?: string;
  source?: string;
  ctaLabel?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const STORAGE_KEY = 'dayront:notify-submitted';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function NotifyForm({
  platform = 'unknown',
  source = 'app',
  ctaLabel = 'Notify me',
}: Props) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [submittedAt] = useState(Date.now());
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const age = Date.now() - parseInt(raw, 10);
        if (age < SEVEN_DAYS) setAlreadySubmitted(true);
      }
    } catch {}
  }, []);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (Date.now() - submittedAt < 2000) return;

    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          platform,
          source,
          website,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again.');
        return;
      }

      try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch {}

      setStatus('success');
      setMessage(data.message || "You're on the list!");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (alreadySubmitted && status !== 'success') {
    return (
      <div class="notify-form">
        <div class="notify-form__message notify-form__message--success" role="status">
          ✅ You're on the list — we'll email you when it's ready.
        </div>
      </div>
    );
  }

  return (
    <form class="notify-form" onSubmit={handleSubmit} noValidate>
      <input
        type="text"
        name="website"
        value={website}
        onInput={(e) => setWebsite((e.target as HTMLInputElement).value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        class="notify-form__honeypot"
      />

      <div class="notify-form__row">
        <input
          ref={inputRef}
          type="email"
          name="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
          disabled={status === 'loading' || status === 'success'}
          class="notify-form__input"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          class="notify-form__button"
        >
          {status === 'loading' && <span class="notify-form__spinner" aria-hidden="true" />}
          {status === 'loading' ? 'Sending…' : status === 'success' ? '✓ Done' : ctaLabel}
        </button>
      </div>

      {message && (
        <div class={`notify-form__message notify-form__message--${status}`} role="status">
          {status === 'success' ? '✅ ' : status === 'error' ? '⚠️ ' : ''}
          {message}
        </div>
      )}

      <p class="notify-form__fineprint">
        No spam. One email when we launch. Unsubscribe any time.
      </p>
    </form>
  );
}