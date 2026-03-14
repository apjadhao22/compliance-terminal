// ThemeToggle.tsx — Dark/light mode toggle
import React from 'react';

const ThemeToggle: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <button
    className="ml-2 px-2 py-1 rounded font-mono border border-border bg-secondary hover:bg-primary/20"
    onClick={() => onChange(value === 'dark' ? 'light' : 'dark')}
    aria-label="Toggle theme"
  >
    {value === 'dark' ? '🌙 Dark' : '☀️ Light'}
  </button>
);

export default ThemeToggle;
