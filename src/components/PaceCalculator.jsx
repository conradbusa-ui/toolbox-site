import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core helpers ──────────────────────────────────────────────

// Parse "H:MM:SS" or "MM:SS" or plain seconds → total seconds
function parseTime(str) {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

// Format total seconds → "H:MM:SS" (omit hours if 0) or "MM:SS"
function fmtTime(totalSec, forceHours = false) {
  if (!isFinite(totalSec) || totalSec < 0) return '—';
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0 || forceHours) {
    return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// Format pace seconds/km or /mi → "MM:SS /unit"
function fmtPace(secPerUnit, unit = 'km') {
  if (!isFinite(secPerUnit) || secPerUnit <= 0) return '—';
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  return `${m}:${String(s).padStart(2,'0')} /${unit}`;
}

// Distance conversions
const KM_TO_MI = 0.621371;
const MI_TO_KM = 1.60934;

function kmToMi(km) { return km * KM_TO_MI; }
function miToKm(mi) { return mi * MI_TO_KM; }

function parseDistance(val, unit) {
  const n = parseFloat(val);
  if (isNaN(n) || n <= 0) return null;
  return unit === 'km' ? n : miToKm(n); // always return km
}

// Speed conversions
function paceToSpeed(secPerKm) { return 3600 / secPerKm; } // km/h
function speedToPace(kmph)     { return 3600 / kmph;      } // sec/km

// Core calculations
function calcPace(distKm, totalSec) {
  return totalSec / distKm; // sec/km
}

function calcTime(distKm, secPerKm) {
  return distKm * secPerKm; // total seconds
}

function calcDist(totalSec, secPerKm) {
  return totalSec / secPerKm; // km
}

// Standard race distances in km
const RACE_DISTANCES = [
  { label: '1 km',          km: 1,       mi: 0.621 },
  { label: '1 mile',        km: 1.60934, mi: 1     },
  { label: '5K',            km: 5,       mi: 3.107 },
  { label: '10K',           km: 10,      mi: 6.214 },
  { label: 'Half marathon', km: 21.0975, mi: 13.109},
  { label: 'Marathon',      km: 42.195,  mi: 26.219},
  { label: '50K ultra',     km: 50,      mi: 31.07 },
  { label: '100K ultra',    km: 100,     mi: 62.14 },
];

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
      textAlign: 'center', flex: '1 1 130px', minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: 'clamp(1rem,2.8vw,1.55rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

function TimeInput({ label, value, onChange, hint }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. 25:30 or 1:45:00"
        style={{ fontFamily: 'var(--mono)', fontSize: '1rem', letterSpacing: '0.05em' }}
      />
      {hint && <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '3px' }}>{hint}</p>}
    </div>
  );
}

// ── Mode 1: Pace calculator (dist + time → pace) ──────────────

function PaceMode() {
  const [distance, setDistance] = useState('');
  const [distUnit,  setDistUnit] = useState('km');
  const [time,      setTime]     = useState('');
  const [result,    setResult]   = useState(null);
  const [error,     setError]    = useState('');
  const [toast,     setToast]    = useState('');

  function loadPreset(km) {
    setDistance(distUnit === 'km' ? fmt(km, 3) : fmt(kmToMi(km), 3));
    setResult(null); setError('');
  }

  function calculate() {
    const distKm = parseDistance(distance, distUnit);
    const totalSec = parseTime(time);
    if (!distKm) { setError('Enter a valid distance.'); setResult(null); return; }
    if (totalSec === null || totalSec <= 0) { setError('Enter a valid time (MM:SS or H:MM:SS).'); setResult(null); return; }

    const secPerKm   = calcPace(distKm, totalSec);
    const kmph       = paceToSpeed(secPerKm);
    const mph        = kmph * KM_TO_MI;

    // Race finish times at this pace
    const splits = RACE_DISTANCES.map(r => ({
      ...r,
      finishSec: calcTime(r.km, secPerKm),
    }));

    setResult({ secPerKm, secPerMi: secPerKm * MI_TO_KM, kmph, mph, totalSec, distKm, splits });
    setError('');
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(
      `Pace: ${fmtPace(result.secPerKm, 'km')} (${fmtPace(result.secPerMi, 'mi')})\nSpeed: ${fmt(result.kmph)} km/h (${fmt(result.mph)} mph)`
    ).then(() => { setToast('Copied!'); setTimeout(() => setToast(''), 2000); });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your distance and finish time to calculate your running pace per kilometre and per mile.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Distance</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={distance} min="0"
              onChange={e => { setDistance(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={distUnit === 'km' ? 'e.g. 10' : 'e.g. 6.2'}
              style={{ flex: 1, fontFamily: 'var(--mono)' }} />
            <select value={distUnit} onChange={e => { setDistUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '68px', padding: '4px 6px' }}>
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </div>
        </div>
        <TimeInput label="Finish time (H:MM:SS)" value={time}
          onChange={v => { setTime(v); setResult(null); setError(''); }}
          hint="Enter as MM:SS or H:MM:SS" />
      </div>

      {/* Race presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Common distances</p>
        <div className="tag-row">
          {RACE_DISTANCES.map(r => (
            <button key={r.label} className="tag" onClick={() => loadPreset(r.km)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate pace</button>
        <button className="btn btn-ghost" onClick={() => { setDistance(''); setTime(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Your pace</div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtPace(result.secPerKm, 'km')}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtPace(result.secPerMi, 'mi')} &nbsp;·&nbsp; {fmt(result.kmph)} km/h &nbsp;·&nbsp; {fmt(result.mph)} mph
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Pace per km"  value={fmtPace(result.secPerKm, 'km')} />
            <StatCard accent label="Pace per mile" value={fmtPace(result.secPerMi, 'mi')} />
            <StatCard label="Speed (km/h)" value={`${fmt(result.kmph)} km/h`} />
            <StatCard label="Speed (mph)"  value={`${fmt(result.mph)} mph`}   />
          </div>

          {/* Race time projections */}
          <SectionTitle>Projected finish times at this pace</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '8px' }}>
            {result.splits.map(r => (
              <div key={r.label} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{fmt(r.km)} km / {fmt(r.mi)} mi</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', fontSize: '0.92rem' }}>
                  {fmtTime(r.finishSec, r.finishSec >= 3600)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Finish time calculator (dist + pace → time) ───────

function TimeMode() {
  const [distance, setDistance] = useState('');
  const [distUnit,  setDistUnit] = useState('km');
  const [pace,      setPace]     = useState('');
  const [paceUnit,  setPaceUnit] = useState('km');
  const [result,    setResult]   = useState(null);
  const [error,     setError]    = useState('');

  function loadPreset(km) {
    setDistance(distUnit === 'km' ? fmt(km, 3) : fmt(kmToMi(km), 3));
    setResult(null); setError('');
  }

  function calculate() {
    const distKm   = parseDistance(distance, distUnit);
    const paceSec  = parseTime(pace); // sec per km or per mi
    if (!distKm) { setError('Enter a valid distance.'); setResult(null); return; }
    if (paceSec === null || paceSec <= 0) { setError('Enter a valid pace (MM:SS).'); setResult(null); return; }

    // Convert pace to sec/km
    const secPerKm = paceUnit === 'km' ? paceSec : paceSec / MI_TO_KM;
    const totalSec = calcTime(distKm, secPerKm);
    const kmph     = paceToSpeed(secPerKm);
    const mph      = kmph * KM_TO_MI;

    setResult({ totalSec, secPerKm, secPerMi: secPerKm * MI_TO_KM, kmph, mph, distKm });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your distance and target pace to calculate your projected finish time.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Distance</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={distance} min="0"
              onChange={e => { setDistance(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={distUnit === 'km' ? '42.195' : '26.219'}
              style={{ flex: 1, fontFamily: 'var(--mono)' }} />
            <select value={distUnit} onChange={e => { setDistUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '68px', padding: '4px 6px' }}>
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Target pace</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="text" value={pace}
              onChange={e => { setPace(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 5:30"
              style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: '1rem' }} />
            <select value={paceUnit} onChange={e => { setPaceUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', width: '68px', padding: '4px 6px' }}>
              <option value="km">/km</option>
              <option value="mi">/mi</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Common distances</p>
        <div className="tag-row">
          {RACE_DISTANCES.map(r => (
            <button key={r.label} className="tag" onClick={() => loadPreset(r.km)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate time</button>
        <button className="btn btn-ghost" onClick={() => { setDistance(''); setPace(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Projected finish time</div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtTime(result.totalSec, true)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtPace(result.secPerKm,'km')} &nbsp;·&nbsp; {fmtPace(result.secPerMi,'mi')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Finish time"   value={fmtTime(result.totalSec, true)} />
            <StatCard label="Pace per km"   value={fmtPace(result.secPerKm,'km')} />
            <StatCard label="Pace per mile"  value={fmtPace(result.secPerMi,'mi')} />
            <StatCard label="Speed"          value={`${fmt(result.kmph)} km/h`}  sub={`${fmt(result.mph)} mph`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Distance calculator (time + pace → distance) ──────

function DistanceMode() {
  const [time,     setTime]     = useState('');
  const [pace,     setPace]     = useState('');
  const [paceUnit, setPaceUnit] = useState('km');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  function calculate() {
    const totalSec = parseTime(time);
    const paceSec  = parseTime(pace);
    if (totalSec === null || totalSec <= 0) { setError('Enter a valid time (H:MM:SS).'); setResult(null); return; }
    if (paceSec === null || paceSec <= 0)   { setError('Enter a valid pace (MM:SS).'); setResult(null); return; }

    const secPerKm  = paceUnit === 'km' ? paceSec : paceSec / MI_TO_KM;
    const distKm    = calcDist(totalSec, secPerKm);
    const distMi    = kmToMi(distKm);
    const kmph      = paceToSpeed(secPerKm);

    setResult({ distKm, distMi, secPerKm, secPerMi: secPerKm * MI_TO_KM, kmph, mph: kmph * KM_TO_MI });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your total time and pace to calculate how far you will run.
      </p>

      <div className="form-row">
        <TimeInput label="Total time (H:MM:SS)" value={time}
          onChange={v => { setTime(v); setResult(null); setError(''); }}
          hint="e.g. 1:00:00 for 1 hour" />
        <div className="form-group">
          <label>Pace</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="text" value={pace}
              onChange={e => { setPace(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 5:30"
              style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: '1rem' }} />
            <select value={paceUnit} onChange={e => { setPaceUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', width: '68px', padding: '4px 6px' }}>
              <option value="km">/km</option>
              <option value="mi">/mi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate distance</button>
        <button className="btn btn-ghost" onClick={() => { setTime(''); setPace(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Distance covered</div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(result.distKm, 2)} km
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmt(result.distMi, 2)} miles &nbsp;·&nbsp; {fmt(result.kmph)} km/h
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Distance (km)"  value={`${fmt(result.distKm, 2)} km`} />
            <StatCard accent label="Distance (mi)"  value={`${fmt(result.distMi, 2)} mi`} />
            <StatCard label="Pace /km"       value={fmtPace(result.secPerKm,'km')} />
            <StatCard label="Speed"           value={`${fmt(result.kmph)} km/h`} sub={`${fmt(result.mph)} mph`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Pace converter ────────────────────────────────────

function ConverterMode() {
  const [inputVal,  setInputVal]  = useState('');
  const [inputType, setInputType] = useState('pace_km'); // pace_km | pace_mi | kmph | mph
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

  const INPUT_TYPES = [
    { id: 'pace_km', label: 'Pace /km',  placeholder: 'e.g. 5:30' },
    { id: 'pace_mi', label: 'Pace /mi',  placeholder: 'e.g. 8:51' },
    { id: 'kmph',    label: 'km/h',      placeholder: 'e.g. 10.9'  },
    { id: 'mph',     label: 'mph',        placeholder: 'e.g. 6.8'  },
  ];

  function convert() {
    let secPerKm;
    if (inputType === 'pace_km') {
      const sec = parseTime(inputVal);
      if (!sec || sec <= 0) { setError('Enter a valid pace (MM:SS).'); setResult(null); return; }
      secPerKm = sec;
    } else if (inputType === 'pace_mi') {
      const sec = parseTime(inputVal);
      if (!sec || sec <= 0) { setError('Enter a valid pace (MM:SS).'); setResult(null); return; }
      secPerKm = sec / MI_TO_KM;
    } else if (inputType === 'kmph') {
      const v = parseFloat(inputVal);
      if (isNaN(v) || v <= 0) { setError('Enter a valid speed in km/h.'); setResult(null); return; }
      secPerKm = speedToPace(v);
    } else {
      const v = parseFloat(inputVal);
      if (isNaN(v) || v <= 0) { setError('Enter a valid speed in mph.'); setResult(null); return; }
      secPerKm = speedToPace(v * MI_TO_KM);
    }

    const kmph    = paceToSpeed(secPerKm);
    const mph     = kmph * KM_TO_MI;
    const secPerMi = secPerKm * MI_TO_KM;

    setResult({ secPerKm, secPerMi, kmph, mph });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Convert between pace per km, pace per mile, km/h, and mph instantly.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {INPUT_TYPES.map(t => (
          <button key={t.id} className={`tag${inputType === t.id ? ' active' : ''}`}
            onClick={() => { setInputType(t.id); setResult(null); setError(''); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ maxWidth: '240px' }}>
        <label>Value ({INPUT_TYPES.find(t => t.id === inputType)?.label})</label>
        <input type="text" value={inputVal}
          onChange={e => { setInputVal(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && convert()}
          placeholder={INPUT_TYPES.find(t => t.id === inputType)?.placeholder}
          style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={convert}>Convert</button>
        <button className="btn btn-ghost" onClick={() => { setInputVal(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <StatCard accent label="Pace per km"  value={fmtPace(result.secPerKm,'km')} />
          <StatCard accent label="Pace per mile" value={fmtPace(result.secPerMi,'mi')} />
          <StatCard accent label="Speed (km/h)" value={`${fmt(result.kmph)} km/h`} />
          <StatCard accent label="Speed (mph)"  value={`${fmt(result.mph)} mph`} />
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Pace',          desc: 'dist + time → pace'     },
  { label: 'Finish Time',   desc: 'dist + pace → time'     },
  { label: 'Distance',      desc: 'time + pace → distance' },
  { label: 'Pace Converter',desc: 'km/h ↔ min/km ↔ mph'   },
];

export default function PaceCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Pace Calculator</span>
          </div>
          <h1>Pace Calculator</h1>
          <p className="subtitle">
            Calculate your running pace, projected finish time, or distance covered — for any race from 1 km to 100K — with instant conversion between min/km, min/mile, km/h, and mph.
          </p>
        </div>

        {/* Tool */}
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

          {mode === 0 && <PaceMode />}
          {mode === 1 && <TimeMode />}
          {mode === 2 && <DistanceMode />}
          {mode === 3 && <ConverterMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Pace Calculator</h2>
          <p>
            A running pace calculator helps you plan training, set race goals, and track progress. This tool covers all three variations of the fundamental running equation — give it any two of <em>distance</em>, <em>time</em>, and <em>pace</em>, and it calculates the third.
          </p>
          <p>
            <strong>Pace</strong> mode takes your distance and finish time to calculate your average pace per kilometre and per mile, your speed in km/h and mph, and projected finish times at that pace for every standard race distance from 1 km to 100K ultra. This is the most common use case — enter your last training run to see your pace, or enter a race result to compare across distances.
          </p>
          <p>
            <strong>Finish Time</strong> mode lets you set a target pace and calculate exactly what your finish time will be for any race. This is invaluable for race planning — "if I run 5:15/km, what will my marathon time be?" Time inputs accept both MM:SS and H:MM:SS formats.
          </p>
          <p>
            <strong>Distance</strong> mode answers "how far will I get in X minutes at Y pace?" — useful for time-capped runs, treadmill sessions, and interval training.
          </p>
          <p>
            <strong>Pace Converter</strong> instantly converts between the four common speed and pace formats: minutes per kilometre (min/km, used in most of the world), minutes per mile (min/mi, used in the US and UK), kilometres per hour (km/h), and miles per hour (mph). All four values are shown simultaneously so you can use whichever unit your watch or training plan uses.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Pace Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '10K in 50:00',             value: '5:00 /km', sub: '12.0 km/h · 7:27 /mi' },
              { label: 'Marathon in 4:00:00',      value: '5:41 /km', sub: '10.5 km/h · 9:09 /mi' },
              { label: '5K in 25:00',              value: '5:00 /km', sub: '50:00 for 10K at same pace' },
              { label: 'Half marathon in 1:45:00', value: '4:58 /km', sub: '12.1 km/h · 7:59 /mi' },
              { label: '10.0 km/h',                value: '6:00 /km', sub: '9:39 /mi' },
              { label: '1:00:00 at 5:30/km',       value: '10.91 km', sub: '6.78 miles covered' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="pace-calculator" />
      </div>
    </div>
  );
}
