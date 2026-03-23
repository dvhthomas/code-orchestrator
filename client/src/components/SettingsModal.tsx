import { useState, useEffect } from 'react';
import type { AgentDefinition, AgentStatus, AppConfig } from '@remote-orchestrator/shared';
import { api } from '../services/api.js';

interface SettingsModalProps {
  config: AppConfig;
  onClose: () => void;
  onSave: (config: Partial<AppConfig>) => Promise<void>;
  theme: 'dark' | 'light';
}

function agentAbbrev(agent: AgentDefinition): string {
  const abbrevs: Record<string, string> = { claude: 'CLd', gemini: 'Gem', codex: 'Cdx' };
  return abbrevs[agent.id] || agent.name.slice(0, 3);
}

export function SettingsModal({ config, onClose, onSave, theme }: SettingsModalProps) {
  const isDark = theme === 'dark';
  const [defaultAgent, setDefaultAgent] = useState(config.defaultAgent);
  const [customAgents, setCustomAgents] = useState<AgentDefinition[]>(config.customAgents);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [detecting, setDetecting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.detectAgents()
      .then((res) => setAgentStatuses(res.agents))
      .catch(console.error)
      .finally(() => setDetecting(false));
  }, []);

  const handleAddCustomAgent = () => {
    const id = crypto.randomUUID();
    setCustomAgents((prev) => [...prev, { id, name: '', command: '', builtin: false }]);
  };

  const handleUpdateCustomAgent = (id: string, field: 'name' | 'command', value: string) => {
    setCustomAgents((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleRemoveCustomAgent = (id: string) => {
    setCustomAgents((prev) => prev.filter((a) => a.id !== id));
    if (defaultAgent === id) setDefaultAgent('claude');
  };

  const handleSave = async () => {
    const invalid = customAgents.find((a) => !a.name.trim() || !a.command.trim());
    if (invalid) {
      setError('All custom agents must have a name and command.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ defaultAgent, customAgents });
      onClose();
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  const inputStyle = {
    padding: '6px 10px',
    fontSize: '13px',
    border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
    borderRadius: '6px',
    background: isDark ? '#1a1b26' : '#ffffff',
    color: isDark ? '#c0caf5' : '#343b58',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: isDark ? '#a9b1d6' : '#565c73',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const allAgents: AgentDefinition[] = [
    ...agentStatuses.map((s) => s.agent),
    ...customAgents,
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#24283b' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          width: '580px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
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
          Settings
        </h2>

        {/* Default Agent */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Default Agent</label>
          <select
            value={defaultAgent}
            onChange={(e) => setDefaultAgent(e.target.value)}
            style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
          >
            {allAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}{!agent.builtin ? ' (custom)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Status */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Agent Status</label>
          {detecting ? (
            <div style={{ fontSize: '13px', color: isDark ? '#565f89' : '#8b8fa3' }}>Detecting installed agents...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agentStatuses.map(({ agent, installed, resolvedPath }) => (
                <div
                  key={agent.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#3b4261' : '#e0e0e0'}`,
                    background: isDark ? '#1e1f2e' : '#f8f8f8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: installed ? 0 : '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: installed ? '#22c55e' : '#f7768e',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#c0caf5' : '#343b58' }}>
                        {agent.name}
                      </span>
                      <span style={{ fontSize: '11px', color: isDark ? '#565f89' : '#8b8fa3', fontFamily: 'Menlo, Monaco, monospace' }}>
                        {agent.command}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: installed ? '#22c55e' : '#f7768e', fontWeight: 500 }}>
                      {installed ? (resolvedPath || 'installed') : 'not installed'}
                    </span>
                  </div>
                  {!installed && agent.installCommand && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <code
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: isDark ? '#16161e' : '#f0f0f0',
                          color: isDark ? '#7aa2f7' : '#3b5998',
                          fontSize: '12px',
                          fontFamily: 'Menlo, Monaco, monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {agent.installCommand}
                      </code>
                      <button
                        onClick={() => handleCopy(agent.installCommand!)}
                        title="Copy install command"
                        style={{
                          background: 'none',
                          border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: isDark ? '#a9b1d6' : '#565c73',
                          flexShrink: 0,
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Agents */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Custom Agents</label>
          {customAgents.length === 0 && (
            <div style={{ fontSize: '13px', color: isDark ? '#565f89' : '#8b8fa3', marginBottom: '8px' }}>
              No custom agents configured.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customAgents.map((agent) => (
              <div key={agent.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Name (e.g. Aider)"
                  value={agent.name}
                  onChange={(e) => handleUpdateCustomAgent(agent.id, 'name', e.target.value)}
                  style={{ ...inputStyle, flex: '0 0 40%' }}
                />
                <input
                  type="text"
                  placeholder="Command (e.g. aider)"
                  value={agent.command}
                  onChange={(e) => handleUpdateCustomAgent(agent.id, 'command', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => handleRemoveCustomAgent(agent.id)}
                  title="Remove"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#565f89' : '#8b8fa3',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 4px',
                    flexShrink: 0,
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddCustomAgent}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
              borderRadius: '6px',
              background: 'transparent',
              color: isDark ? '#7aa2f7' : '#3b5998',
              cursor: 'pointer',
            }}
          >
            + Add Custom Agent
          </button>
        </div>

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
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '6px',
              background: '#7aa2f7',
              color: '#ffffff',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              fontWeight: 500,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { agentAbbrev };
