import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import { execSync } from 'child_process';

function findClaude(): string {
  try {
    return execSync('which claude', { encoding: 'utf-8' }).trim();
  } catch {
    return 'claude';
  }
}

const CLAUDE_PATH = findClaude();

export class PtyManager {
  spawn(folderPath: string, cols: number = 120, rows: number = 30): IPty {
    // Use shell to ensure PATH is properly inherited
    const shell = process.env.SHELL || '/bin/zsh';
    return pty.spawn(shell, ['-l', '-c', `exec ${CLAUDE_PATH}`], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: folderPath,
      env: { ...process.env, TERM: 'xterm-256color' } as Record<string, string>,
    });
  }

  write(ptyProcess: IPty, data: string): void {
    ptyProcess.write(data);
  }

  resize(ptyProcess: IPty, cols: number, rows: number): void {
    ptyProcess.resize(cols, rows);
  }

  kill(ptyProcess: IPty): void {
    ptyProcess.kill();
  }
}
