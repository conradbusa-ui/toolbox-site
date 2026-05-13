import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Grade scales ──────────────────────────────────────────────

const GRADE_SCALES = {
  '4.0': [
    { letter: 'A+', points: 4.0, minPct: 97 },
    { letter: 'A',  points: 4.0, minPct: 93 },
    { letter: 'A-', points: 3.7, minPct: 90 },
    { letter: 'B+', points: 3.3, minPct: 87 },
    { letter: 'B',  points: 3.0, minPct: 83 },
    { letter: 'B-', points: 2.7, minPct: 80 },
    { letter: 'C+', points: 2.3, minPct: 77 },
    { letter: 'C',  points: 2.0, minPct: 73 },
    { letter: 'C-', points: 1.7, minPct: 70 },
    { letter: 'D+', points: 1.3, minPct: 67 },
    { letter: 'D',  points: 1.0, minPct: 63 },
    { letter: 'D-', points: 0.7, minPct: 60 },
    { letter: 'F',  points: 0.0, minPct: 0  },
  ],
  '5.0': [
    { letter: 'A+', points: 5.0, minPct: 97 },
    { letter: 'A',  points: 5.0, minPct: 93 },
    { letter: 'A-', points: 4.7, minPct: 90 },
    { letter: 'B+', points: 4.3, minPct: 87 },
    { letter: 'B',  points: 4.0, minPct: 83 },
    { letter: 'B-', points: 3.7, minPct: 80 },
    { letter: 'C+', points: 3.3, minPct: 77 },
    { letter: 'C',  points: 3.0, minPct: 73 },
    { letter: 'C-', points: 2.7, minPct: 70 },
    { letter: 'D+', points: 2.3, minPct: 67 },
    { letter: 'D',  points: 2.0, minPct: 63 },
    { letter: 'D-', points: 1.7, minPct: 60 },
    { letter: 'F',  points: 0.0, minPct: 0  },
  ],
  '10.0': [
    { letter: 'O',  points: 10, minPct: 91 },
    { letter: 'A+', points: 9,  minPct: 81 },
    { letter: 'A',  points: 8,  minPct: 71 },
    { letter: 'B+', points: 7,  minPct: 61 },
    { letter: 'B',  points: 6,  minPct: 51 },
    { letter: 'C',  points: 5,  minPct: 41 },
    { letter: 'P',  points: 4,  minPct: 35 },
    { letter: 'F',  points: 0,  minPct: 0  },
  ],
  '100': [
    { letter: 'A',  points: 100, minPct: 90 },
    { letter: 'B',  points: 80,  minPct: 80 },
    { letter: 'C',  points: 70,  minPct: 70 },
    { letter: 'D',  points: 60,  minPct: 60 },
    { letter: 'F',  points: 0,   minPct: 0  },
  ],
};

const GPA_STANDINGS = [
  { min: 3.9,  label: 'Summa Cum Laude',  color: '#7c3aed' },
  { min: 3.7,  label: 'Magna Cum Laude',  color: '#0891b2' },
  { min: 3.5,  label: 'Cum Laude',        color: '#0d9488' },
  { min: 3.0,  label: 'Good Standing',    color: '#16a34a' },
  { min: 2.0,  label: 'Satisfactory',     color: '#f59e0b' },
  { min: 0.0,  label: 'Academic Probation',color: '#dc2626'},
];

function getStanding(gpa, scale) {
  const max = parseFloat(scale);
  const normalised = (gpa / max) * 4.0;
  return GPA_STANDINGS.find(s => normalised >= s.min) || GPA_STANDINGS[GPA_STANDINGS.length - 1];
}

function gradeToPoints(letterOrPct, scale) {
  const grades = GRADE_SCALES[scale];
  // Try letter match first
  const byLetter = grades.find(g => g.letter.toUpperCase() === letterOrPct.trim().toUpperCase());
  if (byLetter) return byLetter.points;
  // Try percentage
  const pct = parseFloat(letterOrPct);
  if (!isNaN(pct) && pct >= 0 && pct <= 100) {
    const sorted = [...grades].sort((a, b) => b.minPct - a.minPct);
    const byPct  = sorted.find(g => pct >= g.minPct);
    return byPct ? byPct.points : 0;
  }
  return null;
}

function calcGPA(courses) {
  const valid = courses.filter(c => c.points !== null && c.credits > 0);
  if (valid.length === 0) return null;
  const totalPoints  = valid.reduce((s, c) => s + c.points * c.credits, 0);
  const totalCredits = valid.reduce((s, c) => s + c.credits, 0);
  return { gpa: totalPoints / totalCredits, totalCredits, totalPoints };
}

function fmt(n, dp = 2) {
  return isFinite(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

// ── Grade colour helper ───────────────────────────────────────

function gradeColor(letter) {
  const l = (letter || '').charAt(0).toUpperCase();
  const map = { A: '#16a34a', B: '#0891b2', C: '#f59e0b', D: '#f97316', F: '#dc2626', O: '#7c3aed', P: '#0d9488' };
  return map[l] || 'var(--text)';
}

// ── Shared UI ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '24px', marginBottom: '10px',
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

// ── GPA progress bar ──────────────────────────────────────────

function GPABar({ gpa, scale }) {
  const max = parseFloat(scale);
  const pct = Math.min((gpa / max) * 100, 100);
  const standing = getStanding(gpa, scale);

  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ position: 'relative', height: '12px', borderRadius: '99px', background: 'var(--surface2)', marginBottom: '8px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: `linear-gradient(to right, #dc2626, #f59e0b, #16a34a, #0d9488, #7c3aed)`,
          borderRadius: '99px',
          transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: '10px' }}>
        <span>0.0</span>
        <span>{(max / 2).toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', borderRadius: 'var(--radius-sm)',
        background: `${standing.color}18`, border: `1px solid ${standing.color}`,
        fontSize: '0.82rem', fontWeight: 700, color: standing.color,
      }}>
        {standing.label}
      </div>
    </div>
  );
}

// ── Mode 1: Semester / Single GPA ────────────────────────────

const EMPTY_COURSE = { name: '', grade: '', credits: '3', points: null };

function SemesterMode() {
  const [scale, setScale] = useState('4.0');
  const [courses, setCourses] = useState([
    { ...EMPTY_COURSE, name: 'Course 1' },
    { ...EMPTY_COURSE, name: 'Course 2' },
    { ...EMPTY_COURSE, name: 'Course 3' },
    { ...EMPTY_COURSE, name: 'Course 4' },
  ]);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  function updateCourse(i, field, val) {
    setCourses(prev => {
      const updated = prev.map((c, idx) => {
        if (idx !== i) return c;
        const next = { ...c, [field]: val };
        if (field === 'grade') {
          next.points = val.trim() ? gradeToPoints(val, scale) : null;
        }
        return next;
      });
      return updated;
    });
    setResult(null);
    setError('');
  }

  function addCourse() {
    setCourses(prev => [...prev, { ...EMPTY_COURSE, name: `Course ${prev.length + 1}` }]);
  }

  function removeCourse(i) {
    if (courses.length <= 1) return;
    setCourses(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function calculate() {
    const withPoints = courses.map(c => ({
      ...c,
      credits: parseFloat(c.credits) || 0,
      points: c.grade.trim() ? gradeToPoints(c.grade, scale) : null,
    }));

    const invalid = withPoints.filter(c => c.grade.trim() && c.points === null);
    if (invalid.length > 0) {
      setError(`Unrecognised grade${invalid.length > 1 ? 's' : ''}: ${invalid.map(c => `"${c.grade}"`).join(', ')}. Enter a letter grade (A, B+, etc.) or percentage.`);
      setResult(null);
      return;
    }

    const res = calcGPA(withPoints);
    if (!res) { setError('Enter at least one course with a grade and credits.'); setResult(null); return; }

    setResult({ ...res, courses: withPoints, scale });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `GPA: ${fmt(result.gpa)} / ${scale}`,
      `Total credits: ${result.totalCredits}`,
      `Standing: ${getStanding(result.gpa, scale).label}`,
      '',
      ...result.courses.filter(c => c.points !== null).map(c =>
        `${c.name || 'Course'}: ${c.grade} (${c.credits} cr) = ${fmt(c.points)} pts`
      ),
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const allGrades = GRADE_SCALES[scale].map(g => g.letter);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your courses, grades, and credit hours. Accepts letter grades (A, B+, C−) or percentages.
      </p>

      {/* Scale selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', alignSelf: 'center', marginRight: '4px' }}>Scale:</span>
        {Object.keys(GRADE_SCALES).map(s => (
          <button key={s}
            className={`tag${scale === s ? ' active' : ''}`}
            onClick={() => {
              setScale(s);
              setCourses(prev => prev.map(c => ({ ...c, points: c.grade.trim() ? gradeToPoints(c.grade, s) : null })));
              setResult(null);
            }}>
            {s} scale
          </button>
        ))}
      </div>

      {/* Course table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '460px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Course name', 'Grade', 'Credits', 'Grade points', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={c.name}
                    onChange={e => updateCourse(i, 'name', e.target.value)}
                    placeholder={`Course ${i + 1}`}
                    style={{ fontSize: '0.85rem', width: '140px' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={c.grade}
                    onChange={e => updateCourse(i, 'grade', e.target.value)}
                    placeholder="A, B+, 92…"
                    style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', width: '80px',
                      color: c.points !== null ? gradeColor(c.grade) : 'var(--text)' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="number" value={c.credits} min="0.5" max="12" step="0.5"
                    onChange={e => updateCourse(i, 'credits', e.target.value)}
                    style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '70px' }} />
                </td>
                <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: c.points !== null ? gradeColor(c.grade) : 'var(--text-3)' }}>
                  {c.points !== null ? fmt(c.points) : '—'}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <button onClick={() => removeCourse(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '4px 6px', borderRadius: '4px', transition: 'color 0.15s' }}
                    title="Remove course"
                    onMouseEnter={e => e.target.style.color = '#dc2626'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btn-group" style={{ marginTop: '12px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate GPA</button>
        <button className="btn btn-ghost btn-sm" onClick={addCourse}>+ Add course</button>
        <button className="btn btn-ghost" onClick={() => {
          setCourses([{ ...EMPTY_COURSE, name: 'Course 1' }, { ...EMPTY_COURSE, name: 'Course 2' }, { ...EMPTY_COURSE, name: 'Course 3' }, { ...EMPTY_COURSE, name: 'Course 4' }]);
          setResult(null); setError('');
        }}>Reset</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {/* Quick grade reference */}
      <div style={{ marginTop: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Grade reference ({scale} scale)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {GRADE_SCALES[scale].map(g => (
            <div key={g.letter} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '4px', padding: '2px 8px',
              fontSize: '0.72rem', fontFamily: 'var(--mono)',
              color: gradeColor(g.letter), fontWeight: 700,
            }}>
              {g.letter} = {g.points}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          <SectionTitle>Semester GPA</SectionTitle>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label={`GPA (${scale} scale)`} value={fmt(result.gpa)} sub={getStanding(result.gpa, scale).label} />
            <StatCard label="Total credits" value={result.totalCredits} sub="credit hours" />
            <StatCard label="Quality points" value={fmt(result.totalPoints, 1)} sub="grade pts × credits" />
            <StatCard label="Courses" value={result.courses.filter(c => c.points !== null).length} sub="counted" />
          </div>
          <GPABar gpa={result.gpa} scale={scale} />

          {/* Per-course breakdown */}
          <SectionTitle>Course breakdown</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.courses.filter(c => c.points !== null && c.credits > 0).map((c, i) => {
              const contribution = (c.points * c.credits);
              const pctOfTotal   = result.totalPoints > 0 ? (contribution / result.totalPoints) * 100 : 0;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                }}>
                  <div style={{ flex: '0 0 150px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name || `Course ${i + 1}`}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 700, color: gradeColor(c.grade), flex: '0 0 35px' }}>
                    {c.grade.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pctOfTotal}%`, height: '100%', background: gradeColor(c.grade), borderRadius: '99px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-3)', flex: '0 0 65px', textAlign: 'right' }}>
                    {c.credits} cr
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-hover)', flex: '0 0 45px', textAlign: 'right' }}>
                    {fmt(c.points)}
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

// ── Mode 2: Cumulative GPA ────────────────────────────────────

function CumulativeMode() {
  const [scale, setScale]         = useState('4.0');
  const [prevGPA, setPrevGPA]     = useState('');
  const [prevCredits, setPrevCredits] = useState('');
  const [semGPA, setSemGPA]       = useState('');
  const [semCredits, setSemCredits] = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  function calculate() {
    const pg = parseFloat(prevGPA);
    const pc = parseFloat(prevCredits);
    const sg = parseFloat(semGPA);
    const sc = parseFloat(semCredits);
    const maxScale = parseFloat(scale);

    if (isNaN(sg) || sg < 0 || sg > maxScale) { setError(`Semester GPA must be 0–${scale}.`); setResult(null); return; }
    if (isNaN(sc) || sc <= 0) { setError('Enter valid semester credits.'); setResult(null); return; }

    let cumulativeGPA, totalCredits;

    if (prevGPA.trim() && prevCredits.trim()) {
      if (isNaN(pg) || pg < 0 || pg > maxScale) { setError(`Previous GPA must be 0–${scale}.`); setResult(null); return; }
      if (isNaN(pc) || pc <= 0) { setError('Enter valid previous credits.'); setResult(null); return; }
      totalCredits = pc + sc;
      cumulativeGPA = (pg * pc + sg * sc) / totalCredits;
    } else {
      totalCredits  = sc;
      cumulativeGPA = sg;
    }

    setResult({ cumulativeGPA, totalCredits, prevGPA: pg, prevCredits: pc, semGPA: sg, semCredits: sc, scale });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Combine your previous cumulative GPA with your latest semester GPA to get your new overall GPA.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', alignSelf: 'center' }}>Scale:</span>
        {Object.keys(GRADE_SCALES).map(s => (
          <button key={s} className={`tag${scale === s ? ' active' : ''}`}
            onClick={() => { setScale(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      <SectionTitle>Previous cumulative GPA <span style={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 400 }}>(leave blank if this is your first semester)</span></SectionTitle>
      <div className="form-row">
        <div className="form-group">
          <label>Cumulative GPA</label>
          <input type="number" value={prevGPA} min="0" max={scale} step="0.01"
            onChange={e => { setPrevGPA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={`e.g. 3.50`} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Total credits earned</label>
          <input type="number" value={prevCredits} min="0"
            onChange={e => { setPrevCredits(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 60" />
        </div>
      </div>

      <SectionTitle>This semester</SectionTitle>
      <div className="form-row">
        <div className="form-group">
          <label>Semester GPA</label>
          <input type="number" value={semGPA} min="0" max={scale} step="0.01"
            onChange={e => { setSemGPA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={`e.g. 3.75`} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Semester credits</label>
          <input type="number" value={semCredits} min="0"
            onChange={e => { setSemCredits(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 15" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate cumulative GPA</button>
        <button className="btn btn-ghost" onClick={() => { setPrevGPA(''); setPrevCredits(''); setSemGPA(''); setSemCredits(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="New cumulative GPA" value={fmt(result.cumulativeGPA)} sub={getStanding(result.cumulativeGPA, result.scale).label} />
            <StatCard label="Total credits" value={result.totalCredits} sub="cumulative" />
            {!isNaN(result.prevGPA) && result.prevCredits > 0 && (
              <StatCard
                label="GPA change"
                value={result.cumulativeGPA >= result.prevGPA ? `+${fmt(result.cumulativeGPA - result.prevGPA)}` : fmt(result.cumulativeGPA - result.prevGPA)}
                color={result.cumulativeGPA >= result.prevGPA ? '#16a34a' : '#dc2626'}
                sub="from previous"
              />
            )}
          </div>
          <GPABar gpa={result.cumulativeGPA} scale={result.scale} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: GPA target / what-if ─────────────────────────────

function TargetMode() {
  const [scale, setScale]         = useState('4.0');
  const [currentGPA, setCurrentGPA] = useState('');
  const [currentCredits, setCurrentCredits] = useState('');
  const [targetGPA, setTargetGPA] = useState('');
  const [nextCredits, setNextCredits] = useState('15');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  function calculate() {
    const cg = parseFloat(currentGPA);
    const cc = parseFloat(currentCredits);
    const tg = parseFloat(targetGPA);
    const nc = parseFloat(nextCredits);
    const maxScale = parseFloat(scale);

    if (isNaN(cg) || cg < 0 || cg > maxScale) { setError(`Current GPA must be 0–${scale}.`); setResult(null); return; }
    if (isNaN(cc) || cc <= 0) { setError('Enter valid current credits.'); setResult(null); return; }
    if (isNaN(tg) || tg < 0 || tg > maxScale) { setError(`Target GPA must be 0–${scale}.`); setResult(null); return; }
    if (isNaN(nc) || nc <= 0) { setError('Enter valid upcoming credits.'); setResult(null); return; }

    // Required GPA in upcoming credits: (target × totalCredits − current × currentCredits) / nextCredits
    const totalCredits = cc + nc;
    const requiredGPA  = (tg * totalCredits - cg * cc) / nc;
    const feasible     = requiredGPA >= 0 && requiredGPA <= maxScale;

    // What GPA in next semester needed for various targets
    const scenarios = [3.5, 3.7, 3.9, maxScale].filter(g => g <= maxScale).map(target => {
      const req = (target * (cc + nc) - cg * cc) / nc;
      return { target, req, feasible: req >= 0 && req <= maxScale };
    });

    setResult({ currentGPA: cg, currentCredits: cc, targetGPA: tg, nextCredits: nc, totalCredits, requiredGPA, feasible, scenarios, scale });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find out what GPA you need in your upcoming semester to reach a target cumulative GPA.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', alignSelf: 'center' }}>Scale:</span>
        {Object.keys(GRADE_SCALES).map(s => (
          <button key={s} className={`tag${scale === s ? ' active' : ''}`}
            onClick={() => { setScale(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Current cumulative GPA</label>
          <input type="number" value={currentGPA} min="0" max={scale} step="0.01"
            onChange={e => { setCurrentGPA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3.20" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Credits completed</label>
          <input type="number" value={currentCredits} min="0"
            onChange={e => { setCurrentCredits(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 60" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Target cumulative GPA</label>
          <input type="number" value={targetGPA} min="0" max={scale} step="0.01"
            onChange={e => { setTargetGPA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3.50" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Upcoming semester credits</label>
          <input type="number" value={nextCredits} min="1"
            onChange={e => { setNextCredits(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 15" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate target</button>
        <button className="btn btn-ghost" onClick={() => { setCurrentGPA(''); setCurrentCredits(''); setTargetGPA(''); setNextCredits('15'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard
              accent
              label="Required next semester GPA"
              value={result.feasible ? fmt(result.requiredGPA) : 'Not possible'}
              sub={result.feasible
                ? `to reach ${fmt(result.targetGPA)} cumulative`
                : `target is not achievable in ${result.nextCredits} credits`}
              color={!result.feasible ? '#dc2626' : undefined}
            />
            <StatCard label="Total credits after" value={result.totalCredits} />
          </div>

          {!result.feasible && result.requiredGPA > parseFloat(scale) && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: '#fef2f2', border: '1px solid #fca5a5',
              fontSize: '0.82rem', color: '#dc2626',
            }}>
              ⚠ Achieving a {fmt(result.targetGPA)} cumulative GPA is mathematically impossible in {result.nextCredits} credits — even a perfect {scale} GPA would only bring you to {fmt((result.targetGPA * result.totalCredits - result.currentGPA * result.currentCredits) > 0 ? (parseFloat(scale) * result.nextCredits + result.currentGPA * result.currentCredits) / result.totalCredits : 0)}.
            </div>
          )}

          <SectionTitle>What-if scenarios</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.scenarios.map(s => (
              <div key={s.target} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                  To reach <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{fmt(s.target)}</span> cumulative GPA
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.9rem',
                  color: s.feasible ? 'var(--accent-hover)' : '#94a3b8',
                }}>
                  {s.feasible ? `Need ${fmt(s.req)} this semester` : 'Not achievable'}
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
  { label: 'Semester GPA',   desc: 'grade + credits per course' },
  { label: 'Cumulative GPA', desc: 'combine semesters'          },
  { label: 'GPA Target',     desc: 'what do I need to reach X?' },
];

export default function GPACalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>GPA Calculator</span>
          </div>
          <h1>GPA Calculator</h1>
          <p className="subtitle">
            Calculate your semester GPA, cumulative GPA across multiple semesters, and find out exactly what grades you need to hit your target GPA — on 4.0, 5.0, 10.0, or 100-point scales.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <SemesterMode />}
          {mode === 1 && <CumulativeMode />}
          {mode === 2 && <TargetMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Calculate Your GPA</h2>
          <p>
            GPA (Grade Point Average) is calculated by multiplying the grade points for each course by the number of credit hours, summing the results (quality points), and dividing by total credits. For example, a 3-credit A (4.0) and a 3-credit B (3.0) gives 12 + 9 = 21 quality points ÷ 6 credits = 3.5 GPA.
          </p>
          <p>
            This calculator supports four grading scales. The <strong>4.0 scale</strong> is the standard in most US colleges and universities. The <strong>5.0 scale</strong> is common in high schools that weight honours or AP courses. The <strong>10.0 scale</strong> is used widely in Indian universities. The <strong>100-point scale</strong> is a simple percentage-based system.
          </p>
          <p>
            <strong>Semester GPA</strong> calculates your GPA for a single semester from individual course grades and credit hours. Enter letter grades (A, B+, C−) or percentages — the tool converts them automatically for whichever scale you've selected. <strong>Cumulative GPA</strong> combines your existing GPA and credits with your latest semester to produce a new overall GPA. <strong>GPA Target</strong> works backwards — enter your current GPA, credits, target GPA, and upcoming credits, and it tells you exactly what semester GPA you need to achieve your goal, with what-if scenarios for common honour thresholds.
          </p>
          <p>
            Academic standings shown are based on common university conventions: Summa Cum Laude (3.9+), Magna Cum Laude (3.7+), Cum Laude (3.5+), and Good Standing (3.0+) on the 4.0 scale.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">GPA Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '4×A + 1×B (3cr each)', value: '3.80', sub: 'Magna Cum Laude' },
              { label: '3×B + 2×C (3cr each)', value: '2.60', sub: 'Satisfactory' },
              { label: 'Prev 3.2 (60cr) + 3.8 sem (15cr)', value: '3.32', sub: 'cumulative' },
              { label: 'Need 3.4 from 3.2 (30cr) + 15cr', value: '3.80 needed', sub: 'achievable on 4.0 scale' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="gpa-calculator" />
      </div>
    </div>
  );
}
