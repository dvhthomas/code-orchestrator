import { useState } from 'react';
import type { AgentDefinition } from '@remote-orchestrator/shared';
import { Modal } from './primitives/index.js';
import { Button } from './primitives/index.js';

interface CloneSessionModalProps {
  folderPath: string;
  currentAgentType?: string;
  agents: AgentDefinition[];
  defaultAgentType?: string;
  theme: 'dark' | 'light';
  onClone: (folderPath: string, agentType: string) => Promise<void>;
  onClose: () => void;
}

export function CloneSessionModal({
  folderPath,
  currentAgentType,
  agents,
  defaultAgentType = 'claude',
  onClone,
  onClose,
}: CloneSessionModalProps) {
  const [agentType, setAgentType] = useState(currentAgentType || defaultAgentType);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloning(true);
    setError('');
    try {
      await onClone(folderPath, agentType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setCloning(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Clone Session"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={cloning} onClick={() => {
            const form = document.getElementById('clone-session-form') as HTMLFormElement;
            form?.requestSubmit();
          }}>
            Clone
          </Button>
        </>
      }
    >
      <form id="clone-session-form" onSubmit={handleSubmit}>
        {/* Folder display */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={labelStyle}>Folder</label>
          <div
            style={{
              padding: '6px 10px',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-accent)',
              background: 'var(--color-accent-bg)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {folderPath}
          </div>
        </div>

        {/* Agent */}
        {agents.length > 0 && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={labelStyle}>Agent</label>
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              style={selectStyle}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}{!agent.builtin ? ' (custom)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: '8px 12px',
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
            }}
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: 'var(--text-base)',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 'var(--text-md)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg-input)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
};
