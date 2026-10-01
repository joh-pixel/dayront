/**
 * src/ui/shared/Input.tsx
 * Reusable text input — web + mobile + desktop + extension.
 */
interface Props {
  type?: 'text' | 'email' | 'search' | 'number';
  value: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  autocomplete?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function Input({
  type = 'text',
  value,
  onInput,
  placeholder,
  autocomplete,
  name,
  required,
  disabled,
  ariaLabel,
}: Props) {
  return (
    <input
      type={type}
      class="d-input"
      value={value}
      onInput={(e) => onInput?.((e.target as HTMLInputElement).value)}
      placeholder={placeholder}
      autocomplete={autocomplete}
      name={name}
      required={required}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}