import { useState } from 'react';
import type { AgentDefinition } from '@remote-orchestrator/shared';

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
  theme,
  onClone,
  onClose,
}: CloneSessionModalProps) {
  const [agentType, setAgentType] = useState(currentAgentType || defaultAgentType);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState('');
  const isDark = theme === 'dark';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#24283b' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          width: '420px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2
          style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: isDark ? '#c0caf5' : '#343b58',
          }}
        >
          Clone Session
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: isDark ? '#a9b1d6' : '#565c73',
              }}
            >
              Folder
            </label>
            <div
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontFamily: 'Menlo, Monaco, monospace',
                color: isDark ? '#7aa2f7' : '#3b5998',
                background: isDark ? '#1a1b26' : '#f0f4ff',
                borderRadius: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {folderPath}
            </div>
          </div>

          {agents.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isDark ? '#a9b1d6' : '#565c73',
                }}
              >
                Agent
              </label>
              <select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#1a1b26' : '#ffffff',
                  color: isDark ? '#c0caf5' : '#343b58',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
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
                marginBottom: '16px',
                padding: '8px 12px',
                background: isDark ? '#3b2030' : '#fee2e2',
                color: '#f7768e',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
                borderRadius: '6px',
                background: 'transparent',
                color: isDark ? '#a9b1d6' : '#565c73',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={cloning}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '6px',
                background: '#7aa2f7',
                color: '#ffffff',
                cursor: cloning ? 'not-allowed' : 'pointer',
                opacity: cloning ? 0.6 : 1,
                fontWeight: 500,
              }}
            >
              {cloning ? 'Cloning...' : 'Clone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
