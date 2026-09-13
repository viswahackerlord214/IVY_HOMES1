/**
 * Format price in Indian currency format (lakhs/crores)
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '—';
  if (amount < 0) return `-${formatPrice(-amount)}`;
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(lakh % 1 === 0 ? 0 : 1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format monthly rent
 */
export function formatRent(amount) {
  if (amount === null || amount === undefined) return '—';
  return `₹${amount.toLocaleString('en-IN')}/mo`;
}

/**
 * Format area with units
 */
export function formatArea(sqft) {
  if (sqft === null || sqft === undefined) return '—';
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

/**
 * Format price per sqft
 */
export function formatPricePerSqft(price, area) {
  if (!price || !area) return '—';
  const pps = Math.round(price / area);
  return `₹${pps.toLocaleString('en-IN')}/sq.ft`;
}

/**
 * Format date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format furnishing label
 */
export function formatFurnishing(f) {
  if (!f) return '—';
  return f.split('-').map(capitalize).join(' ');
}

/**
 * Format BHK label
 */
export function formatBHK(bedrooms) {
  if (bedrooms === null || bedrooms === undefined) return '—';
  return `${bedrooms} BHK`;
}

/**
 * Truncate text
 */
export function truncate(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen) + '…';
}

/**
 * Get property type color
 */
export function getPropertyTypeColor(type) {
  const colors = {
    'apartment': '#4f46e5',
    'villa': '#059669',
    'independent house': '#d97706',
    'plot': '#7c3aed',
    'builder floor': '#0891b2',
  };
  return colors[type] || '#6b7280';
}

/**
 * Localities list for filters
 */
export const LOCALITIES = [
  'bellandur', 'whitefield', 'koramangala', 'indiranagar',
  'hsr layout', 'electronic city', 'sarjapur road',
  'hebbal', 'yelahanka', 'jp nagar'
];

/**
 * Furnishing options
 */
export const FURNISHING_OPTIONS = [
  'unfurnished', 'semi-furnished', 'fully-furnished'
];

/**
 * BHK options
 */
export const BHK_OPTIONS = [1, 2, 3, 4, 5];
