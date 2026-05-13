import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

// ── Nav structure ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Text Tools',
    items: [
      { title: 'Username Generator',    path: '/username-generator'   },
      { title: 'Case Converter',        path: '/case-converter'       },
      { title: 'Remove Duplicate Lines',path: '/remove-duplicates'    },
      { title: 'JSON Formatter',        path: '/json-formatter'       },
    ],
  },
  {
    label: 'Finance & Money',
    items: [
      { title: 'Discount Calculator',       path: '/discount-calculator'       },
      { title: 'Tip Calculator',            path: '/tip-calculator'            },
      { title: 'Interest Calculator',       path: '/interest-calculator'       },
      { title: 'Compound Interest',         path: '/compound-interest-calculator' },
      { title: 'Savings Calculator',        path: '/savings-calculator'        },
      { title: 'Investment Calculator',     path: '/investment-calculator'     },
      { title: 'ROI Calculator',            path: '/roi-calculator'            },
      { title: 'Profit Margin Calculator',  path: '/profit-margin-calculator'  },
      { title: 'Inflation Calculator',      path: '/inflation-calculator'      },
      { title: 'Currency Converter',        path: '/currency-converter'        },
      { title: 'SIP Calculator', path: '/sip-calculator' },
      { title: 'Sales Tax Calculator', path: '/sales-tax-calculator' },
      { title: 'Auto Loan Calculator', path: '/auto-loan-calculator' },
    ],
  },
  {
    label: 'Loan & Mortgage',
    items: [
      { title: 'Loan Calculator',           path: '/loan-calculator'           },
      { title: 'Mortgage Calculator',       path: '/mortgage-calculator'       },
      { title: 'EMI Calculator',            path: '/emi-calculator'            },
      { title: 'Salary Calculator',         path: '/salary-calculator'         },
      { title: 'Tax Calculator',            path: '/tax-calculator'            },
      { title: 'US Tax Calculator 2025',    path: '/us-tax-calculator'         },
      { title: 'Retirement Calculator',     path: '/retirement-calculator'     },
    ],
  },
  {
    label: 'Math Calculators',
    items: [
      { title: 'Percentage Calculator',     path: '/percentage-calculator'     },
      { title: 'Unit Converter',            path: '/unit-converter'            },
      { title: 'Age Calculator',            path: '/age-calculator'            },
      { title: 'Time Duration Calculator',  path: '/time-duration-calculator'  },
      { title: 'Scientific Calculator', path: '/scientific-calculator' },
      { title: 'Fraction Calculator', path: '/fraction-calculator' },
      { title: 'Algebra Calculator', path: '/algebra-calculator' },
      { title: 'Equation Solver', path: '/equation-solver' },
      { title: 'Logarithm Calculator', path: '/logarithm-calculator' },
      { title: 'Square Root Calculator', path: '/square-root-calculator' },
      { title: 'Exponent Calculator', path: '/exponent-calculator' },
      { title: 'Mean Median Mode', path: '/mean-median-mode-calculator' },
      { title: 'Standard Deviation', path: '/standard-deviation-calculator' },
      { title: 'Random Number Generator', path: '/random-number-generator' },
      { title: 'Area Calculator', path: '/area-calculator' },
      { title: 'Volume Calculator', path: '/volume-calculator' },
      { title: 'Matrix Calculator', path: '/matrix-calculator' },
      { title: 'Binary Calculator', path: '/binary-calculator' },
      { title: 'Integral Calculator', path: '/integral-calculator' },
    ],
  },
  {
    label: 'Health & Fitness',
    items: [
      { title: 'BMI Calculator',            path: '/bmi-calculator'            },
      { title: 'BMR Calculator', path: '/bmr-calculator' },
      { title: 'Calorie Calculator', path: '/calorie-calculator' },
      { title: 'Body Fat Calculator', path: '/body-fat-calculator' },
      { title: 'Ideal Weight Calculator', path: '/ideal-weight-calculator' },
      { title: 'Water Intake Calculator', path: '/water-intake-calculator' },
      { title: 'Due Date Calculator', path: '/pregnancy-due-date-calculator' },
      { title: 'Ovulation Calculator', path: '/ovulation-calculator' },
      { title: 'Macro Calculator', path: '/macro-calculator' },
      { title: 'Pace Calculator', path: '/pace-calculator' },
      { title: 'Miles to Steps', path: '/miles-to-steps-calculator' },
      { title: 'WHR Calculator', path: '/whr-calculator' },
    ],
  },
  {
    label: 'Other',
    items: [
      { title: 'Date Calculator', path: '/date-calculator' },
      { title: 'Work Hours Calculator', path: '/work-hours-calculator' },
      { title: 'GPA Calculator', path: '/gpa-calculator' },
      { title: 'Grade Calculator', path: '/grade-calculator' },
      { title: 'Final Exam Calculator', path: '/final-exam-calculator' },
      { title: 'Fuel Cost Calculator', path: '/fuel-cost-calculator' },
      { title: 'Electricity Calculator', path: '/electricity-bill-calculator' },
      { title: 'Concrete Calculator', path: '/concrete-calculator' },
      { title: 'Tile & Area Calculator', path: '/tile-calculator' },
      { title: 'Baud Rate Calculator', path: '/baud-rate-calculator' },
    ],
  },
];

const NAV_LINKS = [
  { title: 'Privacy',  path: '/privacy-policy'  },
  { title: 'Contact',  path: '/contact'          },
];

// ── Dropdown (desktop) ────────────────────────────────────────
function Dropdown({ group }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  const isGroupActive = group.items.some(i => location.pathname === i.path);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`nav-dropdown-btn${isGroupActive ? ' active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {group.label}
        <span style={{
          display: 'inline-block',
          marginLeft: '4px',
          fontSize: '0.65rem',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          verticalAlign: 'middle',
        }}>▼</span>
      </button>

      {open && (
        <div className="nav-dropdown-menu" role="menu">
          {group.items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              role="menuitem"
              className={({ isActive }) => `nav-dropdown-item${isActive ? ' active' : ''}`}
            >
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile accordion ──────────────────────────────────────────
function MobileGroup({ group, onClose }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isGroupActive = group.items.some(i => location.pathname === i.path);

  return (
    <div>
      <button
        className={`mobile-group-btn${isGroupActive ? ' active' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span>{group.label}</span>
        <span style={{
          fontSize: '0.65rem',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>▼</span>
      </button>
      {open && (
        <div style={{ paddingLeft: '12px', paddingBottom: '4px' }}>
          {group.items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <style>{`
        /* ── Dropdown button ── */
        .nav-dropdown-btn {
          font-family: var(--font);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text);
          background: var(--surface2);
          border: 1px solid var(--border);
          cursor: pointer;
          padding: 7px 11px;
          border-radius: var(--radius-sm);
          transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
          display: flex;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .nav-dropdown-btn:hover {
          background: var(--border);
          color: var(--text);
          border-color: var(--border-strong);
          box-shadow: var(--shadow);
        }
        .nav-dropdown-btn.active {
          background: var(--accent-light);
          color: var(--accent-hover);
          border-color: var(--accent);
        }

        /* ── Dropdown menu panel ── */
        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          min-width: 220px;
          max-width: 280px;
          max-height: 70vh;
          overflow-y: auto;
          z-index: 200;
          padding: 6px;
          animation: dropdown-in 0.15s ease;
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Dropdown items ── */
        .nav-dropdown-item {
          display: block;
          padding: 8px 12px;
          font-size: 0.875rem;
          color: var(--text-2);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: background 0.12s, color 0.12s;
          white-space: nowrap;
        }
        .nav-dropdown-item:hover {
          background: var(--surface2);
          color: var(--text);
          text-decoration: none;
        }
        .nav-dropdown-item.active {
          background: var(--accent-light);
          color: var(--accent-hover);
          font-weight: 600;
        }

        /* ── Plain nav links (Privacy / Contact) ── */
        .nav-plain-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-2);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .nav-plain-link:hover {
          background: var(--surface2);
          color: var(--text);
          text-decoration: none;
        }
        .nav-plain-link.active {
          background: var(--accent-light);
          color: var(--accent-hover);
        }

        /* ── Hamburger button ── */
        .hamburger-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-sm);
          transition: background 0.15s;
        }
        .hamburger-btn:hover { background: var(--surface2); }
        .hamburger-btn span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--text-2);
          border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s;
          transform-origin: center;
        }
        .hamburger-btn.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger-btn.open span:nth-child(2) { opacity: 0; }
        .hamburger-btn.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── Mobile overlay ── */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          top: var(--header-h);
          background: rgba(0,0,0,0.4);
          z-index: 90;
          animation: fade-in 0.2s ease;
        }
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── Mobile drawer ── */
        .mobile-drawer {
          display: none;
          position: fixed;
          top: var(--header-h);
          left: 0;
          right: 0;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          z-index: 95;
          padding: 12px 16px 20px;
          max-height: calc(100vh - var(--header-h));
          overflow-y: auto;
          animation: slide-down 0.2s ease;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Mobile group button ── */
        .mobile-group-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-family: var(--font);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text);
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 4px;
          border-bottom: 1px solid var(--border);
          text-align: left;
        }
        .mobile-group-btn.active { color: var(--accent-hover); }

        /* ── Mobile nav link ── */
        .mobile-nav-link {
          display: block;
          padding: 8px 8px;
          font-size: 0.875rem;
          color: var(--text-2);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: background 0.12s, color 0.12s;
        }
        .mobile-nav-link:hover { background: var(--surface2); color: var(--text); text-decoration: none; }
        .mobile-nav-link.active { color: var(--accent-hover); font-weight: 600; }

        /* ── Mobile plain links ── */
        .mobile-plain-links {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          margin-top: 8px;
        }
        .mobile-plain-links a {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-2);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          transition: background 0.15s;
        }
        .mobile-plain-links a:hover { background: var(--surface2); color: var(--text); text-decoration: none; }

        /* ── Responsive breakpoint ── */
        @media (max-width: 1100px) {
          .desktop-nav   { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-overlay,
          .mobile-drawer  { display: block !important; }
        }
        @media (min-width: 1101px) {
          .mobile-overlay,
          .mobile-drawer  { display: none !important; }
        }
      `}</style>

      <header className="site-header">
        <div className="container header-inner">

          {/* Logo */}
          <Link to="/" className="site-logo">
            <span className="logo-icon">
              <svg viewBox="0 0 64 64" width="32" height="32">
                <defs>
                  <linearGradient id="toolboxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4EFFE2" />
                    <stop offset="45%" stopColor="#10A79B" />
                    <stop offset="100%" stopColor="#0B4D63" />
                  </linearGradient>
                </defs>

                <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#toolboxGradient)" />

                <rect x="18" y="18" width="11" height="11" rx="3" fill="#FFFFFF"/>
                <rect x="35" y="18" width="11" height="11" rx="3" fill="#FFFFFF"/>
                <rect x="18" y="35" width="11" height="11" rx="3" fill="#FFFFFF"/>
                <rect x="35" y="35" width="11" height="11" rx="3" fill="#FFFFFF"/>
              </svg>
            </span>

            <span className="logo-text">ToolBox</span>
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav desktop-nav" aria-label="Main navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'nowrap' }}>
            {NAV_GROUPS.map(group => (
              <Dropdown key={group.label} group={group} />
            ))}
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `nav-plain-link${isActive ? ' active' : ''}`}
              >
                {link.title}
              </NavLink>
            ))}
          </nav>

          {/* Hamburger */}
          <button
            className={`hamburger-btn${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile overlay (closes menu on outside tap) */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer" aria-label="Mobile navigation">
          {NAV_GROUPS.map(group => (
            <MobileGroup
              key={group.label}
              group={group}
              onClose={() => setMobileOpen(false)}
            />
          ))}
          <div className="mobile-plain-links">
            {NAV_LINKS.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
