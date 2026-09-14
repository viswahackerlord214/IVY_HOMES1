import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRental, getLocalSavedRentals, addLocalSavedRental, removeLocalSavedRental, withRetry } from '../services/api';
import { formatArea, formatBHK, formatFurnishing, formatDate, capitalize } from '../utils/formatters';

export default function RentalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await withRetry(() => getRental(id));
        setRental(data);
        const saved = getLocalSavedRentals();
        setIsSaved(saved.some(s => s.listing_id === id));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const toggleSave = () => {
    if (isSaved) {
      removeLocalSavedRental(id);
      setIsSaved(false);
    } else {
      addLocalSavedRental(rental);
      setIsSaved(true);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading…</p></div>;
  if (error) return <div className="page"><div className="container"><div className="error-state"><p>⚠️ {error}</p></div></div></div>;
  if (!rental) return null;

  const r = rental;
  return (
    <div className="page detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="detail-header fade-in">
          <div>
            <h1 className="detail-title">{r.title || r.apartment_name}</h1>
            <p className="detail-location">📍 {capitalize(r.locality)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="detail-price">₹{r.price?.toLocaleString('en-IN')}/mo</div>
            {r.deposit > 0 && <div className="detail-pps">Deposit: ₹{r.deposit?.toLocaleString('en-IN')}</div>}
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
          <h2 className="detail-section-title">Rental Details</h2>
          <div className="detail-info-grid">
            <div className="detail-info-item"><span className="detail-info-label">Bedrooms</span><span className="detail-info-value">{formatBHK(r.bedroom)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Bathrooms</span><span className="detail-info-value">{r.bathroom}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Floor</span><span className="detail-info-value">{r.floor}/{r.total_floors}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Carpet Area</span><span className="detail-info-value">{formatArea(r.carpet_area)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Furnishing</span><span className="detail-info-value">{formatFurnishing(r.furnishing)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Facing</span><span className="detail-info-value">{capitalize(r.facing_direction)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Rent</span><span className="detail-info-value">₹{r.price?.toLocaleString('en-IN')}/mo</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Deposit</span><span className="detail-info-value">₹{r.deposit?.toLocaleString('en-IN')}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Maintenance</span><span className="detail-info-value">₹{r.maintenance?.toLocaleString('en-IN')}/mo</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Posted On</span><span className="detail-info-value">{formatDate(r.posted_at)}</span></div>
            <div className="detail-info-item"><span className="detail-info-label">Contact</span><span className="detail-info-value">{r.posted_by_name}</span></div>
          </div>
        </div>

        {r.description && (
          <div className="detail-section fade-in">
            <h2 className="detail-section-title">Description</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{r.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
