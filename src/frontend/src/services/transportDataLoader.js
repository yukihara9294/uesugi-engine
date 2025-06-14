import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Load and process GTFS transport data
 */
export const loadTransportData = async () => {
  try {
    console.log('Loading transport data from:', `${API_BASE_URL}/api/v1/transport/gtfs`);
    // First, try to load from backend API
    const response = await axios.get(`${API_BASE_URL}/api/v1/transport/gtfs`);
    console.log('Transport data from API:', {
      hasData: !!response.data,
      stopsCount: response.data?.stops?.length || 0,
      routesCount: response.data?.routes?.length || 0,
      totalStops: response.data?.total_stops,
      totalRoutes: response.data?.total_routes
    });
    return response.data;
  } catch (error) {
    console.warn('Failed to load transport data from API, using local data:', error);
    
    // Fallback to loading local GTFS files
    const localData = await loadLocalGTFSData();
    console.log('Local transport data generated:', localData);
    return localData;
  }
};

/**
 * Load GTFS data from local files
 */
const loadLocalGTFSData = async () => {
  try {
    // For now, we'll create sample data based on the GTFS structure
    // In production, this would load actual GTFS files
    const stops = generateSampleStops();
    const routes = generateSampleRoutes();
    
    return {
      stops,
      routes,
      shapes: []
    };
  } catch (error) {
    console.error('Failed to load local GTFS data:', error);
    return {
      stops: [],
      routes: [],
      shapes: []
    };
  }
};

/**
 * Generate sample bus stops for Hiroshima
 */
const generateSampleStops = () => {
  const centerLat = 34.3963;
  const centerLon = 132.4559;
  const stops = [];
  
  // Major bus terminals and stations
  const majorStops = [
    { name: '広島バスセンター', lat: 34.3963, lon: 132.4559, type: 'station' },
    { name: '広島駅', lat: 34.3975, lon: 132.4753, type: 'station' },
    { name: '横川駅', lat: 34.4107, lon: 132.4498, type: 'station' },
    { name: '西広島駅', lat: 34.3675, lon: 132.4144, type: 'station' },
    { name: '八丁堀', lat: 34.3939, lon: 132.4616, type: 'stop' },
    { name: '紙屋町', lat: 34.3955, lon: 132.4574, type: 'stop' },
    { name: '本通り', lat: 34.3936, lon: 132.4593, type: 'stop' },
    { name: '平和記念公園', lat: 34.3915, lon: 132.4529, type: 'stop' },
    { name: '原爆ドーム前', lat: 34.3955, lon: 132.4534, type: 'stop' },
    { name: '市役所前', lat: 34.3944, lon: 132.4550, type: 'stop' }
  ];
  
  majorStops.forEach((stop, index) => {
    stops.push({
      stop_id: `stop_${index + 1}`,
      stop_name: stop.name,
      stop_lat: stop.lat,
      stop_lon: stop.lon,
      location_type: stop.type === 'station' ? 1 : 0,
      route_type: 'bus'
    });
  });
  
  // Generate additional bus stops in a grid pattern
  const gridSize = 5;
  const spacing = 0.01; // About 1km
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + (i - gridSize / 2) * spacing;
      const lon = centerLon + (j - gridSize / 2) * spacing;
      
      stops.push({
        stop_id: `stop_grid_${i}_${j}`,
        stop_name: `バス停 ${i + 1}-${j + 1}`,
        stop_lat: lat,
        stop_lon: lon,
        location_type: 0,
        route_type: 'bus'
      });
    }
  }
  
  return stops;
};

/**
 * Generate sample bus routes
 */
const generateSampleRoutes = () => {
  const routes = [
    {
      route_id: 'route_1',
      route_short_name: '1',
      route_long_name: '広島駅～広島バスセンター',
      route_type: 'bus',
      route_color: 'FF6B6B',
      shapes: [
        [132.4753, 34.3975], // 広島駅
        [132.4616, 34.3939], // 八丁堀
        [132.4574, 34.3955], // 紙屋町
        [132.4559, 34.3963]  // 広島バスセンター
      ]
    },
    {
      route_id: 'route_2',
      route_short_name: '2',
      route_long_name: '横川駅～西広島駅',
      route_type: 'bus',
      route_color: '4ECDC4',
      shapes: [
        [132.4498, 34.4107], // 横川駅
        [132.4534, 34.3955], // 原爆ドーム前
        [132.4529, 34.3915], // 平和記念公園
        [132.4144, 34.3675]  // 西広島駅
      ]
    },
    {
      route_id: 'route_3',
      route_short_name: '3',
      route_long_name: '市内循環線',
      route_type: 'bus',
      route_color: 'FFE66D',
      shapes: [
        [132.4559, 34.3963], // 広島バスセンター
        [132.4550, 34.3944], // 市役所前
        [132.4593, 34.3936], // 本通り
        [132.4616, 34.3939], // 八丁堀
        [132.4574, 34.3955], // 紙屋町
        [132.4559, 34.3963]  // 広島バスセンター
      ]
    }
  ];
  
  return routes;
};

/**
 * Process shapes.txt data from GTFS
 */
export const processShapesData = (shapesText) => {
  const lines = shapesText.split('\n');
  const headers = lines[0].split(',');
  const shapes = {};
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const shapeId = values[0];
    const lat = parseFloat(values[1]);
    const lon = parseFloat(values[2]);
    const sequence = parseInt(values[3]);
    
    if (!shapes[shapeId]) {
      shapes[shapeId] = [];
    }
    
    shapes[shapeId].push({
      sequence,
      coordinates: [lon, lat]
    });
  }
  
  // Sort by sequence and extract coordinates
  Object.keys(shapes).forEach(shapeId => {
    shapes[shapeId] = shapes[shapeId]
      .sort((a, b) => a.sequence - b.sequence)
      .map(point => point.coordinates);
  });
  
  return shapes;
};