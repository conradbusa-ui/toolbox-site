import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core conversion functions ─────────────────────────────────

function isValidBin(s) { return /^-?[01]+$/.test(s.trim()); }
function isValidOct(s) { return /^-?[0-7]+$/.test(s.trim()); }
function isValidHex(s) { return /^-?[0-9a-fA-F]+$/.test(s.trim()); }
function isValidDec(s) { return /^-?\d+$/.test(s.trim()); }

function binToDec(bin) {
  const neg = bin.startsWith('-');
  const abs = neg ? bin.slice(1) : bin;
  const val = parseInt(abs, 2);
  return neg ? -val : val;
}

function decToBin(dec) {
  if (dec === 0) return '0';
  const neg = dec < 0;
  return (neg ? '-' : '') + Math.abs(dec).toString(2);
}

function decToOct(dec) {
  if (dec === 0) return '0';
  const neg = dec < 0;
  return (neg ? '-' : '') + Math.abs(dec).toString(8);
}

function decToHex(dec) {
  if (dec === 0) return '0';
  const neg = dec < 0;
  return (neg ? '-' : '') + Math.abs(dec).toString(16).toUpperCase();
}

function formatBin(bin, bits = 8) {
  // Pad to multiple of 4 for readability, group by 4
  const neg = bin.startsWith('-');
  const abs = neg ? bin.slice(1) : bin;
  const padded = abs.padStart(Math.ceil(abs.length / 4) * 4, '0');
  const groups = padded.match(/.{1,4}/g) || [padded];
  return (neg ? '-' : '') + groups.join(' ');
}

// ── Bitwise operations ────────────────────────────────────────

function bitwiseOp(a, b, op) {
  switch (op) {
    case 'AND':  return a & b;
    case 'OR':   return a | b;
    case 'XOR':  return a ^ b;
    case 'NAND': return ~(a & b);
    case 'NOR':  return ~(a | b);
    case 'XNOR': return ~(a ^ b);
    default:     return null;
  }
}

function shiftOp(a, n, op) {
  switch (op) {
    case 'LEFT':  return a << n;
    case 'RIGHT': return a >> n;
    case 'URIGHT':return a >>> n;
    default:      return null;
  }
}

// ── Binary arithmetic ─────────────────────────────────────────

function binaryArith(a, b, op) {
  switch (op) {
    case 'ADD': return a + b;
    case 'SUB': return a - b;
    case 'MUL': return a * b;
    case 'DIV': return b !== 0 ? Math.trunc(a / b) : null;
    case 'MOD': return b !== 0 ? a % b : null;
    default:    return null;
  }
}

// Two's complement representation
function twosComplement(n, bits = 8) {
  if (n >= 0) return n.toString(2).padStart(bits, '0');
  return (Math.pow(2, bits) + n).toString(2);
}

// Ones complement
function onesComplement(n, bits = 8) {
  const bin = n.toString(2).padStart(bits, '0');
  return bin.split('').map(b => b === '0' ? '1' : '0').join('');
}

// Count set bits (population count)
function popCount(n) {
  let count = 0;
  let v = Math.abs(n);
  while (v > 0) { count += v & 1; v >>= 1; }
  return count;
}

function fmt(n) {
  return isFinite(n) && !isNaN(n) ? n.toString() : '—';
}

// ── Shared UI ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '26px', marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true); setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="btn btn-ghost btn-sm"
      style={{ padding: '3px 10px', fontSize: '0.72rem', marginLeft: '8px' }}>
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

// ── Base display row ──────────────────────────────────────────

function BaseRow({ label, value, color, mono = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <span style={{
          flex: '0 0 32px', fontSize: '0.68rem', fontWeight: 700,
          color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{label}</span>
        <span style={{
          fontFamily: mono ? 'var(--mono)' : 'var(--font)',
          fontWeight: 700, fontSize: '1rem', color: color || 'var(--accent-hover)',
          wordBreak: 'break-all',
        }}>{value}</span>
      </div>
      <CopyBtn text={value} />
    </div>
  );
}

// ── Mode 1: Base Converter ────────────────────────────────────

function BaseConverterMode() {
  const [input,    setInput]    = useState('');
  const [fromBase, setFromBase] = useState('bin');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const BASE_OPTIONS = [
    { id: 'bin', label: 'Binary (base 2)',      placeholder: 'e.g. 1010' },
    { id: 'oct', label: 'Octal (base 8)',       placeholder: 'e.g. 12'   },
    { id: 'dec', label: 'Decimal (base 10)',    placeholder: 'e.g. 42'   },
    { id: 'hex', label: 'Hexadecimal (base 16)',placeholder: 'e.g. 2A'   },
  ];

  function convert() {
    const s = input.trim();
    if (!s) { setError('Enter a value to convert.'); setResult(null); return; }

    let dec;
    if (fromBase === 'bin') {
      if (!isValidBin(s)) { setError('Invalid binary value. Use only 0 and 1.'); setResult(null); return; }
      dec = binToDec(s);
    } else if (fromBase === 'oct') {
      if (!isValidOct(s)) { setError('Invalid octal value. Use digits 0–7.'); setResult(null); return; }
      dec = parseInt(s, 8);
    } else if (fromBase === 'dec') {
      if (!isValidDec(s)) { setError('Invalid decimal value.'); setResult(null); return; }
      dec = parseInt(s, 10);
    } else {
      if (!isValidHex(s)) { setError('Invalid hexadecimal value. Use digits 0–9 and A–F.'); setResult(null); return; }
      dec = parseInt(s, 16);
    }

    if (!isFinite(dec)) { setError('Value is too large to convert accurately.'); setResult(null); return; }

    const bin = decToBin(dec);
    const oct = decToOct(dec);
    const hex = decToHex(dec);

    // Bit info
    const bitLength   = Math.abs(dec) === 0 ? 1 : Math.floor(Math.log2(Math.abs(dec))) + 1;
    const bits8       = twosComplement(dec, 8);
    const bits16      = twosComplement(dec, 16);
    const ones        = onesComplement(Math.abs(dec), Math.max(8, bitLength));
    const setBits     = popCount(dec);
    const groupedBin  = formatBin(bin.replace('-',''));

    setResult({ dec, bin, oct, hex, bitLength, bits8, bits16, ones, setBits, groupedBin });
    setError('');
  }

  const currentOption = BASE_OPTIONS.find(b => b.id === fromBase);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Convert any number between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16).
      </p>

      {/* Base selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {BASE_OPTIONS.map(b => (
          <button key={b.id}
            className={`tag${fromBase === b.id ? ' active' : ''}`}
            onClick={() => { setFromBase(b.id); setResult(null); setError(''); }}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="form-group">
        <label>Value ({currentOption?.label})</label>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && convert()}
          placeholder={currentOption?.placeholder}
          style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', textTransform: fromBase === 'hex' ? 'uppercase' : 'none' }}
        />
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quick values</p>
        <div className="tag-row">
          {fromBase === 'dec' && [0, 1, 8, 10, 16, 42, 100, 255, 256, 1024].map(n => (
            <button key={n} className="tag" onClick={() => { setInput(String(n)); setResult(null); setError(''); }}>{n}</button>
          ))}
          {fromBase === 'bin' && ['0', '1', '1010', '1111', '10000', '11111111'].map(n => (
            <button key={n} className="tag" onClick={() => { setInput(n); setResult(null); setError(''); }}>{n}</button>
          ))}
          {fromBase === 'hex' && ['0', 'A', 'F', '1F', 'FF', '100', 'DEAD', 'FFFF'].map(n => (
            <button key={n} className="tag" onClick={() => { setInput(n); setResult(null); setError(''); }}>{n}</button>
          ))}
          {fromBase === 'oct' && ['0', '7', '10', '17', '77', '100', '377'].map(n => (
            <button key={n} className="tag" onClick={() => { setInput(n); setResult(null); setError(''); }}>{n}</button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={convert}>Convert</button>
        <button className="btn btn-ghost" onClick={() => { setInput(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <SectionTitle>Conversions</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <BaseRow label="BIN" value={result.groupedBin} color="#0d9488" />
            <BaseRow label="OCT" value={result.oct}        color="#7c3aed" />
            <BaseRow label="DEC" value={String(result.dec)} color="#0891b2" />
            <BaseRow label="HEX" value={result.hex}        color="#dc2626" />
          </div>

          {/* Bit representation */}
          <SectionTitle>Bit representation</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '8px' }}>
              {[
                { label: 'Bit length',  value: result.bitLength },
                { label: 'Set bits',    value: result.setBits   },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent-hover)' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <BaseRow label="8b"  value={result.bits8}  color="#f59e0b" />
            <BaseRow label="16b" value={result.bits16} color="#f59e0b" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Bitwise Operations ────────────────────────────────

function BitwiseMode() {
  const [inputA,   setInputA]   = useState('');
  const [inputB,   setInputB]   = useState('');
  const [fromBase, setFromBase] = useState('bin');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const OPS = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR', 'NOT A'];

  function parseVal(s, base) {
    const t = s.trim();
    if (!t) return null;
    if (base === 'bin') { if (!isValidBin(t)) return NaN; return binToDec(t); }
    if (base === 'oct') { if (!isValidOct(t)) return NaN; return parseInt(t, 8); }
    if (base === 'dec') { if (!isValidDec(t)) return NaN; return parseInt(t, 10); }
    if (base === 'hex') { if (!isValidHex(t)) return NaN; return parseInt(t, 16); }
    return null;
  }

  function calculate() {
    const a = parseVal(inputA, fromBase);
    const b = parseVal(inputB, fromBase);

    if (a === null || isNaN(a)) { setError(`Invalid ${fromBase.toUpperCase()} value for A.`); setResult(null); return; }

    const results = {};
    OPS.forEach(op => {
      if (op === 'NOT A') {
        results[op] = ~a;
      } else {
        if (b === null || isNaN(b)) return;
        results[op] = bitwiseOp(a, b, op);
      }
    });

    if (b === null || isNaN(b)) {
      // Only NOT A
      const notA = ~a;
      setResult({ a, b: null, ops: { 'NOT A': notA }, fromBase });
    } else {
      setResult({ a, b, ops: results, fromBase });
    }
    setError('');
  }

  function toBase(n, base) {
    if (base === 'bin') return decToBin(n);
    if (base === 'oct') return decToOct(n);
    if (base === 'dec') return String(n);
    if (base === 'hex') return decToHex(n);
    return String(n);
  }

  const BASE_OPTS = ['bin','oct','dec','hex'];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Perform AND, OR, XOR, NAND, NOR, XNOR, and NOT on two values. Results shown in all bases simultaneously.
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {BASE_OPTS.map(b => (
          <button key={b} className={`tag${fromBase === b ? ' active' : ''}`}
            onClick={() => { setFromBase(b); setResult(null); setError(''); }}
            style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {b.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Operand A ({fromBase.toUpperCase()})</label>
          <input type="text" value={inputA}
            onChange={e => { setInputA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={fromBase === 'bin' ? 'e.g. 1010' : fromBase === 'hex' ? 'e.g. 0F' : 'e.g. 10'}
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Operand B ({fromBase.toUpperCase()}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional for NOT</span></label>
          <input type="text" value={inputB}
            onChange={e => { setInputB(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={fromBase === 'bin' ? 'e.g. 0110' : fromBase === 'hex' ? 'e.g. 03' : 'e.g. 6'}
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setInputA(''); setInputB(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          {/* Input display */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '2px' }}>A</div>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#0d9488' }}>{toBase(result.a, 'bin')} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({result.a})</span></div>
            </div>
            {result.b !== null && (
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '2px' }}>B</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#7c3aed' }}>{toBase(result.b, 'bin')} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({result.b})</span></div>
              </div>
            )}
          </div>

          {/* Results table */}
          <SectionTitle>Operation results</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Operation', 'Binary', 'Decimal', 'Hex'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.ops).map(([op, val], i) => (
                  <tr key={op} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{op}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>{toBase(val, 'bin')}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{val}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#dc2626' }}>{toBase(val, 'hex')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Binary Arithmetic ─────────────────────────────────

function ArithmeticMode() {
  const [inputA,   setInputA]   = useState('');
  const [inputB,   setInputB]   = useState('');
  const [fromBase, setFromBase] = useState('bin');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  function parseVal(s, base) {
    const t = s.trim();
    if (!t) return null;
    if (base === 'bin') { if (!isValidBin(t)) return NaN; return binToDec(t); }
    if (base === 'oct') { if (!isValidOct(t)) return NaN; return parseInt(t, 8); }
    if (base === 'dec') { if (!isValidDec(t)) return NaN; return parseInt(t, 10); }
    if (base === 'hex') { if (!isValidHex(t)) return NaN; return parseInt(t, 16); }
    return null;
  }

  function calculate() {
    const a = parseVal(inputA, fromBase);
    const b = parseVal(inputB, fromBase);
    if (a === null || isNaN(a)) { setError(`Invalid ${fromBase.toUpperCase()} value for A.`); setResult(null); return; }
    if (b === null || isNaN(b)) { setError(`Invalid ${fromBase.toUpperCase()} value for B.`); setResult(null); return; }

    const ops = {
      'A + B': binaryArith(a, b, 'ADD'),
      'A − B': binaryArith(a, b, 'SUB'),
      'A × B': binaryArith(a, b, 'MUL'),
      'A ÷ B': binaryArith(a, b, 'DIV'),
      'A mod B': binaryArith(a, b, 'MOD'),
    };

    setResult({ a, b, ops, fromBase });
    setError('');
  }

  function toBase(n, base) {
    if (n === null) return 'undefined (div by 0)';
    if (base === 'bin') return decToBin(n);
    if (base === 'oct') return decToOct(n);
    if (base === 'dec') return String(n);
    if (base === 'hex') return decToHex(n);
    return String(n);
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Add, subtract, multiply, divide, and mod two numbers in binary, octal, decimal, or hex. Results shown in all bases.
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {['bin','oct','dec','hex'].map(b => (
          <button key={b} className={`tag${fromBase === b ? ' active' : ''}`}
            onClick={() => { setFromBase(b); setResult(null); setError(''); }}
            style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {b.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Value A ({fromBase.toUpperCase()})</label>
          <input type="text" value={inputA}
            onChange={e => { setInputA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={fromBase === 'bin' ? '1010' : fromBase === 'hex' ? 'FF' : '10'}
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Value B ({fromBase.toUpperCase()})</label>
          <input type="text" value={inputB}
            onChange={e => { setInputB(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={fromBase === 'bin' ? '0011' : fromBase === 'hex' ? '0F' : '3'}
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setInputA(''); setInputB(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div><div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '2px' }}>A</div><div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#0d9488' }}>{decToBin(result.a)} ({result.a})</div></div>
            <div><div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '2px' }}>B</div><div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#7c3aed' }}>{decToBin(result.b)} ({result.b})</div></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Operation', 'Binary', 'Octal', 'Decimal', 'Hex'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.ops).map(([op, val], i) => (
                  <tr key={op} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{op}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.82rem', color: val === null ? 'var(--text-3)' : 'var(--text)' }}>{val === null ? '—' : toBase(val,'bin')}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: val === null ? 'var(--text-3)' : '#7c3aed' }}>{val === null ? '—' : toBase(val,'oct')}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600, color: val === null ? '#dc2626' : 'var(--text)' }}>{val === null ? 'div by 0' : toBase(val,'dec')}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: val === null ? 'var(--text-3)' : '#dc2626' }}>{val === null ? '—' : toBase(val,'hex')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Bit Shift ─────────────────────────────────────────

function BitShiftMode() {
  const [inputVal, setInputVal] = useState('');
  const [shiftN,   setShiftN]   = useState('1');
  const [fromBase, setFromBase] = useState('bin');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  function parseVal(s, base) {
    const t = s.trim();
    if (!t) return null;
    if (base === 'bin') { if (!isValidBin(t)) return NaN; return binToDec(t); }
    if (base === 'oct') { if (!isValidOct(t)) return NaN; return parseInt(t, 8); }
    if (base === 'dec') { if (!isValidDec(t)) return NaN; return parseInt(t, 10); }
    if (base === 'hex') { if (!isValidHex(t)) return NaN; return parseInt(t, 16); }
    return null;
  }

  function calculate() {
    const val = parseVal(inputVal, fromBase);
    const n   = parseInt(shiftN);
    if (val === null || isNaN(val)) { setError(`Invalid ${fromBase.toUpperCase()} value.`); setResult(null); return; }
    if (isNaN(n) || n < 0 || n > 31) { setError('Shift amount must be 0–31.'); setResult(null); return; }

    const left   = shiftOp(val, n, 'LEFT');
    const right  = shiftOp(val, n, 'RIGHT');
    const uright = shiftOp(val, n, 'URIGHT');

    setResult({ val, n, left, right, uright });
    setError('');
  }

  function toBin(n) { return decToBin(n >>> 0); } // treat as unsigned 32-bit

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Apply left shift, arithmetic right shift, and logical (unsigned) right shift to any value.
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {['bin','dec','hex'].map(b => (
          <button key={b} className={`tag${fromBase === b ? ' active' : ''}`}
            onClick={() => { setFromBase(b); setResult(null); setError(''); }}
            style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {b.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Value ({fromBase.toUpperCase()})</label>
          <input type="text" value={inputVal}
            onChange={e => { setInputVal(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={fromBase === 'bin' ? 'e.g. 1000' : fromBase === 'hex' ? 'e.g. FF' : 'e.g. 8'}
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group" style={{ flex: '0 0 140px' }}>
          <label>Shift by (bits)</label>
          <input type="number" value={shiftN} min="0" max="31"
            onChange={e => { setShiftN(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="1" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Shift</button>
        <button className="btn btn-ghost" onClick={() => { setInputVal(''); setShiftN('1'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: `Original`,                      val: result.val,   op: '' },
              { label: `Left shift (<<${result.n})`,    val: result.left,  op: '×2ⁿ' },
              { label: `Right shift (>>${result.n})`,   val: result.right, op: '÷2ⁿ (signed)' },
              { label: `Unsigned right (>>>${result.n})`,val: result.uright,op: '÷2ⁿ (unsigned)' },
            ].map(r => (
              <div key={r.label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)' }}>{r.label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{r.op}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-hover)' }}>
                  {decToBin(r.val)} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>= {r.val} (dec) = {decToHex(r.val)} (hex)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Base Converter', desc: 'BIN ↔ OCT ↔ DEC ↔ HEX' },
  { label: 'Bitwise Ops',   desc: 'AND, OR, XOR, NOT…'      },
  { label: 'Arithmetic',    desc: 'add, sub, mul, div'       },
  { label: 'Bit Shift',     desc: '<<  >>  >>>'              },
];

export default function BinaryCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Binary Calculator</span>
          </div>
          <h1>Binary Calculator</h1>
          <p className="subtitle">
            Convert between binary, octal, decimal, and hexadecimal — perform bitwise operations, binary arithmetic, and bit shifts — all in your browser.
          </p>
        </div>

        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {mode === 0 && <BaseConverterMode />}
          {mode === 1 && <BitwiseMode />}
          {mode === 2 && <ArithmeticMode />}
          {mode === 3 && <BitShiftMode />}
        </div>

        <div className="seo-content">
          <h2>How to Use the Binary Calculator</h2>
          <p>
            Binary (base 2) is the number system that all digital computers use internally. Understanding binary, hexadecimal, and bitwise operations is essential for programming, computer science, networking, and electronics.
          </p>
          <p>
            <strong>Base Converter</strong> converts any integer between the four most common number bases: binary (base 2, digits 0–1), octal (base 8, digits 0–7), decimal (base 10, digits 0–9), and hexadecimal (base 16, digits 0–9 and A–F). It also shows the 8-bit and 16-bit two's complement representations — the way signed integers are stored in computer memory — along with the bit count and number of set bits (population count).
          </p>
          <p>
            <strong>Bitwise Operations</strong> perform the fundamental logic gates on individual bits: AND (both bits must be 1), OR (at least one bit is 1), XOR (exactly one bit is 1), NAND, NOR, XNOR, and NOT (flip all bits). These operations underlie everything from CPU instructions to hash functions, encryption, and graphics rendering. Results are shown in binary, decimal, and hex simultaneously.
          </p>
          <p>
            <strong>Binary Arithmetic</strong> performs addition, subtraction, multiplication, integer division, and modulo on values entered in any base. This is useful for verifying manual binary arithmetic or checking results when working with bit-level programming.
          </p>
          <p>
            <strong>Bit Shift</strong> applies left shift ({'<<'}), arithmetic right shift ({'>>'}, sign-preserving), and logical right shift ({'>>>'}). Shifting left by n is equivalent to multiplying by 2ⁿ; shifting right by n is equivalent to integer division by 2ⁿ. Bit shifting is a performance-critical operation in embedded systems, cryptography, and low-level programming.
          </p>
        </div>

        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Binary Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '42 in binary',              value: '101010',      sub: '32+8+2 = 42' },
              { label: '255 in hex',                value: 'FF',          sub: '1111 1111 binary' },
              { label: '1010 AND 1100 (binary)',     value: '1000',        sub: '8 decimal' },
              { label: '1010 XOR 1100 (binary)',     value: '0110',        sub: '6 decimal' },
              { label: '8 << 2 (left shift)',        value: '32',          sub: '1000 → 100000' },
              { label: '0xDEAD in decimal',          value: '57005',       sub: 'hex to dec' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="binary-calculator" />
      </div>
    </div>
  );
}
