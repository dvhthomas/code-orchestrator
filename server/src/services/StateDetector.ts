import type { SessionStatus } from '@remote-orchestrator/shared';

const STRIP_ANSI = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(\x07|\x1b\\)/g;

// Patterns that indicate Claude is waiting for user input
const PROMPT_PATTERNS = [
  />\s*$/,                           // Basic prompt ">"
  /\(y\/n\)\s*$/i,                   // Yes/no prompt
  /\[Y\/n\]\s*$/,                    // Default-yes prompt
  /\[y\/N\]\s*$/,                    // Default-no prompt
  /Press Enter to continue/i,        // Continue prompt
  /Allow once/i,                     // Permission prompt
  /Do you want to/i,                 // Permission prompt
];

export class StateDetector {
  private buffer = '';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private currentStatus: SessionStatus = 'running';
  private onStatusChange: (status: SessionStatus) => void;
  private idleDelayMs: number;

  constructor(onStatusChange: (status: SessionStatus) => void, idleDelayMs = 500) {
    this.onStatusChange = onStatusChange;
    this.idleDelayMs = idleDelayMs;
  }

  feed(data: string): void {
    const stripped = data.replace(STRIP_ANSI, '');
    this.buffer += stripped;

    // Keep buffer at reasonable size
    if (this.buffer.length > 4000) {
      this.buffer = this.buffer.slice(-2000);
    }

    // Reset idle timer
    if (this.idleTimer) clearTimeout(this.idleTimer);

    // If output is flowing, we're running
    this.updateStatus('running');

    // After output settles, check for prompt
    this.idleTimer = setTimeout(() => {
      this.checkForPrompt();
    }, this.idleDelayMs);
  }

  private checkForPrompt(): void {
    const tail = this.buffer.slice(-300).trim();

    for (const pattern of PROMPT_PATTERNS) {
      if (pattern.test(tail)) {
        this.updateStatus('waiting');
        return;
      }
    }

    // Output stopped but no prompt detected — idle/done
    this.updateStatus('idle');
  }

  private updateStatus(status: SessionStatus): void {
    if (status !== this.currentStatus) {
      this.currentStatus = status;
      this.onStatusChange(status);
    }
  }

  getStatus(): SessionStatus {
    return this.currentStatus;
  }

  setExited(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.updateStatus('exited');
  }

  destroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
