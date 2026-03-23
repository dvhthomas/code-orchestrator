interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)' }: SkeletonProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-bg-surface) 25%, var(--color-border-base) 50%, var(--color-bg-surface) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

// Inject keyframes once via a style tag
if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframes')) {
  const style = document.createElement('style');
  style.id = 'skeleton-keyframes';
  style.textContent = `
    @keyframes skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes status-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      50%       { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0); }
    }
  `;
  document.head.appendChild(style);
}
