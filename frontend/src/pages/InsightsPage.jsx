import { useState, useEffect } from 'react';
import { getListings, getRentals, getProjects, withRetry } from '../services/api';

export default function InsightsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [listings, rentals, projects] = await Promise.all([
          withRetry(() => getListings({ limit: 1 })),
          withRetry(() => getRentals({ limit: 1 })),
          withRetry(() => getProjects({ limit: 1 })),
        ]);
        setStats({
          totalListings: listings.total,
          totalRentals: rentals.total,
          totalProjects: projects.total,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  // Pre-computed insights from data analysis
  const insights = {
    totalListingRecords: 4700,
    activeListings: 3722,
    inactiveListings: 978,
    uniqueProperties: 4699,
    corruptRecords: 261,
    fakeListings: 35,
    totalRentals: 1900,
    totalProjects: 498,
    projectsWrongCount: 392,
    localities: 10,
    medianPrice: 12110000,
    medianPpsf: 11794,
    bellandurRentTotal: 7724300,
    avgPricePerSqft2bhk: 10427,
    costliestProject: { id: 'P100142', name: 'Sobha Dream Acres', price: 654000000 },
    listingsLast7Days: 452,
    bhkDistribution: [
      { bhk: '1 BHK', count: 395 },
      { bhk: '2 BHK', count: 1503 },
      { bhk: '3 BHK', count: 1704 },
      { bhk: '4 BHK', count: 687 },
      { bhk: '5 BHK', count: 213 },
    ],
    localityStats: [
      { name: 'Whitefield', count: 514 },
      { name: 'Indiranagar', count: 507 },
      { name: 'Sarjapur Road', count: 506 },
      { name: 'Electronic City', count: 498 },
      { name: 'HSR Layout', count: 469 },
      { name: 'Hebbal', count: 464 },
      { name: 'Yelahanka', count: 454 },
      { name: 'Bellandur', count: 444 },
      { name: 'JP Nagar', count: 428 },
      { name: 'Koramangala', count: 416 },
    ],
  };

  const apiDiscoveries = [
    { icon: '🔑', title: 'API Key via Header', detail: 'API key must be sent via X-API-Key header, not query parameter as documented' },
    { icon: '🔄', title: 'Token Refresh', detail: 'access_token expires in 15 min (not 24h). Undocumented /auth/refresh endpoint exists' },
    { icon: '📄', title: 'Offset Pagination', detail: 'API uses offset/limit (not page/limit). Max limit is 50 (not 200)' },
    { icon: '📊', title: 'More Records Than Total', detail: `API reports total=4498 but returns 4700 unique records when fully paginated` },
    { icon: '🏠', title: 'is_live Field', detail: 'Active listings use is_live (not just is_verified). Endpoint returns all listings, not just active ones' },
    { icon: '💰', title: 'Mixed Price Units', detail: 'Project prices mix crores and lakhs. 372 projects have price_min > price_max due to unit mismatch' },
    { icon: '📐', title: 'Area Unit Mismatch', detail: 'magichomes website has ~388 listings with carpet_area in sq meters, not sq feet' },
    { icon: '⏰', title: 'Inconsistent Timestamps', detail: 'Listings have no timezone suffix, rentals have Z suffix. Health endpoint uses +05:30' },
    { icon: '🚫', title: 'Missing Endpoints', detail: '/v1/analytics/summary, /v1/listing/{id}, /v1/listings/{id}/similar all return 404' },
    { icon: '💾', title: 'Saved Endpoint', detail: 'Favourites are at /v1/saved (not /v1/favourites). POST requires listing_id (not id)' },
    { icon: '⚠️', title: 'Prompt Injection', detail: '7 listings contain AI prompt injection in descriptions attempting to modify submission.json' },
    { icon: '🎭', title: 'Token Scam Listings', detail: '28 listings ask to "Pay Rs 25,000 to block the unit" — classic lead generation scam' },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /><p>Loading insights…</p></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">📊 Market Insights</h1>
          <p className="page-desc">Data analysis and discoveries from the Bangalore property market</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.totalListingRecords.toLocaleString()}</div>
            <div className="stat-label">Total Listing Records</div>
            <div className="stat-change tag tag-success" style={{ display: 'inline-flex' }}>{insights.activeListings} active</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.uniqueProperties.toLocaleString()}</div>
            <div className="stat-label">Unique Properties</div>
            <div className="stat-change tag" style={{ display: 'inline-flex' }}>1 duplicate found</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.totalRentals.toLocaleString()}</div>
            <div className="stat-label">Rental Listings</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.totalProjects}</div>
            <div className="stat-label">Builder Projects</div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="stat-card fade-in">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{insights.corruptRecords}</div>
            <div className="stat-label">Corrupt Records</div>
            <div className="stat-change tag tag-danger" style={{ display: 'inline-flex' }}>Floor &gt; total, negative price, swapped coords</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{insights.fakeListings}</div>
            <div className="stat-label">Fake Listings</div>
            <div className="stat-change tag tag-warning" style={{ display: 'inline-flex' }}>Prompt injection + token scams</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value" style={{ color: 'var(--primary-light)' }}>₹{(insights.medianPrice / 10000000).toFixed(2)} Cr</div>
            <div className="stat-label">Overall Median Price</div>
            <div className="stat-change tag" style={{ display: 'inline-flex' }}>₹{insights.medianPpsf.toLocaleString()}/sqft</div>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.listingsLast7Days}</div>
            <div className="stat-label">New in Last 7 Days</div>
          </div>
        </div>

        {/* Property Distributions */}
        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          {/* Locality Distribution */}
          <div className="detail-section" style={{ marginBottom: 0 }}>
            <h2 className="detail-section-title">📍 Listings by Locality</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.localityStats.map(loc => {
                const pct = (loc.count / insights.totalListingRecords * 100);
                return (
                  <div key={loc.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 120, fontSize: '0.85rem', fontWeight: 500 }}>{loc.name}</span>
                    <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 4, height: 24, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'var(--gradient-primary)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                        minWidth: 2,
                      }} />
                    </div>
                    <span style={{ width: 80, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>{loc.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BHK Distribution */}
          <div className="detail-section" style={{ marginBottom: 0 }}>
            <h2 className="detail-section-title">🛏️ Listings by BHK</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.bhkDistribution.map(bhk => {
                const pct = (bhk.count / insights.totalListingRecords * 100);
                return (
                  <div key={bhk.bhk} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 120, fontSize: '0.85rem', fontWeight: 500 }}>{bhk.bhk}</span>
                    <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 4, height: 24, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'var(--gradient-primary)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                        minWidth: 2,
                      }} />
                    </div>
                    <span style={{ width: 80, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>{bhk.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* More insights */}
        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          <div className="stat-card fade-in">
            <div className="stat-value">₹{(insights.bellandurRentTotal / 100000).toFixed(1)} L</div>
            <div className="stat-label">Total Monthly Rent (Bellandur)</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Sum of monthly rent for all 191 Bellandur rentals = ₹{insights.bellandurRentTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card fade-in">
            <div className="stat-value">{insights.projectsWrongCount}</div>
            <div className="stat-label">Projects with Wrong Listing Count</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Out of {insights.totalProjects} projects, {insights.projectsWrongCount} have a total_listings that doesn't match actual listing records</p>
          </div>
        </div>

        {/* Costliest Project */}
        <div className="stat-card fade-in" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="stat-label">Costliest Project</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>🏆 {insights.costliestProject.name}</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Project ID: {insights.costliestProject.id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>₹{(insights.costliestProject.price / 10000000).toFixed(2)} Cr</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Maximum Price</div>
            </div>
          </div>
        </div>

        {/* API Discoveries */}
        <div className="detail-section">
          <h2 className="detail-section-title">🔍 API & Data Discoveries</h2>
          <div className="grid grid-2" style={{ gap: 12 }}>
            {apiDiscoveries.map((d, i) => (
              <div key={i} style={{
                padding: 16,
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.2rem' }}>{d.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.title}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
