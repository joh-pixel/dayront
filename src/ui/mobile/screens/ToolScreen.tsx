/**
 * src/ui/mobile/screens/ToolScreen.tsx
 * ----------------------------------------------------------------------------
 * Public entry point for the mobile tool screen.
 *
 * SSR NOTE: default export is a wrapper. Astro bundles all `client:load`
 * components for a route into one shared chunk; the inner must never run
 * with a missing prop. The wrapper guards against that.
 *
 * The actual implementation lives under ../tool/ — see inner.tsx for the
 * orchestrator and its sibling modules for leaf UI.
 */
import { ToolScreenInner } from '../tool/inner';
import type { Props } from '../tool/types';

export default function ToolScreen(props: Props) {
  if (!props || !props.tool || typeof props.tool !== 'object') {
    return (
      <div
        class="d-tool"
        style={{ padding: '3rem 1.5rem', textAlign: 'center', opacity: 0.6 }}
      >
        <p style={{ fontSize: '0.9rem', margin: 0 }}>No tool selected.</p>
      </div>
    );
  }
  return <ToolScreenInner tool={props.tool} />;
}