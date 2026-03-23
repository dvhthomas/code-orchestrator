import type { ReactNode } from 'react';
import type parseDiff from 'parse-diff';

interface DiffHunkProps {
  chunk: parseDiff.Chunk;
  theme: 'dark' | 'light';
  searchQuery?: string;
}

function highlightText(text: string, query: string): ReactNode {
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const parts: ReactNode[] = [];
  let last = 0;
  let idx = lower.indexOf(queryLower, last);
  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <mark
        key={idx}
        style={{
          background: 'rgba(255, 213, 79, 0.55)',
          color: 'inherit',
          borderRadius: '2px',
          padding: '0 1px',
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    last = idx + query.length;
    idx = lower.indexOf(queryLower, last);
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const COLORS = {
  dark: {
    addBg: 'rgba(165,213,112,0.1)',
    addText: '#a5d570',
    addGutter: 'rgba(165,213,112,0.15)',
    addBorder: '#a5d570',
    delBg: 'rgba(255,180,171,0.1)',
    delText: '#ffb4ab',
    delGutter: 'rgba(255,180,171,0.15)',
    delBorder: '#ffb4ab',
    contextText: '#c3c6d3',
    hunkBg: '#1e1f2a',
    hunkText: '#8d909d',
    lineNum: '#8d909d',
  },
  light: {
    addBg: 'rgba(165,213,112,0.12)',
    addText: '#2d6a0e',
    addGutter: 'rgba(165,213,112,0.2)',
    addBorder: '#7ab648',
    delBg: 'rgba(255,180,171,0.12)',
    delText: '#ba1a1a',
    delGutter: 'rgba(255,180,171,0.2)',
    delBorder: '#e05a4a',
    contextText: '#43474f',
    hunkBg: '#ebedf8',
    hunkText: '#747780',
    lineNum: '#747780',
  },
};

export function DiffHunk({ chunk, theme, searchQuery }: DiffHunkProps) {
  const c = COLORS[theme];

  return (
    <div>
      <div
        style={{
          padding: '4px 12px',
          background: c.hunkBg,
          color: c.hunkText,
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {chunk.content}
      </div>
      {chunk.changes.map((change, i) => {
        let bg = 'transparent';
        let gutterBg = 'transparent';
        let textColor = c.contextText;
        let oldLn = '';
        let newLn = '';
        let prefix = ' ';

        if (change.type === 'add') {
          bg = c.addBg;
          gutterBg = c.addGutter;
          textColor = c.addText;
          newLn = String(change.ln);
          prefix = '+';
        } else if (change.type === 'del') {
          bg = c.delBg;
          gutterBg = c.delGutter;
          textColor = c.delText;
          oldLn = String(change.ln);
          prefix = '-';
        } else {
          oldLn = String(change.ln1);
          newLn = String(change.ln2);
        }

        const borderLeft = change.type === 'add'
          ? `2px solid ${c.addBorder}`
          : change.type === 'del'
          ? `2px solid ${c.delBorder}`
          : 'none';

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              background: bg,
              borderLeft,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              lineHeight: '20px',
            }}
          >
            <span
              style={{
                width: '44px',
                minWidth: '44px',
                textAlign: 'right',
                padding: '0 4px',
                color: c.lineNum,
                background: gutterBg,
                userSelect: 'none',
              }}
            >
              {oldLn}
            </span>
            <span
              style={{
                width: '44px',
                minWidth: '44px',
                textAlign: 'right',
                padding: '0 4px',
                color: c.lineNum,
                background: gutterBg,
                userSelect: 'none',
              }}
            >
              {newLn}
            </span>
            <span
              style={{
                width: '18px',
                minWidth: '18px',
                textAlign: 'center',
                color: textColor,
                userSelect: 'none',
                fontWeight: 600,
              }}
            >
              {prefix}
            </span>
            <span
              style={{
                flex: 1,
                color: textColor,
                padding: '0 8px',
                whiteSpace: 'pre',
                overflow: 'hidden',
              }}
            >
              {searchQuery ? highlightText(change.content.slice(1), searchQuery) : change.content.slice(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
