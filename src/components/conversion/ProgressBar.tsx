import { useEffect, useRef, useState } from 'preact/hooks';

/* --------------------------------------------------------------------------
   HOOK: Smooth progress value
   Given a raw target (0-100), returns a smoothly-animated display value.
   
   - Auto-creep: if target stays at 0 for a while, the display inches forward
     (up to 12%) so users see activity during FFmpeg's initial load phase.
   - Smooth easing: never jumps, always glides toward the target.
   - Never goes backward visually.
-------------------------------------------------------------------------- */
export function useSmoothProgress(target: number): number {
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef(Date.now());
  const mountedRef = useRef(false);

  // Initialize on first render
  useEffect(() => {
    if (!mountedRef.current) {
      startTimeRef.current = Date.now();
      mountedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      setDisplay((prev) => {
        // Auto-creep only when real progress is still at 0
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        const creepFloor =
          target === 0 ? Math.min(12, elapsedSec * 1.5) : 0;

        let next = Math.max(target, creepFloor);

        // Never go backwards
        if (next < prev) next = prev;

        // Cap at 100
        if (next > 100) next = 100;

        // Smooth easing toward the target
        const diff = next - prev;
        if (Math.abs(diff) < 0.2) return next;

        return prev + diff * 0.18;
      });
    };

    const interval = setInterval(tick, 80); // 12.5 fps — smooth enough
    return () => clearInterval(interval);
  }, [target]);

  return display;
}

/* --------------------------------------------------------------------------
   PROGRESS BAR
-------------------------------------------------------------------------- */
interface ProgressBarProps {
  percent: number;
  className?: string;
}

export default function ProgressBar({
  percent,
  className = '',
}: ProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  // Show the shimmer only while actively progressing
  const showShimmer = safePercent > 0 && safePercent < 100;

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
          class="relative h-full overflow-hidden rounded-full bg-sky-500 transition-[width] duration-200 ease-out dark:bg-sky-400"
          style={{ width: `${safePercent}%` }}
        >
          {showShimmer && (
            <div
              class="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/50 to-transparent"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}