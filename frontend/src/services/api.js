const BASE_URL = 'https://solve.ivy.homes';

// API key - in a real production app this would be in a server-side proxy
// For this assignment, the API key must be sent with every request
const API_KEY = import.meta.env.VITE_API_KEY || '';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Try to refresh token
    const refreshed = await refreshToken();
    if (!refreshed) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('TOKEN_REFRESHED');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ======================== AUTH ========================

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Schedule token refresh before expiry
  scheduleRefresh(data.expires_in);
  
  return data;
}

export async function refreshToken() {
  const refreshTkn = localStorage.getItem('refresh_token');
  if (!refreshTkn) return false;
  
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshTkn }),
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    scheduleRefresh(data.expires_in);
    return true;
  } catch {
    return false;
  }
}

let refreshTimer = null;
function scheduleRefresh(expiresIn) {
  if (refreshTimer) clearTimeout(refreshTimer);
  // Refresh 60 seconds before expiry
  const refreshMs = (expiresIn - 60) * 1000;
  refreshTimer = setTimeout(async () => {
    await refreshToken();
  }, Math.max(refreshMs, 30000));
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  if (refreshTimer) clearTimeout(refreshTimer);
}

export function getStoredUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

// Initialize token refresh on page load if authenticated
export function initAuth() {
  if (isAuthenticated()) {
    // Try to refresh immediately to validate session
    refreshToken();
  }
}

// ======================== LISTINGS ========================

export async function getListings(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', params.limit);
  if (params.offset !== undefined) query.set('offset', params.offset);
  if (params.locality) query.set('locality', params.locality);
  if (params.bhk) query.set('bhk', params.bhk);
  if (params.min_price) query.set('min_price', params.min_price);
  if (params.max_price) query.set('max_price', params.max_price);
  if (params.furnishing) query.set('furnishing', params.furnishing);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.order) query.set('order', params.order);
  
  const url = `${BASE_URL}/v1/listings?${query.toString()}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getListing(id) {
  const res = await fetch(`${BASE_URL}/v1/listings/${id}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ======================== RENTALS ========================

export async function getRentals(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', params.limit);
  if (params.offset !== undefined) query.set('offset', params.offset);
  if (params.locality) query.set('locality', params.locality);
  if (params.bhk) query.set('bhk', params.bhk);
  if (params.furnishing) query.set('furnishing', params.furnishing);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.order) query.set('order', params.order);
  
  const url = `${BASE_URL}/v1/rentals?${query.toString()}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getRental(id) {
  const res = await fetch(`${BASE_URL}/v1/rentals/${id}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ======================== PROJECTS ========================

export async function getProjects(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', params.limit);
  if (params.offset !== undefined) query.set('offset', params.offset);
  if (params.locality) query.set('locality', params.locality);
  if (params.project_status) query.set('project_status', params.project_status);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.order) query.set('order', params.order);
  
  const url = `${BASE_URL}/v1/projects?${query.toString()}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getProject(id) {
  const res = await fetch(`${BASE_URL}/v1/projects/${id}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ======================== SAVED (Favourites) ========================

export async function getSaved() {
  const res = await fetch(`${BASE_URL}/v1/saved`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function addSaved(listingId) {
  const res = await fetch(`${BASE_URL}/v1/saved`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ listing_id: listingId }),
  });
  return handleResponse(res);
}

export async function removeSaved(listingId) {
  const res = await fetch(`${BASE_URL}/v1/saved/${listingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// Local storage fallback for saving rentals (API only supports property listings)
export const getLocalSavedRentals = () => {
  const saved = localStorage.getItem('saved_rentals');
  return saved ? JSON.parse(saved) : [];
};

export const addLocalSavedRental = (rental) => {
  const saved = getLocalSavedRentals();
  if (!saved.some(r => r.listing_id === rental.listing_id)) {
    saved.push(rental);
    localStorage.setItem('saved_rentals', JSON.stringify(saved));
  }
};

export const removeLocalSavedRental = (listingId) => {
  const saved = getLocalSavedRentals();
  const filtered = saved.filter(r => r.listing_id !== listingId);
  localStorage.setItem('saved_rentals', JSON.stringify(filtered));
};

// Local storage fallback for saving projects
export const getLocalSavedProjects = () => {
  const saved = localStorage.getItem('saved_projects');
  return saved ? JSON.parse(saved) : [];
};

export const addLocalSavedProject = (project) => {
  const saved = getLocalSavedProjects();
  if (!saved.some(p => p.project_id === project.project_id)) {
    saved.push(project);
    localStorage.setItem('saved_projects', JSON.stringify(saved));
  }
};

export const removeLocalSavedProject = (projectId) => {
  const saved = getLocalSavedProjects();
  const filtered = saved.filter(p => p.project_id !== projectId);
  localStorage.setItem('saved_projects', JSON.stringify(filtered));
};

// ======================== RETRY WRAPPER ========================

export async function withRetry(fn, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message === 'TOKEN_REFRESHED' && attempt < maxRetries) {
        continue; // Retry with new token
      }
      throw err;
    }
  }
}
