import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Load and process GTFS transport data
 */
export const loadTransportData = async (prefecture = '広島県') => {
  const startTime = Date.now();
  try {
    // Choose endpoint based on prefecture
    const endpoint = prefecture === '山口県' 
      ? `${API_BASE_URL}/api/v1/real/transport/gtfs/yamaguchi`
      : `${API_BASE_URL}/api/v1/transport/gtfs`;
      
    console.log(`[${new Date().toISOString()}] Loading transport data from:`, endpoint);
    // First, try to load from backend API
    const response = await axios.get(endpoint, {
      timeout: 90000 // 90 second timeout
    });
    const loadTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Transport data loaded in ${loadTime}ms`);
    console.log('Transport data from API:', {
      hasData: !!response.data,
      stopsCount: response.data?.stops?.length || 0,
      routesCount: response.data?.routes?.length || 0,
      totalStops: response.data?.total_stops,
      totalRoutes: response.data?.total_routes
    });
    return response.data;
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.warn(`[${new Date().toISOString()}] Failed to load transport data from API after ${errorTime}ms, using local data:`, error.message);
    
    // Fallback to loading local GTFS files
    const localData = await loadLocalGTFSData(prefecture);
    console.log('Local transport data generated:', localData);
    return localData;
  }
};

/**
 * Load GTFS data from local files
 */
const loadLocalGTFSData = async (prefecture = '広島県') => {
  try {
    // For now, we'll create sample data based on the GTFS structure
    // In production, this would load actual GTFS files
    const stops = prefecture === '山口県' ? generateYamaguchiStops() : generateSampleStops();
    const routes = prefecture === '山口県' ? generateYamaguchiRoutes() : generateSampleRoutes();
    
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
  
  // Major stations and stops (including train stations)
  const majorStops = [
    // JR Stations
    { name: '広島駅', lat: 34.3975, lon: 132.4753, type: 'station', route_type: 'rail' },
    { name: '横川駅', lat: 34.4107, lon: 132.4498, type: 'station', route_type: 'rail' },
    { name: '西広島駅', lat: 34.3675, lon: 132.4144, type: 'station', route_type: 'rail' },
    { name: '新白島駅', lat: 34.4094, lon: 132.4736, type: 'station', route_type: 'rail' },
    
    // Astram Line Stations
    { name: '本通駅', lat: 34.3936, lon: 132.4593, type: 'station', route_type: 'subway' },
    { name: '県庁前駅', lat: 34.3986, lon: 132.4594, type: 'station', route_type: 'subway' },
    { name: '城北駅', lat: 34.4089, lon: 132.4639, type: 'station', route_type: 'subway' },
    { name: '新白島駅（アストラム）', lat: 34.4094, lon: 132.4736, type: 'station', route_type: 'subway' },
    { name: '白島駅', lat: 34.4058, lon: 132.4675, type: 'station', route_type: 'subway' },
    { name: '牛田駅', lat: 34.4156, lon: 132.4869, type: 'station', route_type: 'subway' },
    { name: '不動院前駅', lat: 34.4247, lon: 132.5042, type: 'station', route_type: 'subway' },
    { name: '大町駅', lat: 34.4436, lon: 132.5244, type: 'station', route_type: 'subway' },
    
    // Bus stops
    { name: '広島バスセンター', lat: 34.3963, lon: 132.4559, type: 'station', route_type: 'bus' },
    { name: '八丁堀', lat: 34.3939, lon: 132.4616, type: 'stop', route_type: 'bus' },
    { name: '紙屋町', lat: 34.3955, lon: 132.4574, type: 'stop', route_type: 'bus' },
    { name: '平和記念公園', lat: 34.3915, lon: 132.4529, type: 'stop', route_type: 'bus' },
    { name: '原爆ドーム前', lat: 34.3955, lon: 132.4534, type: 'stop', route_type: 'bus' },
    { name: '市役所前', lat: 34.3944, lon: 132.4550, type: 'stop', route_type: 'bus' }
  ];
  
  majorStops.forEach((stop, index) => {
    stops.push({
      stop_id: `stop_${index + 1}`,
      stop_name: stop.name,
      stop_lat: stop.lat,
      stop_lon: stop.lon,
      location_type: stop.type === 'station' ? 1 : 0,
      route_type: stop.route_type || 'bus'
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
 * Generate sample routes (bus and train)
 */
const generateSampleRoutes = () => {
  const routes = [
    // JR Lines
    {
      route_id: 'jr_sanyo',
      route_short_name: 'JR山陽本線',
      route_long_name: '山陽本線（広島～西広島）',
      route_type: 'rail',
      route_color: '0052CC',
      shapes: [
        [132.4753, 34.3975], // 広島駅
        [132.4736, 34.4094], // 新白島駅
        [132.4498, 34.4107], // 横川駅
        [132.4144, 34.3675]  // 西広島駅
      ]
    },
    // Astram Line
    {
      route_id: 'astram_line',
      route_short_name: 'アストラムライン',
      route_long_name: 'アストラムライン（本通～大町）',
      route_type: 'subway',
      route_color: '00AA00',
      shapes: [
        [132.4593, 34.3936], // 本通駅
        [132.4594, 34.3986], // 県庁前駅
        [132.4639, 34.4089], // 城北駅
        [132.4736, 34.4094], // 新白島駅
        [132.4675, 34.4058], // 白島駅
        [132.4869, 34.4156], // 牛田駅
        [132.5042, 34.4247], // 不動院前駅
        [132.5244, 34.4436]  // 大町駅
      ]
    },
    // Bus routes
    {
      route_id: 'route_1',
      route_short_name: '1',
      route_long_name: '広島駅～広島バスセンター',
      route_type: 'bus',
      route_color: '3B82F6',
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
      route_color: '3B82F6',
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
      route_color: '3B82F6',
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

/**
 * Generate sample bus stops for Yamaguchi
 */
const generateYamaguchiStops = () => {
  const stops = [];
  
  // Major stations and stops in Yamaguchi
  const majorStops = [
    // JR Stations - Yamaguchi City
    { name: '山口駅', lat: 34.1858, lon: 131.4714, type: 'station', route_type: 'rail' },
    { name: '新山口駅', lat: 34.0411, lon: 131.4089, type: 'station', route_type: 'rail' },
    { name: '湯田温泉駅', lat: 34.1636, lon: 131.4583, type: 'station', route_type: 'rail' },
    
    // Shimonoseki Stations
    { name: '下関駅', lat: 33.9507, lon: 130.9239, type: 'station', route_type: 'rail' },
    { name: '新下関駅', lat: 34.0000, lon: 130.9944, type: 'station', route_type: 'rail' },
    
    // Ube Stations
    { name: '宇部新川駅', lat: 33.9533, lon: 131.2439, type: 'station', route_type: 'rail' },
    { name: '草江駅', lat: 33.9658, lon: 131.2728, type: 'station', route_type: 'rail' },
    
    // Shunan Stations
    { name: '徳山駅', lat: 34.0517, lon: 131.8050, type: 'station', route_type: 'rail' },
    { name: '新南陽駅', lat: 34.0361, lon: 131.7294, type: 'station', route_type: 'rail' },
    
    // Iwakuni Stations
    { name: '岩国駅', lat: 34.1656, lon: 132.2192, type: 'station', route_type: 'rail' },
    { name: '新岩国駅', lat: 34.1439, lon: 132.2356, type: 'station', route_type: 'rail' },
    
    // Hofu Stations
    { name: '防府駅', lat: 34.0517, lon: 131.5631, type: 'station', route_type: 'rail' },
    
    // Bus stops
    { name: '山口県庁前', lat: 34.1786, lon: 131.4738, type: 'stop', route_type: 'bus' },
    { name: '山口市役所前', lat: 34.1859, lon: 131.4706, type: 'stop', route_type: 'bus' },
    { name: '唐戸市場前', lat: 33.9567, lon: 130.9417, type: 'stop', route_type: 'bus' },
    { name: '海響館前', lat: 33.9572, lon: 130.9408, type: 'stop', route_type: 'bus' },
    { name: '山口宇部空港', lat: 33.9300, lon: 131.2786, type: 'stop', route_type: 'bus' },
    { name: '錦帯橋', lat: 34.1686, lon: 132.1778, type: 'stop', route_type: 'bus' }
  ];
  
  majorStops.forEach((stop, index) => {
    stops.push({
      stop_id: `y_stop_${index + 1}`,
      stop_name: stop.name,
      stop_lat: stop.lat,
      stop_lon: stop.lon,
      location_type: stop.type === 'station' ? 1 : 0,
      route_type: stop.route_type || 'bus'
    });
  });
  
  return stops;
};

/**
 * Generate sample routes for Yamaguchi
 */
const generateYamaguchiRoutes = () => {
  const routes = [
    // JR Lines
    {
      route_id: 'jr_yamaguchi',
      route_short_name: 'JR山口線',
      route_long_name: '山口線（新山口～山口）',
      route_type: 'rail',
      route_color: '0052CC',
      shapes: [
        [131.4089, 34.0411], // 新山口駅
        [131.4583, 34.1636], // 湯田温泉駅
        [131.4714, 34.1858]  // 山口駅
      ]
    },
    {
      route_id: 'jr_sanyo_yamaguchi',
      route_short_name: 'JR山陽本線',
      route_long_name: '山陽本線（下関～徳山）',
      route_type: 'rail',
      route_color: '0052CC',
      shapes: [
        [130.9239, 33.9507], // 下関駅
        [130.9944, 34.0000], // 新下関駅
        [131.2439, 33.9533], // 宇部新川駅
        [131.5631, 34.0517], // 防府駅
        [131.8050, 34.0517]  // 徳山駅
      ]
    },
    // Bus routes
    {
      route_id: 'bus_yamaguchi_1',
      route_short_name: '山口市内線',
      route_long_name: '山口駅～県庁～市役所',
      route_type: 'bus',
      route_color: '3B82F6',
      shapes: [
        [131.4714, 34.1858], // 山口駅
        [131.4738, 34.1786], // 山口県庁前
        [131.4706, 34.1859]  // 山口市役所前
      ]
    },
    {
      route_id: 'bus_shimonoseki_1',
      route_short_name: '下関市内線',
      route_long_name: '下関駅～唐戸～海響館',
      route_type: 'bus',
      route_color: '3B82F6',
      shapes: [
        [130.9239, 33.9507], // 下関駅
        [130.9417, 33.9567], // 唐戸市場前
        [130.9408, 33.9572]  // 海響館前
      ]
    },
    {
      route_id: 'bus_airport',
      route_short_name: '空港線',
      route_long_name: '新山口駅～山口宇部空港',
      route_type: 'bus',
      route_color: '3B82F6',
      shapes: [
        [131.4089, 34.0411], // 新山口駅
        [131.2439, 33.9533], // 宇部新川駅
        [131.2786, 33.9300]  // 山口宇部空港
      ]
    }
  ];
  
  return routes;
};