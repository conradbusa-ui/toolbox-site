import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Matrix helpers ────────────────────────────────────────────

function makeMatrix(rows, cols, fill = '') {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function cloneMatrix(m) {
  return m.map(row => [...row]);
}

function parseMatrix(m) {
  return m.map(row => row.map(v => parseFloat(v)));
}

function isValid(m) {
  return m.every(row => row.every(v => !isNaN(v)));
}

function fmt(n, dp = 4) {
  if (!isFinite(n) || isNaN(n)) return '—';
  const r = parseFloat(n.toFixed(dp));
  return Object.is(r, -0) ? '0' : String(r);
}

// ── Core operations ───────────────────────────────────────────

function matAdd(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) return null;
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

function matSub(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) return null;
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

function matMul(A, B) {
  const rA = A.length, cA = A[0].length, cB = B[0].length;
  if (cA !== B.length) return null;
  return Array.from({ length: rA }, (_, i) =>
    Array.from({ length: cB }, (_, j) =>
      A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)
    )
  );
}

function matScalar(A, k) {
  return A.map(row => row.map(v => v * k));
}

function matTranspose(A) {
  return A[0].map((_, j) => A.map(row => row[j]));
}

// Determinant (recursive cofactor expansion)
function matDet(A) {
  const n = A.length;
  if (A.some(row => row.length !== n)) return null;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = A.slice(1).map(row => row.filter((_, c) => c !== j));
    det += Math.pow(-1, j) * A[0][j] * matDet(minor);
  }
  return det;
}

// Inverse using Gauss-Jordan elimination
function matInverse(A) {
  const n = A.length;
  if (A.some(row => row.length !== n)) return null;
  const det = matDet(A);
  if (Math.abs(det) < 1e-12) return null; // singular

  // Augment with identity
  const aug = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0),
  ]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) return null;

    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  return aug.map(row => row.slice(n));
}

// Trace (sum of diagonal)
function matTrace(A) {
  const n = Math.min(A.length, A[0].length);
  let t = 0;
  for (let i = 0; i < n; i++) t += A[i][i];
  return t;
}

// Rank via row reduction
function matRank(A) {
  const m = cloneMatrix(A);
  const rows = m.length, cols = m[0].length;
  let rank = 0;
  for (let col = 0; col < cols && rank < rows; col++) {
    let pivotRow = -1;
    for (let row = rank; row < rows; row++) {
      if (Math.abs(m[row][col]) > 1e-12) { pivotRow = row; break; }
    }
    if (pivotRow < 0) continue;
    [m[rank], m[pivotRow]] = [m[pivotRow], m[rank]];
    const pivot = m[rank][col];
    for (let j = 0; j < cols; j++) m[rank][j] /= pivot;
    for (let row = 0; row < rows; row++) {
      if (row === rank) continue;
      const factor = m[row][col];
      for (let j = 0; j < cols; j++) m[row][j] -= factor * m[rank][j];
    }
    rank++;
  }
  return rank;
}

// Power A^n (integer)
function matPow(A, n) {
  if (n === 0) return A.map((_, i) => A[0].map((_, j) => i === j ? 1 : 0));
  if (n === 1) return cloneMatrix(A);
  if (n < 0) {
    const inv = matInverse(A);
    if (!inv) return null;
    return matPow(inv, -n);
  }
  let result = A.map((_, i) => A[0].map((_, j) => i === j ? 1 : 0)); // identity
  let base    = cloneMatrix(A);
  let exp     = n;
  while (exp > 0) {
    if (exp % 2 === 1) result = matMul(result, base);
    base = matMul(base, base);
    exp  = Math.floor(exp / 2);
  }
  return result;
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
  return (
    <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>
  );
}

// ── Matrix input grid ─────────────────────────────────────────

function MatrixInput({ label, matrix, onChange, rows, cols, onResize, color = 'var(--accent)' }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '99px',
          background: `${color}18`, border: `1px solid ${color}`,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.88rem', color }}>{label}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            {rows}×{cols}
          </span>
        </div>
        {onResize && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[
              { label: 'rows', val: rows, set: r => onResize(r, cols), min: 1, max: 5 },
              { label: 'cols', val: cols, set: c => onResize(rows, c), min: 1, max: 5 },
            ].map(ctrl => (
              <div key={ctrl.label} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginRight: '2px' }}>{ctrl.label}</span>
                <button onClick={() => ctrl.set(Math.max(ctrl.min, ctrl.val - 1))}
                  style={{ width: 22, height: 22, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface2)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1 }}>−</button>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.82rem', minWidth: '14px', textAlign: 'center' }}>{ctrl.val}</span>
                <button onClick={() => ctrl.set(Math.min(ctrl.max, ctrl.val + 1))}
                  style={{ width: 22, height: 22, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface2)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1 }}>+</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${cols}, auto)`,
        gap: '4px',
        background: 'var(--surface2)',
        border: `1px solid ${color}40`,
        borderRadius: 'var(--radius-sm)',
        padding: '10px',
      }}>
        {matrix.map((row, i) =>
          row.map((val, j) => (
            <input
              key={`${i}-${j}`}
              type="number"
              value={val}
              onChange={e => onChange(i, j, e.target.value)}
              style={{
                width: '58px',
                fontFamily: 'var(--mono)',
                fontSize: '0.9rem',
                textAlign: 'center',
                padding: '5px 4px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Matrix result display ─────────────────────────────────────

function MatrixResult({ label, matrix, color = 'var(--accent-hover)' }) {
  const [copied, setCopied] = useState(false);

  function copyMatrix() {
    const text = matrix.map(row => row.map(v => fmt(v)).join('\t')).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.88rem', color }}>{label}</span>
        <button onClick={copyMatrix} className="btn btn-ghost btn-sm" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${matrix[0].length}, auto)`,
        gap: '4px',
        background: `${color}10`,
        border: `1px solid ${color}40`,
        borderRadius: 'var(--radius-sm)',
        padding: '10px',
      }}>
        {matrix.map((row, i) =>
          row.map((val, j) => (
            <div key={`${i}-${j}`} style={{
              minWidth: '64px', height: '32px',
              fontFamily: 'var(--mono)', fontSize: '0.88rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 4, color,
            }}>
              {fmt(val)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Scalar result ─────────────────────────────────────────────

function ScalarResult({ label, value, color = 'var(--accent-hover)' }) {
  return (
    <div style={{
      background: 'var(--accent-light)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-sm)', padding: '12px 18px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color }}>{fmt(value)}</span>
    </div>
  );
}

// ── Mode 1: Binary operations (A op B) ───────────────────────

function BinaryMode() {
  const [rowsA, setRowsA] = useState(2);
  const [colsA, setColsA] = useState(2);
  const [rowsB, setRowsB] = useState(2);
  const [colsB, setColsB] = useState(2);
  const [matA,  setMatA]  = useState(makeMatrix(2, 2, ''));
  const [matB,  setMatB]  = useState(makeMatrix(2, 2, ''));
  const [op,    setOp]    = useState('add');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  function updateA(i, j, val) { setMatA(prev => { const m = cloneMatrix(prev); m[i][j] = val; return m; }); setResult(null); }
  function updateB(i, j, val) { setMatB(prev => { const m = cloneMatrix(prev); m[i][j] = val; return m; }); setResult(null); }

  function resizeA(r, c) {
    setRowsA(r); setColsA(c);
    setMatA(prev => {
      const m = makeMatrix(r, c, '');
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[0]?.length || 0); j++)
          m[i][j] = prev[i][j];
      return m;
    });
    setResult(null);
  }

  function resizeB(r, c) {
    setRowsB(r); setColsB(c);
    setMatB(prev => {
      const m = makeMatrix(r, c, '');
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[0]?.length || 0); j++)
          m[i][j] = prev[i][j];
      return m;
    });
    setResult(null);
  }

  function calculate() {
    const A = parseMatrix(matA), B = parseMatrix(matB);
    if (!isValid(A)) { setError('Matrix A contains invalid values.'); setResult(null); return; }
    if (!isValid(B)) { setError('Matrix B contains invalid values.'); setResult(null); return; }

    let res;
    if (op === 'add') {
      res = matAdd(A, B);
      if (!res) { setError(`Cannot add: A is ${rowsA}×${colsA} but B is ${rowsB}×${colsB}. Dimensions must match.`); setResult(null); return; }
    } else if (op === 'sub') {
      res = matSub(A, B);
      if (!res) { setError(`Cannot subtract: dimensions must match.`); setResult(null); return; }
    } else if (op === 'mul') {
      res = matMul(A, B);
      if (!res) { setError(`Cannot multiply: A columns (${colsA}) must equal B rows (${rowsB}).`); setResult(null); return; }
    }

    setResult(res);
    setError('');
  }

  const OP_LABELS = { add: 'A + B', sub: 'A − B', mul: 'A × B' };

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Perform addition, subtraction, or multiplication between two matrices of any compatible size (up to 5×5).
      </p>

      {/* Operation selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(OP_LABELS).map(([key, label]) => (
          <button key={key} className={`tag${op === key ? ' active' : ''}`}
            style={{ minWidth: '80px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.9rem' }}
            onClick={() => { setOp(key); setResult(null); setError(''); }}>
            {label}
          </button>
        ))}
      </div>

      {/* Matrices side by side */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <MatrixInput label="A" matrix={matA} onChange={updateA} rows={rowsA} cols={colsA} onResize={resizeA} color="#0d9488" />
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '36px', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
          {op === 'add' ? '+' : op === 'sub' ? '−' : '×'}
        </div>
        <MatrixInput label="B" matrix={matB} onChange={updateB} rows={rowsB} cols={colsB} onResize={resizeB} color="#7c3aed" />
      </div>

      <div className="btn-group" style={{ marginTop: '16px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setMatA(makeMatrix(rowsA, colsA, '')); setMatB(makeMatrix(rowsB, colsB, '')); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Result: {OP_LABELS[op]}</SectionTitle>
          <MatrixResult label={`= ${OP_LABELS[op]}`} matrix={result} />
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Single matrix operations ─────────────────────────

function UnaryMode() {
  const [rows,   setRows]   = useState(3);
  const [cols,   setCols]   = useState(3);
  const [mat,    setMat]    = useState(makeMatrix(3, 3, ''));
  const [op,     setOp]     = useState('transpose');
  const [scalar, setScalar] = useState('2');
  const [power,  setPower]  = useState('2');
  const [result, setResult] = useState(null);
  const [scalarResult, setScalarResult] = useState(null);
  const [error,  setError]  = useState('');

  function update(i, j, val) { setMat(prev => { const m = cloneMatrix(prev); m[i][j] = val; return m; }); setResult(null); setScalarResult(null); }

  function resize(r, c) {
    setRows(r); setCols(c);
    setMat(prev => {
      const m = makeMatrix(r, c, '');
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[0]?.length || 0); j++)
          m[i][j] = prev[i][j];
      return m;
    });
    setResult(null); setScalarResult(null);
  }

  function calculate() {
    const A = parseMatrix(mat);
    if (!isValid(A)) { setError('Matrix contains invalid values.'); setResult(null); setScalarResult(null); return; }

    setResult(null); setScalarResult(null);

    if (op === 'transpose') {
      setResult(matTranspose(A));
    } else if (op === 'scalar') {
      const k = parseFloat(scalar);
      if (isNaN(k)) { setError('Enter a valid scalar.'); return; }
      setResult(matScalar(A, k));
    } else if (op === 'det') {
      if (rows !== cols) { setError('Determinant requires a square matrix.'); return; }
      if (rows > 5)      { setError('Determinant is supported for matrices up to 5×5.'); return; }
      const det = matDet(A);
      setScalarResult({ label: 'Determinant |A|', value: det });
    } else if (op === 'inverse') {
      if (rows !== cols) { setError('Inverse requires a square matrix.'); return; }
      const inv = matInverse(A);
      if (!inv) { setError('This matrix is singular (determinant = 0) — no inverse exists.'); return; }
      setResult(inv);
    } else if (op === 'trace') {
      if (rows !== cols) { setError('Trace requires a square matrix.'); return; }
      setScalarResult({ label: 'Trace (sum of diagonal)', value: matTrace(A) });
    } else if (op === 'rank') {
      setScalarResult({ label: 'Rank', value: matRank(A) });
    } else if (op === 'power') {
      if (rows !== cols) { setError('Matrix power requires a square matrix.'); return; }
      const p = parseInt(power);
      if (isNaN(p)) { setError('Enter a valid integer power.'); return; }
      if (Math.abs(p) > 10) { setError('Power must be between −10 and 10.'); return; }
      if (p < 0) {
        const inv = matInverse(A);
        if (!inv) { setError('Singular matrix — A^−n requires an invertible matrix.'); return; }
      }
      const res = matPow(A, p);
      if (!res) { setError('Could not compute matrix power.'); return; }
      setResult(res);
    }
    setError('');
  }

  const OPS = [
    { id: 'transpose', label: 'Transposᵀ',   note: 'flip rows/cols'     },
    { id: 'det',       label: 'Determinant',  note: 'scalar, square only' },
    { id: 'inverse',   label: 'Inverse A⁻¹', note: 'square, invertible'  },
    { id: 'trace',     label: 'Trace',        note: 'diagonal sum'        },
    { id: 'rank',      label: 'Rank',         note: 'row rank'            },
    { id: 'scalar',    label: 'Scalar ×',     note: 'multiply by k'       },
    { id: 'power',     label: 'Power Aⁿ',    note: 'integer exponent'    },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Apply a single operation to one matrix: transpose, determinant, inverse, trace, rank, scalar multiplication, or power.
      </p>

      {/* Op selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {OPS.map(o => (
          <button key={o.id} onClick={() => { setOp(o.id); setResult(null); setScalarResult(null); setError(''); }}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              border: `1.5px solid ${op === o.id ? 'var(--accent)' : 'var(--border)'}`,
              background: op === o.id ? 'var(--accent-light)' : 'var(--surface2)',
              transition: 'all 0.15s', textAlign: 'left',
            }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: op === o.id ? 'var(--accent-hover)' : 'var(--text)', fontFamily: 'var(--mono)' }}>{o.label}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '1px' }}>{o.note}</div>
          </button>
        ))}
      </div>

      {/* Extra inputs */}
      {op === 'scalar' && (
        <div className="form-group" style={{ maxWidth: '150px', marginBottom: '14px' }}>
          <label>Scalar (k)</label>
          <input type="number" value={scalar} onChange={e => { setScalar(e.target.value); setResult(null); }} style={{ fontFamily: 'var(--mono)' }} />
        </div>
      )}
      {op === 'power' && (
        <div className="form-group" style={{ maxWidth: '150px', marginBottom: '14px' }}>
          <label>Power (n)</label>
          <input type="number" value={power} onChange={e => { setPower(e.target.value); setResult(null); }} placeholder="e.g. 2" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      )}

      <MatrixInput label="A" matrix={mat} onChange={update} rows={rows} cols={cols} onResize={resize} />

      <div className="btn-group" style={{ marginTop: '16px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setMat(makeMatrix(rows, cols, '')); setResult(null); setScalarResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {scalarResult && !error && (
        <div style={{ marginTop: '20px' }}>
          <ScalarResult label={scalarResult.label} value={scalarResult.value} />
        </div>
      )}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Result</SectionTitle>
          <MatrixResult label="=" matrix={result} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Properties panel ──────────────────────────────────

function PropertiesMode() {
  const [rows,   setRows]   = useState(3);
  const [cols,   setCols]   = useState(3);
  const [mat,    setMat]    = useState(makeMatrix(3, 3, ''));
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  function update(i, j, val) { setMat(prev => { const m = cloneMatrix(prev); m[i][j] = val; return m; }); setResult(null); }

  function resize(r, c) {
    setRows(r); setCols(c);
    setMat(prev => {
      const m = makeMatrix(r, c, '');
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[0]?.length || 0); j++)
          m[i][j] = prev[i][j];
      return m;
    });
    setResult(null);
  }

  function analyse() {
    const A = parseMatrix(mat);
    if (!isValid(A)) { setError('Matrix contains invalid values.'); setResult(null); return; }

    const isSquare = rows === cols;
    const rank     = matRank(A);
    const trace    = isSquare ? matTrace(A) : null;
    const det      = isSquare && rows <= 5 ? matDet(A) : null;
    const isSingular   = det !== null ? Math.abs(det) < 1e-10 : null;
    const isIdentity   = isSquare && A.every((row, i) => row.every((v, j) => Math.abs(v - (i === j ? 1 : 0)) < 1e-10));
    const isSymmetric  = isSquare && A.every((row, i) => row.every((v, j) => Math.abs(v - A[j][i]) < 1e-10));
    const isDiagonal   = isSquare && A.every((row, i) => row.every((v, j) => i !== j ? Math.abs(v) < 1e-10 : true));
    const isZero       = A.every(row => row.every(v => Math.abs(v) < 1e-10));
    const isUpperTri   = isSquare && A.every((row, i) => row.every((v, j) => j < i ? Math.abs(v) < 1e-10 : true));
    const isLowerTri   = isSquare && A.every((row, i) => row.every((v, j) => j > i ? Math.abs(v) < 1e-10 : true));
    const frobNorm     = Math.sqrt(A.flat().reduce((s, v) => s + v * v, 0));

    setResult({ rank, trace, det, isSingular, isSquare, isIdentity, isSymmetric, isDiagonal, isZero, isUpperTri, isLowerTri, frobNorm, rows, cols });
    setError('');
  }

  const Badge = ({ label, val }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)', fontSize: '0.85rem',
    }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--mono)', fontWeight: 700,
        color: val === true ? '#16a34a' : val === false ? '#dc2626' : 'var(--accent-hover)',
      }}>
        {val === true ? 'Yes ✓' : val === false ? 'No' : fmt(val)}
      </span>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Analyse a matrix — compute all key properties including rank, determinant, trace, Frobenius norm, and structural checks.
      </p>

      <MatrixInput label="A" matrix={mat} onChange={update} rows={rows} cols={cols} onResize={resize} />

      <div className="btn-group" style={{ marginTop: '16px' }}>
        <button className="btn btn-primary" onClick={analyse}>Analyse matrix</button>
        <button className="btn btn-ghost" onClick={() => { setMat(makeMatrix(rows, cols, '')); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <SectionTitle>Matrix properties</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Badge label="Dimensions"       val={`${result.rows} × ${result.cols}`} />
            <Badge label="Rank"             val={result.rank} />
            {result.trace !== null && <Badge label="Trace"  val={result.trace} />}
            {result.det   !== null && <Badge label="Determinant" val={result.det} />}
            <Badge label="Frobenius norm"   val={result.frobNorm} />
            <Badge label="Square"           val={result.isSquare} />
            <Badge label="Invertible"       val={result.isSingular === null ? 'N/A (not square)' : !result.isSingular} />
            <Badge label="Identity matrix"  val={result.isSquare ? result.isIdentity : 'N/A'} />
            <Badge label="Symmetric"        val={result.isSquare ? result.isSymmetric : 'N/A'} />
            <Badge label="Diagonal"         val={result.isSquare ? result.isDiagonal : 'N/A'} />
            <Badge label="Upper triangular" val={result.isSquare ? result.isUpperTri : 'N/A'} />
            <Badge label="Lower triangular" val={result.isSquare ? result.isLowerTri : 'N/A'} />
            <Badge label="Zero matrix"      val={result.isZero} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'A op B',     desc: 'add, subtract, multiply' },
  { label: 'Single matrix', desc: 'inverse, det, transpose…' },
  { label: 'Properties', desc: 'analyse all properties'  },
];

export default function MatrixCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Matrix Calculator</span>
          </div>
          <h1>Matrix Calculator</h1>
          <p className="subtitle">
            Add, subtract, and multiply matrices, compute determinants, inverses, and transposes, and analyse matrix properties — all in your browser with support for matrices up to 5×5.
          </p>
        </div>

        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <BinaryMode />}
          {mode === 1 && <UnaryMode />}
          {mode === 2 && <PropertiesMode />}
        </div>

        <div className="seo-content">
          <h2>How to Use the Matrix Calculator</h2>
          <p>
            A matrix is a rectangular array of numbers arranged in rows and columns. Matrix algebra is foundational to linear algebra, computer graphics, machine learning, physics, and engineering. This calculator handles the most common matrix operations for matrices from 1×1 up to 5×5, entirely in your browser.
          </p>
          <p>
            <strong>A op B</strong> performs binary operations between two matrices. Matrix <strong>addition and subtraction</strong> require both matrices to have the same dimensions — each element is added or subtracted position by position. Matrix <strong>multiplication</strong> (A × B) requires the number of columns in A to equal the number of rows in B; the result has the same row count as A and column count as B. Note that matrix multiplication is generally not commutative: A × B ≠ B × A.
          </p>
          <p>
            <strong>Single matrix</strong> mode applies one operation to a single matrix. The <strong>transpose</strong> (Aᵀ) flips rows and columns. The <strong>determinant</strong> is a scalar value associated with a square matrix — it's zero if the matrix is singular (non-invertible) and non-zero if it's invertible. The <strong>inverse</strong> A⁻¹ satisfies A × A⁻¹ = I (identity matrix) and exists only when the determinant is non-zero. <strong>Scalar multiplication</strong> multiplies every element by a constant k. The <strong>trace</strong> is the sum of diagonal elements. <strong>Rank</strong> is the number of linearly independent rows (or columns).
          </p>
          <p>
            <strong>Properties</strong> mode analyses a matrix comprehensively — computing rank, determinant, trace, and Frobenius norm, and checking structural properties like symmetry, being diagonal, upper triangular, lower triangular, an identity matrix, or a zero matrix.
          </p>
        </div>

        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Matrix Operation Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '2×2 determinant [[1,2],[3,4]]',  value: '−2',      sub: '1×4 − 2×3 = −2' },
              { label: 'Inverse of identity matrix',      value: 'Identity', sub: 'I⁻¹ = I always' },
              { label: '2×3 × 3×2 multiplication',        value: '2×2 result', sub: 'inner dims must match' },
              { label: 'Symmetric matrix check',          value: 'A = Aᵀ',  sub: 'every element aᵢⱼ = aⱼᵢ' },
              { label: 'Rank of zero matrix',             value: '0',       sub: 'no independent rows' },
              { label: 'Trace of 3×3 identity',           value: '3',       sub: '1+1+1 diagonal sum' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="matrix-calculator" />
      </div>
    </div>
  );
}
