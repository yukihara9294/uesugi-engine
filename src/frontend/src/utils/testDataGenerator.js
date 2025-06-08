/**
 * Test script for Hiroshima Prefecture Data Generator
 */

import { 
  generateAllPrefectureData,
  HIROSHIMA_CITIES,
  TRANSPORTATION_ROUTES 
} from './hiroshimaPrefectureDataGenerator.js';

// Test the data generator
console.log('Testing Hiroshima Prefecture Data Generator...\n');

// Generate all data
const prefectureData = generateAllPrefectureData();

// Summary statistics
console.log('=== Data Generation Summary ===');
console.log(`Cities: ${Object.keys(HIROSHIMA_CITIES).length}`);
console.log(`Transportation Routes: ${TRANSPORTATION_ROUTES.length}`);
console.log(`\nGenerated Data Points:`);
console.log(`- Accommodation Facilities: ${prefectureData.accommodation.length}`);
console.log(`- Consumption Points: ${prefectureData.consumption.length}`);
console.log(`- Mobility Routes: ${prefectureData.mobility.routes.length}`);
console.log(`- Congestion Points: ${prefectureData.mobility.congestionPoints.length}`);
console.log(`- Landmarks: ${prefectureData.landmarks.length}`);
console.log(`- Events: ${prefectureData.events.length}`);
console.log(`- SNS Heatmap Points: ${prefectureData.heatmap.length}`);

// City-wise breakdown
console.log('\n=== City-wise Breakdown ===');
Object.values(HIROSHIMA_CITIES).forEach(city => {
  const cityAccommodations = prefectureData.accommodation.filter(a => a.city === city.name);
  const cityConsumption = prefectureData.consumption.filter(c => c.city === city.name);
  const cityLandmarks = prefectureData.landmarks.filter(l => l.city === city.name);
  const cityEvents = prefectureData.events.filter(e => e.city === city.name);
  const cityHeatmap = prefectureData.heatmap.filter(h => h.city === city.name);
  
  console.log(`\n${city.name} (${city.nameEn}):`);
  console.log(`  Population: ${city.population.toLocaleString()}`);
  console.log(`  Districts: ${city.districts.length}`);
  console.log(`  Generated Data:`);
  console.log(`    - Hotels: ${cityAccommodations.length}`);
  console.log(`    - Consumption Points: ${cityConsumption.length}`);
  console.log(`    - Landmarks: ${cityLandmarks.length}`);
  console.log(`    - Events: ${cityEvents.length}`);
  console.log(`    - SNS Points: ${cityHeatmap.length}`);
});

// Sample data points
console.log('\n=== Sample Data Points ===');
console.log('\nSample Accommodation:');
console.log(JSON.stringify(prefectureData.accommodation[0], null, 2));

console.log('\nSample Consumption:');
console.log(JSON.stringify(prefectureData.consumption[0], null, 2));

console.log('\nSample Mobility Route:');
console.log(JSON.stringify(prefectureData.mobility.routes[0], null, 2));

console.log('\nSample Landmark:');
console.log(JSON.stringify(prefectureData.landmarks[0], null, 2));

console.log('\nSample Event:');
console.log(JSON.stringify(prefectureData.events[0], null, 2));

console.log('\nMap Bounds:');
console.log(JSON.stringify(prefectureData.bounds, null, 2));

// Data validation
console.log('\n=== Data Validation ===');
let validationPassed = true;

// Check coordinates are within bounds
const bounds = prefectureData.bounds;
let outOfBounds = 0;

const checkCoordinates = (item, type) => {
  const [lng, lat] = item.coordinates;
  if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) {
    outOfBounds++;
    console.warn(`${type} out of bounds: ${item.name || item.id} at [${lng}, ${lat}]`);
    validationPassed = false;
  }
};

prefectureData.accommodation.forEach(a => checkCoordinates(a, 'Accommodation'));
prefectureData.consumption.forEach(c => checkCoordinates(c, 'Consumption'));
prefectureData.landmarks.forEach(l => checkCoordinates(l, 'Landmark'));
prefectureData.events.forEach(e => checkCoordinates(e, 'Event'));
prefectureData.heatmap.forEach(h => checkCoordinates(h, 'Heatmap'));

console.log(`\nCoordinates check: ${outOfBounds === 0 ? 'PASSED' : `FAILED (${outOfBounds} points out of bounds)`}`);

// Check data distribution matches population
console.log('\n=== Population-based Distribution Check ===');
const totalPopulation = Object.values(HIROSHIMA_CITIES).reduce((sum, city) => sum + city.population, 0);

Object.values(HIROSHIMA_CITIES).forEach(city => {
  const populationRatio = city.population / totalPopulation;
  const cityHeatmap = prefectureData.heatmap.filter(h => h.city === city.name);
  const heatmapRatio = cityHeatmap.length / prefectureData.heatmap.length;
  
  const deviation = Math.abs(populationRatio - heatmapRatio) * 100;
  console.log(`${city.name}: Population ${(populationRatio * 100).toFixed(1)}%, Data ${(heatmapRatio * 100).toFixed(1)}% (deviation: ${deviation.toFixed(1)}%)`);
});

console.log(`\nOverall validation: ${validationPassed ? 'PASSED' : 'FAILED'}`);

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testPrefectureData = prefectureData;
  console.log('\nData exported to window.testPrefectureData for browser inspection');
}