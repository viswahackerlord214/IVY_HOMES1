import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSaved, removeSaved, getLocalSavedRentals, removeLocalSavedRental, getLocalSavedProjects, removeLocalSavedProject, withRetry } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import ProjectCard from '../components/ProjectCard';

export default function SavedPage() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const result = await withRetry(() => getSaved());
      const localRentals = getLocalSavedRentals();
      const localProjects = getLocalSavedProjects();
      
      setData({
        results: [...result.results, ...localRentals, ...localProjects],
        count: result.count + localRentals.length + localProjects.length
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleRemove = async (idOrObject) => {
    // If it's a project, idOrObject is the project object (from ProjectCard)
    // If it's a listing/rental, idOrObject is the listing_id string
    const isProject = typeof idOrObject === 'object' && idOrObject.project_id;
    const itemId = isProject ? idOrObject.project_id : idOrObject;
    
    const isRental = typeof itemId === 'string' && itemId.startsWith('R');
    
    // Optimistic removal
    setData(prev => ({
      ...prev,
      count: prev.count - 1,
      results: prev.results.filter(r => (r.listing_id || r.project_id) !== itemId)
    }));

    if (isProject) {
      removeLocalSavedProject(itemId);
    } else if (isRental) {
      removeLocalSavedRental(itemId);
    } else {
      try {
        await withRetry(() => removeSaved(itemId));
      } catch {
        fetchSaved(); // Revert by re-fetching
      }
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">♥ Saved Listings</h1>
          <p className="page-desc">{data.count || data.results?.length || 0} saved properties</p>
        </div>

        {error && <div className="error-state"><p>⚠️ {error}</p></div>}

        {loading ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
        ) : data.results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">♡</div>
            <h3 className="empty-state-title">No saved listings yet</h3>
            <p>Browse listings and click the heart icon to save them.</p>
            <Link to="/listings" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Listings</Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {data.results.map(item => {
              if (item.project_id && !item.listing_id) {
                return (
                  <ProjectCard 
                    key={item.project_id}
                    project={item}
                    onToggleSave={() => handleRemove(item)}
                    isSaved={true}
                  />
                );
              }
              return (
                <PropertyCard
                  key={item.listing_id}
                  listing={item}
                  onToggleSave={handleRemove}
                  isSaved={true}
                  type={item.listing_id.startsWith('R') ? 'rental' : 'sale'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
