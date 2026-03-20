import { readdir } from 'fs/promises';
import path from 'path';
import os from 'os';

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', '__pycache__', 'dist', 'build',
  '.next', '.nuxt', '.cache', 'coverage', '.terraform',
]);

export interface DirectoryEntry {
  name: string;
  path: string;
  hasChildren: boolean;
}

export async function getDirectoryChildren(dirPath?: string): Promise<{
  entries: DirectoryEntry[];
  parentPath: string;
}> {
  const resolved = dirPath
    ? (dirPath.startsWith('~') ? path.join(os.homedir(), dirPath.slice(1)) : path.resolve(dirPath))
    : os.homedir();

  try {
    const entries = await readdir(resolved, { withFileTypes: true });
    const results: DirectoryEntry[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (EXCLUDED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(resolved, entry.name);
      let hasChildren = false;
      try {
        const children = await readdir(fullPath, { withFileTypes: true });
        hasChildren = children.some(c => c.isDirectory() && !c.name.startsWith('.') && !EXCLUDED_DIRS.has(c.name));
      } catch { /* permission denied */ }

      results.push({ name: entry.name, path: fullPath, hasChildren });
    }

    return {
      entries: results.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50),
      parentPath: resolved,
    };
  } catch {
    return { entries: [], parentPath: resolved };
  }
}
