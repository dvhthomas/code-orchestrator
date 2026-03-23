import { useState } from 'react';
import type { SessionInfo } from '@remote-orchestrator/shared';
import { StatusDot } from './primitives/index.js';

interface CollapsedSessionStripProps {
  sessions: SessionInfo[];
  focusedSessionId: string;
  theme: 'dark' | 'light';
  onSwitchFocus: (id: string) => void;
}

function CollapsedBar({
  session,
  onClick,
}: {
  session: SessionInfo;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderLeft: `3px solid var(--color-status-${session.status})`,
        borderRadius: 'var(--radius-sm)',
        background: hovered ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        cursor: 'pointer',
        minWidth: '120px',
        maxWidth: '220px',
        flexShrink: 0,
        transition: 'background var(--transition-fast)',
      }}
    >
      <StatusDot status={session.status} size={6} />
      <span
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {session.name}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {session.agentType.slice(0, 3)}
      </span>
    </div>
  );
}

export function CollapsedSessionStrip({
  sessions,
  focusedSessionId,
  onSwitchFocus,
}: CollapsedSessionStripProps) {
  const otherSessions = sessions.filter((s) => s.id !== focusedSessionId);

  if (otherSessions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '6px',
        padding: '4px 16px',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        borderBottom: '1px solid var(--color-border-base)',
      }}
    >
      {otherSessions.map((session) => (
        <CollapsedBar
          key={session.id}
          session={session}
          onClick={() => onSwitchFocus(session.id)}
        />
      ))}
    </div>
  );
}
