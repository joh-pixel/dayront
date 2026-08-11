interface ProgressBarProps {
  percent: number;
  className?: string;
}

export default function ProgressBar({
  percent,
  className = '',
}: ProgressBarProps) {
  const safePercent = Math.max(
    0,
    Math.min(100, Math.round(percent)),
  );

  return (
    <div
      class={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={safePercent}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Processing progress"
    >
      <div class="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out dark:bg-sky-400"
          style={{
            width: `${safePercent}%`,
          }}
        />
      </div>
    </div>
  );
}