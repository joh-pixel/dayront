import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  /** Optional platform hint (e.g. 'android') — passed by the download page */
  platform?: string;
  /** Where the form was submitted from — for analytics */
  source?: string;
  /** Initial CTA label */
  ctaLabel?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NotifyForm({
  platform = 'unknown',
  source = 'download',
  ctaLabel = 'Notify me',
}: Props) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [submittedAt, setSubmittedAt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent autofill dropdowns from looking weird on mobile
  useEffect(() => {
    setSubmittedAt(Date.now());
  }, []);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    // Bot check — form submitted too fast (humans take >2s)
    if (Date.now() - submittedAt < 2000) {
      console.log('[notify] Submitted too fast — ignoring');
      return;
    }

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
          website, // honeypot — should be empty
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message || "You're on the list!");
      setEmail('');
    } catch (err) {
      console.error('[notify] Submit failed:', err);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <form class="notify-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from humans, visible to bots */}
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
          {status === 'loading' && (
            <span class="notify-form__spinner" aria-hidden="true" />
          )}
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