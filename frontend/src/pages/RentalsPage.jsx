import { useState, useEffect, useCallback } from 'react';
import { getRentals, getLocalSavedRentals, addLocalSavedRental, removeLocalSavedRental, withRetry } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';

const LIMIT = 20;

export default function RentalsPage() {
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { min_price, max_price, locality, ...apiFilters } = filters;
      const params = { limit: LIMIT, offset, ...apiFilters };
      
      let multiLocality = [];
      if (Array.isArray(locality) && locality.length > 0) {
        if (locality.length === 1) {
          params.locality = locality[0];
        } else {
          multiLocality = locality;
        }
      }

      Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k]; });
      const result = await withRetry(() => getRentals(params));
      
      // Client-side price filtering (since API doesn't support it for rentals)
      if (min_price || max_price) {
        const min = min_price ? Number(min_price) : 0;
        const max = max_price ? Number(max_price) : Infinity;
        result.results = result.results.filter(r => r.price >= min && r.price <= max);
      }
      
      // Client-side filtering for multiple localities
      if (multiLocality.length > 0) {
        result.results = result.results.filter(r => multiLocality.includes(r.locality));
      }
      
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [offset, filters]);

  const loadSaved = useCallback(() => {
    const saved = getLocalSavedRentals();
    setSavedIds(new Set(saved.map(r => r.listing_id)));
  }, []);

  useEffect(() => { fetchRentals(); }, [fetchRentals]);
  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleToggleSave = (rental) => {
    const isSaved = savedIds.has(rental.listing_id);
    if (isSaved) {
      removeLocalSavedRental(rental.listing_id);
    } else {
      addLocalSavedRental(rental);
    }
    loadSaved(); // refresh local state
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Rental Properties</h1>
          <p className="page-desc">{data.total?.toLocaleString()} rental properties in Bangalore</p>
        </div>

        <Filters filters={filters} onChange={handleFilterChange} onClear={() => { setFilters({}); setOffset(0); }} type="rental" />

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={fetchRentals}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
        ) : data.results.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏠</div><h3 className="empty-state-title">No rentals found</h3></div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.results.map(r => (
                <PropertyCard 
                  key={r.listing_id} 
                  listing={r} 
                  type="rental"
                  onToggleSave={() => handleToggleSave(r)}
                  isSaved={savedIds.has(r.listing_id)} 
                />
              ))}
            </div>
            <Pagination offset={offset} limit={LIMIT} total={data.total} onPageChange={setOffset} />
          </>
        )}
      </div>
    </div>
  );
}
