/**
 * src/ui/shared/Button.tsx
 * Reusable button — web + mobile + desktop + extension.
 */
import type { ComponentChildren } from 'preact';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  icon?: ComponentChildren;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  children: ComponentChildren;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  icon,
  onClick,
  href,
  type = 'button',
  disabled,
  children,
}: Props) {
  const cls = `d-btn d-btn--${variant} d-btn--${size} ${full ? 'd-btn--full' : ''}`;

  if (href) {
    return (
      <a href={href} class={cls} aria-disabled={disabled}>
        {icon && <span class="d-btn__icon">{icon}</span>}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      class={cls}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span class="d-btn__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}