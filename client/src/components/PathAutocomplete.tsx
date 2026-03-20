import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

interface PathAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'dark' | 'light';
}

export function PathAutocomplete({ value, onChange, theme }: PathAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const fetchCompletions = useCallback(async (path: string) => {
    if (!path) {
      setSuggestions([]);
      return;
    }
    try {
      const completions = await api.getPathCompletions(path);
      setSuggestions(completions);
      setShowSuggestions(completions.length > 0);
      setSelectedIndex(0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCompletions(val), 200);
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion + '/');
    setShowSuggestions(false);
    inputRef.current?.focus();
    // Trigger new completions for the selected directory
    setTimeout(() => fetchCompletions(suggestion + '/'), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="/path/to/project"
        autoFocus
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'Menlo, Monaco, monospace',
          border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
          borderRadius: '6px',
          background: isDark ? '#1a1b26' : '#ffffff',
          color: isDark ? '#c0caf5' : '#343b58',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            background: isDark ? '#1a1b26' : '#ffffff',
            border: `1px solid ${isDark ? '#3b4261' : '#c0c0c0'}`,
            borderRadius: '6px',
            marginTop: '4px',
            zIndex: 10,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s}
              onMouseDown={() => selectSuggestion(s)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontFamily: 'Menlo, Monaco, monospace',
                cursor: 'pointer',
                background: i === selectedIndex
                  ? (isDark ? '#283457' : '#e3e8f0')
                  : 'transparent',
                color: isDark ? '#c0caf5' : '#343b58',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
