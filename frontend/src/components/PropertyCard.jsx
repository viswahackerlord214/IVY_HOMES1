import { Link } from 'react-router-dom';
import { formatPrice, formatArea, formatBHK, formatFurnishing, formatRelativeTime, capitalize } from '../utils/formatters';

export default function PropertyCard({ listing, onToggleSave, isSaved, type = 'sale' }) {
  const isSale = type === 'sale';
  const price = isSale ? formatPrice(listing.price) : `₹${listing.price?.toLocaleString('en-IN')}/mo`;
  const detailUrl = isSale ? `/listings/${listing.listing_id}` : `/rentals/${listing.listing_id}`;
  
  // Property type emoji
  const typeEmoji = {
    'apartment': '🏢', 'villa': '🏡', 'independent house': '🏠',
    'plot': '📐', 'builder floor': '🏗️'
  }[listing.property_type] || '🏠';

  return (
    <div className="card fade-in">
      <div className="card-image" style={{ 
        background: `linear-gradient(135deg, hsl(${(listing.listing_id?.charCodeAt(4) || 0) * 15}, 60%, 25%), hsl(${(listing.listing_id?.charCodeAt(5) || 0) * 20}, 50%, 15%))` 
      }}>
        <span style={{ position: 'relative', zIndex: 2 }}>{typeEmoji}</span>
        
        {onToggleSave && (
          <button
            className={`fav-btn ${isSaved ? 'saved' : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(listing.listing_id); }}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          >
            {isSaved ? '♥' : '♡'}
          </button>
        )}

        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2, display: 'flex', gap: 6 }}>
          {listing.is_live && <span className="tag tag-success">Live</span>}
          {listing.is_verified && <span className="tag">✓ Verified</span>}
          {!isSale && <span className="tag tag-warning">Rental</span>}
        </div>
      </div>

      <div className="card-body">
        <div className="card-price">{price}</div>
        <h3 className="card-title">{listing.apartment_name || 'Property'}</h3>
        <p className="card-subtitle">📍 {capitalize(listing.locality)}</p>

        <div className="card-meta">
          <span className="card-meta-item">🛏️ {formatBHK(listing.bedroom)}</span>
          <span className="card-meta-item">🚿 {listing.bathroom} Bath</span>
          <span className="card-meta-item">📐 {formatArea(listing.carpet_area)}</span>
          {listing.floor !== null && listing.floor !== undefined && (
            <span className="card-meta-item">🏢 Floor {listing.floor}/{listing.total_floors}</span>
          )}
        </div>

        <div className="card-tags">
          <span className="tag">{capitalize(listing.property_type)}</span>
          <span className="tag">{formatFurnishing(listing.furnishing)}</span>
          {listing.posted_at && (
            <span className="tag" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
              {formatRelativeTime(listing.posted_at)}
            </span>
          )}
        </div>

        <Link to={detailUrl} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
          View Details
        </Link>
      </div>
    </div>
  );
}
