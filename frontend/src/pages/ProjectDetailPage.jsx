import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, getLocalSavedProjects, addLocalSavedProject, removeLocalSavedProject, withRetry } from '../services/api';
import { formatDate, capitalize } from '../utils/formatters';

function formatProjectPrice(val) {
  if (!val) return '—';
  if (val > 10) return `₹${val} L`;
  return `₹${val} Cr`;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await withRetry(() => getProject(id));
        setProject(data);
        const saved = getLocalSavedProjects();
        setIsSaved(saved.some(s => s.project_id === id));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const toggleSave = () => {
    if (isSaved) {
      removeLocalSavedProject(id);
      setIsSaved(false);
    } else {
      addLocalSavedProject(project);
      setIsSaved(true);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading project…</p></div>;
  if (error) return <div className="page"><div className="container"><div className="error-state"><p>⚠️ {error}</p></div></div></div>;
  if (!project) return null;

  const p = project;

  return (
    <div className="page detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-header fade-in">
          <div>
            <h1 className="detail-title">{p.apartment_name}</h1>
            <p className="detail-location">📍 {capitalize(p.locality)} • By {p.developer_name}</p>
            <div className="card-tags" style={{ marginTop: 8 }}>
              <span className="tag tag-success">{capitalize(p.project_status)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="detail-price">{formatProjectPrice(p.price_min)} – {formatProjectPrice(p.price_max)}</div>
            <button
              className={`btn ${isSaved ? 'btn-danger' : 'btn-ghost'}`}
              style={{ marginTop: 12 }}
              onClick={toggleSave}
            >
              {isSaved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>

        <div className="detail-section fade-in">
          <h2 className="detail-section-title">Project Details</h2>
          <div className="detail-info-grid">
            <div className="detail-info-item"><span className="detail-info-label">Developer</span><span className="detail-info-value">{p.developer_name}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Status</span><span className="detail-info-value">{capitalize(p.project_status)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Towers</span><span className="detail-info-value">{p.total_towers}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Total Units</span><span className="detail-info-value">{p.total_units}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Floors</span><span className="detail-info-value">{p.total_floors}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Size Range</span><span className="detail-info-value">{p.min_area_sqft} – {p.max_area_sqft} sqft</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Launch Date</span><span className="detail-info-value">{formatDate(p.launch_date)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Possession Date</span><span className="detail-info-value">{formatDate(p.possession_date)}</span></div>
          </div>
        </div>

        {p.amenities?.length > 0 && (
          <div className="detail-section fade-in">
            <h2 className="detail-section-title">Amenities</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {p.amenities.map(a => (
                <span key={a} className="tag" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  {capitalize(a)}
                </span>
              ))}
            </div>
          </div>
        )}

        {p.total_listings > 0 && (
          <div className="detail-section fade-in">
            <h2 className="detail-section-title">Listings in this Project</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              There are {p.total_listings} properties listed for sale in {p.apartment_name}.
            </p>
            <Link 
              to="/listings" 
              className="btn btn-primary"
            >
              Browse Listings in {capitalize(p.locality)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
