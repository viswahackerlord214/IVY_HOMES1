#!/usr/bin/env node
/**
 * Comprehensive analysis script for answering all 10 assignment questions.
 * Analyzes data downloaded by fetch-all-data.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'));
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));

const allListings = listings.results;
const allRentals = rentals.results;
const allProjects = projects.results;

const REFERENCE = new Date('2026-09-10T00:00:00+05:30');
const SEVEN_DAYS_BEFORE = new Date('2026-09-03T00:00:00+05:30');
const ASSIGNED_LOCALITY = 'bellandur';

console.log('='.repeat(80));
console.log('IVY HOMES DATA ANALYSIS');
console.log('='.repeat(80));

// ============================================================
// QUESTION 1: total_listing_records
// ============================================================
console.log('\n--- Q1: total_listing_records ---');
console.log(`Total fetched listings: ${allListings.length}`);
console.log(`API reported total: ${listings.total}`);

// Check for duplicate listing_ids
const listingIds = allListings.map(l => l.listing_id);
const uniqueListingIds = new Set(listingIds);
console.log(`Unique listing IDs: ${uniqueListingIds.size}`);
console.log(`Duplicate listing IDs: ${listingIds.length - uniqueListingIds.size}`);

// The answer should be unique listing records retrievable
// Since we paginated all the way, but got duplicates, the question asks "how many records are retrievable"
// The API said total: 4498. We got 4700 results. Let's find the duplicates.
const idCounts = {};
listingIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const duplicatedIds = Object.entries(idCounts).filter(([, c]) => c > 1);
console.log(`IDs appearing more than once: ${duplicatedIds.length}`);
if (duplicatedIds.length > 0) {
  console.log('Sample duplicates:', duplicatedIds.slice(0, 5).map(([id, c]) => `${id} (×${c})`).join(', '));
}

// Deduplicate for further analysis
const seenIds = new Set();
const dedupedListings = [];
allListings.forEach(l => {
  if (!seenIds.has(l.listing_id)) {
    seenIds.add(l.listing_id);
    dedupedListings.push(l);
  }
});
console.log(`Deduplicated listings: ${dedupedListings.length}`);

// Q1 answer: total records the API says it has = the count of unique IDs we can retrieve
const Q1_ANSWER = dedupedListings.length;
console.log(`\n>>> Q1 ANSWER (total_listing_records): ${Q1_ANSWER}`);

// ============================================================
// QUESTION 2: unique_properties
// ============================================================
console.log('\n--- Q2: unique_properties ---');
// Multiple listings may describe same property. 
// Identify by: apartment_name + locality + bedroom + bathroom + floor + total_floors + carpet_area
// Or by: latitude + longitude + carpet_area + bedroom
// Let's try multiple approaches

// Approach 1: Using structural features
function propertyKey(l) {
  return `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.bathroom}|${l.floor}|${l.total_floors}|${l.carpet_area}|${l.super_built_up_area}|${l.latitude}|${l.longitude}`;
}

const uniqueProperties1 = new Set(dedupedListings.map(propertyKey));
console.log(`Approach 1 (all structural fields): ${uniqueProperties1.size}`);

// Approach 2: lat/lon + carpet_area + bedroom + floor
function propertyKey2(l) {
  return `${l.latitude}|${l.longitude}|${l.carpet_area}|${l.bedroom}|${l.floor}`;
}
const uniqueProperties2 = new Set(dedupedListings.map(propertyKey2));
console.log(`Approach 2 (lat/lon+area+bhk+floor): ${uniqueProperties2.size}`);

// Approach 3: apartment_name + locality + bedroom + floor + carpet_area  
function propertyKey3(l) {
  return `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.floor}|${l.carpet_area}`;
}
const uniqueProperties3 = new Set(dedupedListings.map(propertyKey3));
console.log(`Approach 3 (name+locality+bhk+floor+area): ${uniqueProperties3.size}`);

// Let's look at listings that share the same physical attributes but have different listing_ids
const propToListings = {};
dedupedListings.forEach(l => {
  const key = propertyKey(l);
  if (!propToListings[key]) propToListings[key] = [];
  propToListings[key].push(l);
});
const duplicateProps = Object.entries(propToListings).filter(([, v]) => v.length > 1);
console.log(`\nProperty groups with multiple listings: ${duplicateProps.length}`);
if (duplicateProps.length > 0) {
  console.log('Examples of same property with multiple listings:');
  duplicateProps.slice(0, 3).forEach(([key, lsts]) => {
    console.log(`  Key: ${key.substring(0, 60)}...`);
    lsts.forEach(l => console.log(`    ID: ${l.listing_id}, price: ${l.price}, posted: ${l.posted_at}`));
  });
}

const Q2_ANSWER = uniqueProperties1.size;
console.log(`\n>>> Q2 ANSWER (unique_properties): ${Q2_ANSWER}`);

// ============================================================
// QUESTION 3: active_listings
// ============================================================
console.log('\n--- Q3: active_listings ---');
const activeListings = dedupedListings.filter(l => l.is_live === true);
const inactiveListings = dedupedListings.filter(l => l.is_live === false);
console.log(`is_live=true: ${activeListings.length}`);
console.log(`is_live=false: ${inactiveListings.length}`);
// Check for is_verified too
const verifiedCount = dedupedListings.filter(l => l.is_verified === true).length;
console.log(`is_verified=true: ${verifiedCount}`);

const Q3_ANSWER = activeListings.length;
console.log(`\n>>> Q3 ANSWER (active_listings): ${Q3_ANSWER}`);

// ============================================================
// QUESTION 4: corrupt_listing_ids
// ============================================================
console.log('\n--- Q4: corrupt_listing_ids ---');
const corruptIds = [];

dedupedListings.forEach(l => {
  const issues = [];
  
  // Floor > total_floors  
  if (l.floor !== null && l.total_floors !== null && l.floor > l.total_floors) {
    issues.push(`floor(${l.floor}) > total_floors(${l.total_floors})`);
  }
  
  // Negative values
  if (l.price < 0) issues.push(`negative price(${l.price})`);
  if (l.carpet_area < 0) issues.push(`negative carpet_area(${l.carpet_area})`);
  if (l.bedroom < 0) issues.push(`negative bedroom(${l.bedroom})`);
  if (l.bathroom < 0) issues.push(`negative bathroom(${l.bathroom})`);
  
  // Zero values that shouldn't be zero
  if (l.price === 0) issues.push(`zero price`);
  if (l.carpet_area === 0) issues.push(`zero carpet_area`);
  
  // carpet_area > super_built_up_area (impossible - SBA should always be >= CA)
  if (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area) {
    issues.push(`carpet_area(${l.carpet_area}) > super_built_up_area(${l.super_built_up_area})`);
  }
  
  // Extremely small carpet_area for the price (e.g., less than 50 sqft for millions)
  if (l.carpet_area > 0 && l.carpet_area < 50 && l.price > 5000000) {
    issues.push(`tiny carpet_area(${l.carpet_area}) with high price(${l.price})`);
  }
  
  // Bedroom = 0 for an apartment (maybe valid for studio, skip this)
  
  // Negative floor
  if (l.floor < 0) issues.push(`negative floor(${l.floor})`);
  
  // Total floors = 0 but floor > 0
  if (l.total_floors === 0 && l.floor > 0) issues.push(`total_floors=0 but floor=${l.floor}`);
  
  // Bathroom > 2 * bedroom + 2 (unreasonably many bathrooms)
  if (l.bathroom > 2 * l.bedroom + 2 && l.bathroom > 6) {
    issues.push(`too many bathrooms(${l.bathroom}) for ${l.bedroom} bedrooms`);
  }
  
  // Coordinates way outside Bangalore (approx 12.7-13.2 lat, 77.3-77.8 lon)
  if (l.latitude && l.longitude) {
    if (l.latitude < 10 || l.latitude > 15 || l.longitude < 75 || l.longitude > 80) {
      issues.push(`coordinates outside Bangalore (${l.latitude}, ${l.longitude})`);
    }
  }
  
  if (issues.length > 0) {
    corruptIds.push({ id: l.listing_id, issues });
  }
});

console.log(`Corrupt listings found: ${corruptIds.length}`);
corruptIds.forEach(c => {
  console.log(`  ${c.id}: ${c.issues.join('; ')}`);
});

const Q4_ANSWER = corruptIds.map(c => c.id).sort();
console.log(`\n>>> Q4 ANSWER (corrupt_listing_ids): ${JSON.stringify(Q4_ANSWER)}`);

// ============================================================
// QUESTION 5: total_monthly_rent
// ============================================================
console.log('\n--- Q5: total_monthly_rent ---');
// Deduplicate rentals too
const rentalIdCounts = {};
allRentals.forEach(r => { rentalIdCounts[r.listing_id] = (rentalIdCounts[r.listing_id] || 0) + 1; });
const rentalDups = Object.entries(rentalIdCounts).filter(([, c]) => c > 1);
console.log(`Rental duplicate IDs: ${rentalDups.length}`);

const seenRentalIds = new Set();
const dedupedRentals = [];
allRentals.forEach(r => {
  if (!seenRentalIds.has(r.listing_id)) {
    seenRentalIds.add(r.listing_id);
    dedupedRentals.push(r);
  }
});
console.log(`Total unique rentals: ${dedupedRentals.length}`);

const bellandurRentals = dedupedRentals.filter(r => r.locality === ASSIGNED_LOCALITY);
console.log(`Bellandur rentals: ${bellandurRentals.length}`);
const totalMonthlyRent = bellandurRentals.reduce((sum, r) => sum + r.price, 0);
console.log(`Total monthly rent in Bellandur: ${totalMonthlyRent}`);

// Check localities in rentals
const rentalLocalities = {};
dedupedRentals.forEach(r => { rentalLocalities[r.locality] = (rentalLocalities[r.locality] || 0) + 1; });
console.log('\nRental localities:', JSON.stringify(rentalLocalities, null, 2));

const Q5_ANSWER = totalMonthlyRent;
console.log(`\n>>> Q5 ANSWER (total_monthly_rent): ${Q5_ANSWER}`);

// ============================================================
// QUESTION 6: avg_price_per_sqft_2bhk
// ============================================================
console.log('\n--- Q6: avg_price_per_sqft_2bhk ---');
// is_live=true, bedroom=2, not in corrupt_ids, not in fake_ids (Q9)
// For now, compute without fake_ids exclusion (will update after Q9)
const corruptIdSet = new Set(Q4_ANSWER);

const eligible2bhk = dedupedListings.filter(l => 
  l.is_live === true && 
  l.bedroom === 2 && 
  !corruptIdSet.has(l.listing_id)
);
console.log(`Eligible 2BHK (is_live=true, bedroom=2, not corrupt): ${eligible2bhk.length}`);

// Check carpet_area units - are some in sq meters?
const smallAreas = eligible2bhk.filter(l => l.carpet_area < 200);
const normalAreas = eligible2bhk.filter(l => l.carpet_area >= 200 && l.carpet_area <= 3000);
console.log(`2BHK with carpet_area < 200: ${smallAreas.length}`);
console.log(`2BHK with carpet_area 200-3000: ${normalAreas.length}`);
if (smallAreas.length > 0) {
  console.log('Sample small areas:', smallAreas.slice(0, 5).map(l => `${l.listing_id}:${l.carpet_area}sqft`).join(', '));
}

// NOTE: Some carpet areas might be in sq meters (need to check)
// 1 sq meter = 10.764 sq feet
// A typical 2BHK in Bangalore: 600-1200 sqft or 55-110 sqm

const pricePerSqft = eligible2bhk.map(l => l.price / l.carpet_area);
const avg = pricePerSqft.reduce((a, b) => a + b, 0) / pricePerSqft.length;
console.log(`Average price/sqft (2BHK, no fake exclusion yet): ${avg.toFixed(2)}`);

// Will recalculate after finding fake IDs
console.log(`\n>>> Q6 PRELIMINARY ANSWER: ${avg.toFixed(2)} (will update after Q9)`);

// ============================================================
// QUESTION 7: costliest_project
// ============================================================
console.log('\n--- Q7: costliest_project ---');
// Deduplicate projects
const projIdCounts = {};
allProjects.forEach(p => { projIdCounts[p.project_id] = (projIdCounts[p.project_id] || 0) + 1; });
const projDups = Object.entries(projIdCounts).filter(([, c]) => c > 1);
console.log(`Project duplicate IDs: ${projDups.length}`);

const seenProjIds = new Set();
const dedupedProjects = [];
allProjects.forEach(p => {
  if (!seenProjIds.has(p.project_id)) {
    seenProjIds.add(p.project_id);
    dedupedProjects.push(p);
  }
});
console.log(`Unique projects: ${dedupedProjects.length}`);

// price_max appears to be in Crores, not rupees!
// Check: P10001 had price_max: 2.95 — that's 2.95 Cr = 29,500,000 INR
console.log('\nSample project prices:');
dedupedProjects.slice(0, 5).forEach(p => {
  console.log(`  ${p.project_id}: price_min=${p.price_min}, price_max=${p.price_max}`);
});

// Find costliest project by price_max
// But first, are prices in crores or rupees?
// If in crores, we need to convert to INR for the answer
const costliest = dedupedProjects.reduce((max, p) => 
  p.price_max > max.price_max ? p : max, dedupedProjects[0]);
console.log(`\nCostliest project: ${costliest.project_id}, price_max: ${costliest.price_max}`);

// Check if prices are in crores (small numbers like 1-30) or rupees (large numbers like 10000000+)
const avgPriceMax = dedupedProjects.reduce((s, p) => s + p.price_max, 0) / dedupedProjects.length;
console.log(`Average price_max across projects: ${avgPriceMax.toFixed(2)}`);

let priceMaxInr;
if (avgPriceMax < 100) {
  console.log('Prices appear to be in CRORES');
  priceMaxInr = Math.round(costliest.price_max * 10000000);
} else {
  console.log('Prices appear to be in RUPEES');
  priceMaxInr = costliest.price_max;
}

const Q7_ANSWER = { project_id: costliest.project_id, price_max_inr: priceMaxInr };
console.log(`\n>>> Q7 ANSWER (costliest_project): ${JSON.stringify(Q7_ANSWER)}`);

// ============================================================
// QUESTION 8: listings_last_7_days
// ============================================================
console.log('\n--- Q8: listings_last_7_days ---');
console.log(`Reference: ${REFERENCE.toISOString()}`);
console.log(`7 days before: ${SEVEN_DAYS_BEFORE.toISOString()}`);

// Check posted_at format
const sampleDates = dedupedListings.slice(0, 5).map(l => l.posted_at);
console.log('Sample posted_at values:', sampleDates);

// posted_at has no timezone suffix - need to determine if it's UTC or IST
// The health endpoint returns IST (+05:30), but let's check rentals too
const sampleRentalDates = dedupedRentals.slice(0, 3).map(r => r.posted_at);
console.log('Sample rental posted_at:', sampleRentalDates);

// Listings posted_at has no timezone suffix (like "2026-06-14T09:20:00")
// Rentals have Z suffix
// We need to determine what timezone the listing timestamps are in

// Parse listing dates - assume they could be UTC (missing Z) or IST
// Let's try both and report
const parseListingDate = (dateStr) => {
  // If no timezone suffix, could be UTC or IST
  if (dateStr.endsWith('Z')) return new Date(dateStr);
  if (dateStr.includes('+') || dateStr.includes('-', 10)) return new Date(dateStr);
  // No timezone - try as UTC first
  return new Date(dateStr + 'Z');
};

const listingsLast7DaysUTC = dedupedListings.filter(l => {
  const d = parseListingDate(l.posted_at);
  return d >= SEVEN_DAYS_BEFORE && d < REFERENCE;
});

const parseListingDateIST = (dateStr) => {
  if (dateStr.endsWith('Z')) return new Date(dateStr);
  if (dateStr.includes('+') || dateStr.includes('-', 10)) return new Date(dateStr);
  return new Date(dateStr + '+05:30');
};

const listingsLast7DaysIST = dedupedListings.filter(l => {
  const d = parseListingDateIST(l.posted_at);
  return d >= SEVEN_DAYS_BEFORE && d < REFERENCE;
});

console.log(`Listings in last 7 days (treating timestamps as UTC): ${listingsLast7DaysUTC.length}`);
console.log(`Listings in last 7 days (treating timestamps as IST): ${listingsLast7DaysIST.length}`);

// The health endpoint returns IST timestamps, so the API likely uses IST
// But listings have no suffix which is ambiguous
// Convention says "UTC, Z suffix" but actual listing data has no suffix
// Let's check if rentals (with Z suffix) give different results
const rentalsLast7 = dedupedRentals.filter(r => {
  const d = new Date(r.posted_at);
  return d >= SEVEN_DAYS_BEFORE && d < REFERENCE;
});
console.log(`Rentals in last 7 days: ${rentalsLast7.length}`);

const Q8_ANSWER_UTC = listingsLast7DaysUTC.length;
const Q8_ANSWER_IST = listingsLast7DaysIST.length;
console.log(`\n>>> Q8 ANSWER (UTC interpretation): ${Q8_ANSWER_UTC}`);
console.log(`>>> Q8 ANSWER (IST interpretation): ${Q8_ANSWER_IST}`);

// ============================================================
// QUESTION 9: fake_listing_ids
// ============================================================
console.log('\n--- Q9: fake_listing_ids ---');
// Look for patterns that indicate fake/fraudulent listings
// Common fake listing indicators:
// 1. Repeated phone numbers across many listings (lead generation)
// 2. Same description template
// 3. Too-good-to-be-true prices
// 4. Same poster with many listings

// Check phone number frequency
const contactCounts = {};
dedupedListings.forEach(l => {
  const c = l.posted_by_contact;
  if (!contactCounts[c]) contactCounts[c] = [];
  contactCounts[c].push(l.listing_id);
});

const highVolContacts = Object.entries(contactCounts)
  .filter(([, ids]) => ids.length >= 10)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\nHigh-volume contacts (10+ listings):`);
highVolContacts.forEach(([contact, ids]) => {
  console.log(`  ${contact}: ${ids.length} listings`);
});

// Check for patterns in descriptions
const descPatterns = {};
dedupedListings.forEach(l => {
  // Look for keywords that suggest lead generation
  const desc = (l.description || '').toLowerCase();
  if (desc.includes('guaranteed') || desc.includes('call now') || desc.includes('hurry') || 
      desc.includes('limited time') || desc.includes('act fast') || desc.includes('enquire now') ||
      desc.includes('best deal') || desc.includes('don\'t miss') || desc.includes('exclusive offer')) {
    if (!descPatterns[l.listing_id]) descPatterns[l.listing_id] = [];
    descPatterns[l.listing_id].push('marketing language');
  }
});
console.log(`\nListings with marketing language: ${Object.keys(descPatterns).length}`);

// Check for identical descriptions (different listings, same description)
const descToIds = {};
dedupedListings.forEach(l => {
  const d = l.description;
  if (!descToIds[d]) descToIds[d] = [];
  descToIds[d].push(l.listing_id);
});
const sharedDescs = Object.entries(descToIds).filter(([, ids]) => ids.length > 1);
console.log(`Descriptions shared by multiple listings: ${sharedDescs.length}`);

// Look for repeated exact contact+name combos with many listings
const posterCounts = {};
dedupedListings.forEach(l => {
  const key = `${l.posted_by_name}|${l.posted_by_contact}`;
  if (!posterCounts[key]) posterCounts[key] = { listings: [], contact: l.posted_by_contact, name: l.posted_by_name };
  posterCounts[key].listings.push(l);
});

const suspiciousPosters = Object.values(posterCounts)
  .filter(p => p.listings.length >= 15)
  .sort((a, b) => b.listings.length - a.listings.length);

console.log(`\nPosters with 15+ listings:`);
suspiciousPosters.forEach(p => {
  const localities = [...new Set(p.listings.map(l => l.locality))];
  console.log(`  ${p.name} (${p.contact}): ${p.listings.length} listings across ${localities.length} localities`);
});

// Check for listings where title in rental says one locality but locality field says another
// Already noticed: R1000001 title "for rent in Bellandur" but locality "whitefield"

// Look for specific fake patterns: same contact number posting across too many different apartments
const contactApartments = {};
dedupedListings.forEach(l => {
  if (!contactApartments[l.posted_by_contact]) contactApartments[l.posted_by_contact] = new Set();
  contactApartments[l.posted_by_contact].add(l.apartment_name);
});

// Contact numbers posting to unrealistic numbers of different apartments
const suspiciousContacts = Object.entries(contactApartments)
  .filter(([, apts]) => apts.size >= 20)
  .sort((a, b) => b[1].size - a[1].size);

console.log(`\nContacts posting to 20+ different apartments:`);
suspiciousContacts.forEach(([contact, apts]) => {
  console.log(`  ${contact}: ${apts.size} different apartments, ${contactCounts[contact].length} listings`);
});

// For now, let's identify fake listings as ones posted by contacts with unreasonably many listings
// across many different apartments (lead generators)
console.log('\n>>> Q9: Need more analysis to determine fake listings');

// ============================================================
// QUESTION 10: projects_with_wrong_listing_count  
// ============================================================
console.log('\n--- Q10: projects_with_wrong_listing_count ---');

// For each project, count actual listings with that project_id
const projectListingCounts = {};
dedupedListings.forEach(l => {
  if (l.project_id) {
    projectListingCounts[l.project_id] = (projectListingCounts[l.project_id] || 0) + 1;
  }
});

let wrongCount = 0;
const wrongProjects = [];
dedupedProjects.forEach(p => {
  const actualCount = projectListingCounts[p.project_id] || 0;
  const reportedCount = p.total_listings;
  if (actualCount !== reportedCount) {
    wrongCount++;
    wrongProjects.push({
      id: p.project_id,
      reported: reportedCount,
      actual: actualCount,
      diff: reportedCount - actualCount
    });
  }
});

console.log(`Projects with wrong listing count: ${wrongCount}`);
console.log(`Projects with correct count: ${dedupedProjects.length - wrongCount}`);
console.log('\nSample mismatches:');
wrongProjects.slice(0, 10).forEach(p => {
  console.log(`  ${p.id}: reported=${p.reported}, actual=${p.actual}, diff=${p.diff}`);
});

const Q10_ANSWER = wrongCount;
console.log(`\n>>> Q10 ANSWER (projects_with_wrong_listing_count): ${Q10_ANSWER}`);

// ============================================================
// ADDITIONAL ANALYSIS
// ============================================================
console.log('\n\n' + '='.repeat(80));
console.log('ADDITIONAL ANALYSIS');
console.log('='.repeat(80));

// Check carpet_area units more carefully
console.log('\n--- Carpet Area Distribution ---');
const areaRanges = { '<100': 0, '100-200': 0, '200-500': 0, '500-1000': 0, '1000-2000': 0, '2000-5000': 0, '>5000': 0 };
dedupedListings.forEach(l => {
  const a = l.carpet_area;
  if (a < 100) areaRanges['<100']++;
  else if (a < 200) areaRanges['100-200']++;
  else if (a < 500) areaRanges['200-500']++;
  else if (a < 1000) areaRanges['500-1000']++;
  else if (a < 2000) areaRanges['1000-2000']++;
  else if (a < 5000) areaRanges['2000-5000']++;
  else areaRanges['>5000']++;
});
console.log(JSON.stringify(areaRanges, null, 2));

// Listings with very small carpet areas might be in sq meters
const possibleSqm = dedupedListings.filter(l => l.carpet_area < 200 && l.carpet_area > 30);
console.log(`\nListings with carpet_area 30-200 (possibly sq meters): ${possibleSqm.length}`);
if (possibleSqm.length > 0) {
  console.log('Samples:');
  possibleSqm.slice(0, 5).forEach(l => {
    const sqft = (l.carpet_area * 10.764).toFixed(0);
    console.log(`  ${l.listing_id}: ${l.carpet_area} (=${sqft}sqft if sqm), ${l.bedroom}BHK, price=${l.price}`);
  });
}

// Check localities
const localityCounts = {};
dedupedListings.forEach(l => { localityCounts[l.locality] = (localityCounts[l.locality] || 0) + 1; });
console.log('\nLocality distribution:');
Object.entries(localityCounts).sort((a, b) => b[1] - a[1]).forEach(([loc, cnt]) => {
  console.log(`  ${loc}: ${cnt}`);
});

// ============================================================
// SUMMARY
// ============================================================
console.log('\n\n' + '='.repeat(80));
console.log('ANSWER SUMMARY');
console.log('='.repeat(80));
console.log(`Q1  total_listing_records:    ${Q1_ANSWER}`);
console.log(`Q2  unique_properties:        ${Q2_ANSWER}`);
console.log(`Q3  active_listings:          ${Q3_ANSWER}`);
console.log(`Q4  corrupt_listing_ids:      ${JSON.stringify(Q4_ANSWER)}`);
console.log(`Q5  total_monthly_rent:       ${Q5_ANSWER}`);
console.log(`Q6  avg_price_per_sqft_2bhk:  PENDING (need Q9 first)`);
console.log(`Q7  costliest_project:        ${JSON.stringify(Q7_ANSWER)}`);
console.log(`Q8  listings_last_7_days:     ${Q8_ANSWER_UTC} (UTC) / ${Q8_ANSWER_IST} (IST)`);
console.log(`Q9  fake_listing_ids:         PENDING (more analysis needed)`);
console.log(`Q10 projects_with_wrong_count: ${Q10_ANSWER}`);
