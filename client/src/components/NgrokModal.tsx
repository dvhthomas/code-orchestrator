import type { NgrokStatus } from '@remote-orchestrator/shared';
import { Modal } from './primitives/index.js';
import { Button } from './primitives/index.js';

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
  status,
  loading,
  error,
  onStart,
  onStop,
  onRecheck,
}: NgrokModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
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

  const footer = status?.installed ? (
    <>
      <Button variant="secondary" onClick={onClose}>Close</Button>
      {isConnected ? (
        <Button variant="danger" loading={loading} onClick={onStop}>
          Stop Tunnel
        </Button>
      ) : (
        <Button variant="primary" disabled={isConnecting} onClick={onStart}>
          {isConnecting ? 'Connecting…' : isError ? 'Retry' : 'Start Tunnel'}
        </Button>
      )}
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={onClose}>Close</Button>
      <Button variant="primary" onClick={onRecheck}>Re-check Installation</Button>
    </>
  );

  return (
    <Modal isOpen onClose={onClose} title="Remote Access" size="md" footer={footer}>
      {/* Status badge */}
      {status && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <StatusBadge status={status} />
        </div>
      )}

      {/* Hook error */}
      {error && <ErrorBox message={error} />}

      {/* Process error */}
      {isError && status?.error && !error && <ErrorBox message={status.error} />}

      {/* Not installed */}
      {status && !status.installed && (
        <NotInstalledView instructions={installInstructions(status.platform)} />
      )}

      {/* Installed — connected */}
      {status?.installed && isConnected && status.publicUrl && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            Public URL
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              background: 'var(--color-bg-code)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              border: '1px solid var(--color-border-base)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 'var(--text-md)',
                color: 'var(--color-success)',
                flex: 1,
                wordBreak: 'break-all',
              }}
            >
              {status.publicUrl}
            </span>
            <button
              onClick={() => copyToClipboard(status.publicUrl!)}
              style={actionLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Copy
            </button>
            <a
              href={status.publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{ ...actionLinkStyle, textDecoration: 'none', display: 'inline-block' }}
            >
              Open ↗
            </a>
          </div>

          <div
            style={{
              marginTop: 'var(--space-3)',
              padding: '10px 12px',
              background: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-warning)',
            }}
          >
            ⚠ Anyone with this URL can control your Claude sessions.
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Sleep prevention is active — your computer will stay awake while the tunnel is open.
          </p>
        </div>
      )}

      {/* Installed — disconnected */}
      {status?.installed && !isConnected && !isConnecting && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
            Start an ngrok tunnel to access this dashboard remotely.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            Your computer will stay awake while the tunnel is active.
          </p>
        </div>
      )}
    </Modal>
  );
}

function StatusBadge({ status }: { status: NgrokStatus }) {
  let label = 'Checking…';
  let color = 'var(--color-text-muted)';
  let bg = 'var(--color-bg-surface)';

  if (!status.installed) {
    label = 'Not Installed';
    color = 'var(--color-error)';
    bg = 'var(--color-error-subtle)';
  } else if (status.tunnelStatus === 'connected') {
    label = 'Connected';
    color = 'var(--color-success)';
    bg = 'rgba(158,206,106,0.12)';
  } else if (status.tunnelStatus === 'connecting') {
    label = 'Connecting…';
    color = 'var(--color-warning)';
    bg = 'var(--color-warning-bg)';
  } else if (status.tunnelStatus === 'error') {
    label = 'Error';
    color = 'var(--color-error)';
    bg = 'var(--color-error-subtle)';
  } else {
    label = 'Ready';
    color = 'var(--color-accent)';
    bg = 'var(--color-accent-subtle)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        color,
        background: bg,
      }}
    >
      {status.tunnelStatus === 'connected' && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'inline-block',
          }}
        />
      )}
      {label}
    </span>
  );
}

function NotInstalledView({
  instructions,
}: {
  instructions: { steps: { label: string; cmd: string }[]; link: string; linkLabel: string };
}) {
  return (
    <>
      <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
        ngrok is required to create a public tunnel. Follow the steps below to install it.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-4)' }}>
        {instructions.steps.map((step, i) => (
          <div key={i}>
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {i + 1}. {step.label}
            </p>
            <div
              style={{
                background: 'var(--color-bg-code)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
                userSelect: 'all',
              }}
            >
              {step.cmd}
            </div>
          </div>
        ))}
      </div>

      <a
        href={instructions.link}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 'var(--text-base)', color: 'var(--color-accent)', display: 'block', marginBottom: 'var(--space-5)' }}
      >
        {instructions.linkLabel}
      </a>
    </>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'var(--color-error-subtle)',
        border: '1px solid var(--color-error)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--text-base)',
        color: 'var(--color-error)',
      }}
    >
      {message}
    </div>
  );
}

const actionLinkStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-border-base)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background var(--transition-fast)',
};
