import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export class OrderStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async save(order: string[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(order, null, 2), 'utf-8');
  }

  async load(): Promise<string[]> {
    try {
      const data = await readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
