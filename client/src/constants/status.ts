import type { SessionStatus } from '@remote-orchestrator/shared';

/** Canonical status colors — reference CSS tokens so they auto-switch with theme. */
export const STATUS_COLORS: Record<SessionStatus, string> = {
  waiting: 'var(--color-status-waiting)',
  running: 'var(--color-status-running)',
  idle:    'var(--color-status-idle)',
  exited:  'var(--color-status-exited)',
};

/** Human-readable status labels. */
export const STATUS_LABELS: Record<SessionStatus, string> = {
  waiting: 'Waiting for input',
  running: 'Running',
  idle:    'Idle',
  exited:  'Exited',
};
