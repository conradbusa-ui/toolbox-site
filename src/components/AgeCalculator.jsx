import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function calcAge(dob, to) {
  const d1 = new Date(dob);
  const d2 = new Date(to);
  if (isNaN(d1) || isNaN(d2) || d1 > d2) return null;

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  const msInDay = 86400000;
  const totalDays = Math.floor((d2 - d1) / msInDay);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = totalDays * 24;

  // Next birthday
  const nextBd = new Date(d2.getFullYear(), d1.getMonth(), d1.getDate());
  if (nextBd <= d2) nextBd.setFullYear(nextBd.getFullYear() + 1);
  const daysToNextBd = Math.ceil((nextBd - d2) / msInDay);

  // Day of week born
  const dowNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dow = dowNames[d1.getDay()];

  return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, daysToNextBd, dow };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function AgeCalculator() {
  const [dob, setDob] = useState('');
  const [toDate, setToDate] = useState(todayStr());
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const calculate = () => {
    if (!dob) { setError('Please enter your date of birth.'); return; }
    const r = calcAge(dob, toDate);
    if (!r) { setError('Date of birth must be before the "as of" date.'); setResult(null); return; }
    setError('');
    setResult(r);
  };

  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Age Calculator</span>
          </div>
          <h1>Age Calculator</h1>
          <p className="subtitle">Find your exact age in years, months, days, weeks, and hours.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Your Age</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob-input">Date of Birth</label>
              <input
                id="dob-input"
                type="date"
                value={dob}
                max={todayStr()}
                onChange={e => { setDob(e.target.value); setResult(null); setError(''); }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="to-input">Age as of</label>
              <input
                id="to-input"
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setResult(null); setError(''); }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px' }}>{error}</p>
          )}

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate} disabled={!dob}>Calculate Age</button>
            <button className="btn btn-ghost" onClick={() => { setDob(''); setToDate(todayStr()); setResult(null); setError(''); }}>
              Reset
            </button>
          </div>

          {result && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="age-big">{result.years}</div>
                <div className="age-label">Years Old</div>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-2)' }}>
                  {result.years} years, {result.months} months, and {result.days} days
                </p>
              </div>

              <div className="result-grid">
                <div className="result-stat">
                  <div className="stat-value">{result.totalMonths.toLocaleString()}</div>
                  <div className="stat-label">Total Months</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.totalWeeks.toLocaleString()}</div>
                  <div className="stat-label">Total Weeks</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.totalDays.toLocaleString()}</div>
                  <div className="stat-label">Total Days</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.totalHours.toLocaleString()}</div>
                  <div className="stat-label">Total Hours</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.daysToNextBd}</div>
                  <div className="stat-label">Days to Birthday</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{result.dow}</div>
                  <div className="stat-label">Born on</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="seo-content">
          <h2>How Does the Age Calculator Work?</h2>
          <p>
            This age calculator works out the precise difference between two dates down to the day, accounting for
            leap years and varying month lengths. Enter your date of birth and it calculates your age as of today by
            default, or you can change the "as of" date to calculate age at any point in time — useful for legal or
            historical purposes.
          </p>
          <p>
            The results show your age broken down into years, months, and remaining days, as well as the total count
            in months, weeks, days, and hours. You'll also see what day of the week you were born on, and how many
            days remain until your next birthday. This can be handy for planning parties, checking eligibility for
            age-restricted services, or satisfying curiosity.
          </p>
          <p>
            The calculation handles edge cases correctly — for example, if you were born on 29 February in a leap
            year, the tool correctly identifies your birthday in non-leap years as 28 February or 1 March depending
            on the convention used. No personal data is stored; the calculator runs entirely in your browser.
          </p>
        </div>

        <RelatedTools currentId="age-calculator" />
      </div>
    </div>
  );
}
