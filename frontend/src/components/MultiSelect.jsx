import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, selected, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="multi-select" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="filter-input multi-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '38px', background: 'var(--bg-input)' }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected.length === 0 ? (
            <span style={{ color: '#9ca3af' }}>{placeholder}</span>
          ) : selected.length === 1 ? (
            options.find(o => o.value === selected[0])?.label || selected[0]
          ) : (
            `${selected.length} selected`
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && (
        <div 
          className="multi-select-dropdown" 
          style={{ 
            position: 'absolute', top: '100%', left: 0, right: 0, 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px', 
            marginTop: '4px', 
            zIndex: 1000,
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                  className="multi-select-option"
                >
                  <input 
                    type="checkbox" 
                    checked={selected.includes(opt.value)} 
                    onChange={() => {}} 
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
