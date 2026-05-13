import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Unit helpers ──────────────────────────────────────────────

const UNIT_OPTIONS = ['m', 'cm', 'mm', 'ft', 'in', 'yd'];

function toM(val, unit) {
  const n = parseFloat(val);
  if (isNaN(n) || n <= 0) return null;
  switch (unit) {
    case 'm':  return n;
    case 'cm': return n / 100;
    case 'mm': return n / 1000;
    case 'ft': return n * 0.3048;
    case 'in': return n * 0.0254;
    case 'yd': return n * 0.9144;
    default:   return n;
  }
}

// Convert m² to display unit
function fromM2(m2, unit) {
  switch (unit) {
    case 'm²':   return m2;
    case 'cm²':  return m2 * 10000;
    case 'mm²':  return m2 * 1000000;
    case 'ft²':  return m2 * 10.7639;
    case 'in²':  return m2 * 1550.00;
    case 'yd²':  return m2 * 1.19599;
    case 'ac':   return m2 / 4046.86;
    case 'ha':   return m2 / 10000;
    default:     return m2;
  }
}

const AREA_UNITS = ['m²', 'cm²', 'ft²', 'yd²', 'ac', 'ha'];

function fmt(n, dp = 4) {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (n >= 1000) return parseFloat(n.toFixed(1)).toLocaleString();
  if (n >= 1)    return parseFloat(n.toFixed(dp > 2 ? 3 : dp)).toString();
  return parseFloat(n.toFixed(dp)).toString();
}

// ── Shape formulas (return m²) ────────────────────────────────

const SHAPES = {
  rectangle: {
    label: 'Rectangle',
    icon: '▬',
    desc: 'rooms, lots, fields',
    formula: 'A = length × width',
    fields: [
      { id: 'length', label: 'Length', placeholder: '5', unit: 'm' },
      { id: 'width',  label: 'Width',  placeholder: '4', unit: 'm' },
    ],
    calc: ({ length, width }) => {
      const l = length, w = width;
      if (!l || !w) return null;
      return l * w;
    },
    diagramColor: '#0d9488',
  },
  square: {
    label: 'Square',
    icon: '■',
    desc: 'tiles, plots, rooms',
    formula: 'A = side²',
    fields: [
      { id: 'side', label: 'Side length', placeholder: '4', unit: 'm' },
    ],
    calc: ({ side }) => side ? side * side : null,
    diagramColor: '#0891b2',
  },
  circle: {
    label: 'Circle',
    icon: '●',
    desc: 'pools, ponds, roundabouts',
    formula: 'A = π × r²',
    fields: [
      { id: 'radius', label: 'Radius', placeholder: '3', unit: 'm' },
    ],
    calc: ({ radius }) => radius ? Math.PI * radius * radius : null,
    diagramColor: '#7c3aed',
  },
  triangle: {
    label: 'Triangle',
    icon: '▲',
    desc: 'corner lots, roof sections',
    formula: 'A = ½ × base × height',
    fields: [
      { id: 'base',   label: 'Base',   placeholder: '6', unit: 'm' },
      { id: 'height', label: 'Height', placeholder: '4', unit: 'm' },
    ],
    calc: ({ base, height }) => (base && height) ? 0.5 * base * height : null,
    diagramColor: '#f59e0b',
  },
  trapezoid: {
    label: 'Trapezoid',
    icon: '⏢',
    desc: 'irregular lots, cross-sections',
    formula: 'A = ½ × (a + b) × height',
    fields: [
      { id: 'sideA',  label: 'Side a (top)',    placeholder: '3', unit: 'm' },
      { id: 'sideB',  label: 'Side b (bottom)', placeholder: '5', unit: 'm' },
      { id: 'height', label: 'Height',           placeholder: '4', unit: 'm' },
    ],
    calc: ({ sideA, sideB, height }) =>
      (sideA && sideB && height) ? 0.5 * (sideA + sideB) * height : null,
    diagramColor: '#dc2626',
  },
  ellipse: {
    label: 'Ellipse',
    icon: '⬭',
    desc: 'oval pools, gardens, tracks',
    formula: 'A = π × a × b',
    fields: [
      { id: 'semiA', label: 'Semi-axis a', placeholder: '5', unit: 'm' },
      { id: 'semiB', label: 'Semi-axis b', placeholder: '3', unit: 'm' },
    ],
    calc: ({ semiA, semiB }) =>
      (semiA && semiB) ? Math.PI * semiA * semiB : null,
    diagramColor: '#16a34a',
  },
  sector: {
    label: 'Sector',
    icon: '◔',
    desc: 'pie slices, curved sections',
    formula: 'A = ½ × r² × θ (radians)',
    fields: [
      { id: 'radius', label: 'Radius',     placeholder: '4',  unit: 'm'  },
      { id: 'angle',  label: 'Angle (°)',  placeholder: '90', unit: '°', noUnitSel: true },
    ],
    calc: ({ radius, angle }) =>
      (radius && angle) ? 0.5 * radius * radius * (angle * Math.PI / 180) : null,
    diagramColor: '#0891b2',
  },
  parallelogram: {
    label: 'Parallelogram',
    icon: '▱',
    desc: 'slanted fields, sections',
    formula: 'A = base × height',
    fields: [
      { id: 'base',   label: 'Base',   placeholder: '6', unit: 'm' },
      { id: 'height', label: 'Height', placeholder: '4', unit: 'm' },
    ],
    calc: ({ base, height }) => (base && height) ? base * height : null,
    diagramColor: '#f97316',
  },
  pentagon: {
    label: 'Pentagon',
    icon: '⬠',
    desc: 'regular 5-sided shapes',
    formula: 'A = (s² × √(25+10√5)) / 4',
    fields: [
      { id: 'side', label: 'Side length', placeholder: '5', unit: 'm' },
    ],
    calc: ({ side }) =>
      side ? (side * side * Math.sqrt(25 + 10 * Math.sqrt(5))) / 4 : null,
    diagramColor: '#7c3aed',
  },
  hexagon: {
    label: 'Hexagon',
    icon: '⬡',
    desc: 'regular 6-sided shapes',
    formula: 'A = (3√3 / 2) × s²',
    fields: [
      { id: 'side', label: 'Side length', placeholder: '4', unit: 'm' },
    ],
    calc: ({ side }) =>
      side ? (3 * Math.sqrt(3) / 2) * side * side : null,
    diagramColor: '#0d9488',
  },
  annulus: {
    label: 'Annulus (Ring)',
    icon: '◎',
    desc: 'ring paths, hollow circles',
    formula: 'A = π × (R² − r²)',
    fields: [
      { id: 'outerR', label: 'Outer radius R', placeholder: '5', unit: 'm' },
      { id: 'innerR', label: 'Inner radius r', placeholder: '3', unit: 'm' },
    ],
    calc: ({ outerR, innerR }) => {
      if (!outerR || !innerR) return null;
      if (innerR >= outerR) return 'error:inner >= outer';
      return Math.PI * (outerR * outerR - innerR * innerR);
    },
    diagramColor: '#dc2626',
  },
};

const SHAPE_KEYS = Object.keys(SHAPES);

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

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px',
      textAlign: 'center', flex: '1 1 120px', minWidth: '110px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

function UnitSel({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', width: '68px', padding: '4px 6px' }}>
      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  );
}

// ── All-units result row ──────────────────────────────────────

function AllUnitsRow({ m2 }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
      {AREA_UNITS.map(u => {
        const val = fromM2(m2, u);
        return (
          <div key={u} style={{
            flex: '1 1 100px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-hover)' }}>
              {fmt(val)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px', fontWeight: 600 }}>{u}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shape calculator ──────────────────────────────────────────

function ShapeCalc({ shapeKey }) {
  const shape = SHAPES[shapeKey];
  const [values, setValues] = useState({});
  const [units,  setUnits]  = useState(
    Object.fromEntries(shape.fields.map(f => [f.id, f.unit || 'm']))
  );
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');
  const [toast,  setToast]  = useState('');

  function setValue(id, val) {
    setValues(prev => ({ ...prev, [id]: val }));
    setResult(null); setError('');
  }
  function setUnit(id, u) {
    setUnits(prev => ({ ...prev, [id]: u }));
    setResult(null);
  }

  function calculate() {
    const converted = {};
    for (const f of shape.fields) {
      if (f.noUnitSel) {
        const n = parseFloat(values[f.id]);
        if (isNaN(n) || n <= 0) { setError(`Enter a valid ${f.label}.`); setResult(null); return; }
        converted[f.id] = n;
      } else {
        const m = toM(values[f.id], units[f.id]);
        if (!m) { setError(`Enter a valid ${f.label}.`); setResult(null); return; }
        converted[f.id] = m;
      }
    }

    const area = shape.calc(converted);
    if (area === null) { setError('Enter all required dimensions.'); setResult(null); return; }
    if (typeof area === 'string' && area.startsWith('error:')) {
      setError(area === 'error:inner >= outer'
        ? 'Inner radius must be smaller than outer radius.'
        : 'Invalid dimensions.'); setResult(null); return;
    }

    setResult({ m2: area, converted });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = AREA_UNITS.map(u => `${u}: ${fmt(fromM2(result.m2, u))}`).join('\n');
    navigator.clipboard.writeText(`${shape.label} area:\n${lines}`).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  function clear() {
    setValues({});
    setUnits(Object.fromEntries(shape.fields.map(f => [f.id, f.unit || 'm'])));
    setResult(null); setError('');
  }

  return (
    <div>
      {/* Formula badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', background: `${shape.diagramColor}18`, border: `1px solid ${shape.diagramColor}`, marginBottom: '16px' }}>
        <span style={{ fontSize: '1.1rem' }}>{shape.icon}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', fontWeight: 700, color: shape.diagramColor }}>{shape.formula}</span>
      </div>

      {/* Input fields */}
      <div className="form-row">
        {shape.fields.map(f => (
          <div key={f.id} className="form-group">
            <label>{f.label}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="number" value={values[f.id] || ''} min="0"
                onChange={e => setValue(f.id, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder={f.placeholder}
                style={{ flex: 1, fontFamily: 'var(--mono)' }} />
              {f.noUnitSel
                ? <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>°</span>
                : <UnitSel value={units[f.id]} onChange={u => setUnit(f.id, u)} />
              }
            </div>
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate area</button>
        <button className="btn btn-ghost" onClick={clear}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy all units</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          {/* Big result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              {shape.label} area
            </div>
            <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(result.m2, 4)} m²
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmt(fromM2(result.m2, 'ft²'), 2)} ft² &nbsp;·&nbsp; {fmt(fromM2(result.m2, 'cm²'), 0)} cm²
            </div>
          </div>

          <SectionTitle>All units</SectionTitle>
          <AllUnitsRow m2={result.m2} />
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function AreaCalculator() {
  const [activeShape, setActiveShape] = useState('rectangle');

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Area Calculator</span>
          </div>
          <h1>Area Calculator</h1>
          <p className="subtitle">
            Calculate the area of 11 shapes — rectangle, square, circle, triangle, trapezoid, ellipse, sector, parallelogram, pentagon, hexagon, and annulus — in any unit with instant conversion to m², ft², yd², acres, and hectares.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Shape selector grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: '6px', marginBottom: '24px' }}>
            {SHAPE_KEYS.map(key => {
              const s = SHAPES[key];
              const isActive = activeShape === key;
              return (
                <button key={key} onClick={() => setActiveShape(key)}
                  style={{
                    background: isActive ? 'var(--accent-light)' : 'var(--surface2)',
                    border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 10px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isActive ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{s.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px' }}>{s.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Active shape calculator */}
          <div key={activeShape}>
            <ShapeCalc shapeKey={activeShape} />
          </div>
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Calculate Area</h2>
          <p>
            Area is the measure of a two-dimensional surface, expressed in square units. This calculator covers 11 of the most commonly needed shapes, each with its own formula and flexible unit input — mix metres, feet, inches, or any other unit freely within the same calculation.
          </p>
          <p>
            The <strong>rectangle</strong> and <strong>square</strong> formulas (length × width and side²) cover the vast majority of real-world use cases: rooms, floor plans, garden beds, and land parcels. The <strong>circle</strong> formula (πr²) is used for pools, ponds, and circular structures; the <strong>ellipse</strong> (π × a × b) extends this to oval shapes. The <strong>triangle</strong> (½ × base × height) and <strong>trapezoid</strong> (½ × (a+b) × height) handle angled and irregular plots. The <strong>parallelogram</strong> (base × height) is a rectangle tilted at an angle — common in irregular lot shapes.
          </p>
          <p>
            For more specialised uses: the <strong>sector</strong> calculates a pie-slice portion of a circle given its angle; the <strong>annulus</strong> (ring) finds the area between two concentric circles — useful for circular paths, ring-shaped gardens, or hollow cross-sections. Regular <strong>pentagon</strong> and <strong>hexagon</strong> formulas handle uniform 5- and 6-sided shapes.
          </p>
          <p>
            Every result is automatically converted to six area units — <strong>m²</strong> (square metres), <strong>cm²</strong> (square centimetres), <strong>ft²</strong> (square feet), <strong>yd²</strong> (square yards), <strong>acres</strong>, and <strong>hectares</strong> — so you never need to convert separately.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Area Formula Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))' }}>
            {[
              { label: 'Rectangle 5m × 4m',           value: '20 m²',        sub: '215.3 ft²' },
              { label: 'Circle radius 3m',             value: '28.27 m²',     sub: 'A = π × 3²' },
              { label: 'Triangle base 6m, height 4m',  value: '12 m²',        sub: 'A = ½ × 6 × 4' },
              { label: 'Trapezoid a=3m, b=5m, h=4m',   value: '16 m²',        sub: 'A = ½ × 8 × 4' },
              { label: 'Hexagon side 4m',              value: '41.57 m²',     sub: 'regular 6-sided' },
              { label: 'Annulus R=5m, r=3m',           value: '50.27 m²',     sub: 'π × (25 − 9)' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="area-calculator" />
      </div>
    </div>
  );
}
