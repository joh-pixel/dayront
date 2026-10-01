/**
 * src/ui/shared/ProgressBar.tsx
 * Progress indicator for FFmpeg operations.
 */
interface Props {
  /** 0–100 */
  value: number;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({ value, label, showPercent = true }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div class="d-progress" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      {(label || showPercent) && (
        <div class="d-progress__head">
          {label && <span class="d-progress__label">{label}</span>}
          {showPercent && <span class="d-progress__percent">{Math.round(safe)}%</span>}
        </div>
      )}
      <div class="d-progress__track">
        <div class="d-progress__fill" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}