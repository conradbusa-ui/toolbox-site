import { Link } from 'react-router-dom';

export default function ToolCard({ tool, compact = false }) {
  return (
    <Link to={tool.path} className="tool-card" style={{ '--card-accent': tool.color }}>
      <div
        className="tool-card-icon"
        style={{ background: tool.color }}
        aria-hidden="true"
      >
        {tool.icon}
      </div>
      <h3>{tool.title}</h3>
      {!compact && <p>{tool.shortDesc}</p>}
      {compact && <p style={{ fontSize: '0.8rem' }}>{tool.shortDesc}</p>}
      <span className="tool-card-arrow">Use tool →</span>
    </Link>
  );
}
