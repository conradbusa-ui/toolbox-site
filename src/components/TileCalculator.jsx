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

function toM2(val, unit) {
  // For area inputs already in square units
  const n = parseFloat(val);
  if (isNaN(n) || n <= 0) return null;
  switch (unit) {
    case 'm²':   return n;
    case 'cm²':  return n / 10000;
    case 'ft²':  return n * 0.092903;
    case 'yd²':  return n * 0.836127;
    default:     return n;
  }
}

// ── Core calculations ─────────────────────────────────────────

function roomArea(lengthM, widthM) {
  return lengthM * widthM;
}

function tilesNeeded(roomM2, tileLengthM, tileWidthM, wastePct) {
  const tileM2   = tileLengthM * tileWidthM;
  const rawTiles = roomM2 / tileM2;
  const withWaste = rawTiles * (1 + wastePct / 100);
  return { rawTiles, withWaste: Math.ceil(withWaste), tileM2 };
}

function boxesNeeded(totalTiles, tilesPerBox) {
  return Math.ceil(totalTiles / tilesPerBox);
}

function groutAmount(roomM2, tileLengthM, tileWidthM, jointMm, groutDepthMm) {
  // Grout volume (m³) per m² of floor
  // Joint area per tile
  const tileL = tileLengthM;
  const tileW = tileWidthM;
  const jointM = jointMm / 1000;
  const depthM = groutDepthMm / 1000;
  // Horizontal joints per m²: 1/tileW, vertical joints per m²: 1/tileL
  const groutVol = roomM2 * (jointM / tileL + jointM / tileW) * depthM;
  // Grout density ≈ 1600 kg/m³
  return groutVol * 1600; // kg
}

function adhesiveAmount(roomM2, coverage = 4) {
  // coverage: m² per kg (standard tile adhesive ≈ 3–5 kg/m²)
  return Math.ceil((roomM2 / coverage) * 1.05); // +5% waste
}

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
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

function UnitSel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', width: '68px', padding: '4px 6px' }}>
      {(options || UNIT_OPTIONS).map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  );
}

function DimInput({ label, val, setVal, unit, setUnit, placeholder, onEnter, hint }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input type="number" value={val} min="0"
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          placeholder={placeholder}
          style={{ flex: 1, fontFamily: 'var(--mono)' }} />
        <UnitSel value={unit} onChange={setUnit} />
      </div>
      {hint && <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '3px' }}>{hint}</p>}
    </div>
  );
}

// ── Mode 1: Tile calculator ───────────────────────────────────

const COMMON_TILES = [
  { label: '30×30 cm',  l: '300', w: '300', unit: 'mm' },
  { label: '45×45 cm',  l: '450', w: '450', unit: 'mm' },
  { label: '60×60 cm',  l: '600', w: '600', unit: 'mm' },
  { label: '30×60 cm',  l: '600', w: '300', unit: 'mm' },
  { label: '60×120 cm', l: '1200',w: '600', unit: 'mm' },
  { label: '12×12 in',  l: '12',  w: '12',  unit: 'in'  },
  { label: '18×18 in',  l: '18',  w: '18',  unit: 'in'  },
  { label: '24×24 in',  l: '24',  w: '24',  unit: 'in'  },
];

const ROOM_PRESETS = [
  { label: 'Bathroom',   l: '2.5', w: '2',   unit: 'm' },
  { label: 'Kitchen',    l: '4',   w: '3.5', unit: 'm' },
  { label: 'Living room',l: '6',   w: '5',   unit: 'm' },
  { label: 'Hallway',    l: '6',   w: '1.2', unit: 'm' },
];

function TileMode() {
  // Room
  const [roomL, setRoomL]   = useState(''); const [roomLU, setRoomLU] = useState('m');
  const [roomW, setRoomW]   = useState(''); const [roomWU, setRoomWU] = useState('m');
  // Extra areas
  const [extraAreas, setExtraAreas] = useState([]);
  // Tile
  const [tileL, setTileL]   = useState(''); const [tileLU, setTileLU] = useState('mm');
  const [tileW, setTileW]   = useState(''); const [tileWU, setTileWU] = useState('mm');
  // Options
  const [wastePct, setWastePct]   = useState('10');
  const [tilesPerBox, setTilesPerBox] = useState('');
  const [pricePerBox, setPricePerBox] = useState('');
  const [currency, setCurrency]   = useState('$');
  // Grout
  const [showGrout, setShowGrout] = useState(false);
  const [jointMm, setJointMm]     = useState('3');
  const [groutDepth, setGroutDepth] = useState('8');
  // Result
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [toast, setToast]   = useState('');

  function addExtraArea() {
    setExtraAreas(prev => [...prev, { l: '', w: '', lu: 'm', wu: 'm', label: `Area ${prev.length + 2}` }]);
  }
  function updateExtra(i, field, val) {
    setExtraAreas(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
    setResult(null);
  }

  function loadRoomPreset(p) {
    setRoomL(p.l); setRoomLU(p.unit);
    setRoomW(p.w); setRoomWU(p.unit);
    setResult(null); setError('');
  }

  function loadTilePreset(p) {
    setTileL(p.l); setTileLU(p.unit);
    setTileW(p.w); setTileWU(p.unit);
    setResult(null); setError('');
  }

  function calculate() {
    const rlM = toM(roomL, roomLU), rwM = toM(roomW, roomWU);
    if (!rlM) { setError('Enter a valid room length.'); setResult(null); return; }
    if (!rwM) { setError('Enter a valid room width.'); setResult(null); return; }

    const tlM = toM(tileL, tileLU), twM = toM(tileW, tileWU);
    if (!tlM) { setError('Enter a valid tile length.'); setResult(null); return; }
    if (!twM) { setError('Enter a valid tile width.'); setResult(null); return; }

    const waste = parseFloat(wastePct) || 10;
    let totalM2 = roomArea(rlM, rwM);

    // Add extra areas
    for (const ea of extraAreas) {
      const el = toM(ea.l, ea.lu), ew = toM(ea.w, ea.wu);
      if (el && ew) totalM2 += roomArea(el, ew);
    }

    const { rawTiles, withWaste: totalTiles, tileM2 } = tilesNeeded(totalM2, tlM, twM, waste);

    const tilesBox = parseInt(tilesPerBox) || null;
    const boxes    = tilesBox ? boxesNeeded(totalTiles, tilesBox) : null;
    const priceBox = parseFloat(pricePerBox) || null;
    const totalCost = (boxes && priceBox) ? boxes * priceBox : null;

    // Grout
    const groutKg = showGrout
      ? groutAmount(totalM2, tlM, twM, parseFloat(jointMm) || 3, parseFloat(groutDepth) || 8)
      : null;

    // Adhesive estimate
    const adhesiveKg = adhesiveAmount(totalM2);

    setResult({
      totalM2, rawTiles, totalTiles, tileM2,
      tlM, twM, waste,
      boxes, tilesBox, priceBox, totalCost, currency,
      groutKg, adhesiveKg,
      roomM2: roomArea(rlM, rwM),
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Total area: ${fmt(result.totalM2)} m²`,
      `Tiles needed: ${result.totalTiles} (incl. ${result.waste}% waste)`,
      result.boxes ? `Boxes needed: ${result.boxes}` : '',
      result.totalCost ? `Est. cost: ${result.currency}${parseFloat(result.totalCost.toFixed(2)).toLocaleString()}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your room dimensions and tile size to calculate how many tiles you need, how many boxes to buy, and the total cost.
      </p>

      {/* Room dimensions */}
      <SectionTitle>Room / area dimensions</SectionTitle>
      <div className="form-row">
        <DimInput label="Room length" val={roomL} setVal={v=>{setRoomL(v);setResult(null);setError('');}} unit={roomLU} setUnit={v=>{setRoomLU(v);setResult(null);}} placeholder="4" onEnter={calculate} />
        <DimInput label="Room width"  val={roomW} setVal={v=>{setRoomW(v);setResult(null);setError('');}} unit={roomWU} setUnit={v=>{setRoomWU(v);setResult(null);}} placeholder="3" onEnter={calculate} />
      </div>

      {/* Room presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Room presets</p>
        <div className="tag-row">
          {ROOM_PRESETS.map(p => (
            <button key={p.label} className="tag" onClick={() => loadRoomPreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Extra areas */}
      {extraAreas.map((ea, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '6px' }}>
          <div className="form-group" style={{ flex: '0 0 100px', margin: 0 }}>
            {i === 0 && <label style={{ marginBottom: '6px' }}>Area label</label>}
            <input type="text" value={ea.label} onChange={e => updateExtra(i, 'label', e.target.value)}
              style={{ fontSize: '0.85rem' }} />
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0, minWidth: '100px' }}>
            {i === 0 && <label style={{ marginBottom: '6px' }}>Length</label>}
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="number" value={ea.l} onChange={e => updateExtra(i, 'l', e.target.value)} placeholder="2" style={{ flex: 1, fontFamily: 'var(--mono)' }} />
              <UnitSel value={ea.lu} onChange={v => updateExtra(i, 'lu', v)} />
            </div>
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0, minWidth: '100px' }}>
            {i === 0 && <label style={{ marginBottom: '6px' }}>Width</label>}
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="number" value={ea.w} onChange={e => updateExtra(i, 'w', e.target.value)} placeholder="1.5" style={{ flex: 1, fontFamily: 'var(--mono)' }} />
              <UnitSel value={ea.wu} onChange={v => updateExtra(i, 'wu', v)} />
            </div>
          </div>
          <button onClick={() => { setExtraAreas(prev => prev.filter((_, idx) => idx !== i)); setResult(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '6px', marginBottom: '2px' }}
            onMouseEnter={e => e.target.style.color = '#dc2626'}
            onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>✕</button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }} onClick={addExtraArea}>
        + Add another area
      </button>

      {/* Tile size */}
      <SectionTitle>Tile dimensions</SectionTitle>
      <div className="form-row">
        <DimInput label="Tile length" val={tileL} setVal={v=>{setTileL(v);setResult(null);setError('');}} unit={tileLU} setUnit={v=>{setTileLU(v);setResult(null);}} placeholder="600" onEnter={calculate} />
        <DimInput label="Tile width"  val={tileW} setVal={v=>{setTileW(v);setResult(null);setError('');}} unit={tileWU} setUnit={v=>{setTileWU(v);setResult(null);}} placeholder="600" onEnter={calculate} />
      </div>

      {/* Tile presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Common tile sizes</p>
        <div className="tag-row">
          {COMMON_TILES.map(p => (
            <button key={p.label} className="tag" onClick={() => loadTilePreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Options */}
      <SectionTitle>Options</SectionTitle>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '14px' }}>
        <div className="form-group" style={{ flex: '1 1 90px', margin: 0 }}>
          <label>Waste / cuts (%)</label>
          <input type="number" value={wastePct} min="0" max="50"
            onChange={e => { setWastePct(e.target.value); setResult(null); }}
            placeholder="10" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '1 1 120px', margin: 0 }}>
          <label>Tiles per box <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
          <input type="number" value={tilesPerBox} min="1"
            onChange={e => { setTilesPerBox(e.target.value); setResult(null); }}
            placeholder="e.g. 6" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '1 1 120px', margin: 0 }}>
          <label>Price per box <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
          <input type="number" value={pricePerBox} min="0" step="0.01"
            onChange={e => { setPricePerBox(e.target.value); setResult(null); }}
            placeholder="e.g. 45" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '0 0 90px', margin: 0 }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)' }}>
            {['$', '£', '€', 'A$', 'C$', 'R', '₹'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Grout toggle */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '14px' }}
        onClick={() => setShowGrout(v => !v)}>
        {showGrout ? '▼' : '▶'} {showGrout ? 'Hide' : 'Show'} grout & adhesive estimate
      </button>

      {showGrout && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '14px' }}>
          <div className="form-group" style={{ flex: '1 1 110px', margin: 0 }}>
            <label>Grout joint width (mm)</label>
            <input type="number" value={jointMm} min="1" max="20"
              onChange={e => { setJointMm(e.target.value); setResult(null); }}
              placeholder="3" style={{ fontFamily: 'var(--mono)' }} />
          </div>
          <div className="form-group" style={{ flex: '1 1 110px', margin: 0 }}>
            <label>Grout depth (mm)</label>
            <input type="number" value={groutDepth} min="1" max="30"
              onChange={e => { setGroutDepth(e.target.value); setResult(null); }}
              placeholder="8" style={{ fontFamily: 'var(--mono)' }} />
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => {
          setRoomL(''); setRoomW(''); setTileL(''); setTileW('');
          setExtraAreas([]); setResult(null); setError('');
        }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Banner */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Tiles needed (incl. {result.waste}% waste)
            </div>
            <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {result.totalTiles}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmt(result.rawTiles, 1)} tiles needed + waste → {result.totalTiles} tiles total
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Total tiles"   value={result.totalTiles}                       sub={`incl. ${result.waste}% waste`} />
            <StatCard label="Total area"    value={`${fmt(result.totalM2)} m²`}              sub={`${fmt(result.totalM2 * 10.7639, 1)} ft²`} />
            <StatCard label="Tile area"     value={`${fmt(result.tileM2 * 10000, 0)} cm²`}   sub={`${fmt(result.tlM * 100)}×${fmt(result.twM * 100)} cm`} />
            {result.boxes    && <StatCard accent label="Boxes to buy"  value={result.boxes}    sub={`${result.tilesBox} tiles/box`} />}
            {result.totalCost && <StatCard accent label="Est. material cost" value={`${result.currency}${parseFloat(result.totalCost.toFixed(2)).toLocaleString()}`} sub={`${result.boxes} × ${result.currency}${fmt(result.priceBox)}/box`} />}
          </div>

          {/* Grout + adhesive */}
          {(result.groutKg || result.adhesiveKg) && (
            <>
              <SectionTitle>Materials estimate</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {result.groutKg && (
                  <StatCard label="Grout (approx.)" value={`${fmt(result.groutKg, 1)} kg`} sub="based on joint size" />
                )}
                <StatCard label="Adhesive (approx.)" value={`${result.adhesiveKg} kg`} sub="at 4 kg/m² coverage" />
              </div>
            </>
          )}

          {/* Cost breakdown if boxes and price set */}
          {result.totalCost && (
            <>
              <SectionTitle>Cost breakdown</SectionTitle>
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                {[
                  { label: `Tiles (${result.boxes} boxes × ${result.currency}${fmt(result.priceBox)})`, value: result.totalCost },
                  { label: 'Adhesive (estimated, 5 kg bags @ est. price)', value: null, note: 'Price varies' },
                  { label: 'Grout (estimated)', value: null, note: 'Price varies' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: r.value ? 'var(--accent-hover)' : 'var(--text-3)' }}>
                      {r.value ? `${result.currency}${parseFloat(r.value.toFixed(2)).toLocaleString()}` : r.note}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            ⓘ Always buy 10% extra for cuts, breakage, and future repairs. Grout and adhesive quantities are estimates — check product packaging for exact coverage rates.
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Area-only calculator ──────────────────────────────

function AreaMode() {
  const [shapes, setShapes] = useState([
    { label: 'Room 1', l: '', w: '', lu: 'm', wu: 'm', active: true },
    { label: 'Room 2', l: '', w: '', lu: 'm', wu: 'm', active: true },
  ]);
  const [deductions, setDeductions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function updateShape(i, field, val) {
    setShapes(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    setResult(null);
  }
  function updateDeduct(i, field, val) {
    setDeductions(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    setResult(null);
  }

  function calculate() {
    const addAreas   = shapes.filter(s => s.active).map(s => {
      const l = toM(s.l, s.lu), w = toM(s.w, s.wu);
      return (l && w) ? l * w : 0;
    });
    const deductAreas = deductions.map(s => {
      const l = toM(s.l, s.lu), w = toM(s.w, s.wu);
      return (l && w) ? l * w : 0;
    });

    const totalAdd    = addAreas.reduce((a, b) => a + b, 0);
    const totalDeduct = deductAreas.reduce((a, b) => a + b, 0);
    const net         = Math.max(0, totalAdd - totalDeduct);

    if (totalAdd === 0) { setError('Enter dimensions for at least one area.'); setResult(null); return; }

    setResult({ totalAdd, totalDeduct, net, addAreas, deductAreas });
    setError('');
  }

  const ShapeRow = ({ items, update, removeItem, isDeduct }) => items.map((s, i) => (
    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '8px' }}>
      <div className="form-group" style={{ flex: '0 0 110px', margin: 0 }}>
        {i === 0 && <label>Label</label>}
        <input type="text" value={s.label} onChange={e => update(i, 'label', e.target.value)} style={{ fontSize: '0.85rem' }} />
      </div>
      <div className="form-group" style={{ flex: 1, margin: 0, minWidth: '90px' }}>
        {i === 0 && <label>Length</label>}
        <div style={{ display: 'flex', gap: '4px' }}>
          <input type="number" value={s.l} onChange={e => update(i, 'l', e.target.value)} placeholder="4" style={{ flex: 1, fontFamily: 'var(--mono)' }} />
          <UnitSel value={s.lu} onChange={v => update(i, 'lu', v)} />
        </div>
      </div>
      <div className="form-group" style={{ flex: 1, margin: 0, minWidth: '90px' }}>
        {i === 0 && <label>Width</label>}
        <div style={{ display: 'flex', gap: '4px' }}>
          <input type="number" value={s.w} onChange={e => update(i, 'w', e.target.value)} placeholder="3" style={{ flex: 1, fontFamily: 'var(--mono)' }} />
          <UnitSel value={s.wu} onChange={v => update(i, 'wu', v)} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--accent-hover)', fontWeight: 700, paddingBottom: '8px', whiteSpace: 'nowrap' }}>
        {toM(s.l, s.lu) && toM(s.w, s.wu) ? `${fmt(toM(s.l,s.lu)*toM(s.w,s.wu))} m²` : '—'}
      </div>
      {items.length > 1 && (
        <button onClick={() => removeItem(i)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '6px', marginBottom: '4px' }}
          onMouseEnter={e => e.target.style.color = '#dc2626'}
          onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>✕</button>
      )}
    </div>
  ));

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Add multiple rooms or areas and optionally subtract areas (doors, islands, pillars) to get a net floor area.
      </p>

      <SectionTitle>Areas to include</SectionTitle>
      <ShapeRow items={shapes} update={updateShape} removeItem={i => { setShapes(prev => prev.filter((_,idx)=>idx!==i)); setResult(null); }} />
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}
        onClick={() => setShapes(prev => [...prev, { label: `Room ${prev.length+1}`, l:'',w:'',lu:'m',wu:'m',active:true }])}>
        + Add area
      </button>

      {deductions.length > 0 && (
        <>
          <SectionTitle>Areas to subtract (cabinets, islands, pillars…)</SectionTitle>
          <ShapeRow items={deductions} update={updateDeduct} removeItem={i => { setDeductions(prev => prev.filter((_,idx)=>idx!==i)); setResult(null); }} />
        </>
      )}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}
        onClick={() => setDeductions(prev => [...prev, { label: `Deduct ${prev.length+1}`, l:'',w:'',lu:'m',wu:'m' }])}>
        + Subtract an area
      </button>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate area</button>
        <button className="btn btn-ghost" onClick={() => { setShapes([{label:'Room 1',l:'',w:'',lu:'m',wu:'m',active:true},{label:'Room 2',l:'',w:'',lu:'m',wu:'m',active:true}]); setDeductions([]); setResult(null); setError(''); }}>Reset</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Net area"     value={`${fmt(result.net)} m²`}        sub={`${fmt(result.net * 10.7639, 1)} ft²`} />
            <StatCard label="Total added"  value={`${fmt(result.totalAdd)} m²`}    sub="sum of all areas" />
            {result.totalDeduct > 0 && <StatCard label="Deducted" value={`${fmt(result.totalDeduct)} m²`} sub="subtracted areas" color="#dc2626" />}
            <StatCard label="In yd²"       value={`${fmt(result.net * 1.19599, 2)}`}  sub="square yards" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Paint / wallpaper ─────────────────────────────────

function PaintMode() {
  const [roomL, setRoomL]   = useState(''); const [roomLU, setRoomLU] = useState('m');
  const [roomW, setRoomW]   = useState(''); const [roomWU, setRoomWU] = useState('m');
  const [ceilingH, setCH]   = useState(''); const [ceilingHU, setCHU] = useState('m');
  const [doors, setDoors]   = useState('1');
  const [windows, setWindows] = useState('1');
  const [coats, setCoats]   = useState('2');
  const [coverage, setCoverage] = useState('10'); // m² per litre
  const [pricePerL, setPricePerL] = useState('');
  const [currency, setCurrency] = useState('$');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    const l = toM(roomL, roomLU), w = toM(roomW, roomWU), h = toM(ceilingH, ceilingHU);
    if (!l) { setError('Enter a valid room length.'); setResult(null); return; }
    if (!w) { setError('Enter a valid room width.'); setResult(null); return; }
    if (!h) { setError('Enter a valid ceiling height.'); setResult(null); return; }

    const wallArea    = 2 * (l + w) * h;
    const doorArea    = (parseInt(doors) || 0) * 1.9; // standard door ≈ 0.9×2.1m = ~1.89m²
    const windowArea  = (parseInt(windows) || 0) * 1.5; // standard window ≈ 1.2×1.2m
    const ceilingArea = l * w;
    const paintableWall = Math.max(0, wallArea - doorArea - windowArea);
    const totalArea   = (paintableWall + ceilingArea) * (parseInt(coats) || 2);
    const litres      = totalArea / (parseFloat(coverage) || 10);
    const price       = parseFloat(pricePerL) || 0;
    const cost        = price > 0 ? litres * price : null;

    setResult({ wallArea, paintableWall, ceilingArea, totalArea, litres, cost, coats: parseInt(coats)||2, currency, l, w, h, doorArea, windowArea });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate paint or wallpaper needed for walls and ceiling, accounting for doors and windows.
      </p>

      <div className="form-row">
        <DimInput label="Room length" val={roomL} setVal={v=>{setRoomL(v);setResult(null);setError('');}} unit={roomLU} setUnit={v=>{setRoomLU(v);setResult(null);}} placeholder="4" onEnter={calculate} />
        <DimInput label="Room width"  val={roomW} setVal={v=>{setRoomW(v);setResult(null);setError('');}} unit={roomWU} setUnit={v=>{setRoomWU(v);setResult(null);}} placeholder="3.5" onEnter={calculate} />
        <DimInput label="Ceiling height" val={ceilingH} setVal={v=>{setCH(v);setResult(null);setError('');}} unit={ceilingHU} setUnit={v=>{setCHU(v);setResult(null);}} placeholder="2.4" onEnter={calculate} />
      </div>
      <div className="form-row">
        {[
          { label:'Doors',        val: doors,    setVal: setDoors,    ph:'1' },
          { label:'Windows',      val: windows,  setVal: setWindows,  ph:'1' },
          { label:'Coats of paint', val: coats,  setVal: setCoats,    ph:'2' },
          { label:'Coverage (m²/L)', val: coverage, setVal: setCoverage, ph:'10' },
        ].map(f => (
          <div key={f.label} className="form-group">
            <label>{f.label}</label>
            <input type="number" value={f.val} min="0"
              onChange={e => { f.setVal(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={f.ph} style={{ fontFamily: 'var(--mono)' }} />
          </div>
        ))}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Price per litre <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
          <input type="number" value={pricePerL} min="0" step="0.01"
            onChange={e => { setPricePerL(e.target.value); setResult(null); }}
            placeholder="e.g. 8.50" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '0 0 110px' }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }} style={{ fontFamily: 'var(--mono)' }}>
            {['$','£','€','A$','C$','R','₹'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setRoomL('');setRoomW('');setCH('');setResult(null);setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Paint needed"   value={`${fmt(result.litres, 1)} L`}          sub={`${result.coats} coat${result.coats!==1?'s':''}`} />
            <StatCard label="Paintable walls"  value={`${fmt(result.paintableWall)} m²`}  sub="excl. doors & windows" />
            <StatCard label="Ceiling area"     value={`${fmt(result.ceilingArea)} m²`} />
            <StatCard label="Total painted area" value={`${fmt(result.totalArea)} m²`} sub="walls + ceiling × coats" />
            {result.cost && <StatCard accent label="Est. paint cost" value={`${result.currency}${parseFloat(result.cost.toFixed(2)).toLocaleString()}`} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Tile Calculator',  desc: 'tiles, boxes & cost'    },
  { label: 'Area Calculator',  desc: 'multi-room floor area'  },
  { label: 'Paint Calculator', desc: 'walls & ceiling paint'  },
];

export default function TileCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Tile &amp; Area Calculator</span>
          </div>
          <h1>Tile &amp; Area Calculator</h1>
          <p className="subtitle">
            Calculate how many tiles you need, add up floor areas across multiple rooms, and estimate paint for walls and ceilings — all in one tool with support for metric and imperial units.
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

          {mode === 0 && <TileMode />}
          {mode === 1 && <AreaMode />}
          {mode === 2 && <PaintMode />}
        </div>

        <div className="seo-content">
          <h2>How to Use the Tile and Area Calculator</h2>
          <p>
            This free tile and area calculator covers three of the most common home renovation measurements — all running in your browser with no sign-up needed.
          </p>
          <p>
            <strong>Tile Calculator:</strong> Enter your room dimensions and tile size to instantly see how many tiles you need, with a configurable waste allowance (10% is standard for cuts and breakage). Enter the number of tiles per box and the price per box to get a box count and total material cost. The tool also estimates grout and tile adhesive quantities when you enable the optional grout section. Eight common tile size presets (from 30×30cm to 24×24in) and four room presets load in a single click.
          </p>
          <p>
            <strong>Area Calculator:</strong> Add as many rooms or areas as you need and subtract areas you don't want to tile (kitchen islands, built-in cabinets, pillars). Results are shown in m², ft², and yd² simultaneously. Useful for ordering flooring, carpet, underlay, or screed for any irregular floor plan.
          </p>
          <p>
            <strong>Paint Calculator:</strong> Enter room length, width, and ceiling height to calculate total paintable wall area (minus standard door and window allowances) plus ceiling area. Multiply by the number of coats, divide by your paint's coverage rate (typically 8–12 m²/litre), and get an exact litre count and optional cost estimate.
          </p>
          <p>
            All three modes accept dimensions in metres, centimetres, millimetres, feet, inches, or yards — mix and match freely within any calculation.
          </p>
        </div>

        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'Bathroom 2.5×2m, 300×300mm tiles, 10%',       value: '62 tiles',    sub: '≈ 10–11 boxes of 6' },
              { label: 'Kitchen 4×3.5m, 600×600mm tiles, 10%',        value: '43 tiles',    sub: '≈ 8 boxes of 6' },
              { label: 'Living room 6×5m, 60×120cm tiles, 10%',       value: '46 tiles',    sub: '≈ 37 m² floor area' },
              { label: '3 rooms: 12+8+6 m² floor area',               value: '26 m²',       sub: 'multi-room total' },
              { label: 'Room 4×3.5m, 2.4m ceiling — 2 coats paint',   value: '≈ 9.3 L',    sub: 'at 10 m²/litre' },
              { label: '18×18 in tiles, 15×12 ft room, 10% waste',    value: '≈ 88 tiles',  sub: 'imperial units' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="tile-calculator" />
      </div>
    </div>
  );
}
