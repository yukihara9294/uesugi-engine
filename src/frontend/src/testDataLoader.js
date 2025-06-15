// Test script to verify data loading functions work properly
import { loadRealMobilityData, loadRealEventData } from './utils/realDataLoader';
import { loadTransportData } from './services/transportDataLoader';

async function testDataLoading() {
  console.log('=== Testing Data Loading Functions ===');
  console.log(`Start time: ${new Date().toISOString()}`);
  
  try {
    // Test 1: Load mobility data
    console.log('\n1. Testing mobility data loading...');
    const startMobility = Date.now();
    const mobilityData = await loadRealMobilityData('広島県', true);
    const mobilityTime = Date.now() - startMobility;
    console.log(`Mobility data loaded in ${mobilityTime}ms`);
    console.log('Mobility data result:', {
      hasData: !!mobilityData,
      hasFlows: !!mobilityData?.flows,
      flowsCount: mobilityData?.flows?.features?.length || 0,
      hasParticles: !!mobilityData?.particles,
      particlesCount: mobilityData?.particles?.features?.length || 0
    });
    
    // Test 2: Load event data
    console.log('\n2. Testing event data loading...');
    const startEvent = Date.now();
    const eventData = await loadRealEventData('広島県');
    const eventTime = Date.now() - startEvent;
    console.log(`Event data loaded in ${eventTime}ms`);
    console.log('Event data result:', {
      hasData: !!eventData,
      type: eventData?.type,
      featuresCount: eventData?.features?.length || 0
    });
    
    // Test 3: Load transport data
    console.log('\n3. Testing transport data loading...');
    const startTransport = Date.now();
    const transportData = await loadTransportData();
    const transportTime = Date.now() - startTransport;
    console.log(`Transport data loaded in ${transportTime}ms`);
    console.log('Transport data result:', {
      hasData: !!transportData,
      stopsCount: transportData?.stops?.length || 0,
      routesCount: transportData?.routes?.length || 0
    });
    
    console.log('\n=== All tests completed successfully ===');
    console.log(`Total time: ${Date.now() - Date.now()}ms`);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  window.testDataLoading = testDataLoading;
  console.log('Test function available. Run window.testDataLoading() in console to test.');
}

export default testDataLoading;