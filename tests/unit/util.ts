import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '../..');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'test-results', 'playwright-report', 'captures']);

export function walk(dir: string, filter: (file: string) => boolean = () => true): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

export const read = (file: string) => readFileSync(file, 'utf8');
export const rel = (file: string) => path.relative(ROOT, file);

/** Aplatit un objet de messages en clés pointées. */
export function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v as Record<string, unknown>, key));
    else out[key] = String(v);
  }
  return out;
}
