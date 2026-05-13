import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Helpers ───────────────────────────────────────────────────

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}
function fmtCurrency(n, symbol = '$') {
  if (!isFinite(n) || isNaN(n)) return '—';
  return `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Core calculation ──────────────────────────────────────────

// kWh = (watts × hours/day × days) / 1000
function calcKwh(watts, hoursPerDay, days) {
  return (watts * hoursPerDay * days) / 1000;
}

// Cost = kWh × rate (per kWh)
function calcCost(kwh, ratePerKwh) {
  return kwh * ratePerKwh;
}

// ── Appliance presets ─────────────────────────────────────────

const APPLIANCE_PRESETS = [
  { category: 'Kitchen',     name: 'Refrigerator',       watts: 150,  hoursPerDay: 24 },
  { category: 'Kitchen',     name: 'Microwave',           watts: 1100, hoursPerDay: 0.25 },
  { category: 'Kitchen',     name: 'Electric oven',       watts: 2400, hoursPerDay: 1 },
  { category: 'Kitchen',     name: 'Dishwasher',          watts: 1500, hoursPerDay: 1 },
  { category: 'Kitchen',     name: 'Coffee maker',        watts: 800,  hoursPerDay: 0.5 },
  { category: 'Laundry',     name: 'Washing machine',     watts: 500,  hoursPerDay: 1 },
  { category: 'Laundry',     name: 'Tumble dryer',        watts: 3000, hoursPerDay: 1 },
  { category: 'Heating/Cooling', name: 'Air conditioner (room)', watts: 1200, hoursPerDay: 8 },
  { category: 'Heating/Cooling', name: 'Space heater',    watts: 1500, hoursPerDay: 6 },
  { category: 'Heating/Cooling', name: 'Ceiling fan',     watts: 75,   hoursPerDay: 8 },
  { category: 'Lighting',    name: 'LED bulb (10W)',       watts: 10,   hoursPerDay: 5 },
  { category: 'Lighting',    name: 'Incandescent (60W)',   watts: 60,   hoursPerDay: 5 },
  { category: 'Electronics', name: 'Television (55")',     watts: 100,  hoursPerDay: 4 },
  { category: 'Electronics', name: 'Desktop computer',    watts: 200,  hoursPerDay: 8 },
  { category: 'Electronics', name: 'Laptop',              watts: 50,   hoursPerDay: 8 },
  { category: 'Electronics', name: 'Gaming console',      watts: 150,  hoursPerDay: 3 },
  { category: 'Electronics', name: 'Phone charger',       watts: 20,   hoursPerDay: 2 },
  { category: 'Electronics', name: 'WiFi router',         watts: 10,   hoursPerDay: 24 },
  { category: 'Other',       name: 'Electric water heater',watts: 4000, hoursPerDay: 3 },
  { category: 'Other',       name: 'Pool pump',           watts: 1500, hoursPerDay: 6 },
  { category: 'Other',       name: 'EV charger (Level 2)',watts: 7200, hoursPerDay: 2 },
];

const CATEGORIES = [...new Set(APPLIANCE_PRESETS.map(a => a.category))];

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

// ── Mode 1: Appliance list calculator ────────────────────────

const EMPTY_APPLIANCE = { name: '', watts: '', hoursPerDay: '', daysPerMonth: '30' };

function ApplianceListMode() {
  const [appliances, setAppliances] = useState([
    { name: 'Refrigerator',  watts: '150',  hoursPerDay: '24', daysPerMonth: '30' },
    { name: 'LED lights (×5)',watts: '50',  hoursPerDay: '6',  daysPerMonth: '30' },
    { name: 'Television',    watts: '100',  hoursPerDay: '4',  daysPerMonth: '30' },
  ]);
  const [rate, setRate]       = useState('0.15');
  const [currency, setCurrency] = useState('$');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [filterCat, setFilterCat] = useState('All');

  function update(i, field, val) {
    setAppliances(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
    setResult(null);
  }

  function addPreset(preset) {
    setAppliances(prev => [...prev, {
      name: preset.name,
      watts: String(preset.watts),
      hoursPerDay: String(preset.hoursPerDay),
      daysPerMonth: '30',
    }]);
    setResult(null);
  }

  function removeRow(i) {
    if (appliances.length <= 1) return;
    setAppliances(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function calculate() {
    const rateVal = parseFloat(rate);
    if (isNaN(rateVal) || rateVal <= 0) { setError('Enter a valid electricity rate (per kWh).'); setResult(null); return; }

    const rows = appliances.map(a => {
      const w = parseFloat(a.watts);
      const h = parseFloat(a.hoursPerDay);
      const d = parseFloat(a.daysPerMonth) || 30;
      if (isNaN(w) || isNaN(h) || w < 0 || h < 0) return null;
      const kwh  = calcKwh(w, h, d);
      const cost = calcCost(kwh, rateVal);
      return { ...a, w, h, d, kwh, cost };
    });

    const validRows = rows.filter(Boolean);
    if (validRows.length === 0) { setError('Enter watts and hours/day for at least one appliance.'); setResult(null); return; }

    const totalKwh     = validRows.reduce((s, r) => s + r.kwh, 0);
    const totalCost    = validRows.reduce((s, r) => s + r.cost, 0);
    const annualKwh    = totalKwh * 12;
    const annualCost   = totalCost * 12;
    const dailyKwh     = totalKwh / 30;
    const dailyCost    = totalCost / 30;

    setResult({ rows: validRows, totalKwh, totalCost, annualKwh, annualCost, dailyKwh, dailyCost, rateVal, currency });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Monthly electricity cost: ${fmtCurrency(result.totalCost, result.currency)}`,
      `Monthly consumption: ${fmt(result.totalKwh)} kWh`,
      `Annual cost: ${fmtCurrency(result.annualCost, result.currency)}`,
      '',
      ...result.rows.map(r => `${r.name}: ${fmt(r.kwh)} kWh/mo (${fmtCurrency(r.cost, result.currency)})`),
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => { setToast('Copied!'); setTimeout(() => setToast(''), 2000); });
  }

  const filteredPresets = filterCat === 'All' ? APPLIANCE_PRESETS : APPLIANCE_PRESETS.filter(a => a.category === filterCat);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Add your appliances with their wattage and daily usage to calculate your monthly electricity bill.
      </p>

      {/* Rate + currency */}
      <div className="form-row">
        <div className="form-group">
          <label>Electricity rate (per kWh)</label>
          <input type="number" value={rate} min="0" step="0.001"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 0.15" style={{ fontFamily: 'var(--mono)' }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
            Check your electricity bill for your local rate (typically $0.10–$0.30/kWh).
          </p>
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)' }}>
            {['$', '£', '€', '₹', 'A$', 'C$', 'R'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appliance table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '520px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Appliance', 'Watts', 'Hours/day', 'Days/month', 'kWh/month', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appliances.map((a, i) => {
              const w = parseFloat(a.watts), h = parseFloat(a.hoursPerDay), d = parseFloat(a.daysPerMonth) || 30;
              const preview = !isNaN(w) && !isNaN(h) ? calcKwh(w, h, d) : null;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="text" value={a.name} onChange={e => update(i, 'name', e.target.value)}
                      placeholder={`Appliance ${i + 1}`} style={{ fontSize: '0.85rem', width: '140px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.watts} min="0"
                      onChange={e => update(i, 'watts', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && calculate()}
                      placeholder="0" style={{ fontFamily: 'var(--mono)', width: '72px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.hoursPerDay} min="0" max="24" step="0.5"
                      onChange={e => update(i, 'hoursPerDay', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && calculate()}
                      placeholder="0" style={{ fontFamily: 'var(--mono)', width: '72px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.daysPerMonth} min="1" max="31"
                      onChange={e => update(i, 'daysPerMonth', e.target.value)}
                      placeholder="30" style={{ fontFamily: 'var(--mono)', width: '65px' }} />
                  </td>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', whiteSpace: 'nowrap' }}>
                    {preview !== null ? `${fmt(preview)} kWh` : '—'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <button onClick={() => removeRow(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '4px 6px', borderRadius: '4px' }}
                      onMouseEnter={e => e.target.style.color = '#dc2626'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="btn-group" style={{ marginTop: '10px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate bill</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setAppliances(prev => [...prev, { ...EMPTY_APPLIANCE }]); setResult(null); }}>+ Add appliance</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowPresets(v => !v)}>
          {showPresets ? 'Hide' : 'Browse'} presets
        </button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
        <button className="btn btn-ghost" onClick={() => {
          setAppliances([
            { name: 'Refrigerator', watts: '150', hoursPerDay: '24', daysPerMonth: '30' },
            { name: 'LED lights (×5)', watts: '50', hoursPerDay: '6', daysPerMonth: '30' },
            { name: 'Television', watts: '100', hoursPerDay: '4', daysPerMonth: '30' },
          ]); setResult(null); setError('');
        }}>Reset</button>
      </div>

      {/* Preset browser */}
      {showPresets && (
        <div style={{ marginTop: '14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Add from presets</p>
          <div className="tag-row" style={{ marginBottom: '10px' }}>
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} className={`tag${filterCat === cat ? ' active' : ''}`} onClick={() => setFilterCat(cat)}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '6px' }}>
            {filteredPresets.map(p => (
              <button key={p.name} onClick={() => addPreset(p)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '7px 10px',
                  cursor: 'pointer', fontSize: '0.8rem', transition: 'border-color 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.75rem', marginLeft: '8px', flexShrink: 0 }}>{p.watts}W</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Monthly cost banner */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px',
            textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Estimated monthly bill
            </div>
            <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtCurrency(result.totalCost, result.currency)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmt(result.totalKwh)} kWh at {result.currency}{fmt(result.rateVal, 3)}/kWh
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Daily cost"    value={fmtCurrency(result.dailyCost, result.currency)}    sub={`${fmt(result.dailyKwh, 2)} kWh/day`} />
            <StatCard label="Monthly kWh"   value={`${fmt(result.totalKwh)} kWh`} />
            <StatCard accent label="Annual cost" value={fmtCurrency(result.annualCost, result.currency)} sub={`${fmt(result.annualKwh, 0)} kWh/year`} />
          </div>

          {/* Per-appliance breakdown */}
          <SectionTitle>Breakdown by appliance</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...result.rows].sort((a, b) => b.cost - a.cost).map((r, i) => {
              const pct = result.totalCost > 0 ? (r.cost / result.totalCost) * 100 : 0;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                }}>
                  <div style={{ flex: '0 0 150px', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {r.name || `Appliance ${i + 1}`}
                  </div>
                  <div style={{ flex: 1, height: '7px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '99px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-3)', flex: '0 0 60px', textAlign: 'right' }}>{fmt(pct, 1)}%</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-hover)', flex: '0 0 65px', textAlign: 'right' }}>
                    {fmtCurrency(r.cost, result.currency)}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-3)', flex: '0 0 70px', textAlign: 'right' }}>
                    {fmt(r.kwh)} kWh
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Single appliance calculator ───────────────────────

function SingleApplianceMode() {
  const [watts, setWatts]       = useState('');
  const [hours, setHours]       = useState('');
  const [days, setDays]         = useState('30');
  const [rate, setRate]         = useState('0.15');
  const [currency, setCurrency] = useState('$');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  function calculate() {
    const w = parseFloat(watts), h = parseFloat(hours), d = parseFloat(days) || 30, r = parseFloat(rate);
    if (isNaN(w) || w <= 0) { setError('Enter a valid wattage.'); setResult(null); return; }
    if (isNaN(h) || h <= 0 || h > 24) { setError('Hours per day must be 0.1–24.'); setResult(null); return; }
    if (isNaN(r) || r <= 0) { setError('Enter a valid electricity rate.'); setResult(null); return; }

    const kwhDay   = calcKwh(w, h, 1);
    const kwhMonth = calcKwh(w, h, d);
    const kwhYear  = calcKwh(w, h, 365);
    const costDay   = calcCost(kwhDay, r);
    const costMonth = calcCost(kwhMonth, r);
    const costYear  = calcCost(kwhYear, r);

    setResult({ kwhDay, kwhMonth, kwhYear, costDay, costMonth, costYear, w, h, d, r, currency });
    setError('');
  }

  const QUICK_PRESETS = APPLIANCE_PRESETS.slice(0, 8);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate the electricity cost of a single appliance by entering its wattage and daily usage.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Wattage (W)</label>
          <input type="number" value={watts} min="0"
            onChange={e => { setWatts(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 1500" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Hours used per day</label>
          <input type="number" value={hours} min="0" max="24" step="0.5"
            onChange={e => { setHours(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 6" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Days per month</label>
          <input type="number" value={days} min="1" max="31"
            onChange={e => { setDays(e.target.value); setResult(null); setError(''); }}
            placeholder="30" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Rate per kWh</label>
          <input type="number" value={rate} min="0" step="0.001"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="0.15" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)' }}>
            {['$', '£', '€', '₹', 'A$', 'C$', 'R'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Quick appliance presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quick load</p>
        <div className="tag-row">
          {QUICK_PRESETS.map(p => (
            <button key={p.name} className="tag"
              onClick={() => { setWatts(String(p.watts)); setHours(String(p.hoursPerDay)); setResult(null); setError(''); }}>
              {p.name} ({p.watts}W)
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setWatts(''); setHours(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Per day"    value={fmtCurrency(result.costDay, result.currency)}   sub={`${fmt(result.kwhDay, 3)} kWh`} />
            <StatCard accent label="Per month" value={fmtCurrency(result.costMonth, result.currency)} sub={`${fmt(result.kwhMonth, 2)} kWh`} />
            <StatCard label="Per year"   value={fmtCurrency(result.costYear, result.currency)}  sub={`${fmt(result.kwhYear, 0)} kWh`} />
          </div>

          {/* Formula explanation */}
          <div style={{ marginTop: '14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong>{fmt(result.w, 0)}W</strong> × <strong>{fmt(result.h, 1)} hrs/day</strong> × <strong>{fmt(result.d, 0)} days</strong> ÷ 1000 = <strong style={{ color: 'var(--accent-hover)' }}>{fmt(result.kwhMonth, 2)} kWh</strong> × <strong>{result.currency}{fmt(result.r, 3)}/kWh</strong> = <strong style={{ color: 'var(--accent-hover)' }}>{fmtCurrency(result.costMonth, result.currency)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: kWh from bill ─────────────────────────────────────

function BillMode() {
  const [billAmount, setBillAmount] = useState('');
  const [rate, setRate]             = useState('0.15');
  const [currency, setCurrency]     = useState('$');
  const [standingCharge, setStanding] = useState('');
  const [days, setDays]             = useState('30');
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  function calculate() {
    const bill = parseFloat(billAmount);
    const r    = parseFloat(rate);
    const sc   = parseFloat(standingCharge) || 0;
    const d    = parseFloat(days) || 30;

    if (isNaN(bill) || bill <= 0) { setError('Enter a valid bill amount.'); setResult(null); return; }
    if (isNaN(r) || r <= 0) { setError('Enter a valid rate per kWh.'); setResult(null); return; }

    const energyCost = bill - sc;
    if (energyCost <= 0) { setError('Standing charge is higher than the total bill. Please check your values.'); setResult(null); return; }

    const kwh         = energyCost / r;
    const dailyKwh    = kwh / d;
    const dailyCost   = bill / d;
    const annualCost  = dailyCost * 365;
    const annualKwh   = dailyKwh * 365;

    setResult({ kwh, dailyKwh, dailyCost, annualCost, annualKwh, bill, r, sc, d, currency });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Work out how much energy you used from a bill amount, or find your effective rate per kWh.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Total bill amount</label>
          <input type="number" value={billAmount} min="0" step="0.01"
            onChange={e => { setBillAmount(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 120" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Rate per kWh</label>
          <input type="number" value={rate} min="0" step="0.001"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="0.15" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Standing / service charge <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
          <input type="number" value={standingCharge} min="0" step="0.01"
            onChange={e => { setStanding(e.target.value); setResult(null); setError(''); }}
            placeholder="e.g. 10" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Billing period (days)</label>
          <input type="number" value={days} min="1" max="92"
            onChange={e => { setDays(e.target.value); setResult(null); setError(''); }}
            placeholder="30" />
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)' }}>
            {['$', '£', '€', '₹', 'A$', 'C$', 'R'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setBillAmount(''); setStanding(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Energy used" value={`${fmt(result.kwh, 0)} kWh`} sub={`this billing period`} />
            <StatCard label="Daily usage"  value={`${fmt(result.dailyKwh, 2)} kWh`}  sub="per day" />
            <StatCard label="Daily cost"   value={fmtCurrency(result.dailyCost, result.currency)}   sub="avg per day" />
            <StatCard label="Annual est."  value={fmtCurrency(result.annualCost, result.currency)}  sub={`${fmt(result.annualKwh, 0)} kWh/yr`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Appliance List',      desc: 'full household bill'      },
  { label: 'Single Appliance',    desc: 'one device cost'          },
  { label: 'Bill Analyser',       desc: 'kWh from bill amount'     },
];

export default function ElectricityBillCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Electricity Bill Calculator</span>
          </div>
          <h1>Electricity Bill Calculator</h1>
          <p className="subtitle">
            Calculate your monthly electricity bill by appliance, find the running cost of any device, or work backwards from a bill to see how much energy you used.
          </p>
        </div>

        {/* Tool */}
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
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          {mode === 0 && <ApplianceListMode />}
          {mode === 1 && <SingleApplianceMode />}
          {mode === 2 && <BillMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Electricity Bill Calculator</h2>
          <p>
            This free electricity bill calculator helps you understand exactly where your electricity money goes — running entirely in your browser with no sign-up required. Switch between three modes depending on what you need.
          </p>
          <p>
            <strong>Appliance List</strong> is a full household calculator. Add all your appliances, enter the wattage (found on the device label or in the manual), daily hours of use, and days per month. The calculator totals up your monthly kWh consumption and cost, then breaks it down per appliance in a ranked bar chart so you can instantly see which devices cost the most. A library of 21 common appliance presets lets you add devices in one click.
          </p>
          <p>
            <strong>Single Appliance</strong> calculates the daily, monthly, and annual running cost of one device. It shows the full formula — watts × hours ÷ 1000 × rate — so you understand exactly how the figure was reached. Great for evaluating whether an upgrade to a more efficient appliance would pay for itself.
          </p>
          <p>
            <strong>Bill Analyser</strong> works backwards from a bill total: enter your bill amount, rate per kWh, and any standing/service charge to find out how many kWh you used, your daily average, and your projected annual cost. Useful for spotting whether your usage has changed between billing periods.
          </p>
          <p>
            Enter your local electricity rate — typically found on your electricity bill under "unit rate" or "rate per kWh." Rates vary widely by country and provider, from around $0.10/kWh in the US to £0.25/kWh in the UK.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Running Cost Examples (at $0.15/kWh)</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))' }}>
            {[
              { label: 'Refrigerator (150W, 24h/day)',    value: '$16.20',  sub: 'per month' },
              { label: 'Air conditioner (1200W, 8h/day)', value: '$43.20',  sub: 'per month' },
              { label: 'Tumble dryer (3000W, 1h/day)',    value: '$13.50',  sub: 'per month' },
              { label: 'LED bulb (10W, 5h/day)',          value: '$0.23',   sub: 'per month' },
              { label: 'EV charger (7200W, 2h/day)',      value: '$64.80',  sub: 'per month' },
              { label: 'Desktop PC (200W, 8h/day)',       value: '$7.20',   sub: 'per month' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="electricity-bill-calculator" />
      </div>
    </div>
  );
}
