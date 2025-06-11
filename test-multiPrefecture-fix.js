// Test script to verify the fixes for multiPrefectureDataGenerator.js
import { generateDataForPrefecture } from './src/frontend/src/utils/multiPrefectureDataGenerator.js';

console.log('Testing multi-prefecture data generator fixes...\n');

// Test 1: Valid prefecture data
console.log('Test 1: Testing valid prefecture (Tokyo)');
try {
  const tokyoData = generateDataForPrefecture('東京都', {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07')
  });
  console.log('✓ Tokyo data generated successfully');
  console.log(`  - Accommodation: ${tokyoData.accommodation.length} items`);
  console.log(`  - Mobility routes: ${tokyoData.mobility.routes.length} items`);
  console.log(`  - Bounds: ${JSON.stringify(tokyoData.bounds)}`);
} catch (error) {
  console.error('✗ Error generating Tokyo data:', error.message);
}

// Test 2: Yamaguchi (previously problematic)
console.log('\nTest 2: Testing Yamaguchi prefecture');
try {
  const yamaguchiData = generateDataForPrefecture('山口県', {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07')
  });
  console.log('✓ Yamaguchi data generated successfully');
  console.log(`  - Accommodation: ${yamaguchiData.accommodation.length} items`);
  console.log(`  - Mobility routes: ${yamaguchiData.mobility.routes.length} items`);
  console.log(`  - Bounds: ${JSON.stringify(yamaguchiData.bounds)}`);
} catch (error) {
  console.error('✗ Error generating Yamaguchi data:', error.message);
}

// Test 3: Invalid prefecture data
console.log('\nTest 3: Testing with invalid prefecture data');
try {
  const invalidData = {
    // Missing bounds property
    cities: {}
  };
  
  // Import individual functions for testing
  const module = await import('./src/frontend/src/utils/multiPrefectureDataGenerator.js');
  const result = module.generateMobilityForPrefecture(invalidData);
  
  if (result.routes.length === 0 && result.congestionPoints.length === 0) {
    console.log('✓ Invalid data handled gracefully - returned empty data');
  } else {
    console.log('✗ Invalid data not handled properly');
  }
} catch (error) {
  console.error('✗ Error with invalid data:', error.message);
}

// Test 4: Null/undefined data
console.log('\nTest 4: Testing with null/undefined data');
try {
  const module = await import('./src/frontend/src/utils/multiPrefectureDataGenerator.js');
  const result1 = module.generateMobilityForPrefecture(null);
  const result2 = module.generateMobilityForPrefecture(undefined);
  
  if (result1.routes.length === 0 && result2.routes.length === 0) {
    console.log('✓ Null/undefined data handled gracefully');
  } else {
    console.log('✗ Null/undefined data not handled properly');
  }
} catch (error) {
  console.error('✗ Error with null/undefined data:', error.message);
}

console.log('\nAll tests completed!');