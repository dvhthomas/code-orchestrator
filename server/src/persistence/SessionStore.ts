import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface PersistedSession {
  id: string;
  name: string;
  folderPath: string;
  createdAt: string;
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
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
