// Typed client entry point for the Viral Script Builder engine.
// The implementation lives in scriptBuilderRuntime.js so the Vercel
// serverless API and the browser share one single source of truth.
import { buildScript as buildScriptImpl } from './scriptBuilderRuntime.js';

export type ScriptTone = 'direct' | 'funny' | 'curiosity';

export interface ScriptSection {
  label: string;
  text: string;
  note: string;
}

export interface ScriptTiming {
  label: string;
  range: string;
}

export interface ScriptBuildInput {
  topic: string;
  hook: string;
  lengthSec: 30 | 60;
  tone: ScriptTone;
}

export interface ScriptBuildResult {
  topic: string;
  hook: string;
  lengthSec: number;
  tone: ScriptTone;
  sections: ScriptSection[];
  timing: ScriptTiming[];
  title: string;
  hashtags: string[];
}

export function buildScript(input: ScriptBuildInput): ScriptBuildResult {
  return buildScriptImpl(input) as ScriptBuildResult;
}
