import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { AppConfig } from '@remote-orchestrator/shared';

const DEFAULT_CONFIG: AppConfig = {
  defaultAgent: 'claude',
  customAgents: [],
};

export class ConfigStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async save(config: AppConfig): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  async load(): Promise<AppConfig> {
    try {
      const data = await readFile(this.filePath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
}
