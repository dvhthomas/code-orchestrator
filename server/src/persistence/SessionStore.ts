import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface PersistedSession {
  id: string;
  name: string;
  folderPath: string;
  createdAt: string;
  agentType: string;
}

export class SessionStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async save(sessions: PersistedSession[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(sessions, null, 2), 'utf-8');
  }

  async load(): Promise<PersistedSession[]> {
    try {
      const data = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      // Backfill agentType for sessions saved before multi-agent support
      return parsed.map((s: PersistedSession) => ({
        ...s,
        agentType: s.agentType || 'claude',
      }));
    } catch {
      return [];
    }
  }
}
