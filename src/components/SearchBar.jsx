import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tools } from '../data/tools.js';

export default function SearchBar() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(-1);
  const ref = useRef(null);
  const navigate = useNavigate();

  function search(q) {
    setQuery(q);
    setFocused(-1);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const lower = q.toLowerCase();
    const hits = tools.filter(t =>
      t.title.toLowerCase().includes(lower) ||
      t.shortDesc.toLowerCase().includes(lower) ||
      t.keywords?.some(k => k.toLowerCase().includes(lower))
    ).slice(0, 8);
    setResults(hits);
    setOpen(true);
  }

  function select(tool) {
    setQuery(''); setResults([]); setOpen(false);
    navigate(tool.path);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setFocused(f => Math.max(f - 1, -1)); }
    if (e.key === 'Enter' && focused >= 0) select(results[focused]);
    if (e.key === 'Escape')     { setOpen(false); setFocused(-1); }
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.9rem', color: 'var(--text-3)', pointerEvents: 'none',
        }}>
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(true)}
          placeholder="Search tools…"
          style={{
            width: '100%',
            padding: '10px 36px 10px 38px',
            fontFamily: 'var(--font)',
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            outline: 'none',
            backdropFilter: 'blur(8px)',
            transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.5)';
            e.target.style.background  = 'rgba(255,255,255,0.15)';
            e.target.style.boxShadow   = '0 0 0 3px rgba(94,234,212,0.25)';
            if (query) setOpen(true);
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
            e.target.style.background  = 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow   = 'none';
          }}
        />
        {/* Placeholder text colour override via inline style on ::placeholder not possible,
            so we handle it via the light background + white text above */}
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', padding: '2px 4px',
              lineHeight: 1,
            }}>
            ✕
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 300,
          overflow: 'hidden',
          animation: 'dropdown-in 0.15s ease',
        }}>
          {results.map((tool, i) => (
            <div
              key={tool.id}
              onMouseDown={() => select(tool)}
              onMouseEnter={() => setFocused(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', cursor: 'pointer',
                background: focused === i ? 'var(--accent-light)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}>
              {/* Icon */}
              <span style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                background: tool.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: 'white',
                fontFamily: 'var(--mono)',
              }}>
                {tool.icon}
              </span>
              {/* Text */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.87rem', fontWeight: 600,
                  color: focused === i ? 'var(--accent-hover)' : 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {tool.title}
                </div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {tool.shortDesc}
                </div>
              </div>
              {/* Arrow hint */}
              <span style={{
                marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-3)',
                flexShrink: 0, opacity: focused === i ? 1 : 0, transition: 'opacity 0.1s',
              }}>
                →
              </span>
            </div>
          ))}

          {/* Footer hint */}
          <div style={{
            padding: '6px 14px', fontSize: '0.68rem', color: 'var(--text-3)',
            background: 'var(--surface2)', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '12px',
          }}>
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>Esc close</span>
          </div>
        </div>
      )}

      {/* No results state */}
      {open && query.trim() && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          zIndex: 300, padding: '16px', fontSize: '0.84rem', color: 'var(--text-3)',
          textAlign: 'center',
        }}>
          No tools found for "<strong style={{ color: 'var(--text-2)' }}>{query}</strong>"
        </div>
      )}
    </div>
  );
}
