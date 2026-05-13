import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Unit helpers ──────────────────────────────────────────────

const LENGTH_UNITS = ['m', 'cm', 'mm', 'ft', 'in', 'yd'];

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

const VOLUME_UNITS = ['m³', 'cm³', 'mm³', 'ft³', 'in³', 'yd³', 'L', 'mL', 'gal (US)', 'gal (UK)', 'fl oz (US)'];

function fromM3(m3, unit) {
  switch (unit) {
    case 'm³':       return m3;
    case 'cm³':      return m3 * 1e6;
    case 'mm³':      return m3 * 1e9;
    case 'ft³':      return m3 * 35.3147;
    case 'in³':      return m3 * 61023.7;
    case 'yd³':      return m3 * 1.30795;
    case 'L':        return m3 * 1000;
    case 'mL':       return m3 * 1e6;
    case 'gal (US)': return m3 * 264.172;
    case 'gal (UK)': return m3 * 219.969;
    case 'fl oz (US)': return m3 * 33814.0;
    default:         return m3;
  }
}

const DISPLAY_UNITS = ['m³', 'cm³', 'ft³', 'in³', 'L', 'gal (US)', 'gal (UK)'];

function fmtVol(n) {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (n >= 1e6) return n.toExponential(3);
  if (n >= 1000) return parseFloat(n.toFixed(1)).toLocaleString();
  if (n >= 1)    return parseFloat(n.toFixed(4)).toString();
  if (n >= 0.001) return parseFloat(n.toFixed(6)).toString();
  return n.toExponential(3);
}

// ── Shape formulas (all return m³) ───────────────────────────

const SHAPES = {
  cube: {
    label: 'Cube',
    icon: '⬛',
    desc: 'equal sides',
    formula: 'V = s³',
    color: '#0d9488',
    fields: [
      { id: 'side', label: 'Side length', placeholder: '3', unit: 'm' },
    ],
    calc: ({ side: s }) => s ? s * s * s : null,
  },
  cuboid: {
    label: 'Cuboid',
    icon: '▬',
    desc: 'box, room, tank',
    formula: 'V = l × w × h',
    color: '#0891b2',
    fields: [
      { id: 'length', label: 'Length', placeholder: '5', unit: 'm' },
      { id: 'width',  label: 'Width',  placeholder: '3', unit: 'm' },
      { id: 'height', label: 'Height', placeholder: '2', unit: 'm' },
    ],
    calc: ({ length: l, width: w, height: h }) => (l && w && h) ? l * w * h : null,
  },
  cylinder: {
    label: 'Cylinder',
    icon: '🥫',
    desc: 'tanks, pipes, cans',
    formula: 'V = π × r² × h',
    color: '#7c3aed',
    fields: [
      { id: 'radius', label: 'Radius',  placeholder: '2',  unit: 'm' },
      { id: 'height', label: 'Height',  placeholder: '5',  unit: 'm' },
    ],
    calc: ({ radius: r, height: h }) => (r && h) ? Math.PI * r * r * h : null,
  },
  sphere: {
    label: 'Sphere',
    icon: '●',
    desc: 'balls, tanks, planets',
    formula: 'V = (4/3) × π × r³',
    color: '#dc2626',
    fields: [
      { id: 'radius', label: 'Radius', placeholder: '3', unit: 'm' },
    ],
    calc: ({ radius: r }) => r ? (4 / 3) * Math.PI * r * r * r : null,
  },
  cone: {
    label: 'Cone',
    icon: '🔺',
    desc: 'funnels, piles, roofs',
    formula: 'V = (1/3) × π × r² × h',
    color: '#f59e0b',
    fields: [
      { id: 'radius', label: 'Base radius', placeholder: '2', unit: 'm' },
      { id: 'height', label: 'Height',       placeholder: '5', unit: 'm' },
    ],
    calc: ({ radius: r, height: h }) => (r && h) ? (1 / 3) * Math.PI * r * r * h : null,
  },
  pyramid: {
    label: 'Pyramid',
    icon: '△',
    desc: 'square base pyramid',
    formula: 'V = (1/3) × l × w × h',
    color: '#f97316',
    fields: [
      { id: 'length', label: 'Base length', placeholder: '4', unit: 'm' },
      { id: 'width',  label: 'Base width',  placeholder: '4', unit: 'm' },
      { id: 'height', label: 'Height',       placeholder: '5', unit: 'm' },
    ],
    calc: ({ length: l, width: w, height: h }) =>
      (l && w && h) ? (1 / 3) * l * w * h : null,
  },
  capsule: {
    label: 'Capsule',
    icon: '💊',
    desc: 'pill shape, rounded tank',
    formula: 'V = π × r² × (h + 4r/3)',
    color: '#16a34a',
    fields: [
      { id: 'radius', label: 'Radius',         placeholder: '1', unit: 'm' },
      { id: 'height', label: 'Cylinder height', placeholder: '4', unit: 'm' },
    ],
    calc: ({ radius: r, height: h }) =>
      (r && h) ? Math.PI * r * r * (h + (4 * r) / 3) : null,
  },
  hemisphere: {
    label: 'Hemisphere',
    icon: '◑',
    desc: 'half sphere, dome',
    formula: 'V = (2/3) × π × r³',
    color: '#0891b2',
    fields: [
      { id: 'radius', label: 'Radius', placeholder: '3', unit: 'm' },
    ],
    calc: ({ radius: r }) => r ? (2 / 3) * Math.PI * r * r * r : null,
  },
  ellipsoid: {
    label: 'Ellipsoid',
    icon: '⬭',
    desc: 'egg shape, oval tank',
    formula: 'V = (4/3) × π × a × b × c',
    color: '#7c3aed',
    fields: [
      { id: 'axisA', label: 'Semi-axis a', placeholder: '5', unit: 'm' },
      { id: 'axisB', label: 'Semi-axis b', placeholder: '3', unit: 'm' },
      { id: 'axisC', label: 'Semi-axis c', placeholder: '2', unit: 'm' },
    ],
    calc: ({ axisA: a, axisB: b, axisC: c }) =>
      (a && b && c) ? (4 / 3) * Math.PI * a * b * c : null,
  },
  torus: {
    label: 'Torus',
    icon: '🍩',
    desc: 'donut / ring shape',
    formula: 'V = 2π² × R × r²',
    color: '#dc2626',
    fields: [
      { id: 'majorR', label: 'Major radius R', placeholder: '4', unit: 'm' },
      { id: 'minorR', label: 'Minor radius r', placeholder: '1', unit: 'm' },
    ],
    calc: ({ majorR: R, minorR: r }) => {
      if (!R || !r) return null;
      if (r >= R) return 'error:minor >= major';
      return 2 * Math.PI * Math.PI * R * r * r;
    },
  },
  triangularPrism: {
    label: 'Triangular Prism',
    icon: '◆',
    desc: 'wedge, ramp shape',
    formula: 'V = ½ × b × h × l',
    color: '#16a34a',
    fields: [
      { id: 'base',   label: 'Triangle base',   placeholder: '3', unit: 'm' },
      { id: 'height', label: 'Triangle height',  placeholder: '4', unit: 'm' },
      { id: 'length', label: 'Prism length',     placeholder: '6', unit: 'm' },
    ],
    calc: ({ base: b, height: h, length: l }) =>
      (b && h && l) ? 0.5 * b * h * l : null,
  },
  hollowCylinder: {
    label: 'Hollow Cylinder',
    icon: '⭕',
    desc: 'pipe, tube cross-section',
    formula: 'V = π × (R² − r²) × h',
    color: '#0d9488',
    fields: [
      { id: 'outerR', label: 'Outer radius R', placeholder: '3', unit: 'm' },
      { id: 'innerR', label: 'Inner radius r', placeholder: '2', unit: 'm' },
      { id: 'height', label: 'Height / length',placeholder: '5', unit: 'm' },
    ],
    calc: ({ outerR: R, innerR: r, height: h }) => {
      if (!R || !r || !h) return null;
      if (r >= R) return 'error:inner >= outer';
      return Math.PI * (R * R - r * r) * h;
    },
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
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: 'clamp(1rem,2.8vw,1.6rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
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
      {LENGTH_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  );
}

// ── All-units result grid ─────────────────────────────────────

function AllUnitsGrid({ m3 }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
      {DISPLAY_UNITS.map(u => (
        <div key={u} style={{
          flex: '1 1 100px', background: 'var(--surface2)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-hover)' }}>
            {fmtVol(fromM3(m3, u))}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px', fontWeight: 600 }}>{u}</div>
        </div>
      ))}
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
      const m = toM(values[f.id], units[f.id]);
      if (!m) { setError(`Enter a valid ${f.label.toLowerCase()}.`); setResult(null); return; }
      converted[f.id] = m;
    }
    const vol = shape.calc(converted);
    if (vol === null) { setError('Enter all required dimensions.'); setResult(null); return; }
    if (typeof vol === 'string' && vol.startsWith('error:')) {
      const msgs = {
        'error:inner >= outer': 'Inner radius must be smaller than outer radius.',
        'error:minor >= major': 'Minor radius must be smaller than major radius.',
      };
      setError(msgs[vol] || 'Invalid dimensions.'); setResult(null); return;
    }
    setResult({ m3: vol, converted });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = DISPLAY_UNITS.map(u => `${u}: ${fmtVol(fromM3(result.m3, u))}`).join('\n');
    navigator.clipboard.writeText(`${shape.label} volume:\n${lines}`).then(() => {
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
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', borderRadius: '99px',
        background: `${shape.color}18`, border: `1px solid ${shape.color}`,
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{shape.icon}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', fontWeight: 700, color: shape.color }}>
          {shape.formula}
        </span>
      </div>

      {/* Inputs */}
      <div className="form-row">
        {shape.fields.map(f => (
          <div key={f.id} className="form-group">
            <label>{f.label}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number" value={values[f.id] || ''} min="0"
                onChange={e => setValue(f.id, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder={f.placeholder}
                style={{ flex: 1, fontFamily: 'var(--mono)' }}
              />
              <UnitSel value={units[f.id]} onChange={u => setUnit(f.id, u)} />
            </div>
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate volume</button>
        <button className="btn btn-ghost" onClick={clear}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy all units</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          {/* Big result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px',
            textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              {shape.label} volume
            </div>
            <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtVol(result.m3)} m³
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtVol(fromM3(result.m3, 'L'))} L &nbsp;·&nbsp; {fmtVol(fromM3(result.m3, 'ft³'))} ft³
            </div>
          </div>

          <SectionTitle>All units</SectionTitle>
          <AllUnitsGrid m3={result.m3} />
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function VolumeCalculator() {
  const [activeShape, setActiveShape] = useState('cuboid');

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Volume Calculator</span>
          </div>
          <h1>Volume Calculator</h1>
          <p className="subtitle">
            Calculate the volume of 12 three-dimensional shapes — cuboid, sphere, cylinder, cone, pyramid, and more — with instant conversion to m³, litres, gallons, and all other common volume units.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Shape selector grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: '6px', marginBottom: '24px' }}>
            {SHAPE_KEYS.map(key => {
              const s = SHAPES[key];
              const isActive = activeShape === key;
              return (
                <button key={key} onClick={() => setActiveShape(key)}
                  style={{
                    background: isActive ? 'var(--accent-light)' : 'var(--surface2)',
                    border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 8px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isActive ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{s.label}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: '2px' }}>{s.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Active calculator */}
          <div key={activeShape}>
            <ShapeCalc shapeKey={activeShape} />
          </div>
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Calculate Volume</h2>
          <p>
            Volume measures the three-dimensional space occupied by a solid object, expressed in cubic units. This calculator covers 12 of the most commonly needed 3D shapes, each with the correct formula and flexible unit inputs — mix metres, centimetres, feet, or inches freely within any calculation.
          </p>
          <p>
            The <strong>cuboid</strong> (l × w × h) is the most frequently used formula — for rooms, tanks, boxes, and any rectangular solid. The <strong>cube</strong> is a special case where all sides are equal. The <strong>cylinder</strong> (πr²h) handles tanks, pipes, columns, and cans; the <strong>hollow cylinder</strong> extends this to tubes and pipes with wall thickness.
          </p>
          <p>
            The <strong>sphere</strong> (4/3 × πr³) is used for spherical tanks, balls, and domes; the <strong>hemisphere</strong> gives exactly half of that. The <strong>cone</strong> (1/3 × πr²h) and <strong>pyramid</strong> (1/3 × l × w × h) both hold one-third of their respective base × height volumes. The <strong>triangular prism</strong> is used for wedge and ramp shapes.
          </p>
          <p>
            The <strong>capsule</strong> (a cylinder capped with two hemispheres) is ideal for pill-shaped tanks and pressure vessels. The <strong>ellipsoid</strong> extends the sphere to three unequal axes. The <strong>torus</strong> calculates the volume of a donut or ring shape.
          </p>
          <p>
            Every result instantly converts to <strong>m³, cm³, ft³, in³, litres, US gallons, and UK gallons</strong> — no secondary converter needed.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Volume Calculation Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: 'Cuboid 5m × 3m × 2m',           value: '30 m³',    sub: '30,000 L' },
              { label: 'Sphere radius 1m',               value: '4.189 m³', sub: '4,189 L' },
              { label: 'Cylinder r=2m, h=5m',           value: '62.83 m³', sub: '62,832 L' },
              { label: 'Cone r=3m, h=4m',               value: '37.70 m³', sub: '37,699 L' },
              { label: 'Swimming pool 8m×4m×1.5m',       value: '48 m³',   sub: '48,000 L' },
              { label: 'Cube side 1ft',                  value: '0.0283 m³',sub: '28.32 L' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="volume-calculator" />
      </div>
    </div>
  );
}
