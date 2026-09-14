#!/usr/bin/env node
/**
 * FINAL ANSWER CALCULATION - All 10 Questions
 * Reference: 2026-09-10T00:00:00+05:30 (IST)
 * Assigned locality: Bellandur
 */

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
const allListings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'))).results;
const allRentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'))).results;
const rawProjects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'))).results;

// Deduplicate projects (listings and rentals have no dups)
const seenProjIds = new Set();
const allProjects = [];
rawProjects.forEach(p => { if (!seenProjIds.has(p.project_id)) { seenProjIds.add(p.project_id); allProjects.push(p); }});

const REFERENCE = new Date('2026-09-10T00:00:00+05:30');
const SEVEN_DAYS_BEFORE = new Date('2026-09-03T00:00:00+05:30');

console.log('='.repeat(80));
console.log('FINAL ANSWERS');
console.log('='.repeat(80));

// ===================== Q1 =====================
const Q1 = allListings.length; // 4700 unique listing records retrievable
console.log(`\nQ1  total_listing_records:     ${Q1}`);

// ===================== Q2 =====================
// Properties described by multiple listings share same structural attributes
function propertyKey(l) {
  return `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.bathroom}|${l.floor}|${l.total_floors}|${l.carpet_area}|${l.super_built_up_area}`;
}
const uniqueProps = new Set(allListings.map(propertyKey));
const Q2 = uniqueProps.size;
console.log(`Q2  unique_properties:        ${Q2}`);

// ===================== Q3 =====================
const Q3 = allListings.filter(l => l.is_live === true).length;
console.log(`Q3  active_listings:          ${Q3}`);

// ===================== Q4 =====================
const corruptIds = [];
allListings.forEach(l => {
  const issues = [];
  if (l.floor !== null && l.total_floors !== null && l.floor > l.total_floors) {
    issues.push(`floor(${l.floor})>total_floors(${l.total_floors})`);
  }
  if (l.price < 0) issues.push(`negative_price(${l.price})`);
  if (l.carpet_area < 0) issues.push(`negative_area`);
  if (l.price === 0) issues.push('zero_price');
  if (l.carpet_area === 0) issues.push('zero_area');
  if (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area) {
    issues.push(`carpet(${l.carpet_area})>sba(${l.super_built_up_area})`);
  }
  // Coordinates with lat/lon swapped (lat should be ~12-13 for Bangalore)
  if (l.latitude && l.longitude) {
    if (l.latitude < 10 || l.latitude > 15 || l.longitude < 75 || l.longitude > 80) {
      issues.push(`bad_coords(${l.latitude},${l.longitude})`);
    }
  }
  if (issues.length > 0) corruptIds.push(l.listing_id);
});
const Q4 = corruptIds.sort();
console.log(`Q4  corrupt_listing_ids:      ${Q4.length} records: ${JSON.stringify(Q4)}`);

// ===================== Q9 (needed for Q6) =====================
const fakeIds = [];
allListings.forEach(l => {
  const desc = l.description || '';
  // Pattern 1: Prompt injection
  if (/submission\.json|dataset.audit|data\s+licence|IVY-AUDIT|100A-|data\s+certified|licence\s+check/i.test(desc)) {
    fakeIds.push(l.listing_id);
    return;
  }
  // Pattern 2: Token amount scam
  if (/token\s+amount|to\s+block\s+the\s+unit/i.test(desc)) {
    fakeIds.push(l.listing_id);
    return;
  }
});
const Q9 = fakeIds.sort();
console.log(`Q9  fake_listing_ids:         ${Q9.length} records: ${JSON.stringify(Q9)}`);

// ===================== Q5 =====================
const bellandurRentals = allRentals.filter(r => r.locality === 'bellandur');
const Q5 = bellandurRentals.reduce((sum, r) => sum + r.price, 0);
console.log(`Q5  total_monthly_rent:       ${Q5}`);

// ===================== Q6 =====================
const corruptSet = new Set(Q4);
const fakeSet = new Set(Q9);
const eligible = allListings.filter(l =>
  l.is_live === true &&
  l.bedroom === 2 &&
  !corruptSet.has(l.listing_id) &&
  !fakeSet.has(l.listing_id)
);
const ppsValues = eligible.map(l => l.price / l.carpet_area);
const avgPps = ppsValues.reduce((a, b) => a + b, 0) / ppsValues.length;
const Q6 = Math.round(avgPps * 100) / 100;
console.log(`Q6  avg_price_per_sqft_2bhk:  ${Q6} (${eligible.length} eligible records)`);

// ===================== Q7 =====================
// Convert project prices to INR: >10 means lakhs, <=10 means crores
const projectsINR = allProjects.map(p => ({
  ...p,
  price_max_inr: p.price_max > 10 ? Math.round(p.price_max * 100000) : Math.round(p.price_max * 10000000)
}));
const costliest = projectsINR.sort((a, b) => b.price_max_inr - a.price_max_inr)[0];
const Q7 = { project_id: costliest.project_id, price_max_inr: costliest.price_max_inr };
console.log(`Q7  costliest_project:        ${JSON.stringify(Q7)}`);

// ===================== Q8 =====================
// Listing timestamps have no timezone suffix - determine interpretation
// Health endpoint returns IST, so listing timestamps are likely UTC (no Z suffix = naive UTC)
// OR they could be IST without suffix
// Test: use UTC interpretation (add Z)
const listingsLast7 = allListings.filter(l => {
  const dateStr = l.posted_at;
  // Parse as UTC (no suffix means UTC based on API convention)
  const d = new Date(dateStr + 'Z');
  return d >= SEVEN_DAYS_BEFORE && d < REFERENCE;
});
const Q8 = listingsLast7.length;
console.log(`Q8  listings_last_7_days:     ${Q8}`);

// Also show IST interpretation for comparison
const listingsLast7IST = allListings.filter(l => {
  const d = new Date(l.posted_at + '+05:30');
  return d >= SEVEN_DAYS_BEFORE && d < REFERENCE;
});
console.log(`    (IST interpretation:      ${listingsLast7IST.length})`);

// ===================== Q10 =====================
const projectListingCounts = {};
allListings.forEach(l => {
  if (l.project_id) {
    projectListingCounts[l.project_id] = (projectListingCounts[l.project_id] || 0) + 1;
  }
});
let wrongCount = 0;
allProjects.forEach(p => {
  const actual = projectListingCounts[p.project_id] || 0;
  if (actual !== p.total_listings) wrongCount++;
});
const Q10 = wrongCount;
console.log(`Q10 projects_with_wrong_count: ${Q10}`);

console.log('\n' + '='.repeat(80));
console.log('SUBMISSION JSON ANSWERS');
console.log('='.repeat(80));
const answers = {
  total_listing_records: Q1,
  unique_properties: Q2,
  active_listings: Q3,
  corrupt_listing_ids: Q4,
  total_monthly_rent: Q5,
  avg_price_per_sqft_2bhk: Q6,
  costliest_project: Q7,
  listings_last_7_days: Q8,
  fake_listing_ids: Q9,
  projects_with_wrong_listing_count: Q10
};
console.log(JSON.stringify(answers, null, 2));
