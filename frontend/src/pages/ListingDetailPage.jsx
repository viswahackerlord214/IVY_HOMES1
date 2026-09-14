import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing, getSaved, addSaved, removeSaved, withRetry } from '../services/api';
import { formatPrice, formatArea, formatBHK, formatFurnishing, formatDate, formatPricePerSqft, capitalize } from '../utils/formatters';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [data, saved] = await Promise.all([
          withRetry(() => getListing(id)),
          withRetry(() => getSaved()).catch(() => ({ results: [] })),
        ]);
        setListing(data);
        setIsSaved(saved.results.some(s => s.listing_id === id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleSave = async () => {
    setIsSaved(!isSaved);
    try {
      isSaved ? await withRetry(() => removeSaved(id)) : await withRetry(() => addSaved(id));
    } catch {
      setIsSaved(isSaved);
    }
  };

  if (loading) return (
    <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading listing…</p></div>
  );

  if (error) return (
    <div className="page"><div className="container"><div className="error-state"><p>⚠️ {error}</p>
      <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/listings')}>Back to Listings</button>
    </div></div></div>
  );

  if (!listing) return null;

  const l = listing;

  return (
    <div className="page detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-header fade-in">
          <div>
            <h1 className="detail-title">{l.apartment_name}</h1>
            <p className="detail-location">📍 {capitalize(l.locality)} • {capitalize(l.property_type)}</p>
            <div className="card-tags" style={{ marginTop: 8 }}>
              {l.is_live && <span className="tag tag-success">● Live</span>}
              {l.is_verified && <span className="tag">✓ Verified</span>}
              {!l.is_live && <span className="tag tag-warning">Inactive</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="detail-price">{formatPrice(l.price)}</div>
            <div className="detail-pps">{formatPricePerSqft(l.price, l.carpet_area)}</div>
            <button
              className={`btn ${isSaved ? 'btn-danger' : 'btn-ghost'}`}
              style={{ marginTop: 12 }}
              onClick={toggleSave}
            >
              {isSaved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <div className="detail-section fade-in">
              <h2 className="detail-section-title">Property Details</h2>
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <span className="detail-info-label">Bedrooms</span>
                  <span className="detail-info-value">🛏️ {formatBHK(l.bedroom)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Bathrooms</span>
                  <span className="detail-info-value">🚿 {l.bathroom}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Balconies</span>
                  <span className="detail-info-value">{l.balcony ?? '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Floor</span>
                  <span className="detail-info-value">{l.floor ?? '—'} / {l.total_floors ?? '—'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Carpet Area</span>
                  <span className="detail-info-value">{formatArea(l.carpet_area)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Super Built-up</span>
                  <span className="detail-info-value">{formatArea(l.super_built_up_area)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Furnishing</span>
                  <span className="detail-info-value">{formatFurnishing(l.furnishing)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Facing</span>
                  <span className="detail-info-value">{capitalize(l.facing_direction)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Parking</span>
                  <span className="detail-info-value">{l.covered_parking ?? '—'} covered</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Posted By</span>
                  <span className="detail-info-value">{capitalize(l.posted_by)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Posted On</span>
                  <span className="detail-info-value">{formatDate(l.posted_at)}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-label">Website</span>
                  <span className="detail-info-value">{l.website}</span>
                </div>
              </div>
            </div>

            {l.description && (
              <div className="detail-section fade-in">
                <h2 className="detail-section-title">Description</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{l.description}</p>
              </div>
            )}
          </div>

          <div>
            <div className="detail-section fade-in">
              <h2 className="detail-section-title">Contact</h2>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{l.posted_by_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{l.posted_by_contact}</p>
              {l.listing_url && (
                <a
                  href={l.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ marginTop: 12, width: '100%' }}
                >
                  View on {l.website} ↗
                </a>
              )}
            </div>

            {l.project_id && (
              <div className="detail-section fade-in">
                <h2 className="detail-section-title">Project</h2>
                <p style={{ fontWeight: 500 }}>Project ID: {l.project_id}</p>
                <a
                  href={`/projects/${l.project_id}`}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 8 }}
                >
                  View Project →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
