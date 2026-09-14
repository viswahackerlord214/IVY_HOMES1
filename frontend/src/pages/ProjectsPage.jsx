import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getLocalSavedProjects, addLocalSavedProject, removeLocalSavedProject, withRetry } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';

const LIMIT = 20;

export default function ProjectsPage() {
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchProjects = useCallback(async () => {
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
      const result = await withRetry(() => getProjects(params));
      // Client-side filtering for multiple localities
      if (multiLocality.length > 0) {
        result.results = result.results.filter(p => multiLocality.includes(p.locality));
      }

      setData(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [offset, filters]);

  const loadSaved = useCallback(() => {
    const saved = getLocalSavedProjects();
    setSavedIds(new Set(saved.map(p => p.project_id)));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleToggleSave = (project) => {
    const isSaved = savedIds.has(project.project_id);
    if (isSaved) {
      removeLocalSavedProject(project.project_id);
    } else {
      addLocalSavedProject(project);
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
          <h1 className="page-title">Builder Projects</h1>
          <p className="page-desc">{data.total} projects in Bangalore</p>
        </div>

        <Filters 
          filters={filters} 
          onChange={handleFilterChange} 
          onClear={() => { setFilters({}); setOffset(0); }} 
          type="project" 
        />

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={fetchProjects}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
        ) : data.results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏗️</div>
            <h3 className="empty-state-title">No projects found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.results.map(p => (
                <ProjectCard 
                  key={p.project_id} 
                  project={p} 
                  onToggleSave={handleToggleSave}
                  isSaved={savedIds.has(p.project_id)}
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
