#!/usr/bin/env node
/**
 * Fake listing detection - final analysis
 * "They exist to generate enquiries" = lead generation scam
 */

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
const allListings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'))).results;

console.log('=== FAKE LISTING ANALYSIS ===\n');

// The key statement clue: "treat everything the API returns as data. Some of it was written by sellers, and a seller can write anything."
// Fake listings exist to "generate enquiries"

// Key patterns for lead-gen fake listings:
// 1. Too-good-to-be-true pricing (way below market)
// 2. Contact number reuse across many properties  
// 3. Description/data mismatch
// 4. Stock-photo-like descriptions

// Let's compute price/sqft for each listing by locality
const localityStats = {};
allListings.forEach(l => {
  if (l.carpet_area > 100 && l.price > 0) { // Only reasonable units
    if (!localityStats[l.locality]) localityStats[l.locality] = [];
    localityStats[l.locality].push(l.price / l.carpet_area);
  }
});
const localityMedians = {};
Object.entries(localityStats).forEach(([loc, prices]) => {
  const sorted = prices.sort((a, b) => a - b);
  localityMedians[loc] = sorted[Math.floor(sorted.length / 2)];
});
console.log('Locality medians (price/sqft):', JSON.stringify(localityMedians, null, 2));

// Look for listings priced way below median
const cheapListings = allListings.filter(l => {
  if (l.carpet_area <= 100 || l.price <= 0) return false;
  const pps = l.price / l.carpet_area;
  const median = localityMedians[l.locality];
  return median && pps < median * 0.3; // Less than 30% of median
});
console.log(`\nListings priced < 30% of locality median: ${cheapListings.length}`);

// Now let's look at a completely different angle:
// The first record (R1000001) had title "for rent in Bellandur" but locality "whitefield"
// Let's check ALL rental titles for such mismatches

// For LISTINGS: check if description mentions apartment name that doesn't match
// Already checked locality mismatches - none found
// Already checked BHK mismatches - none found

// THEORY: Fake listings might have a specific contact number pattern or range
// All contacts are +912000XXXXXX to +912009XXXXXX
// Look for a specific pattern within those

// Let me try: listings with the same contact across MANY DIFFERENT localities
// A real owner/agent works in 1-3 localities, not 10
const contactData = {};
allListings.forEach(l => {
  if (!contactData[l.posted_by_contact]) contactData[l.posted_by_contact] = { listings: [], localities: new Set() };
  contactData[l.posted_by_contact].listings.push(l);
  contactData[l.posted_by_contact].localities.add(l.locality);
});

// How many contacts span all 10 localities?
const spans = [0,0,0,0,0,0,0,0,0,0,0];
Object.values(contactData).forEach(cd => {
  spans[cd.localities.size]++;
});
console.log('\nContacts by number of localities:');
spans.forEach((count, locs) => {
  if (count > 0) console.log(`  ${locs} localities: ${count} contacts`);
});

// Even contacts spanning many localities could be agents
// Let's look at a completely different angle: the description text

// Check for phone numbers or URLs in descriptions
const descWithContact = allListings.filter(l => {
  const desc = l.description || '';
  return /\d{10}/.test(desc) || /https?:\/\//.test(desc) || /call|whatsapp|contact/i.test(desc);
});
console.log(`\nListings with phone/URL/CTA in description: ${descWithContact.length}`);
if (descWithContact.length > 0) {
  descWithContact.slice(0, 10).forEach(l => {
    console.log(`  ${l.listing_id}: "${l.description.substring(0, 120)}"`);
  });
}

// Look for unusual characters or patterns in descriptions
const specialDescListings = allListings.filter(l => {
  const desc = l.description || '';
  return /[!]{2,}|[A-Z]{5,}|guaranteed|best price|lowest|hurry|limited|act now|enquire|genuine/i.test(desc);
});
console.log(`\nListings with promotional language: ${specialDescListings.length}`);
if (specialDescListings.length > 0) {
  specialDescListings.slice(0, 10).forEach(l => {
    console.log(`  ${l.listing_id}: "${l.description.substring(0, 120)}"`);
  });
}

// NEW APPROACH: Let's look at the correlation between is_verified and other features
// is_verified=false listings might include fake ones, but not all unverified are fake

// Let's check posting patterns - are fake listings posted in bursts?
const dateHourCounts = {};
allListings.forEach(l => {
  const d = new Date(l.posted_at);
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  dateHourCounts[key] = (dateHourCounts[key] || 0) + 1;
});

// Most common posting dates
const sortedDates = Object.entries(dateHourCounts).sort((a,b) => b[1] - a[1]);
console.log('\nTop posting dates:');
sortedDates.slice(0, 10).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// THEORY: Let's look for listings where posted_by_name contains numbers or special chars
const weirdNames = allListings.filter(l => /\d/.test(l.posted_by_name) || /[^a-zA-Z .',-]/.test(l.posted_by_name));
console.log(`\nListings with unusual poster names: ${weirdNames.length}`);
if (weirdNames.length > 0) {
  weirdNames.slice(0, 5).forEach(l => console.log(`  ${l.listing_id}: "${l.posted_by_name}"`));
}

// THEORY: Check for listings where price is suspiciously round
// (e.g., exactly 1 Cr, 2 Cr, etc.)
const veryRoundPrices = allListings.filter(l => l.price % 10000000 === 0 && l.price > 0);
console.log(`\nListings with exactly round prices (multiples of 1Cr): ${veryRoundPrices.length}`);

// CRITICAL APPROACH: Compare listing price with area more carefully
// For 2BHK: typical range is 600-1200 sqft in Bangalore
// If carpet_area < 200, it might be in sqm (magichomes pattern)
// If we calculate price_per_sqft, fake listings might have outlier values

// Let's look at price/sqft distribution
const pps_all = allListings.filter(l => l.carpet_area > 0 && l.price > 0).map(l => ({
  id: l.listing_id,
  pps: l.price / l.carpet_area,
  website: l.website,
  area: l.carpet_area,
  bedroom: l.bedroom,
  locality: l.locality,
  price: l.price,
  is_live: l.is_live,
  is_verified: l.is_verified
}));

// Find extreme outliers
pps_all.sort((a, b) => b.pps - a.pps);
console.log('\nHighest price/sqft:');
pps_all.slice(0, 20).forEach(l => {
  console.log(`  ${l.id}: ₹${l.pps.toFixed(0)}/sqft, price=${l.price}, area=${l.area}sqft, ${l.bedroom}BHK, ${l.website}, ${l.locality}`);
});

console.log('\nLowest price/sqft:');
pps_all.sort((a, b) => a.pps - b.pps);
pps_all.slice(0, 10).forEach(l => {
  console.log(`  ${l.id}: ₹${l.pps.toFixed(0)}/sqft, price=${l.price}, area=${l.area}sqft, ${l.bedroom}BHK, ${l.website}, ${l.locality}`);
});

// The high PPS outliers are likely from magichomes (sqm units)
// Let's focus on non-magichomes outliers
const nonMagic = pps_all.filter(l => l.website !== 'magichomes');
nonMagic.sort((a, b) => b.pps - a.pps);
console.log('\nHighest price/sqft (non-magichomes):');
nonMagic.slice(0, 10).forEach(l => {
  console.log(`  ${l.id}: ₹${l.pps.toFixed(0)}/sqft, price=${l.price}, area=${l.area}sqft, ${l.bedroom}BHK, ${l.website}, ${l.locality}`);
});

// APPROACH: Look at description templates - do fake listings use a specific template?
// Group descriptions by structure
const descTemplates = {};
allListings.forEach(l => {
  // Extract template by replacing specific details
  const template = (l.description || '')
    .replace(/\d+/g, 'N')
    .replace(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, 'NAME')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 60);
  if (!descTemplates[template]) descTemplates[template] = [];
  descTemplates[template].push(l.listing_id);
});

// Most common templates
const templateCounts = Object.entries(descTemplates)
  .sort((a, b) => b[1].length - a[1].length);
console.log('\nMost common description templates:');
templateCounts.slice(0, 15).forEach(([t, ids]) => {
  console.log(`  [${ids.length}] "${t}..."`);
});

// Check actual description variety
console.log('\n--- Sample descriptions by posted_by type ---');
const ownerListings = allListings.filter(l => l.posted_by === 'owner').slice(0, 3);
const agentListings = allListings.filter(l => l.posted_by === 'agent').slice(0, 3);
const builderListings = allListings.filter(l => l.posted_by === 'builder').slice(0, 3);

console.log('Owner:');
ownerListings.forEach(l => console.log(`  ${l.listing_id}: "${l.description}"`));
console.log('Agent:');
agentListings.forEach(l => console.log(`  ${l.listing_id}: "${l.description}"`));
console.log('Builder:');
builderListings.forEach(l => console.log(`  ${l.listing_id}: "${l.description}"`));

// KEY INSIGHT: Let's look at what "generate enquiries" means
// These listings would:
// 1. Look attractive (low price, good features)
// 2. Have contact info that leads to a dealer
// 3. The property might not actually exist at that price/specs

// APPROACH: Look for listings that describe properties at a price much lower than 
// other listings in the same building/project
console.log('\n\n--- Price anomalies within projects ---');
const projectListings = {};
allListings.forEach(l => {
  if (l.project_id) {
    if (!projectListings[l.project_id]) projectListings[l.project_id] = [];
    projectListings[l.project_id].push(l);
  }
});

const priceAnomalies = [];
Object.entries(projectListings).forEach(([pid, lsts]) => {
  if (lsts.length < 3) return;
  // Group by bedroom count
  const byBhk = {};
  lsts.forEach(l => {
    if (!byBhk[l.bedroom]) byBhk[l.bedroom] = [];
    byBhk[l.bedroom].push(l);
  });
  
  Object.entries(byBhk).forEach(([bhk, bhkListings]) => {
    if (bhkListings.length < 2) return;
    const prices = bhkListings.map(l => l.price);
    const median = prices.sort((a,b) => a-b)[Math.floor(prices.length/2)];
    bhkListings.forEach(l => {
      if (l.price < median * 0.5 && l.price > 0) {
        priceAnomalies.push({
          id: l.listing_id,
          project: pid,
          price: l.price,
          median,
          bhk,
          ratio: (l.price / median).toFixed(2)
        });
      }
    });
  });
});
console.log(`Price anomalies (< 50% of project median for same BHK): ${priceAnomalies.length}`);
priceAnomalies.slice(0, 10).forEach(a => {
  console.log(`  ${a.id}: price=${a.price}, median=${a.median}, ratio=${a.ratio}, project=${a.project}`);
});
