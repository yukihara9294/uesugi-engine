// Test script to verify GeoJSON validation
import { generateAllPrefectureData } from './multiPrefectureDataGenerator';
import { validateFeature, validateFeatureCollection } from './geoJSONValidator';

// Test all prefectures
const prefectures = ['hiroshima', 'tokyo', 'osaka', 'fukuoka', 'yamaguchi'];

console.log('Testing GeoJSON validation for all prefectures...\n');

prefectures.forEach(prefecture => {
  console.log(`\n=== Testing ${prefecture.toUpperCase()} ===`);
  
  try {
    const data = generateAllPrefectureData(prefecture);
    
    // Check each data type
    const dataTypes = ['accommodation', 'consumption', 'landmarks', 'events', 'heatmap'];
    
    dataTypes.forEach(type => {
      if (data[type]) {
        const isValid = data[type].type === 'FeatureCollection' && 
                       Array.isArray(data[type].features);
        
        console.log(`${type}: ${isValid ? '✓' : '✗'} Valid FeatureCollection`);
        
        if (isValid && data[type].features.length > 0) {
          // Check first feature
          const firstFeature = data[type].features[0];
          console.log(`  - Features: ${data[type].features.length}`);
          console.log(`  - First feature has properties:`, Object.keys(firstFeature.properties || {}).slice(0, 5).join(', '));
        }
      }
    });
    
    // Check mobility data separately
    if (data.mobility) {
      const hasParticles = data.mobility.particles && 
                          data.mobility.particles.type === 'FeatureCollection';
      const hasFlows = data.mobility.flows && 
                      data.mobility.flows.type === 'FeatureCollection';
      
      console.log(`mobility.particles: ${hasParticles ? '✓' : '✗'} Valid FeatureCollection`);
      if (hasParticles && data.mobility.particles.features.length > 0) {
        console.log(`  - Features: ${data.mobility.particles.features.length}`);
      }
      
      console.log(`mobility.flows: ${hasFlows ? '✓' : '✗'} Valid FeatureCollection`);
      if (hasFlows && data.mobility.flows.features.length > 0) {
        console.log(`  - Features: ${data.mobility.flows.features.length}`);
      }
    }
    
  } catch (error) {
    console.error(`Error generating data for ${prefecture}:`, error.message);
  }
});

console.log('\n=== Validation Complete ===');