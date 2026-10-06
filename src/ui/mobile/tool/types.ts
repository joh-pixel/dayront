/**
 * src/ui/mobile/tool/types.ts
 * ----------------------------------------------------------------------------
 * Shared types for the tool screen.
 *
 * Nothing here has runtime side effects — this module is types + re-exports.
 */
import type { SettingOption } from '../../../components/conversion/Converter';

/** Re-export so downstream modules only need to import from `./types`. */
export type { SettingOption };

/**
 * A single user-tunable option on a tool.
 *
 * New optional fields (added for the modern settings redesign):
 *   group     — section header shown above the control (e.g. "Encoding")
 *   hint      — one-line helper under the control
 *   unit      — suffix shown inside number inputs (e.g. "px", "dB", "%")
 *   timeUnit  — enables the seconds ↔ minutes toggle on number inputs
 *
 * Existing tools do not need to set these. When they're absent, the UI
 * falls back to the heuristics in ui.tsx / overlays.tsx.
 */
export interface SettingDef {
  name: string;
  label: string;
  type: 'range' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: Array<string | SettingOption>;
  default: string | number;

  group?: string;
  hint?: string;
  unit?: string;
  timeUnit?: boolean;
}

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  type?: string;
  from?: string;
  to?: string;
  settings?: SettingDef[];
  outputFormat?: string;
  presetWidth?: number;
  presetHeight?: number;
  recommendApp?: boolean;
  faq?: Array<{ question: string; answer: string }>;
}

export interface Props {
  tool: Tool;
}

export type State = 'idle' | 'ready' | 'processing' | 'done' | 'error';