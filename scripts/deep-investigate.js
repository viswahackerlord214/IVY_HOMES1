#!/usr/bin/env node
/**
 * Deep investigation for Q7 (project prices), Q9 (fake listings), 
 * carpet area units, and timestamp analysis
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));

// Deduplicate
const seenIds = new Set();
const allListings = [];
listings.results.forEach(l => {
  if (!seenIds.has(l.listing_id)) { seenIds.add(l.listing_id); allListings.push(l); }
});

const seenProjIds = new Set();
const allProjects = [];
projects.results.forEach(p => {
  if (!seenProjIds.has(p.project_id)) { seenProjIds.add(p.project_id); allProjects.push(p); }
});

// ============================================================
// Q7 DEEP DIVE: Project prices
// ============================================================
console.log('=== Q7: PROJECT PRICE ANALYSIS ===');
console.log('\nAll projects sorted by price_max (top 20):');
const sortedByPriceMax = [...allProjects].sort((a, b) => b.price_max - a.price_max);
sortedByPriceMax.slice(0, 20).forEach(p => {
  console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}, name=${p.apartment_name}`);
});

// Look at price distribution
const priceMaxValues = allProjects.map(p => p.price_max);
console.log(`\nPrice max range: ${Math.min(...priceMaxValues)} to ${Math.max(...priceMaxValues)}`);
console.log(`Mean: ${(priceMaxValues.reduce((a,b) => a+b, 0) / priceMaxValues.length).toFixed(2)}`);

// Check if some are in lakhs and some in crores
const inLakhs = allProjects.filter(p => p.price_max > 10);
const inCrores = allProjects.filter(p => p.price_max <= 10);
console.log(`\nProjects with price_max > 10 (possibly in lakhs?): ${inLakhs.length}`);
console.log(`Projects with price_max <= 10 (likely in crores): ${inCrores.length}`);

// Check: are some project prices in lakhs?
// If price_max=99.8 is in lakhs, that's 99.8L = 99,80,000 = 9,980,000 INR
// If price_max=99.8 is in crores, that's 99.8Cr = 99,80,00,000 = 998,000,000 INR
// Typical Bangalore project prices: 50L to 5Cr for apartments

// Compare with actual listing prices for those projects
console.log('\nComparing project prices with actual listing prices:');
sortedByPriceMax.slice(0, 10).forEach(p => {
  const projListings = allListings.filter(l => l.project_id === p.project_id);
  if (projListings.length > 0) {
    const listingPrices = projListings.map(l => l.price);
    console.log(`  ${p.project_id}: proj_max=${p.price_max}, listing_prices=${JSON.stringify(listingPrices)}`);
    // Listing prices are in rupees (e.g., 14500000 = 1.45 Cr)
    const maxListingCr = Math.max(...listingPrices) / 10000000;
    const maxListingL = Math.max(...listingPrices) / 100000;
    console.log(`    Max listing: ${maxListingCr.toFixed(2)} Cr = ${maxListingL.toFixed(1)} L`);
  } else {
    console.log(`  ${p.project_id}: proj_max=${p.price_max}, NO listings found`);
  }
});

// Check a few "normal" projects too
console.log('\nNormal range projects:');
allProjects.filter(p => p.price_max >= 1 && p.price_max <= 5).slice(0, 10).forEach(p => {
  const projListings = allListings.filter(l => l.project_id === p.project_id);
  if (projListings.length > 0) {
    const listingPrices = projListings.map(l => l.price);
    const maxListingCr = Math.max(...listingPrices) / 10000000;
    console.log(`  ${p.project_id}: proj_max=${p.price_max}, max_listing=${maxListingCr.toFixed(2)} Cr, listings_count=${projListings.length}`);
  }
});

// ============================================================
// Q9 DEEP DIVE: Fake listings
// ============================================================
console.log('\n\n=== Q9: FAKE LISTING DEEP INVESTIGATION ===');

// Hypothesis 1: Check for phone numbers with specific patterns
// Real Indian mobile: +91 followed by 10 digits starting with 6-9
// The data uses +912... format which is unusual
const phonePatterns = {};
allListings.forEach(l => {
  const phone = l.posted_by_contact || '';
  // Check format
  if (phone.startsWith('+91200')) {
    if (!phonePatterns['+91200x']) phonePatterns['+91200x'] = 0;
    phonePatterns['+91200x']++;
  } else if (phone.startsWith('+91')) {
    const prefix = phone.substring(0, 6);
    phonePatterns[prefix] = (phonePatterns[prefix] || 0) + 1;
  }
});
console.log('Phone number prefix distribution:');
Object.entries(phonePatterns).sort((a,b) => b[1] - a[1]).forEach(([prefix, cnt]) => {
  console.log(`  ${prefix}: ${cnt}`);
});

// Hypothesis 2: Check for listings where posted_by is "dealer" or specific entity
const postedByDistribution = {};
allListings.forEach(l => {
  postedByDistribution[l.posted_by] = (postedByDistribution[l.posted_by] || 0) + 1;
});
console.log('\nposted_by distribution:', JSON.stringify(postedByDistribution));

// Hypothesis 3: Look for listings with suspiciously low prices compared to locality average
const localityPrices = {};
allListings.forEach(l => {
  if (l.is_live && l.price > 0 && l.carpet_area > 100) {
    if (!localityPrices[l.locality]) localityPrices[l.locality] = [];
    localityPrices[l.locality].push(l.price / l.carpet_area);
  }
});
console.log('\nLocality average price/sqft:');
Object.entries(localityPrices).forEach(([loc, prices]) => {
  const avg = prices.reduce((a,b) => a+b, 0) / prices.length;
  const median = prices.sort((a,b) => a-b)[Math.floor(prices.length/2)];
  console.log(`  ${loc}: avg=${avg.toFixed(0)}, median=${median.toFixed(0)}, count=${prices.length}`);
});

// Hypothesis 4: Listings with areas in sq meters (< 200) - the description says sqft
// If carpet_area is documented as sqft but some are actually in sqm, that's a discrepancy
// but not necessarily fake
const sqmListings = allListings.filter(l => l.carpet_area < 200 && l.carpet_area > 20);
console.log(`\nListings with small carpet_area (20-200, possibly sqm): ${sqmListings.length}`);

// Check which websites have small areas
const websiteSmallArea = {};
sqmListings.forEach(l => {
  websiteSmallArea[l.website] = (websiteSmallArea[l.website] || 0) + 1;
});
console.log('By website:', JSON.stringify(websiteSmallArea));

// Check ALL listings by website
const websiteCounts = {};
allListings.forEach(l => {
  websiteCounts[l.website] = (websiteCounts[l.website] || 0) + 1;
});
console.log('\nAll listings by website:', JSON.stringify(websiteCounts));

// Hypothesis 5: Check for listings where the description mentions a different locality
console.log('\nChecking for locality mismatches in descriptions...');
let mismatchCount = 0;
const mismatchExamples = [];
const localities = [...new Set(allListings.map(l => l.locality))];
allListings.forEach(l => {
  const desc = (l.description || '').toLowerCase();
  const listedLocality = l.locality;
  // Check if description mentions a DIFFERENT known locality
  for (const loc of localities) {
    if (loc !== listedLocality && desc.includes(loc.replace(/ /g, ' '))) {
      // Make sure it's a complete word match
      const regex = new RegExp(`\\b${loc.replace(/ /g, '\\s+')}\\b`, 'i');
      if (regex.test(desc)) {
        mismatchCount++;
        if (mismatchExamples.length < 5) {
          mismatchExamples.push({id: l.listing_id, locality: listedLocality, mentioned: loc, desc: desc.substring(0, 100)});
        }
        break;
      }
    }
  }
});
console.log(`Listings with locality mismatch in description: ${mismatchCount}`);
mismatchExamples.forEach(e => {
  console.log(`  ${e.id}: locality=${e.locality}, desc mentions: ${e.mentioned}`);
  console.log(`    "${e.desc}..."`);
});

// Hypothesis 6: Check for price that doesn't match what description says
// e.g., "2 BHK" in description but bedroom=3

// Hypothesis 7: Check is_verified=false listings  
const unverifiedListings = allListings.filter(l => l.is_verified === false);
console.log(`\nUnverified listings (is_verified=false): ${unverifiedListings.length}`);

// Hypothesis 8: look at listing_url domains for anomalies
const urlDomains = {};
allListings.forEach(l => {
  try {
    const domain = new URL(l.listing_url).hostname;
    urlDomains[domain] = (urlDomains[domain] || 0) + 1;
  } catch (e) {}
});
console.log('\nListing URL domains:', JSON.stringify(urlDomains, null, 2));

// Hypothesis 9: Check for duplicate descriptions across different properties
const descToListings = {};
allListings.forEach(l => {
  const d = l.description;
  if (!descToListings[d]) descToListings[d] = [];
  descToListings[d].push(l.listing_id);
});
const duplicateDescs = Object.entries(descToListings).filter(([,ids]) => ids.length > 1);
console.log(`\nDuplicate descriptions: ${duplicateDescs.length} groups`);

// ============================================================
// CARPET AREA INVESTIGATION
// ============================================================
console.log('\n\n=== CARPET AREA UNIT INVESTIGATION ===');
// If some areas are in sqm, the price/sqft calculation will be off
// A 2BHK in Bangalore: typically 600-1200 sqft or 55-110 sqm
// If carpet_area=75 and it's sqm, that's 807 sqft (reasonable for 2BHK)
// If carpet_area=75 and it's sqft, that's tiny (impossible for 2BHK)

const twoByWebsite = {};
allListings.filter(l => l.bedroom === 2).forEach(l => {
  if (!twoByWebsite[l.website]) twoByWebsite[l.website] = { areas: [], count: 0 };
  twoByWebsite[l.website].areas.push(l.carpet_area);
  twoByWebsite[l.website].count++;
});

console.log('\n2BHK carpet_area by website:');
Object.entries(twoByWebsite).forEach(([website, data]) => {
  const sorted = data.areas.sort((a,b) => a-b);
  const p10 = sorted[Math.floor(sorted.length * 0.1)];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  console.log(`  ${website}: count=${data.count}, min=${min}, p10=${p10}, median=${p50}, p90=${p90}, max=${max}`);
});

// Check if magichomes consistently has smaller areas
const magicListings = allListings.filter(l => l.website === 'magichomes');
const otherListings = allListings.filter(l => l.website !== 'magichomes');
const magicAvgArea = magicListings.reduce((s,l) => s + l.carpet_area, 0) / magicListings.length;
const otherAvgArea = otherListings.reduce((s,l) => s + l.carpet_area, 0) / otherListings.length;
console.log(`\nmagichomes avg carpet_area: ${magicAvgArea.toFixed(1)}`);
console.log(`others avg carpet_area: ${otherAvgArea.toFixed(1)}`);
console.log(`Ratio: ${(otherAvgArea / magicAvgArea).toFixed(2)} (if ~10.76, magichomes is in sqm)`);

// ============================================================  
// DUPLICATE LISTING INVESTIGATION (Q1 & Q2)
// ============================================================
console.log('\n\n=== DUPLICATE LISTING INVESTIGATION ===');
// We got 4700 results but API says total=4498
// Are there 202 duplicates that were returned?
const idCountMap = {};
listings.results.forEach(l => {
  idCountMap[l.listing_id] = (idCountMap[l.listing_id] || 0) + 1;
});
const dupIds = Object.entries(idCountMap).filter(([,c]) => c > 1);
console.log(`Duplicate listing IDs in raw data: ${dupIds.length}`);
const totalDupRecords = dupIds.reduce((s,[,c]) => s + (c-1), 0);
console.log(`Total extra duplicate records: ${totalDupRecords}`);
console.log(`Unique IDs: ${Object.keys(idCountMap).length}`);
console.log(`Expected: 4700 - ${totalDupRecords} = ${4700 - totalDupRecords}`);

// Q1: "How many listing records are retrievable" - is it unique IDs or total records returned?
// The API says total=4498. We retrieved 4700. Unique IDs = 4700 - duplicates.
// "Retrievable" means every record we CAN get = unique records accessible via pagination

// ============================================================
// TIMESTAMP INVESTIGATION
// ============================================================
console.log('\n\n=== TIMESTAMP INVESTIGATION ===');
// Listing timestamps have no timezone suffix
// Rental timestamps have Z suffix
// This is a discrepancy
console.log('Listing timestamp samples:');
allListings.slice(0, 3).forEach(l => console.log(`  ${l.listing_id}: ${l.posted_at}`));
console.log('\nRental timestamps samples (from file):');
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf-8'));
rentals.results.slice(0, 3).forEach(r => console.log(`  ${r.listing_id}: ${r.posted_at}`));

// Check: is the health endpoint returning IST time?
// The health response was: "server_time": "2026-09-13T02:46:44.028568+05:30"
// Listing timestamps: "2026-06-15T02:33:00" (no suffix)  
// If these are UTC, adding 5:30 gives IST
// If these are IST, they're already in the right timezone

// ============================================================
// PROJECT PRICE - LAKHS CHECK
// ============================================================
console.log('\n\n=== PROJECT PRICE UNIT DEEP DIVE ===');
// Hypothesis: some projects have price in lakhs, others in crores
// Check: price_min should always be <= price_max
const priceFlipped = allProjects.filter(p => p.price_min > p.price_max);
console.log(`Projects where price_min > price_max: ${priceFlipped.length}`);
priceFlipped.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}`);
});

// Distribution of price_max values
const priceMaxBuckets = { '<1': 0, '1-5': 0, '5-10': 0, '10-50': 0, '50-100': 0, '>100': 0 };
allProjects.forEach(p => {
  if (p.price_max < 1) priceMaxBuckets['<1']++;
  else if (p.price_max <= 5) priceMaxBuckets['1-5']++;
  else if (p.price_max <= 10) priceMaxBuckets['5-10']++;
  else if (p.price_max <= 50) priceMaxBuckets['10-50']++;
  else if (p.price_max <= 100) priceMaxBuckets['50-100']++;
  else priceMaxBuckets['>100']++;
});
console.log('\nprice_max distribution:', JSON.stringify(priceMaxBuckets));

// If most are 1-5, those are likely in crores (1Cr - 5Cr)
// The outliers (10-100) could be in lakhs (10L - 100L = 10,00,000 - 1,00,00,000)
// That would mean some are in crores and some in lakhs - MIXED UNITS!
