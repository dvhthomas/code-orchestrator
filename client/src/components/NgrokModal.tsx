import type { NgrokStatus } from '@remote-orchestrator/shared';

interface NgrokModalProps {
  onClose: () => void;
  theme: 'dark' | 'light';
  status: NgrokStatus | null;
  loading: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onRecheck: () => void;
}

export function NgrokModal({
  onClose,
  theme,
  status,
  loading,
  error,
  onStart,
  onStop,
  onRecheck,
}: NgrokModalProps) {
  const isDark = theme === 'dark';

  const bg = isDark ? '#1e1f2e' : '#ffffff';
  const border = isDark ? '#3b4261' : '#d0d0d0';
  const textMuted = isDark ? '#565f89' : '#8b8fa3';
  const textPrimary = isDark ? '#c0caf5' : '#343b58';
  const codeBg = isDark ? '#16161e' : '#f0f0f0';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  };

  const installInstructions = (platform: string) => {
    if (platform === 'darwin') {
      return {
        steps: [
          { label: 'Install via Homebrew', cmd: 'brew install ngrok/ngrok/ngrok' },
          { label: 'Add your auth token', cmd: 'ngrok config add-authtoken <your-token>' },
        ],
        link: 'https://dashboard.ngrok.com/get-started/your-authtoken',
        linkLabel: 'Get your auth token →',
      };
    }
    return {
      steps: [
        { label: 'Install via snap', cmd: 'snap install ngrok' },
        { label: 'Add your auth token', cmd: 'ngrok config add-authtoken <your-token>' },
      ],
      link: 'https://dashboard.ngrok.com/get-started/your-authtoken',
      linkLabel: 'Get your auth token →',
    };
  };

  const isConnected = status?.tunnelStatus === 'connected';
  const isConnecting = status?.tunnelStatus === 'connecting' || loading;
  const isError = status?.tunnelStatus === 'error';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: bg,
          borderRadius: '12px',
          padding: '24px',
          width: '520px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: `1px solid ${border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: textPrimary }}>
            Remote Access
          </h2>
          <StatusBadge status={status} isDark={isDark} />
        </div>

        {/* Error from hook */}
        {error && (
          <div style={{
            background: isDark ? 'rgba(247,118,142,0.1)' : 'rgba(200,0,0,0.08)',
            border: `1px solid ${isDark ? '#f7768e' : '#cc0000'}`,
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '13px',
            color: isDark ? '#f7768e' : '#cc0000',
          }}>
            {error}
          </div>
        )}

        {/* ngrok process error */}
        {isError && status?.error && !error && (
          <div style={{
            background: isDark ? 'rgba(247,118,142,0.1)' : 'rgba(200,0,0,0.08)',
            border: `1px solid ${isDark ? '#f7768e' : '#cc0000'}`,
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '13px',
            color: isDark ? '#f7768e' : '#cc0000',
          }}>
            {status.error}
          </div>
        )}

        {/* Not installed state */}
        {status && !status.installed && (
          <NotInstalledView
            instructions={installInstructions(status.platform)}
            onRecheck={onRecheck}
            onClose={onClose}
            isDark={isDark}
            codeBg={codeBg}
            textMuted={textMuted}
            textPrimary={textPrimary}
            border={border}
          />
        )}

        {/* Installed state */}
        {status?.installed && (
          <>
            {/* Connected: show URL */}
            {isConnected && status.publicUrl && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: textMuted }}>
                  Public URL
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: codeBg,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  border: `1px solid ${border}`,
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#9ece6a',
                    flex: 1,
                    wordBreak: 'break-all',
                  }}>
                    {status.publicUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(status.publicUrl!)}
                    style={{
                      background: 'none',
                      border: `1px solid ${border}`,
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: textMuted,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Copy
                  </button>
                  <a
                    href={status.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      border: `1px solid ${border}`,
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: textMuted,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Open ↗
                  </a>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: isDark ? 'rgba(224,175,104,0.08)' : 'rgba(180,120,0,0.07)',
                  border: `1px solid ${isDark ? '#e0af68' : '#c08000'}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: isDark ? '#e0af68' : '#a06800',
                }}>
                  ⚠ Anyone with this URL can control your Claude sessions.
                </div>

                <p style={{ margin: '12px 0 0', fontSize: '12px', color: textMuted }}>
                  Sleep prevention is active — your computer will stay awake while the tunnel is open.
                </p>
              </div>
            )}

            {/* Disconnected / ready */}
            {!isConnected && !isConnecting && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: textPrimary }}>
                  Start an ngrok tunnel to access this dashboard remotely.
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: textMuted }}>
                  Your computer will stay awake while the tunnel is active.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  background: 'none',
                  border: `1px solid ${border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: textMuted,
                }}
              >
                Close
              </button>

              {isConnected ? (
                <button
                  onClick={onStop}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '6px',
                    background: loading ? (isDark ? '#3b4261' : '#d0d0d0') : '#f7768e',
                    color: loading ? textMuted : '#ffffff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {loading ? 'Stopping…' : 'Stop Tunnel'}
                </button>
              ) : (
                <button
                  onClick={onStart}
                  disabled={isConnecting}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isConnecting ? (isDark ? '#3b4261' : '#d0d0d0') : '#7aa2f7',
                    color: isConnecting ? textMuted : '#ffffff',
                    cursor: isConnecting ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {isConnecting ? 'Connecting…' : isError ? 'Retry' : 'Start Tunnel'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, isDark }: { status: NgrokStatus | null; isDark: boolean }) {
  if (!status) return null;

  let label = 'Checking…';
  let color = isDark ? '#565f89' : '#8b8fa3';
  let bg = isDark ? 'rgba(86,95,137,0.15)' : 'rgba(139,143,163,0.15)';

  if (!status.installed) {
    label = 'Not Installed';
    color = isDark ? '#f7768e' : '#cc0000';
    bg = isDark ? 'rgba(247,118,142,0.12)' : 'rgba(200,0,0,0.08)';
  } else if (status.tunnelStatus === 'connected') {
    label = 'Connected';
    color = '#9ece6a';
    bg = 'rgba(158,206,106,0.12)';
  } else if (status.tunnelStatus === 'connecting') {
    label = 'Connecting…';
    color = isDark ? '#e0af68' : '#a06800';
    bg = isDark ? 'rgba(224,175,104,0.12)' : 'rgba(180,120,0,0.08)';
  } else if (status.tunnelStatus === 'error') {
    label = 'Error';
    color = isDark ? '#f7768e' : '#cc0000';
    bg = isDark ? 'rgba(247,118,142,0.12)' : 'rgba(200,0,0,0.08)';
  } else {
    label = 'Ready';
    color = isDark ? '#7aa2f7' : '#4060c0';
    bg = isDark ? 'rgba(122,162,247,0.12)' : 'rgba(64,96,192,0.08)';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 10px',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 500,
      color,
      background: bg,
    }}>
      {status.tunnelStatus === 'connected' && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#9ece6a',
          display: 'inline-block',
        }} />
      )}
      {label}
    </span>
  );
}

interface NotInstalledViewProps {
  instructions: { steps: { label: string; cmd: string }[]; link: string; linkLabel: string };
  onRecheck: () => void;
  onClose: () => void;
  isDark: boolean;
  codeBg: string;
  textMuted: string;
  textPrimary: string;
  border: string;
}

function NotInstalledView({
  instructions,
  onRecheck,
  onClose,
  isDark,
  codeBg,
  textMuted,
  textPrimary,
  border,
}: NotInstalledViewProps) {
  return (
    <>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: textPrimary }}>
        ngrok is required to create a public tunnel. Follow the steps below to install it.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {instructions.steps.map((step, i) => (
          <div key={i}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: textMuted }}>
              {i + 1}. {step.label}
            </p>
            <div style={{
              background: codeBg,
              border: `1px solid ${border}`,
              borderRadius: '6px',
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: isDark ? '#c0caf5' : '#343b58',
              userSelect: 'all',
            }}>
              {step.cmd}
            </div>
          </div>
        ))}
      </div>

      <a
        href={instructions.link}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: '13px', color: isDark ? '#7aa2f7' : '#4060c0', display: 'block', marginBottom: '20px' }}
      >
        {instructions.linkLabel}
      </a>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            background: 'none',
            border: `1px solid ${border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: textMuted,
          }}
        >
          Close
        </button>
        <button
          onClick={onRecheck}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '6px',
            background: '#7aa2f7',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Re-check Installation
        </button>
      </div>
    </>
  );
}
