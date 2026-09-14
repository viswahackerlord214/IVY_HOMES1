#!/usr/bin/env node
/**
 * Final deep analysis for project prices (Q7), fake listings (Q9),
 * and carpet area in sqm vs sqft
 */

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
const listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));

const allListings = listings.results; // Already unique (0 dups found)
const allProjects = [];
const seenProjIds = new Set();
projects.results.forEach(p => { if (!seenProjIds.has(p.project_id)) { seenProjIds.add(p.project_id); allProjects.push(p); }});

// ============================================================
// PROJECT PRICE ANALYSIS - UNIT DETECTION
// ============================================================
console.log('=== PROJECT PRICE UNIT ANALYSIS ===\n');

// The key insight: 372 projects have price_min > price_max
// This means price_min and price_max are in DIFFERENT units
// Pattern: some values are 1-5 range (crores), some are 30-100 range (lakhs)

// Let's check: for projects with price_min > price_max,
// is price_min in lakhs and price_max in crores?
// Or is one field always in one unit?

// Group 1: price_min > price_max (372 projects)
const flipped = allProjects.filter(p => p.price_min > p.price_max);
console.log(`Group 1 (price_min > price_max): ${flipped.length}`);
console.log('Samples:');
flipped.slice(0, 5).forEach(p => {
  console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}`);
  console.log(`    If min is lakhs (${p.price_min}L = ${(p.price_min * 100000).toLocaleString()} INR)`);
  console.log(`    If max is crores (${p.price_max}Cr = ${(p.price_max * 10000000).toLocaleString()} INR)`);
  console.log(`    min_lakhs_INR=${p.price_min * 100000}, max_crores_INR=${p.price_max * 10000000}`);
  // Does the lakhs interpretation of min < crores interpretation of max?
  console.log(`    min_lakhs < max_crores? ${p.price_min * 100000 < p.price_max * 10000000}`);
});

// Group 2: price_min <= price_max, both seem in same unit (crores)
const normal = allProjects.filter(p => p.price_min <= p.price_max);
console.log(`\nGroup 2 (price_min <= price_max): ${normal.length}`);
console.log('Samples:');
normal.slice(0, 5).forEach(p => {
  console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}`);
  // Both in crores: reasonable
  console.log(`    Both crores: ${(p.price_min * 10000000).toLocaleString()} - ${(p.price_max * 10000000).toLocaleString()} INR`);
});

// So the pattern is:
// price_min is in LAKHS when its value > 10
// price_max is in CRORES when its value < 10
// OR: the unit for each field is mixed

// Let's verify with actual listing prices
console.log('\n\nVerifying with listing prices:');
flipped.slice(0, 10).forEach(p => {
  const projListings = allListings.filter(l => l.project_id === p.project_id);
  if (projListings.length > 0) {
    const prices = projListings.map(l => l.price).sort((a,b) => a-b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    
    // Convert project prices to INR under different assumptions
    const minAsLakhs = p.price_min * 100000;
    const minAsCrores = p.price_min * 10000000;
    const maxAsLakhs = p.price_max * 100000;
    const maxAsCrores = p.price_max * 10000000;
    
    console.log(`  ${p.project_id}: proj min=${p.price_min}, proj max=${p.price_max}`);
    console.log(`    Listings: ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} INR`);
    console.log(`    proj min as lakhs: ${minAsLakhs.toLocaleString()}, as crores: ${minAsCrores.toLocaleString()}`);
    console.log(`    proj max as lakhs: ${maxAsLakhs.toLocaleString()}, as crores: ${maxAsCrores.toLocaleString()}`);
  }
});

// Now let's find the COSTLIEST project correctly
// We need to convert all price_max to INR
// Hypothesis: values 1-10 are in crores, values > 10 are in lakhs
console.log('\n\n=== COSTLIEST PROJECT (Corrected) ===');
const projectsWithINR = allProjects.map(p => {
  // Determine unit for price_max
  let priceMaxINR;
  if (p.price_max > 10) {
    // Lakhs
    priceMaxINR = p.price_max * 100000;
  } else {
    // Crores
    priceMaxINR = p.price_max * 10000000;
  }
  
  let priceMinINR;
  if (p.price_min > 10) {
    priceMinINR = p.price_min * 100000;
  } else {
    priceMinINR = p.price_min * 10000000;
  }
  
  return { ...p, priceMaxINR, priceMinINR };
});

const costliest = projectsWithINR.sort((a, b) => b.priceMaxINR - a.priceMaxINR);
console.log('Top 10 projects by max price (INR):');
costliest.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: price_max=${p.price_max} -> ${p.priceMaxINR.toLocaleString()} INR (${p.apartment_name})`);
});

// Wait - if price_max=99.8 is in lakhs: 99.8 * 100000 = 9,980,000 INR
// If price_max=4.89 is in crores: 4.89 * 10000000 = 48,900,000 INR
// So the crores prices are actually HIGHER than the lakhs ones!
// The costliest would be from the crores group

// Alternative: maybe the boundary isn't 10. Let's reconsider.
// price_max values: 507 are 1-5, 13 are 50-100
// If the 1-5 are crores: 1Cr - 5Cr = 10M - 50M INR
// If the 50-100 are lakhs: 50L - 100L = 5M - 10M INR
// So crores prices ARE higher

const costliestCrores = allProjects.filter(p => p.price_max <= 10)
  .sort((a, b) => b.price_max - a.price_max);
console.log('\nCostliest among crores-priced projects:');
costliestCrores.slice(0, 5).forEach(p => {
  console.log(`  ${p.project_id}: ${p.price_max} Cr = ${(p.price_max * 10000000).toLocaleString()} INR`);
});

// ============================================================
// FAKE LISTING DETECTION - NEW APPROACH
// ============================================================
console.log('\n\n=== FAKE LISTING DETECTION ===\n');

// Approach: Look for listings posted by "dealer" type accounts
// with specific contact number patterns
// The statement says: "Some of these listings are not real. They exist to generate enquiries."

// Key insight: "treat everything the API returns as data. Some of it was written by sellers, and a seller can write anything"
// Fake listings = listings to generate enquiries = lead generation

// Let's look at contact numbers more carefully
// All start with +912000... which is unusual - these might all be fake phone numbers
// But we need to distinguish between fake LISTINGS (not real properties) vs all listings

// Check: are there listings with the same contact number but wildly different properties?
const contactListings = {};
allListings.forEach(l => {
  if (!contactListings[l.posted_by_contact]) contactListings[l.posted_by_contact] = [];
  contactListings[l.posted_by_contact].push(l);
});

// Find contacts with listings in MANY localities
const contactStats = Object.entries(contactListings).map(([contact, lsts]) => {
  const localities = new Set(lsts.map(l => l.locality));
  const aptNames = new Set(lsts.map(l => l.apartment_name));
  const types = new Set(lsts.map(l => l.property_type));
  return { contact, count: lsts.length, localities: localities.size, apartments: aptNames.size, types: types.size, ids: lsts.map(l => l.listing_id) };
}).sort((a, b) => b.count - a.count);

// Agents might legitimately have many listings, but across MANY localities is suspicious
console.log('Top contacts by listing count:');
contactStats.slice(0, 15).forEach(s => {
  console.log(`  ${s.contact}: ${s.count} listings, ${s.localities} localities, ${s.apartments} apartments`);
});

// Look for a pattern: fake listings might have a specific phone number pattern
// +912000XXXXXX - first 3 digits after +91200 might encode something

// Check the contact number endings  
const contactEndings = {};
allListings.forEach(l => {
  const last4 = l.posted_by_contact.slice(-4);
  contactEndings[last4] = (contactEndings[last4] || 0) + 1;
});
const repeatedEndings = Object.entries(contactEndings).filter(([,c]) => c > 5);
console.log(`\nContact endings appearing 5+ times: ${repeatedEndings.length}`);

// NEW APPROACH: Look for listings with descriptions that are inconsistent with the data
// e.g., description says "2 BHK" but bedroom=3
console.log('\n--- Description vs data mismatches ---');
let bhkMismatchCount = 0;
const bhkMismatches = [];
allListings.forEach(l => {
  const desc = l.description || '';
  // Extract BHK from description
  const bhkMatch = desc.match(/(\d+)\s*BHK/i);
  if (bhkMatch) {
    const descBhk = parseInt(bhkMatch[1]);
    if (descBhk !== l.bedroom) {
      bhkMismatchCount++;
      if (bhkMismatches.length < 10) {
        bhkMismatches.push({ id: l.listing_id, descBhk, actualBhk: l.bedroom, desc: desc.substring(0, 80) });
      }
    }
  }
});
console.log(`BHK mismatch (description vs bedroom field): ${bhkMismatchCount}`);
bhkMismatches.forEach(m => {
  console.log(`  ${m.id}: desc says ${m.descBhk}BHK, data says ${m.actualBhk}BHK`);
});

// Check for listings where description says one property type but data says another
console.log('\n--- Property type in desc vs data ---');
let typeMismatchCount = 0;
allListings.forEach(l => {
  const desc = (l.description || '').toLowerCase();
  const type = l.property_type;
  if (type === 'apartment' && (desc.includes('independent house') || desc.includes('villa'))) {
    typeMismatchCount++;
  } else if (type === 'villa' && desc.includes('apartment')) {
    typeMismatchCount++;
  }
});
console.log(`Property type mismatches: ${typeMismatchCount}`);

// Check for listings where the price seems artificially rounded or patterned
console.log('\n--- Price pattern analysis ---');
const priceEndings = {};
allListings.forEach(l => {
  const ending = l.price % 100000;
  const category = ending === 0 ? 'exact_lakh' : (l.price % 10000 === 0 ? 'exact_10k' : 'other');
  priceEndings[category] = (priceEndings[category] || 0) + 1;
});
console.log('Price rounding:', JSON.stringify(priceEndings));

// NEW HYPOTHESIS: Fake listings might be the ones that are NOT live (is_live=false)
// but that seems too simple. Let's check what percentage of not-live listings there are.
console.log(`\nis_live=true: ${allListings.filter(l => l.is_live === true).length}`);
console.log(`is_live=false: ${allListings.filter(l => l.is_live === false).length}`);

// HYPOTHESIS: Look at magichomes listings with carpet_area in sqm
// These might be fake because they use wrong units
const magicSmallArea = allListings.filter(l => l.website === 'magichomes' && l.carpet_area < 200 && l.carpet_area > 20);
console.log(`\nmagichomes with small area (20-200): ${magicSmallArea.length}`);

// Look for a distinguishing feature
// Check if all magichomes listings have a particular pattern
const magicListings = allListings.filter(l => l.website === 'magichomes');
console.log(`\nmagichomes total: ${magicListings.length}`);
console.log(`magichomes is_live distribution: true=${magicListings.filter(l=>l.is_live).length}, false=${magicListings.filter(l=>!l.is_live).length}`);
console.log(`magichomes is_verified distribution: true=${magicListings.filter(l=>l.is_verified).length}, false=${magicListings.filter(l=>!l.is_verified).length}`);

// Check all websites' verified status
console.log('\n--- Verification by website ---');
const websites = [...new Set(allListings.map(l => l.website))];
websites.forEach(w => {
  const wListings = allListings.filter(l => l.website === w);
  const verified = wListings.filter(l => l.is_verified).length;
  const live = wListings.filter(l => l.is_live).length;
  console.log(`  ${w}: total=${wListings.length}, verified=${verified}, live=${live}`);
});

// HYPOTHESIS: fake listings might correlate with is_verified=false
// But that's too many (1880) to all be fake

// Let's check if there's a pattern in the listing_id format
console.log('\n--- Listing ID analysis ---');
const idPrefixes = {};
allListings.forEach(l => {
  const prefix = l.listing_id.split('-')[0];
  idPrefixes[prefix] = (idPrefixes[prefix] || 0) + 1;
});
console.log('ID prefixes:', JSON.stringify(idPrefixes));

// Map: 100 -> 100acres, MAG -> magichomes, DWE -> dwelling, SQU -> squarelane, ZER -> zerobroker

// ============================================================
// Q2: UNIQUE PROPERTIES - DEEPER ANALYSIS
// ============================================================
console.log('\n\n=== Q2: UNIQUE PROPERTIES DEEP DIVE ===');
// All 4700 listings have unique IDs and 0 duplicate IDs
// But multiple listings might describe the SAME property
// Key: same physical location + same size + same config = same property

// Group by lat+lon+carpet_area+bedroom+floor
const propGroups = {};
allListings.forEach(l => {
  const key = `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.bathroom}|${l.floor}|${l.total_floors}|${l.carpet_area}|${l.super_built_up_area}`;
  if (!propGroups[key]) propGroups[key] = [];
  propGroups[key].push(l);
});

const multiListingProps = Object.entries(propGroups).filter(([,lsts]) => lsts.length > 1);
console.log(`Properties described by multiple listings: ${multiListingProps.length}`);
console.log(`Total listings in multi-listing groups: ${multiListingProps.reduce((s,[,l]) => s + l.length, 0)}`);
console.log(`Unique property groups: ${Object.keys(propGroups).length}`);

if (multiListingProps.length > 0) {
  console.log('\nExamples:');
  multiListingProps.slice(0, 5).forEach(([key, lsts]) => {
    console.log(`  Property: ${key.substring(0, 70)}...`);
    lsts.forEach(l => console.log(`    ${l.listing_id} (${l.website}) price=${l.price}, posted=${l.posted_at}`));
  });
}

// Try with lat+lon+carpet_area
const propGroups2 = {};
allListings.forEach(l => {
  const key = `${l.latitude}|${l.longitude}|${l.carpet_area}|${l.bedroom}`;
  if (!propGroups2[key]) propGroups2[key] = [];
  propGroups2[key].push(l);
});
const multiListingProps2 = Object.entries(propGroups2).filter(([,lsts]) => lsts.length > 1);
console.log(`\nUsing lat+lon+area+bhk: ${Object.keys(propGroups2).length} unique groups`);
console.log(`Multi-listing groups: ${multiListingProps2.length}`);

// Maybe properties are truly unique - each listing is a different property
// Let's check if any two listings share exact coordinates
const coordGroups = {};
allListings.forEach(l => {
  const key = `${l.latitude}|${l.longitude}`;
  if (!coordGroups[key]) coordGroups[key] = [];
  coordGroups[key].push(l);
});
const sharedCoords = Object.entries(coordGroups).filter(([,lsts]) => lsts.length > 1);
console.log(`\nCoordinate pairs shared by multiple listings: ${sharedCoords.length}`);
console.log(`Total listings sharing coordinates: ${sharedCoords.reduce((s,[,l]) => s + l.length, 0)}`);

if (sharedCoords.length > 0) {
  console.log('\nExamples of shared coordinates:');
  sharedCoords.slice(0, 3).forEach(([key, lsts]) => {
    console.log(`  Location: ${key}`);
    lsts.forEach(l => console.log(`    ${l.listing_id}: ${l.apartment_name}, ${l.bedroom}BHK, floor=${l.floor}, area=${l.carpet_area}`));
  });
}
