import { useState, useCallback } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core random utilities ─────────────────────────────────────

// Cryptographically random integer in [min, max] inclusive
function randInt(min, max) {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range;
  const arr = new Uint8Array(bytesNeeded);
  let val;
  do {
    crypto.getRandomValues(arr);
    val = arr.reduce((acc, b, i) => acc + b * 256 ** i, 0);
  } while (val >= maxValid);
  return min + (val % range);
}

function randFloat(min, max, decimals) {
  const raw = Math.random() * (max - min) + min;
  return parseFloat(raw.toFixed(decimals));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateUUID() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = [...arr].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function generatePassword(length, opts) {
  const sets = [];
  if (opts.upper)   sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (opts.lower)   sets.push('abcdefghijklmnopqrstuvwxyz');
  if (opts.digits)  sets.push('0123456789');
  if (opts.symbols) sets.push('!@#$%^&*()-_=+[]{}|;:,.<>?');
  if (sets.length === 0) return '';
  const pool = sets.join('');
  // Guarantee at least one from each set
  const guaranteed = sets.map(s => s[randInt(0, s.length - 1)]);
  const remaining = Array.from({ length: length - guaranteed.length }, () => pool[randInt(0, pool.length - 1)]);
  return shuffleArray([...guaranteed, ...remaining]).join('');
}

// ── Shared UI ─────────────────────────────────────────────────

function ResultDisplay({ values, onCopy, label = 'Result' }) {
  if (!values || values.length === 0) return null;
  const isMany = values.length > 1;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        background: 'var(--accent-light)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)',
        padding: isMany ? '16px 20px' : '20px 28px',
        textAlign: isMany ? 'left' : 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent-hover)', marginBottom: '10px' }}>
          {label}
        </div>
        {isMany ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {values.map((v, i) => (
              <span key={i} style={{
                background: 'var(--surface)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontFamily: 'var(--mono)',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--accent-hover)',
              }}>{v}</span>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 700,
            fontFamily: 'var(--mono)',
            color: 'var(--accent-hover)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            wordBreak: 'break-all',
          }}>
            {values[0]}
          </div>
        )}
        <button
          onClick={onCopy}
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: '12px', right: '12px' }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '22px', marginBottom: '8px',
    }}>
      {children}
    </p>
  );
}

// ── Mode 1: Integer generator ─────────────────────────────────

function IntegerMode() {
  const [min, setMin]       = useState('1');
  const [max, setMax]       = useState('100');
  const [count, setCount]   = useState('1');
  const [unique, setUnique] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [toast, setToast]   = useState('');

  function generate() {
    const mn = parseInt(min), mx = parseInt(max), ct = parseInt(count);
    if (isNaN(mn) || isNaN(mx)) { setError('Enter valid min and max values.'); setResult(null); return; }
    if (mn > mx) { setError('Min must be less than or equal to max.'); setResult(null); return; }
    if (isNaN(ct) || ct < 1 || ct > 10000) { setError('Count must be between 1 and 10,000.'); setResult(null); return; }
    if (unique && ct > (mx - mn + 1)) { setError(`Cannot generate ${ct} unique numbers from range ${mn}–${mx} (only ${mx - mn + 1} available).`); setResult(null); return; }

    let nums;
    if (unique) {
      const pool = Array.from({ length: mx - mn + 1 }, (_, i) => mn + i);
      nums = shuffleArray(pool).slice(0, ct);
    } else {
      nums = Array.from({ length: ct }, () => randInt(mn, mx));
    }

    if (sorted) nums.sort((a, b) => a - b);
    setResult(nums);
    setError('');
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.join(', ')).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  const QUICK_RANGES = [
    { label: '1–6 (dice)',    min: '1',   max: '6',   count: '1' },
    { label: '1–10',          min: '1',   max: '10',  count: '1' },
    { label: '1–100',         min: '1',   max: '100', count: '1' },
    { label: '0–1',           min: '0',   max: '1',   count: '1' },
    { label: '1–49 (lottery)',min: '1',   max: '49',  count: '6' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Generate one or more random integers in any range, with options for unique values and sorting.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Min</label>
          <input type="number" value={min}
            onChange={e => { setMin(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="1" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Max</label>
          <input type="number" value={max}
            onChange={e => { setMax(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="100" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>How many</label>
          <input type="number" value={count} min="1" max="10000"
            onChange={e => { setCount(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="1" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { label: 'No duplicates', val: unique, set: setUnique },
          { label: 'Sort results',  val: sorted, set: setSorted },
        ].map(opt => (
          <label key={opt.label} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)',
            textTransform: 'none', letterSpacing: 0, fontWeight: 500,
          }}>
            <input type="checkbox" checked={opt.val}
              onChange={e => { opt.set(e.target.checked); setResult(null); }}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Quick ranges */}
      <SectionTitle>Quick ranges</SectionTitle>
      <div className="tag-row" style={{ marginBottom: '14px' }}>
        {QUICK_RANGES.map(r => (
          <button key={r.label} className="tag"
            onClick={() => { setMin(r.min); setMax(r.max); setCount(r.count); setResult(null); setError(''); }}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={generate}>Generate</button>
        <button className="btn btn-ghost" onClick={() => { setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}
      {result && !error && (
        <ResultDisplay
          values={result}
          onCopy={copy}
          label={result.length === 1 ? 'Random integer' : `${result.length} random integers`}
        />
      )}
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Decimal / Float ───────────────────────────────────

function DecimalMode() {
  const [min, setMin]         = useState('0');
  const [max, setMax]         = useState('1');
  const [decimals, setDecimals] = useState('4');
  const [count, setCount]     = useState('1');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  function generate() {
    const mn = parseFloat(min), mx = parseFloat(max);
    const dp = parseInt(decimals), ct = parseInt(count);
    if (isNaN(mn) || isNaN(mx)) { setError('Enter valid min and max.'); setResult(null); return; }
    if (mn >= mx) { setError('Min must be less than max.'); setResult(null); return; }
    if (isNaN(dp) || dp < 0 || dp > 15) { setError('Decimals must be 0–15.'); setResult(null); return; }
    if (isNaN(ct) || ct < 1 || ct > 1000) { setError('Count must be 1–1000.'); setResult(null); return; }

    const nums = Array.from({ length: ct }, () => randFloat(mn, mx, dp));
    setResult(nums);
    setError('');
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.join(', ')).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Generate random decimal numbers (floats) in any range with a chosen number of decimal places.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Min</label>
          <input type="number" value={min} onChange={e => { setMin(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="0" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Max</label>
          <input type="number" value={max} onChange={e => { setMax(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="1" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Decimal places</label>
          <input type="number" value={decimals} min="0" max="15"
            onChange={e => { setDecimals(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="4" />
        </div>
        <div className="form-group">
          <label>How many</label>
          <input type="number" value={count} min="1" max="1000"
            onChange={e => { setCount(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="1" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={generate}>Generate</button>
        <button className="btn btn-ghost" onClick={() => { setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}
      {result && !error && (
        <ResultDisplay values={result} onCopy={copy}
          label={result.length === 1 ? 'Random decimal' : `${result.length} random decimals`} />
      )}
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 3: List picker / shuffler ────────────────────────────

function ListMode() {
  const [listInput, setListInput] = useState('');
  const [pickCount, setPickCount] = useState('1');
  const [doShuffle, setDoShuffle] = useState(false);
  const [uniquePick, setUniquePick] = useState(true);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  function getItems() {
    return listInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }

  function generate() {
    const items = getItems();
    if (items.length === 0) { setError('Enter at least one item.'); setResult(null); return; }

    if (doShuffle) {
      setResult(shuffleArray(items));
      setError('');
      return;
    }

    const ct = parseInt(pickCount);
    if (isNaN(ct) || ct < 1) { setError('Pick count must be at least 1.'); setResult(null); return; }
    if (uniquePick && ct > items.length) {
      setError(`Cannot pick ${ct} unique items from a list of ${items.length}.`); setResult(null); return;
    }

    let picked;
    if (uniquePick) {
      picked = shuffleArray(items).slice(0, ct);
    } else {
      picked = Array.from({ length: ct }, () => items[randInt(0, items.length - 1)]);
    }
    setResult(picked);
    setError('');
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.join(', ')).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  const SAMPLE_LISTS = [
    { label: 'Weekdays',   data: 'Monday, Tuesday, Wednesday, Thursday, Friday' },
    { label: 'Months',     data: 'January, February, March, April, May, June, July, August, September, October, November, December' },
    { label: 'Card suits', data: 'Hearts, Diamonds, Clubs, Spades' },
    { label: 'Coin flip',  data: 'Heads, Tails' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Pick random items from a custom list, or shuffle the entire list. One item per line or comma-separated.
      </p>

      <div className="form-group">
        <label>Your list</label>
        <textarea rows={5} value={listInput}
          onChange={e => { setListInput(e.target.value); setResult(null); setError(''); }}
          placeholder={'One item per line or comma-separated:\nApple\nBanana\nCherry'}
          style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', resize: 'vertical' }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
          {getItems().length} item{getItems().length !== 1 ? 's' : ''} detected
        </p>
      </div>

      <SectionTitle>Sample lists</SectionTitle>
      <div className="tag-row" style={{ marginBottom: '14px' }}>
        {SAMPLE_LISTS.map(s => (
          <button key={s.label} className="tag"
            onClick={() => { setListInput(s.data); setResult(null); setError(''); }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
          <input type="checkbox" checked={doShuffle} onChange={e => { setDoShuffle(e.target.checked); setResult(null); }}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
          Shuffle entire list
        </label>
        {!doShuffle && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
              <input type="checkbox" checked={uniquePick} onChange={e => { setUniquePick(e.target.checked); setResult(null); }}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
              No duplicates
            </label>
            <div className="form-group" style={{ margin: 0, flex: '0 0 120px' }}>
              <label>Pick how many</label>
              <input type="number" value={pickCount} min="1"
                onChange={e => { setPickCount(e.target.value); setResult(null); }}
                placeholder="1" style={{ fontFamily: 'var(--mono)' }} />
            </div>
          </>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={generate}>
          {doShuffle ? 'Shuffle' : 'Pick'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}
      {result && !error && (
        <ResultDisplay values={result} onCopy={copy}
          label={doShuffle ? 'Shuffled list' : result.length === 1 ? 'Random pick' : `${result.length} random picks`} />
      )}
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 4: Password / string generator ──────────────────────

function PasswordMode() {
  const [length, setLength]   = useState('16');
  const [count, setCount]     = useState('1');
  const [opts, setOpts]       = useState({ upper: true, lower: true, digits: true, symbols: false });
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');
  const [revealed, setRevealed] = useState({});

  function toggleOpt(key) {
    setOpts(o => ({ ...o, [key]: !o[key] }));
    setResult(null);
  }

  function generate() {
    const len = parseInt(length), ct = parseInt(count);
    if (isNaN(len) || len < 4 || len > 128) { setError('Length must be 4–128.'); setResult(null); return; }
    if (isNaN(ct) || ct < 1 || ct > 100) { setError('Count must be 1–100.'); setResult(null); return; }
    if (!opts.upper && !opts.lower && !opts.digits && !opts.symbols) {
      setError('Select at least one character type.'); setResult(null); return;
    }
    const passwords = Array.from({ length: ct }, () => generatePassword(len, opts));
    setResult(passwords);
    setRevealed({});
    setError('');
  }

  function copy(val) {
    navigator.clipboard.writeText(val).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  function copyAll() {
    if (!result) return;
    navigator.clipboard.writeText(result.join('\n')).then(() => {
      setToast('All copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  const CHAR_OPTS = [
    { key: 'upper',   label: 'Uppercase A–Z' },
    { key: 'lower',   label: 'Lowercase a–z' },
    { key: 'digits',  label: 'Digits 0–9' },
    { key: 'symbols', label: 'Symbols !@#$…' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Generate cryptographically random passwords with full control over character types and length.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Length</label>
          <input type="number" value={length} min="4" max="128"
            onChange={e => { setLength(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="16" />
        </div>
        <div className="form-group">
          <label>How many</label>
          <input type="number" value={count} min="1" max="100"
            onChange={e => { setCount(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && generate()} placeholder="1" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {CHAR_OPTS.map(o => (
          <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
            <input type="checkbox" checked={opts[o.key]} onChange={() => toggleOpt(o.key)}
              style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            {o.label}
          </label>
        ))}
      </div>

      {/* Quick length presets */}
      <div className="tag-row" style={{ marginBottom: '14px' }}>
        {['8', '12', '16', '24', '32'].map(l => (
          <button key={l} className={`tag${length === l ? ' active' : ''}`}
            onClick={() => { setLength(l); setResult(null); }}>
            {l} chars
          </button>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={generate}>Generate</button>
        <button className="btn btn-ghost" onClick={() => { setResult(null); setError(''); }}>Clear</button>
        {result && result.length > 1 && (
          <button className="btn btn-secondary btn-sm" onClick={copyAll}>Copy all</button>
        )}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.map((pw, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            }}>
              <code style={{
                flex: 1, fontFamily: 'var(--mono)', fontSize: '0.9rem',
                color: 'var(--text)', letterSpacing: '0.04em',
                filter: revealed[i] ? 'none' : 'blur(5px)',
                transition: 'filter 0.2s', userSelect: revealed[i] ? 'text' : 'none',
              }}>
                {pw}
              </code>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}>
                {revealed[i] ? 'Hide' : 'Show'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                onClick={() => copy(pw)}>
                Copy
              </button>
            </div>
          ))}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
            Passwords are generated using the Web Crypto API and never leave your browser.
          </p>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 5: UUID / Token generator ───────────────────────────

function UUIDMode() {
  const [count, setCount]   = useState('1');
  const [format, setFormat] = useState('uuid');
  const [result, setResult] = useState(null);
  const [toast, setToast]   = useState('');

  const FORMATS = [
    { id: 'uuid',   label: 'UUID v4',        desc: 'xxxxxxxx-xxxx-4xxx-…' },
    { id: 'hex16',  label: 'Hex (16 bytes)',  desc: '32 hex chars' },
    { id: 'hex8',   label: 'Hex (8 bytes)',   desc: '16 hex chars' },
    { id: 'base64', label: 'Base64 (16 B)',   desc: 'URL-safe token' },
  ];

  function generate() {
    const ct = parseInt(count);
    if (isNaN(ct) || ct < 1 || ct > 100) return;

    const gen = () => {
      if (format === 'uuid') return generateUUID();
      const bytes = new Uint8Array(format === 'hex8' ? 8 : 16);
      crypto.getRandomValues(bytes);
      if (format === 'base64') {
        return btoa(String.fromCharCode(...bytes))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      }
      return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    };

    setResult(Array.from({ length: ct }, gen));
  }

  function copy(val) {
    navigator.clipboard.writeText(val).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  function copyAll() {
    if (!result) return;
    navigator.clipboard.writeText(result.join('\n')).then(() => {
      setToast('All copied!'); setTimeout(() => setToast(''), 1800);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Generate cryptographically random UUIDs, hex tokens, and Base64 strings for use as IDs, API keys, and session tokens.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '18px' }}>
        {FORMATS.map(f => (
          <button key={f.id} onClick={() => { setFormat(f.id); setResult(null); }}
            style={{
              background: format === f.id ? 'var(--accent-light)' : 'var(--surface2)',
              border: `1.5px solid ${format === f.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '9px 12px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: format === f.id ? 'var(--accent-hover)' : 'var(--text)' }}>{f.label}</div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '2px' }}>{f.desc}</div>
          </button>
        ))}
      </div>

      <div className="form-group" style={{ maxWidth: '180px' }}>
        <label>How many</label>
        <input type="number" value={count} min="1" max="100"
          onChange={e => { setCount(e.target.value); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && generate()} placeholder="1" />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={generate}>Generate</button>
        <button className="btn btn-ghost" onClick={() => setResult(null)}>Clear</button>
        {result && result.length > 1 && (
          <button className="btn btn-secondary btn-sm" onClick={copyAll}>Copy all</button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.map((id, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            }}>
              <code style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--accent-hover)', wordBreak: 'break-all' }}>
                {id}
              </code>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => copy(id)}>
                Copy
              </button>
            </div>
          ))}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px' }}>
            Generated using the Web Crypto API — never transmitted or stored.
          </p>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Integers',       desc: 'whole numbers' },
  { label: 'Decimals',       desc: 'floating point' },
  { label: 'List / Shuffle', desc: 'pick from items' },
  { label: 'Password',       desc: 'secure strings' },
  { label: 'UUID / Token',   desc: 'IDs & hex tokens' },
];

export default function RandomNumberGenerator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Random Number Generator</span>
          </div>
          <h1>Random Number Generator</h1>
          <p className="subtitle">
            Generate random integers, decimals, list picks, secure passwords, and UUIDs — all using your browser's cryptographic random source.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          {mode === 0 && <IntegerMode />}
          {mode === 1 && <DecimalMode />}
          {mode === 2 && <ListMode />}
          {mode === 3 && <PasswordMode />}
          {mode === 4 && <UUIDMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>About This Random Number Generator</h2>
          <p>
            This free random number generator runs entirely in your browser using the <strong>Web Crypto API</strong> (<code>crypto.getRandomValues</code>) — a cryptographically secure random source built into every modern browser. Unlike pseudo-random generators (PRNG) based on a predictable seed, the Web Crypto API produces numbers that are genuinely unpredictable and suitable for security-sensitive applications.
          </p>
          <p>
            <strong>Integers</strong> generates whole numbers in any range — from a single dice roll to thousands of lottery-style draws. The "no duplicates" option uses a cryptographic Fisher-Yates shuffle to guarantee uniqueness without bias. <strong>Decimals</strong> produces floating-point numbers with up to 15 decimal places, useful for probability simulations and statistics.
          </p>
          <p>
            <strong>List / Shuffle</strong> picks random items from any custom list — names, options, weekdays, teams — or shuffles the entire list for randomised ordering. Enter items one per line or comma-separated. <strong>Password</strong> generates secure random strings with full control over character types (uppercase, lowercase, digits, symbols) and guaranteed inclusion of each selected type. Passwords are generated entirely client-side and never leave your device.
          </p>
          <p>
            <strong>UUID / Token</strong> creates RFC 4122 compliant UUID v4 identifiers and hex or Base64 tokens for use as database IDs, API keys, nonces, and session tokens. All generation happens locally in your browser — nothing is logged or transmitted.
          </p>
        </div>

        {/* Use cases */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Use Cases</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {[
              { label: 'Dice roll',         value: '1–6',          sub: 'single integer' },
              { label: 'Lottery pick',      value: '6 from 1–49',  sub: 'unique integers' },
              { label: 'Coin flip',         value: 'Heads / Tails', sub: 'list pick' },
              { label: 'Strong password',   value: '16 chars',     sub: 'all character types' },
              { label: 'Database UUID',     value: 'v4 UUID',      sub: 'RFC 4122' },
              { label: 'API token',         value: '32-char hex',  sub: '16 random bytes' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div className="stat-value" style={{ fontSize: '1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="random-number-generator" />
      </div>
    </div>
  );
}
