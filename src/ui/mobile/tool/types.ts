/**
 * src/ui/mobile/tool/types.ts
 * ----------------------------------------------------------------------------
 * Shared types for the tool screen. Extracted from ToolScreen.tsx so the
 * screen's logic can be split across small, focused modules under tool/.
 *
 * Nothing here has runtime side effects — this module is types + re-exports.
 */
import type { SettingOption } from '../../../components/conversion/Converter';

/** Re-export so downstream modules only need to import from `./types`. */
export type { SettingOption };

/**
 * A single user-tunable option on a tool (resolution, bitrate, format…).
 * Rendered by PillSetting inside the Options bottom sheet.
 */
export interface SettingDef {
  name: string;
  label: string;
  type: 'range' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: Array<string | SettingOption>;
  default: string | number;
}

/**
 * Shape of a tool definition as passed into the mobile ToolScreen.
 * This is a *subset* of the full catalog entry — only the fields the
 * tool screen actually reads.
 *
 * `recommendApp` is read by shouldWarnLongJob() and is present at runtime
 * on every tool definition emitted from src/core/tools.ts.
 */
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

/** Props accepted by the public ToolScreen wrapper. */
export interface Props {
  tool: Tool;
}

/**
 * Lifecycle of a single tool screen:
 *
 *   idle        no files picked yet
 *   ready       file(s) picked, waiting for user to tap Start
 *   processing  FFmpeg running
 *   done        result blob ready, success sheet shown
 *   error       something went wrong, error sheet shown
 */
export type State = 'idle' | 'ready' | 'processing' | 'done' | 'error';