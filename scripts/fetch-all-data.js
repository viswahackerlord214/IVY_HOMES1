#!/usr/bin/env node
/**
 * Fetches ALL listings, rentals, and projects from the Ivy Homes API.
 * Uses discovered pagination behavior (offset-based, max limit=50).
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'IVY26-6F996DCC9055';
const BASE_URL = 'https://solve.ivy.homes';
const PASSWORD = '9bf41cf213';
const LIMIT = 50; // Actual max limit

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ email: 'demo1@ivy.homes', password: PASSWORD }),
  });
  const data = await res.json();
  return data.access_token;
}

async function fetchAllPages(endpoint, token) {
  const allResults = [];
  let offset = 0;
  let total = null;
  let page = 0;

  while (true) {
    const url = `${BASE_URL}${endpoint}?limit=${LIMIT}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      console.error(`Error fetching ${url}: ${res.status}`);
      break;
    }

    const data = await res.json();
    
    if (total === null) {
      total = data.total;
      console.log(`  Total records: ${total}`);
    }
    
    allResults.push(...data.results);
    page++;
    console.log(`  Page ${page}: fetched ${data.count} records (offset=${offset}, total so far: ${allResults.length})`);
    
    if (!data.has_more || data.results.length === 0) {
      break;
    }
    
    offset += LIMIT;
    
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`  Done: ${allResults.length} total records fetched`);
  return { total, results: allResults };
}

async function main() {
  console.log('=== Logging in ===');
  const token = await login();
  console.log('Login successful\n');

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  console.log('=== Fetching Listings ===');
  const listings = await fetchAllPages('/v1/listings', token);
  fs.writeFileSync(path.join(dataDir, 'listings.json'), JSON.stringify(listings, null, 2));
  console.log(`\nListings saved: ${listings.results.length}\n`);

  console.log('=== Fetching Rentals ===');
  const rentals = await fetchAllPages('/v1/rentals', token);
  fs.writeFileSync(path.join(dataDir, 'rentals.json'), JSON.stringify(rentals, null, 2));
  console.log(`\nRentals saved: ${rentals.results.length}\n`);

  console.log('=== Fetching Projects ===');
  const projects = await fetchAllPages('/v1/projects', token);
  fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects, null, 2));
  console.log(`\nProjects saved: ${projects.results.length}\n`);

  console.log('=== Summary ===');
  console.log(`Listings: ${listings.results.length} (API total: ${listings.total})`);
  console.log(`Rentals: ${rentals.results.length} (API total: ${rentals.total})`);
  console.log(`Projects: ${projects.results.length} (API total: ${projects.total})`);
}

main().catch(console.error);
