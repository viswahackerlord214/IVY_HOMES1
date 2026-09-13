import { Link } from 'react-router-dom';
import { capitalize, formatDate } from '../utils/formatters';

function formatProjectPrice(val) {
  if (!val) return '—';
  if (val > 10) return `₹${val} L`;
  return `₹${val} Cr`;
}

export default function ProjectCard({ project, onToggleSave, isSaved }) {
  return (
    <div className="card fade-in">
      <Link to={`/projects/${project.project_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card-image" style={{ 
          height: 140, 
          background: `linear-gradient(135deg, hsl(${parseInt(project.project_id.slice(1)) % 360}, 50%, 25%), hsl(${(parseInt(project.project_id.slice(1)) * 3) % 360}, 40%, 15%))` 
        }}>
          <span style={{ position: 'relative', zIndex: 2, fontSize: '2rem' }}>🏗️</span>
          <div style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 2, display: 'flex', gap: 6 }}>
            <span className="tag">{capitalize(project.project_status)}</span>
          </div>
        </div>
      </Link>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link to={`/projects/${project.project_id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <h3 className="card-title">{project.apartment_name}</h3>
            <p className="card-subtitle">📍 {capitalize(project.locality)} • {project.developer_name}</p>
          </Link>
          {onToggleSave && (
            <button 
              className={`btn btn-icon ${isSaved ? 'btn-danger' : 'btn-ghost'}`}
              onClick={(e) => { e.preventDefault(); onToggleSave(project); }}
              style={{ padding: 4, marginLeft: 8 }}
            >
              {isSaved ? '♥' : '♡'}
            </button>
          )}
        </div>
        <Link to={`/projects/${project.project_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-price">{formatProjectPrice(project.price_min)} – {formatProjectPrice(project.price_max)}</div>
          <div className="card-meta">
            <span className="card-meta-item">🏢 {project.total_towers} Towers</span>
            <span className="card-meta-item">🏠 {project.total_units} Units</span>
            <span className="card-meta-item">📐 {project.min_area_sqft}–{project.max_area_sqft} sqft</span>
          </div>
          <div className="card-meta">
            <span className="card-meta-item">📅 Launch: {formatDate(project.launch_date)}</span>
            <span className="card-meta-item">🔑 Possession: {formatDate(project.possession_date)}</span>
          </div>
          {project.amenities?.length > 0 && (
            <div className="card-tags">
              {project.amenities.slice(0, 4).map(a => <span key={a} className="tag">{capitalize(a)}</span>)}
              {project.amenities.length > 4 && <span className="tag">+{project.amenities.length - 4}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="tag tag-success">{project.total_listings} Listings</span>
            <span className="tag">{project.total_floors} Floors</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
