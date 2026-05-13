import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Constants ─────────────────────────────────────────────────
const CONCRETE_KG_PER_M3  = 2300;
const M3_TO_YD3 = 1.30795;
const FT_TO_M   = 0.3048;
const IN_TO_M   = 0.0254;
const YD_TO_M   = 0.9144;

const BAGS = [
  { label: '40 lb bag', cuft: 40 / (145 * 0.45), isImperial: true  },
  { label: '60 lb bag', cuft: 60 / (145 * 0.45), isImperial: true  },
  { label: '80 lb bag', cuft: 80 / (145 * 0.45), isImperial: true  },
  { label: '25 kg bag', m3: 25  / (2300 * 0.6),  isImperial: false },
  { label: '30 kg bag', m3: 30  / (2300 * 0.6),  isImperial: false },
  { label: '40 kg bag', m3: 40  / (2300 * 0.6),  isImperial: false },
];

// Bag volume in m3
function bagVolM3(bag) {
  return bag.m3 || (bag.cuft * 0.0283168);
}

// ── Core formulas ─────────────────────────────────────────────
function slabVol(l, w, t)           { return l * w * t; }
function columnVol(d, h)            { return Math.PI * Math.pow(d / 2, 2) * h; }
function footingVol(l, w, d)        { return l * w * d; }
function stepsVol(n, w, rise, run)  { return n * w * rise * run; }
function withWaste(m3, pct)          { return m3 * (1 + pct / 100); }

function toM(val, unit) {
  const n = parseFloat(val);
  if (isNaN(n) || n <= 0) return null;
  switch (unit) {
    case 'm':  return n;
    case 'cm': return n / 100;
    case 'mm': return n / 1000;
    case 'ft': return n * FT_TO_M;
    case 'in': return n * IN_TO_M;
    case 'yd': return n * YD_TO_M;
    default:   return n;
  }
}

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

// ── Shared UI ─────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '24px', marginBottom: '10px' }}>
      {children}
    </p>
  );
}

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px', textAlign: 'center',
      flex: '1 1 120px', minWidth: '110px',
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
      {['m','cm','mm','ft','in','yd'].map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  );
}

function DimInput({ label, val, setVal, unit, setUnit, placeholder, onEnter }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input type="number" value={val} min="0"
          onChange={e => { setVal(e.target.value); }}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          placeholder={placeholder}
          style={{ flex: 1, fontFamily: 'var(--mono)' }} />
        <UnitSel value={unit} onChange={setUnit} />
      </div>
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────
function ResultPanel({ m3Raw, wastePct, currency, pricePerM3, bagSel }) {
  const m3 = withWaste(m3Raw, wastePct);
  const yd3 = m3 * M3_TO_YD3;
  const ft3 = m3 * 35.3147;
  const kg  = m3 * CONCRETE_KG_PER_M3;
  const lbs = kg * 2.20462;
  const cost = pricePerM3 > 0 ? m3 * pricePerM3 : null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{
        background: 'var(--accent-light)', border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Concrete volume{wastePct > 0 ? ` (incl. ${wastePct}% waste)` : ''}
        </div>
        <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {fmt(m3, 3)} m³
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
          {fmt(yd3, 3)} yd³ &nbsp;·&nbsp; {fmt(ft3, 2)} ft³
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <StatCard label="Cubic metres" value={`${fmt(m3,3)} m³`} />
        <StatCard label="Cubic yards"  value={`${fmt(yd3,3)} yd³`} />
        <StatCard label="Weight"       value={`${fmt(kg/1000,2)} t`} sub={`${fmt(kg,0)} kg · ${fmt(lbs,0)} lbs`} />
        {cost !== null && <StatCard accent label="Est. cost" value={`${currency}${parseFloat(cost.toFixed(0)).toLocaleString()}`} sub={`@ ${currency}${pricePerM3}/m³`} />}
      </div>

      <SectionTitle>Bag count estimates</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '8px' }}>
        {BAGS.map(b => {
          const bv  = bagVolM3(b);
          const cnt = Math.ceil(m3 / bv);
          const hi  = b.label === bagSel;
          return (
            <div key={b.label} style={{
              background: hi ? 'var(--accent-light)' : 'var(--surface2)',
              border: `1px solid ${hi ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1.3rem', color: hi ? 'var(--accent-hover)' : 'var(--text)' }}>{cnt}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px' }}>{b.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
        ⓘ Order 5–10% extra to allow for spillage and uneven sub-base. Ready-mix is usually supplied in 0.25 m³ increments — round up to the nearest increment. Bag yields are approximate and vary by brand.
      </div>
    </div>
  );
}

// ── Shape modes ───────────────────────────────────────────────

function SlabMode({ globals }) {
  const [l, setL] = useState(''); const [lu, setLu] = useState('m');
  const [w, setW] = useState(''); const [wu, setWu] = useState('m');
  const [t, setT] = useState(''); const [tu, setTu] = useState('mm');
  const [res, setRes] = useState(null); const [err, setErr] = useState('');

  function calc() {
    const lm = toM(l, lu), wm = toM(w, wu), tm = toM(t, tu);
    if (!lm) { setErr('Enter a valid length.'); setRes(null); return; }
    if (!wm) { setErr('Enter a valid width.');  setRes(null); return; }
    if (!tm) { setErr('Enter a valid thickness.'); setRes(null); return; }
    setRes(slabVol(lm, wm, tm)); setErr('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>Calculate concrete for flat pours — driveways, patios, floors, and paths.</p>
      <div className="form-row">
        <DimInput label="Length"    val={l} setVal={v=>{setL(v);setRes(null);setErr('');}} unit={lu} setUnit={v=>{setLu(v);setRes(null);}} placeholder="4"   onEnter={calc} />
        <DimInput label="Width"     val={w} setVal={v=>{setW(v);setRes(null);setErr('');}} unit={wu} setUnit={v=>{setWu(v);setRes(null);}} placeholder="3"   onEnter={calc} />
        <DimInput label="Thickness" val={t} setVal={v=>{setT(v);setRes(null);setErr('');}} unit={tu} setUnit={v=>{setTu(v);setRes(null);}} placeholder="100" onEnter={calc} />
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={calc}>Calculate</button>
        <button className="btn btn-ghost" onClick={()=>{setL('');setW('');setT('');setRes(null);setErr('');}}>Clear</button>
      </div>
      {err && <ErrBox msg={err} />}
      {res !== null && !err && <ResultPanel m3Raw={res} {...globals} />}
    </div>
  );
}

function ColumnMode({ globals }) {
  const [d, setD] = useState(''); const [du, setDu] = useState('m');
  const [h, setH] = useState(''); const [hu, setHu] = useState('m');
  const [n, setN] = useState('1');
  const [res, setRes] = useState(null); const [err, setErr] = useState('');

  function calc() {
    const dm = toM(d, du), hm = toM(h, hu), cnt = parseInt(n) || 1;
    if (!dm) { setErr('Enter a valid diameter.'); setRes(null); return; }
    if (!hm) { setErr('Enter a valid height.'); setRes(null); return; }
    setRes(columnVol(dm, hm) * cnt); setErr('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>Calculate concrete for circular columns, round fence posts, and deck piers.</p>
      <div className="form-row">
        <DimInput label="Diameter"      val={d} setVal={v=>{setD(v);setRes(null);setErr('');}} unit={du} setUnit={v=>{setDu(v);setRes(null);}} placeholder="0.3" onEnter={calc} />
        <DimInput label="Height / Depth" val={h} setVal={v=>{setH(v);setRes(null);setErr('');}} unit={hu} setUnit={v=>{setHu(v);setRes(null);}} placeholder="1.2" onEnter={calc} />
        <div className="form-group">
          <label>Number of columns</label>
          <input type="number" value={n} min="1" onChange={e=>{setN(e.target.value);setRes(null);}} placeholder="1" style={{fontFamily:'var(--mono)'}} />
        </div>
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={calc}>Calculate</button>
        <button className="btn btn-ghost" onClick={()=>{setD('');setH('');setN('1');setRes(null);setErr('');}}>Clear</button>
      </div>
      {err && <ErrBox msg={err} />}
      {res !== null && !err && <ResultPanel m3Raw={res} {...globals} />}
    </div>
  );
}

function FootingMode({ globals }) {
  const [l, setL] = useState(''); const [lu, setLu] = useState('m');
  const [w, setW] = useState(''); const [wu, setWu] = useState('m');
  const [d, setD] = useState(''); const [du, setDu] = useState('m');
  const [n, setN] = useState('1');
  const [res, setRes] = useState(null); const [err, setErr] = useState('');

  function calc() {
    const lm = toM(l,lu), wm = toM(w,wu), dm = toM(d,du), cnt = parseInt(n)||1;
    if (!lm) { setErr('Enter a valid length.'); setRes(null); return; }
    if (!wm) { setErr('Enter a valid width.'); setRes(null); return; }
    if (!dm) { setErr('Enter a valid depth.'); setRes(null); return; }
    setRes(footingVol(lm,wm,dm)*cnt); setErr('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>Calculate concrete for strip footings, pad footings, retaining walls, and rectangular foundations.</p>
      <div className="form-row">
        <DimInput label="Length" val={l} setVal={v=>{setL(v);setRes(null);setErr('');}} unit={lu} setUnit={v=>{setLu(v);setRes(null);}} placeholder="1.2" onEnter={calc} />
        <DimInput label="Width"  val={w} setVal={v=>{setW(v);setRes(null);setErr('');}} unit={wu} setUnit={v=>{setWu(v);setRes(null);}} placeholder="0.6" onEnter={calc} />
        <DimInput label="Depth"  val={d} setVal={v=>{setD(v);setRes(null);setErr('');}} unit={du} setUnit={v=>{setDu(v);setRes(null);}} placeholder="0.3" onEnter={calc} />
      </div>
      <div className="form-group" style={{maxWidth:'160px'}}>
        <label>Number of footings</label>
        <input type="number" value={n} min="1" onChange={e=>{setN(e.target.value);setRes(null);}} placeholder="1" style={{fontFamily:'var(--mono)'}} />
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={calc}>Calculate</button>
        <button className="btn btn-ghost" onClick={()=>{setL('');setW('');setD('');setN('1');setRes(null);setErr('');}}>Clear</button>
      </div>
      {err && <ErrBox msg={err} />}
      {res !== null && !err && <ResultPanel m3Raw={res} {...globals} />}
    </div>
  );
}

function StepsMode({ globals }) {
  const [steps, setSteps] = useState('');
  const [w, setW] = useState(''); const [wu, setWu] = useState('m');
  const [rise, setRise] = useState(''); const [ru, setRu] = useState('mm');
  const [run,  setRun]  = useState(''); const [rnu, setRnu] = useState('mm');
  const [res, setRes] = useState(null); const [err, setErr] = useState('');

  function calc() {
    const n = parseInt(steps);
    const wm = toM(w, wu), rm = toM(rise, ru), dm = toM(run, rnu);
    if (!n||n<=0) { setErr('Enter a valid number of steps.'); setRes(null); return; }
    if (!wm) { setErr('Enter a valid width.'); setRes(null); return; }
    if (!rm) { setErr('Enter a valid rise.'); setRes(null); return; }
    if (!dm) { setErr('Enter a valid run.'); setRes(null); return; }
    setRes(stepsVol(n,wm,rm,dm)); setErr('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate concrete for a staircase. <strong>Rise</strong> = vertical height of each step. <strong>Run</strong> = horizontal depth of each step.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>Number of steps</label>
          <input type="number" value={steps} min="1"
            onChange={e=>{setSteps(e.target.value);setRes(null);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&calc()}
            placeholder="5" style={{fontFamily:'var(--mono)'}} />
        </div>
        <DimInput label="Width" val={w} setVal={v=>{setW(v);setRes(null);setErr('');}} unit={wu} setUnit={v=>{setWu(v);setRes(null);}} placeholder="1.2" onEnter={calc} />
      </div>
      <div className="form-row">
        <DimInput label="Rise (height per step)" val={rise} setVal={v=>{setRise(v);setRes(null);setErr('');}} unit={ru}  setUnit={v=>{setRu(v);setRes(null);}}  placeholder="175" onEnter={calc} />
        <DimInput label="Run (depth per step)"   val={run}  setVal={v=>{setRun(v);setRes(null);setErr('');}}  unit={rnu} setUnit={v=>{setRnu(v);setRes(null);}} placeholder="250" onEnter={calc} />
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={calc}>Calculate</button>
        <button className="btn btn-ghost" onClick={()=>{setSteps('');setW('');setRise('');setRun('');setRes(null);setErr('');}}>Clear</button>
      </div>
      {err && <ErrBox msg={err} />}
      {res !== null && !err && <ResultPanel m3Raw={res} {...globals} />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

const SHAPES = [
  { label: 'Slab / Floor',   desc: 'driveway, patio, floor'  },
  { label: 'Column / Pier',  desc: 'round posts & cylinders' },
  { label: 'Footing / Wall', desc: 'rectangular foundation'  },
  { label: 'Steps',          desc: 'staircases'              },
];

export default function ConcreteCalculator() {
  const [shape,      setShape]      = useState(0);
  const [wastePct,   setWastePct]   = useState('10');
  const [currency,   setCurrency]   = useState('$');
  const [pricePerM3, setPricePerM3] = useState('');
  const [bagSel,     setBagSel]     = useState('80 lb bag');

  const globals = {
    wastePct:   parseFloat(wastePct) || 0,
    currency,
    pricePerM3: parseFloat(pricePerM3) || 0,
    bagSel,
  };

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span><span>Concrete Calculator</span>
          </div>
          <h1>Concrete Calculator</h1>
          <p className="subtitle">
            Calculate the exact volume of concrete needed for slabs, columns, footings, and steps — in m³, yd³, and bags — with waste allowance and optional cost estimate.
          </p>
        </div>

        <div className="tool-box">

          {/* Global options bar */}
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'20px', padding:'12px 16px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
            <div className="form-group" style={{flex:'1 1 100px',margin:0}}>
              <label>Waste allowance (%)</label>
              <input type="number" value={wastePct} min="0" max="50"
                onChange={e=>setWastePct(e.target.value)}
                placeholder="10" style={{fontFamily:'var(--mono)'}} />
            </div>
            <div className="form-group" style={{flex:'1 1 130px',margin:0}}>
              <label>Price per m³ <span style={{fontSize:'0.7rem',color:'var(--text-3)',fontWeight:400}}>optional</span></label>
              <input type="number" value={pricePerM3} min="0"
                onChange={e=>setPricePerM3(e.target.value)}
                placeholder="e.g. 180" style={{fontFamily:'var(--mono)'}} />
            </div>
            <div className="form-group" style={{flex:'0 0 100px',margin:0}}>
              <label>Currency</label>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{fontFamily:'var(--mono)'}}>
                {['$','£','€','A$','C$','R','₹'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{flex:'1 1 130px',margin:0}}>
              <label>Highlight bag size</label>
              <select value={bagSel} onChange={e=>setBagSel(e.target.value)} style={{fontFamily:'var(--mono)'}}>
                {BAGS.map(b=><option key={b.label} value={b.label}>{b.label}</option>)}
              </select>
            </div>
          </div>

          {/* Shape selector */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(145px,1fr))', gap:'8px', marginBottom:'24px' }}>
            {SHAPES.map((s,i)=>(
              <button key={s.label} onClick={()=>setShape(i)}
                style={{
                  background: shape===i ? 'var(--accent-light)' : 'var(--surface2)',
                  border:`1.5px solid ${shape===i?'var(--accent)':'var(--border)'}`,
                  borderRadius:'var(--radius-sm)', padding:'10px 12px',
                  cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                }}>
                <div style={{fontSize:'0.82rem',fontWeight:700,color:shape===i?'var(--accent-hover)':'var(--text)',lineHeight:1.2}}>{s.label}</div>
                <div style={{fontSize:'0.7rem',fontFamily:'var(--mono)',color:'var(--text-3)',marginTop:'3px'}}>{s.desc}</div>
              </button>
            ))}
          </div>

          {shape===0 && <SlabMode    globals={globals} />}
          {shape===1 && <ColumnMode  globals={globals} />}
          {shape===2 && <FootingMode globals={globals} />}
          {shape===3 && <StepsMode   globals={globals} />}
        </div>

        <div className="seo-content">
          <h2>How to Use the Concrete Calculator</h2>
          <p>
            Select your pour shape, enter dimensions in any unit you prefer (m, cm, mm, ft, in, or yd), and press Calculate. Results show volume in cubic metres, cubic yards, and cubic feet, plus the estimated weight and the number of pre-mixed bags needed across six common bag sizes.
          </p>
          <p>
            <strong>Slab / Floor</strong> covers driveways, patios, garden paths, and any flat pour. A typical residential driveway is 100mm (4 in) thick; structural floor slabs are usually 150–200mm.
          </p>
          <p>
            <strong>Column / Pier</strong> uses the formula πr²h for circular sections — fence post footings, deck piers, and structural columns. Multiply by count to get the total for a row of piers in one step.
          </p>
          <p>
            <strong>Footing / Wall</strong> handles rectangular sections: strip footings, pad footings, retaining walls, and concrete cores. Enter length, width, and depth, plus the number of identical elements.
          </p>
          <p>
            <strong>Steps</strong> calculates staircase volume from the number of steps, width, rise (vertical height), and run (horizontal depth). Standard residential steps use a 175mm rise and 250–300mm run.
          </p>
          <p>
            Set a <strong>waste allowance</strong> (10% recommended) for spillage and finishing. If you enter a price per m³, the tool estimates your total ready-mix cost.
          </p>
        </div>

        <div className="tool-box" style={{marginBottom:'32px'}}>
          <h2 className="tool-box-title">Common Concrete Calculations</h2>
          <div className="result-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))'}}>
            {[
              {label:'Driveway 5m × 3m × 100mm',           value:'1.65 m³',  sub:'incl. 10% waste'},
              {label:'Patio 4m × 3m × 75mm',               value:'0.99 m³',  sub:'incl. 10% waste'},
              {label:'Column 300mm dia × 1.2m high (×4)',   value:'0.34 m³',  sub:'4 round piers'},
              {label:'Footing 1.2m × 0.6m × 0.3m (×6)',    value:'1.43 m³',  sub:'6 pad footings'},
              {label:'5 steps, 1.2m wide, 175mm rise/250mm run', value:'0.26 m³', sub:'staircase'},
              {label:'Garage floor 6m × 6m × 100mm',        value:'3.96 m³',  sub:'incl. 10% waste'},
            ].map(ex=>(
              <div key={ex.label} className="result-stat">
                <div style={{fontFamily:'var(--mono)',fontSize:'0.7rem',color:'var(--text-2)',marginBottom:'4px',lineHeight:1.4}}>{ex.label}</div>
                <div className="stat-value" style={{fontSize:'1.2rem'}}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="concrete-calculator" />
      </div>
    </div>
  );
}
