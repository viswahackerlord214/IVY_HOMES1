import { useState, useEffect, useCallback } from 'react';
import { getListings, getSaved, addSaved, removeSaved, withRetry } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';

const LIMIT = 20;

export default function ListingsPage() {
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { min_price, max_price, locality, ...apiFilters } = filters;
      const params = { limit: LIMIT, offset, min_price, max_price, ...apiFilters };
      
      let multiLocality = [];
      if (Array.isArray(locality) && locality.length > 0) {
        if (locality.length === 1) {
          params.locality = locality[0];
        } else {
          multiLocality = locality;
        }
      }

      Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k]; });
      
      const result = await withRetry(() => getListings(params));
      
      // Sanitize bad API data: some properties have negative prices!
      result.results.forEach(l => {
        if (l.price < 0) l.price = Math.abs(l.price);
      });

      // Because the server-side filter includes negative prices even when max_price is low,
      // we must re-enforce the max_price filter client-side after making them absolute.
      if (max_price) {
        const max = Number(max_price);
        result.results = result.results.filter(l => l.price <= max);
      }
      
      // Client-side filtering for multiple localities (API only supports one)
      if (multiLocality.length > 0) {
        result.results = result.results.filter(l => multiLocality.includes(l.locality));
      }

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [offset, filters]);

  const fetchSaved = useCallback(async () => {
    try {
      const result = await withRetry(() => getSaved());
      setSavedIds(new Set(result.results.map(r => r.listing_id)));
    } catch { /* ignore saved errors */ }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleToggleSave = async (listingId) => {
    const wasSaved = savedIds.has(listingId);
    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    try {
      if (wasSaved) {
        await withRetry(() => removeSaved(listingId));
      } else {
        await withRetry(() => addSaved(listingId));
      }
    } catch {
      // Revert on error
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(listingId) : next.delete(listingId);
        return next;
      });
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
  };

  const clearFilters = () => {
    setFilters({});
    setOffset(0);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Property Listings</h1>
          <p className="page-desc">Browse {data.total?.toLocaleString()} properties for sale in Bangalore</p>
        </div>

        <Filters filters={filters} onChange={handleFilterChange} onClear={clearFilters} />

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={fetchListings}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : data.results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <h3 className="empty-state-title">No listings found</h3>
            <p>Try adjusting your filters to see more results.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.results.map(listing => (
                <PropertyCard
                  key={listing.listing_id}
                  listing={listing}
                  onToggleSave={handleToggleSave}
                  isSaved={savedIds.has(listing.listing_id)}
                  type="sale"
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
