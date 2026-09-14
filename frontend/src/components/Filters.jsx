import { LOCALITIES, FURNISHING_OPTIONS, BHK_OPTIONS } from '../utils/formatters';
import MultiSelect from './MultiSelect';

const PROJECT_STATUS_OPTIONS = ['under construction', 'ready to move', 'new launch'];

export default function Filters({ filters, onChange, onClear, type = 'listing' }) {
  const update = (key, value) => {
    onChange({ ...filters, [key]: value || '' });
  };

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-locality">Locality</label>
        <MultiSelect 
          options={LOCALITIES.map(l => ({ value: l, label: l.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }))}
          selected={filters.locality || []}
          onChange={val => update('locality', val)}
          placeholder="All Localities"
        />
      </div>

      {type !== 'project' && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-bhk">BHK</label>
          <select
            id="filter-bhk"
            className="filter-select"
            value={filters.bhk || ''}
            onChange={e => update('bhk', e.target.value)}
          >
            <option value="">All BHK</option>
            {BHK_OPTIONS.map(b => (
              <option key={b} value={b}>{b} BHK</option>
            ))}
          </select>
        </div>
      )}

      {type !== 'project' && (
        <>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-min-price">Min Price</label>
            <input
              id="filter-min-price"
              className="filter-input"
              type="number"
              placeholder="Min ₹"
              value={filters.min_price || ''}
              onChange={e => update('min_price', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-max-price">Max Price</label>
            <input
              id="filter-max-price"
              className="filter-input"
              type="number"
              placeholder="Max ₹"
              value={filters.max_price || ''}
              onChange={e => update('max_price', e.target.value)}
            />
          </div>
        </>
      )}

      {type !== 'project' && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-furnishing">Furnishing</label>
          <select
            id="filter-furnishing"
            className="filter-select"
            value={filters.furnishing || ''}
            onChange={e => update('furnishing', e.target.value)}
          >
            <option value="">All</option>
            {FURNISHING_OPTIONS.map(f => (
              <option key={f} value={f}>{f.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </select>
        </div>
      )}

      {type === 'project' && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className="filter-select"
            value={filters.project_status || ''}
            onChange={e => update('project_status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group" style={{ flex: 'none' }}>
        <label className="filter-label">&nbsp;</label>
        <button className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
