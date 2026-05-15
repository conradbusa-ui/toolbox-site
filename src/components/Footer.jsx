import { Link } from 'react-router-dom';
import { tools } from '../data/tools.js';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <div className="footer-brand">
            <span style={{ background: '#0d9488', padding: '4px 8px', borderRadius: '7px', fontSize: '0.85rem' }}>⊞</span>
            ToolBox
          </div>
          <p className="footer-tagline">Free, fast, browser-based tools — no sign-up required.</p>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '10px', fontWeight: '600' }}>Tools</p>
          <div className="footer-links">
            {tools.map((t) => (
              <Link key={t.id} to={t.path}>{t.title}</Link>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '10px', fontWeight: '600' }}>Legal & Contact</p>
          <div className="footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/contact">Contact</Link>
            <a href="mailto:freetoolcabinet@gmail.com">freetoolcabinet@gmail.com</a>
          </div>
        </div>

        <div className="footer-bottom">
          © {year} ToolBox. All rights reserved. All tools run entirely in your browser.
        </div>
      </div>
    </footer>
  );
}
