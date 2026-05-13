import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

const CURRENCIES = ['$', '€', '£', 'R', '₹', '¥'];

function fmt(n, currency) {
  return currency + parseFloat(n.toFixed(2)).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtShort(n, currency) {
  if (n >= 1_000_000_000) return currency + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return currency + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return currency + (n / 1_000).toFixed(1) + 'K';
  return fmt(n, currency);
}

function ResultRow({ label, value, highlight, muted, positive }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.9rem', color: muted ? 'var(--text-3)' : 'var(--text-2)' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '1.25rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)' : positive ? '#16a34a' : muted ? 'var(--text-3)' : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function RetirementCalculator() {
  const [currency, setCurrency]         = useState('$');

  // Accumulation phase
  const [currentAge, setCurrentAge]     = useState('');
  const [retirementAge, setRetirementAge] = useState('65');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');
  const [employerMatch, setEmployerMatch] = useState('');
  const [matchLimit, setMatchLimit]     = useState('');
  const [preReturnRate, setPreReturnRate] = useState('7');
  const [inflationRate, setInflationRate] = useState('3');

  // Withdrawal phase
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [postReturnRate, setPostReturnRate] = useState('5');
  const [socialSecurity, setSocialSecurity] = useState('');

  const [result, setResult]             = useState(null);
  const [showTable, setShowTable]       = useState(false);

  const calculate = () => {
    const age      = parseInt(currentAge);
    const retAge   = parseInt(retirementAge);
    const lifeAge  = parseInt(lifeExpectancy);
    const savings  = parseFloat(currentSavings)  || 0;
    const contrib  = parseFloat(monthlyContrib)  || 0;
    const match    = parseFloat(employerMatch)   || 0;
    const mLimit   = parseFloat(matchLimit)      || Infinity;
    const preR     = parseFloat(preReturnRate)   / 100;
    const postR    = parseFloat(postReturnRate)  / 100;
    const inf      = parseFloat(inflationRate)   / 100;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const ss       = parseFloat(socialSecurity)  || 0;

    if (isNaN(age) || isNaN(retAge) || retAge <= age) return;

    const yearsToRetire  = retAge - age;
    const yearsInRetire  = Math.max(lifeAge - retAge, 0);
    const monthlyR       = preR / 12;
    const totalMonths    = yearsToRetire * 12;

    // Employer match per month (capped)
    const matchedContrib = Math.min(contrib * (match / 100), mLimit / 12);
    const totalMonthlyContrib = contrib + matchedContrib;

    // Future value at retirement
    const fvSavings  = savings * Math.pow(1 + monthlyR, totalMonths);
    const fvContribs = totalMonthlyContrib > 0 && monthlyR > 0
      ? totalMonthlyContrib * ((Math.pow(1 + monthlyR, totalMonths) - 1) / monthlyR)
      : totalMonthlyContrib * totalMonths;

    const nestEgg = fvSavings + fvContribs;

    // What you need at retirement (present value of withdrawals)
    const monthlyNeed    = Math.max(expenses - ss, 0);
    const postMonthlyR   = postR / 12;
    const retireMonths   = yearsInRetire * 12;
    const neededNestEgg  = monthlyNeed > 0 && postMonthlyR > 0 && retireMonths > 0
      ? monthlyNeed * ((1 - Math.pow(1 + postMonthlyR, -retireMonths)) / postMonthlyR)
      : monthlyNeed * retireMonths;

    // Surplus or shortfall
    const surplus = nestEgg - neededNestEgg;

    // Inflation-adjusted nest egg
    const realNestEgg = nestEgg / Math.pow(1 + inf, yearsToRetire);

    // How long savings last (months)
    let savingsLastMonths = 0;
    if (monthlyNeed > 0 && postMonthlyR > 0) {
      savingsLastMonths = Math.log(1 - (nestEgg * postMonthlyR) / monthlyNeed) / Math.log(1 + postMonthlyR) * -1;
    } else if (monthlyNeed > 0) {
      savingsLastMonths = nestEgg / monthlyNeed;
    } else {
      savingsLastMonths = Infinity;
    }
    const savingsLastYears = isFinite(savingsLastMonths) ? savingsLastMonths / 12 : Infinity;

    // Year-by-year accumulation table
    const breakdown = [];
    let bal = savings;
    for (let y = 1; y <= yearsToRetire; y++) {
      const startBal = bal;
      bal = bal * Math.pow(1 + monthlyR, 12);
      if (totalMonthlyContrib > 0 && monthlyR > 0) {
        bal = startBal * Math.pow(1 + monthlyR, 12)
          + totalMonthlyContrib * ((Math.pow(1 + monthlyR, 12) - 1) / monthlyR);
      } else {
        bal = startBal * Math.pow(1 + preR / 12, 12) + totalMonthlyContrib * 12;
      }
      const totalDeposited = savings + totalMonthlyContrib * 12 * y;
      breakdown.push({
        year: y,
        age: age + y,
        balance: bal,
        totalDeposited,
        growth: bal - totalDeposited,
      });
    }

    setResult({
      nestEgg, realNestEgg, neededNestEgg, surplus,
      yearsToRetire, yearsInRetire,
      monthlyNeed, ss,
      savingsLastYears,
      totalContributions: totalMonthlyContrib * totalMonths,
      fvSavings, fvContribs,
      employerTotal: matchedContrib * totalMonths,
      breakdown, retAge, lifeAge,
      replacementRate: expenses > 0 ? ((nestEgg * postMonthlyR / (1 - Math.pow(1 + postMonthlyR, -retireMonths))) / expenses) * 100 : 0,
    });
    setShowTable(false);
  };

  const reset = () => {
    setCurrentAge(''); setRetirementAge('65'); setCurrentSavings('');
    setMonthlyContrib(''); setEmployerMatch(''); setMatchLimit('');
    setPreReturnRate('7'); setInflationRate('3'); setLifeExpectancy('85');
    setMonthlyExpenses(''); setPostReturnRate('5'); setSocialSecurity('');
    setResult(null); setShowTable(false);
  };

  const onTrack = result && result.surplus >= 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Retirement Calculator</span>
          </div>
          <h1>Retirement Calculator</h1>
          <p className="subtitle">
            Find out if you're on track for retirement — estimate your nest egg, what you'll need, and whether your savings will last.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Plan Your Retirement</h2>

          {/* Currency */}
          <div style={{ marginBottom: '18px' }}>
            <label>Currency</label>
            <div className="tag-row">
              {CURRENCIES.map(c => (
                <button key={c} className={`tag${currency === c ? ' active' : ''}`}
                  onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Section: About You */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
            About You
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="current-age">Current Age</label>
              <input id="current-age" type="number" min="18" max="80" placeholder="e.g. 30"
                value={currentAge} onChange={e => { setCurrentAge(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="retire-age">Retirement Age</label>
              <input id="retire-age" type="number" min="40" max="90" placeholder="e.g. 65"
                value={retirementAge} onChange={e => { setRetirementAge(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="life-exp">Life Expectancy</label>
              <input id="life-exp" type="number" min="60" max="110" placeholder="e.g. 85"
                value={lifeExpectancy} onChange={e => { setLifeExpectancy(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Section: Savings */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Current Savings & Contributions
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="current-savings">Current Retirement Savings</label>
              <input id="current-savings" type="number" min="0" placeholder="e.g. 50000"
                value={currentSavings} onChange={e => { setCurrentSavings(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="monthly-contrib">Your Monthly Contribution</label>
              <input id="monthly-contrib" type="number" min="0" placeholder="e.g. 500"
                value={monthlyContrib} onChange={e => { setMonthlyContrib(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="employer-match">Employer Match %</label>
              <input id="employer-match" type="number" min="0" max="100" placeholder="e.g. 50"
                value={employerMatch} onChange={e => { setEmployerMatch(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="match-limit">Match Annual Cap</label>
              <input id="match-limit" type="number" min="0" placeholder="e.g. 3000"
                value={matchLimit} onChange={e => { setMatchLimit(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Section: Returns */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Return & Inflation Assumptions
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="pre-return">Pre-Retirement Return %</label>
              <input id="pre-return" type="number" min="0" step="0.1" placeholder="e.g. 7"
                value={preReturnRate} onChange={e => { setPreReturnRate(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="post-return">Post-Retirement Return %</label>
              <input id="post-return" type="number" min="0" step="0.1" placeholder="e.g. 5"
                value={postReturnRate} onChange={e => { setPostReturnRate(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="inflation">Inflation Rate %</label>
              <input id="inflation" type="number" min="0" step="0.1" placeholder="e.g. 3"
                value={inflationRate} onChange={e => { setInflationRate(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Section: Retirement needs */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Retirement Income Needs
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="monthly-expenses">Monthly Expenses in Retirement</label>
              <input id="monthly-expenses" type="number" min="0" placeholder="e.g. 4000"
                value={monthlyExpenses} onChange={e => { setMonthlyExpenses(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="social-sec">Monthly Social Security / Pension</label>
              <input id="social-sec" type="number" min="0" placeholder="e.g. 1500"
                value={socialSecurity} onChange={e => { setSocialSecurity(e.target.value); setResult(null); }} />
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={!currentAge || !monthlyContrib && !currentSavings}>
              Calculate Retirement
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* On track / not on track banner */}
              {result.neededNestEgg > 0 && (
                <div style={{
                  textAlign: 'center',
                  background: onTrack
                    ? 'linear-gradient(135deg, #0f172a, #134e4a)'
                    : 'linear-gradient(135deg, #0f172a, #450a0a)',
                  borderRadius: 'var(--radius)',
                  padding: '24px 20px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                    {onTrack ? '✓ You are on track for retirement' : '⚠ Projected shortfall'}
                  </div>
                  <div style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: onTrack ? '#5eead4' : '#fca5a5' }}>
                    {fmtShort(Math.abs(result.surplus), currency)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                    {onTrack ? 'Projected surplus above your target' : 'Additional savings needed to meet your goal'}
                  </div>
                </div>
              )}

              {/* Nest egg hero (no expenses entered) */}
              {result.neededNestEgg === 0 && (
                <div style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #0f172a, #134e4a)',
                  borderRadius: 'var(--radius)',
                  padding: '24px 20px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                    Projected Nest Egg at Retirement (Age {result.retAge})
                  </div>
                  <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {fmtShort(result.nestEgg, currency)}
                  </div>
                </div>
              )}

              {/* Key results */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
                <ResultRow label={`Projected Nest Egg at Age ${result.retAge}`}  value={fmtShort(result.nestEgg, currency)} highlight />
                <ResultRow label="In Today's Dollars (inflation-adjusted)"        value={fmtShort(result.realNestEgg, currency)} muted />
                {result.neededNestEgg > 0 && (
                  <ResultRow label="Nest Egg Needed for Your Goal"               value={fmtShort(result.neededNestEgg, currency)} />
                )}
                {result.employerTotal > 0 && (
                  <ResultRow label="Total Employer Match Received"               value={fmtShort(result.employerTotal, currency)} positive />
                )}
                {result.monthlyNeed > 0 && isFinite(result.savingsLastYears) && (
                  <ResultRow
                    label="How Long Savings Last After Retirement"
                    value={`${result.savingsLastYears.toFixed(1)} years (to age ${(result.retAge + result.savingsLastYears).toFixed(0)})`}
                  />
                )}
              </div>

              {/* Stats grid */}
              <div className="result-grid" style={{ marginBottom: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.yearsToRetire}</div>
                  <div className="stat-label">Years to Retire</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.yearsInRetire}</div>
                  <div className="stat-label">Years in Retirement</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.totalContributions, currency)}</div>
                  <div className="stat-label">Your Contributions</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.nestEgg - result.totalContributions - (parseFloat(currentSavings) || 0), currency)}</div>
                  <div className="stat-label">Investment Growth</div>
                </div>
              </div>

              {/* Growth bar */}
              {result.nestEgg > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                    What builds your nest egg
                  </p>
                  {(() => {
                    const initPct   = Math.max((result.fvSavings / result.nestEgg) * 100, 0);
                    const contPct   = Math.max((result.fvContribs / result.nestEgg) * 100, 0);
                    return (
                      <>
                        <div style={{ height: '16px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                          <div style={{ width: `${initPct.toFixed(1)}%`, background: 'var(--accent)' }} />
                          <div style={{ flex: 1, background: '#7c3aed' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)', flexWrap: 'wrap' }}>
                          <span>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                            Initial savings growth {initPct.toFixed(1)}%
                          </span>
                          <span>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#7c3aed', marginRight: '5px', verticalAlign: 'middle' }} />
                            Contributions + growth {contPct.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Year-by-year table */}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
                {showTable ? 'Hide year-by-year breakdown ▲' : 'Show year-by-year breakdown ▼'}
              </button>

              {showTable && (
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Year', 'Age', 'Balance', 'Total Deposited', 'Investment Growth'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map(row => (
                        <tr key={row.year} style={{ borderBottom: '1px solid var(--border)', background: row.age === result.retAge ? 'var(--accent-light)' : 'transparent' }}>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>{row.year}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: row.age === result.retAge ? 700 : 400 }}>{row.age}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtShort(row.balance, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)' }}>{fmtShort(row.totalDeposited, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmtShort(Math.max(row.growth, 0), currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '16px', lineHeight: 1.5 }}>
                ⚠ This calculator provides estimates only. It assumes fixed rates of return and does not account for taxes, fees, market volatility, salary increases, or changes in spending. Actual results will vary. Consult a certified financial planner for personalised retirement advice.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Retirement Calculator</h2>
          <p>
            Planning for retirement comes down to one fundamental question: will you have enough money
            to last through your retirement years? This calculator answers that question by modelling
            two phases — the accumulation phase (saving before retirement) and the withdrawal phase
            (drawing down in retirement). Enter your current age, target retirement age, and life
            expectancy to define the two phases, then fill in your savings and contribution details to
            see your projected nest egg.
          </p>
          <p>
            The employer match fields are included because employer contributions can represent a
            significant part of your retirement savings — effectively free money you don't want to
            leave on the table. The pre-retirement return rate (default 7%) reflects a typical
            long-term equity portfolio return. The post-retirement return (default 5%) is lower,
            reflecting a more conservative asset allocation in retirement. Inflation (default 3%)
            is used to express your projected nest egg in today's purchasing power so you can relate
            the number to your current lifestyle.
          </p>
          <p>
            Enter your expected monthly expenses in retirement and any Social Security or pension
            income to see whether your projected savings will cover the gap. The calculator shows
            how long your savings will last and flags a surplus or shortfall against your target.
            The year-by-year table highlights your retirement age row so you can track exactly how
            your balance builds over time.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Retirement Planning Examples</h2>
          <p>
            <strong>Example 1 — On track at 35:</strong> Age 35, retiring at 65. Current savings
            $80,000. Monthly contribution $800 with 50% employer match (capped at $3,000/year).
            At 7% pre-retirement return: projected nest egg ≈ $1.87M. In today's dollars ≈ $771K.
          </p>
          <p>
            <strong>Example 2 — Late starter at 45:</strong> Age 45, retiring at 67. Current savings
            $30,000. Monthly contribution $1,200 at 7%. Projected nest egg ≈ $722K.
            Monthly expenses $4,500 less $1,800 Social Security = $2,700 needed from savings.
            Savings last ≈ 24 years — covering to age 91.
          </p>
          <p>
            <strong>Example 3 — Shortfall scenario:</strong> Age 40, retiring at 60. Current savings
            $25,000. Monthly contribution $400 at 6%. Projected nest egg ≈ $321K.
            Monthly expenses $5,000, no pension. Savings last ≈ 6.2 years — well short of
            life expectancy. Increasing contributions or delaying retirement closes the gap.
          </p>
          <p>
            <strong>Example 4 — Power of starting early:</strong> Investor A starts at 25 with
            $300/month at 7%. Investor B starts at 40 with $600/month at 7%. Both retire at 65.
            A accumulates ≈ $987K. B accumulates ≈ $608K. A contributes less in total but ends
            up with 62% more — the power of compounding time.
          </p>
        </div>

        <RelatedTools currentId="retirement-calculator" />
      </div>
    </div>
  );
}
