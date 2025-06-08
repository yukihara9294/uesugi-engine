/**
 * Hiroshima Prefecture Data Generator
 * Generates realistic dummy data based on population density and geographic distribution
 */

// City data with population, coordinates, and characteristics
export const HIROSHIMA_CITIES = {
  hiroshima: {
    name: '広島市',
    nameEn: 'Hiroshima City',
    center: [132.4553, 34.3853],
    population: 1194000,
    districts: [
      { name: '中区', center: [132.4553, 34.3853], population: 140000 },
      { name: '東区', center: [132.4753, 34.3953], population: 120000 },
      { name: '南区', center: [132.4653, 34.3653], population: 143000 },
      { name: '西区', center: [132.4353, 34.3853], population: 190000 },
      { name: '安佐南区', center: [132.4653, 34.4253], population: 245000 },
      { name: '安佐北区', center: [132.4853, 34.4653], population: 140000 },
      { name: '安芸区', center: [132.5553, 34.3753], population: 80000 },
      { name: '佐伯区', center: [132.3653, 34.3653], population: 140000 }
    ],
    touristSpots: ['原爆ドーム', '平和記念公園', '広島城', '縮景園', 'マツダスタジアム'],
    commercialAreas: ['本通り', '紙屋町', '八丁堀', '広島駅前']
  },
  fukuyama: {
    name: '福山市',
    nameEn: 'Fukuyama City',
    center: [133.3627, 34.4858],
    population: 460000,
    districts: [
      { name: '中心部', center: [133.3627, 34.4858], population: 200000 },
      { name: '東部', center: [133.4127, 34.4858], population: 130000 },
      { name: '西部', center: [133.3127, 34.4858], population: 130000 }
    ],
    touristSpots: ['福山城', '鞆の浦', 'みろくの里'],
    commercialAreas: ['福山駅前', '商店街']
  },
  kure: {
    name: '呉市',
    nameEn: 'Kure City',
    center: [132.5653, 34.2489],
    population: 215000,
    districts: [
      { name: '中心部', center: [132.5653, 34.2489], population: 120000 },
      { name: '広地区', center: [132.5453, 34.2289], population: 95000 }
    ],
    touristSpots: ['大和ミュージアム', '海上自衛隊呉史料館', '音戸の瀬戸'],
    commercialAreas: ['呉駅前', 'れんがどおり']
  },
  higashihiroshima: {
    name: '東広島市',
    nameEn: 'Higashi-Hiroshima City',
    center: [132.7426, 34.4286],
    population: 190000,
    districts: [
      { name: '西条', center: [132.7426, 34.4286], population: 100000 },
      { name: '八本松', center: [132.7026, 34.4086], population: 50000 },
      { name: '黒瀬', center: [132.6626, 34.3686], population: 40000 }
    ],
    touristSpots: ['西条酒蔵通り', '正福寺山公園'],
    commercialAreas: ['西条駅前', 'フジグラン東広島']
  },
  onomichi: {
    name: '尾道市',
    nameEn: 'Onomichi City',
    center: [133.2050, 34.4090],
    population: 130000,
    districts: [
      { name: '中心部', center: [133.2050, 34.4090], population: 80000 },
      { name: '向島', center: [133.2150, 34.3890], population: 50000 }
    ],
    touristSpots: ['千光寺', '尾道商店街', 'しまなみ海道', '向島'],
    commercialAreas: ['尾道駅前', '商店街']
  },
  hatsukaichi: {
    name: '廿日市市',
    nameEn: 'Hatsukaichi City',
    center: [132.3318, 34.3486],
    population: 120000,
    districts: [
      { name: '廿日市', center: [132.3318, 34.3486], population: 70000 },
      { name: '宮島', center: [132.3196, 34.2960], population: 2000 },
      { name: '大野', center: [132.3118, 34.3286], population: 48000 }
    ],
    touristSpots: ['厳島神社', '弥山', 'もみじの名所'],
    commercialAreas: ['廿日市駅前', '宮島商店街']
  },
  mihara: {
    name: '三原市',
    nameEn: 'Mihara City',
    center: [133.0794, 34.4011],
    population: 90000,
    districts: [
      { name: '中心部', center: [133.0794, 34.4011], population: 60000 },
      { name: '本郷', center: [133.0294, 34.4211], population: 30000 }
    ],
    touristSpots: ['三原城跡', '佛通寺', '白竜湖'],
    commercialAreas: ['三原駅前']
  },
  miyoshi: {
    name: '三次市',
    nameEn: 'Miyoshi City',
    center: [132.8526, 34.8058],
    population: 51000,
    districts: [
      { name: '中心部', center: [132.8526, 34.8058], population: 35000 },
      { name: '周辺部', center: [132.8026, 34.7858], population: 16000 }
    ],
    touristSpots: ['奥田元宋・小由女美術館', '尾関山公園', '霧の海'],
    commercialAreas: ['三次駅前']
  }
};

// Major transportation routes between cities
export const TRANSPORTATION_ROUTES = [
  {
    name: '山陽自動車道',
    type: 'highway',
    points: [
      [132.3318, 34.3486], // 廿日市
      [132.4553, 34.3853], // 広島
      [132.7426, 34.4286], // 東広島
      [133.0794, 34.4011], // 三原
      [133.2050, 34.4090], // 尾道
      [133.3627, 34.4858]  // 福山
    ]
  },
  {
    name: '国道2号線',
    type: 'national',
    points: [
      [132.3318, 34.3486], // 廿日市
      [132.4553, 34.3853], // 広島
      [132.5653, 34.2489], // 呉
      [132.7426, 34.4286], // 東広島
      [133.0794, 34.4011], // 三原
      [133.2050, 34.4090], // 尾道
      [133.3627, 34.4858]  // 福山
    ]
  },
  {
    name: '山陽新幹線',
    type: 'shinkansen',
    points: [
      [132.4757, 34.3972], // 広島駅
      [132.7426, 34.4286], // 東広島駅
      [133.0794, 34.4011], // 三原駅
      [133.3627, 34.4858]  // 福山駅
    ]
  },
  {
    name: '中国自動車道',
    type: 'highway',
    points: [
      [132.4553, 34.3853], // 広島
      [132.6526, 34.5858], // 北部経由
      [132.8526, 34.8058]  // 三次
    ]
  }
];

// Helper function to generate random points around a center with normal distribution
function generatePointsAroundCenter(center, count, spread = 0.01) {
  const points = [];
  for (let i = 0; i < count; i++) {
    // Use Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    
    points.push([
      center[0] + z0 * spread,
      center[1] + z1 * spread
    ]);
  }
  return points;
}

// Generate accommodation facilities based on population and tourist areas
export function generateAccommodationData() {
  const accommodations = [];
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    // Calculate number of hotels based on population and tourist importance
    const touristMultiplier = city.touristSpots.length > 3 ? 1.5 : 1;
    const baseHotels = Math.floor((city.population / 50000) * touristMultiplier);
    
    city.districts.forEach(district => {
      const districtHotels = Math.floor(baseHotels * (district.population / city.population));
      const points = generatePointsAroundCenter(district.center, districtHotels, 0.015);
      
      points.forEach((coord, idx) => {
        const hotelTypes = ['ビジネスホテル', 'シティホテル', '旅館', 'ゲストハウス'];
        const type = hotelTypes[Math.floor(Math.random() * hotelTypes.length)];
        const occupancy = 0.5 + Math.random() * 0.4; // 50-90% occupancy
        
        accommodations.push({
          id: `${city.nameEn}-${district.name}-hotel-${idx}`,
          coordinates: coord,
          name: `${district.name}${type}${idx + 1}`,
          type: type,
          occupancy: occupancy,
          capacity: type === 'シティホテル' ? 200 + Math.floor(Math.random() * 300) :
                   type === 'ビジネスホテル' ? 50 + Math.floor(Math.random() * 100) :
                   type === '旅館' ? 20 + Math.floor(Math.random() * 50) : 
                   10 + Math.floor(Math.random() * 30),
          city: city.name,
          district: district.name
        });
      });
    });
    
    // Add extra hotels near tourist spots
    city.touristSpots.slice(0, 3).forEach((spot, idx) => {
      const touristCoord = [
        city.center[0] + (Math.random() - 0.5) * 0.02,
        city.center[1] + (Math.random() - 0.5) * 0.02
      ];
      
      accommodations.push({
        id: `${city.nameEn}-tourist-hotel-${idx}`,
        coordinates: touristCoord,
        name: `${spot}ホテル`,
        type: 'シティホテル',
        occupancy: 0.7 + Math.random() * 0.25,
        capacity: 100 + Math.floor(Math.random() * 200),
        city: city.name,
        nearTouristSpot: spot
      });
    });
  });
  
  return accommodations;
}

// Generate consumption data concentrated in commercial areas
export function generateConsumptionData() {
  const consumptionData = [];
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.commercialAreas.forEach(area => {
      // Generate multiple consumption points per commercial area
      const pointCount = Math.floor(5 + (city.population / 100000) * 3);
      const centerOffset = [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      const points = generatePointsAroundCenter(centerOffset, pointCount, 0.005);
      
      points.forEach((coord, idx) => {
        const categories = ['飲食', 'ショッピング', '観光', 'エンターテイメント', 'サービス'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Base amount on city population and category
        const baseAmount = city.population * 0.1;
        const categoryMultiplier = {
          '飲食': 1.2,
          'ショッピング': 1.5,
          '観光': 0.8,
          'エンターテイメント': 0.6,
          'サービス': 0.7
        };
        
        const amount = baseAmount * categoryMultiplier[category] * (0.5 + Math.random());
        
        consumptionData.push({
          id: `${city.nameEn}-${area}-consumption-${idx}`,
          coordinates: coord,
          amount: Math.floor(amount),
          category: category,
          area: area,
          city: city.name,
          peak_time: Math.floor(Math.random() * 24) // Peak hour (0-23)
        });
      });
    });
  });
  
  return consumptionData;
}

// Generate mobility data based on routes and population
export function generateMobilityData() {
  const mobilityData = {
    routes: [],
    congestionPoints: []
  };
  
  // Process transportation routes
  TRANSPORTATION_ROUTES.forEach(route => {
    const congestionLevel = route.type === 'highway' ? 0.6 + Math.random() * 0.3 :
                           route.type === 'shinkansen' ? 0.3 + Math.random() * 0.3 :
                           0.7 + Math.random() * 0.25;
    
    mobilityData.routes.push({
      id: route.name,
      name: route.name,
      type: route.type,
      points: route.points,
      congestion: congestionLevel,
      flow_speed: route.type === 'shinkansen' ? 200 : 
                  route.type === 'highway' ? 80 - (congestionLevel * 30) : 
                  40 - (congestionLevel * 20)
    });
  });
  
  // Add congestion points at major intersections
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    // Station areas tend to be congested
    const stationCongestion = {
      coordinates: [city.center[0] + 0.002, city.center[1] + 0.002],
      level: 0.7 + Math.random() * 0.25,
      radius: city.population > 200000 ? 0.01 : 0.005,
      type: 'station',
      name: `${city.name}駅周辺`
    };
    mobilityData.congestionPoints.push(stationCongestion);
    
    // Commercial areas also have congestion
    city.commercialAreas.forEach(area => {
      const areaCongestion = {
        coordinates: [
          city.center[0] + (Math.random() - 0.5) * 0.01,
          city.center[1] + (Math.random() - 0.5) * 0.01
        ],
        level: 0.5 + Math.random() * 0.35,
        radius: 0.004,
        type: 'commercial',
        name: area
      };
      mobilityData.congestionPoints.push(areaCongestion);
    });
  });
  
  return mobilityData;
}

// Generate landmark data
export function generateLandmarkData() {
  const landmarks = [];
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.touristSpots.forEach((spot, idx) => {
      const coord = [
        city.center[0] + (Math.random() - 0.5) * 0.02,
        city.center[1] + (Math.random() - 0.5) * 0.02
      ];
      
      // Height based on landmark importance
      const importantLandmarks = ['原爆ドーム', '厳島神社', '福山城', '大和ミュージアム'];
      const height = importantLandmarks.includes(spot) ? 40 + Math.random() * 20 : 
                    20 + Math.random() * 20;
      
      landmarks.push({
        id: `${city.nameEn}-landmark-${idx}`,
        coordinates: coord,
        name: spot,
        height: height,
        city: city.name,
        visitor_count: Math.floor((city.population / 100) * (0.5 + Math.random())),
        category: spot.includes('城') ? '歴史' : 
                 spot.includes('神社') || spot.includes('寺') ? '宗教' :
                 spot.includes('公園') || spot.includes('山') ? '自然' : '観光'
      });
    });
  });
  
  return landmarks;
}

// Generate event data based on venues and population
export function generateEventData() {
  const events = [];
  const eventTypes = [
    { category: '祭り', icon: '🎊', seasonal: true },
    { category: 'スポーツ', icon: '⚽', seasonal: false },
    { category: 'コンサート', icon: '🎵', seasonal: false },
    { category: '展示会', icon: '🎨', seasonal: false },
    { category: '花火', icon: '🎆', seasonal: true }
  ];
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    // Number of events based on population
    const eventCount = Math.floor(2 + (city.population / 200000) * 2);
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const coord = [
        city.center[0] + (Math.random() - 0.5) * 0.015,
        city.center[1] + (Math.random() - 0.5) * 0.015
      ];
      
      // Impact radius based on event type and city size
      const baseRadius = city.population > 200000 ? 40 : 25;
      const impactRadius = eventType.category === '祭り' ? baseRadius * 1.5 :
                          eventType.category === 'スポーツ' ? baseRadius :
                          baseRadius * 0.7;
      
      events.push({
        id: `${city.nameEn}-event-${i}`,
        coordinates: coord,
        name: `${city.name}${eventType.category}`,
        category: eventType.category,
        icon: eventType.icon,
        impact_radius: impactRadius,
        expected_attendance: Math.floor((city.population / 100) * (0.1 + Math.random() * 0.2)),
        city: city.name,
        date: eventType.seasonal ? 
              `${Math.floor(Math.random() * 4) + 1}月` : 
              '通年'
      });
    }
  });
  
  return events;
}

// Generate SNS heatmap data based on population density
export function generateSNSHeatmapData() {
  const heatmapPoints = [];
  const categories = ['観光', 'グルメ', 'ショッピング', 'イベント', '交通'];
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.districts.forEach(district => {
      // More SNS activity in populated areas
      const pointCount = Math.floor((district.population / 10000) * 2);
      const points = generatePointsAroundCenter(district.center, pointCount, 0.008);
      
      points.forEach(coord => {
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Intensity based on population density
        const baseIntensity = district.population / city.population;
        const intensity = baseIntensity * (0.5 + Math.random() * 0.5);
        
        // Sentiment tends to be positive around tourist areas
        const nearTourist = city.touristSpots.length > 3;
        const sentiment = nearTourist ? 0.6 + Math.random() * 0.35 : 0.4 + Math.random() * 0.5;
        
        heatmapPoints.push({
          coordinates: coord,
          intensity: intensity,
          sentiment: sentiment,
          category: category,
          city: city.name,
          district: district.name
        });
      });
    });
    
    // Extra activity around tourist spots
    city.touristSpots.forEach(spot => {
      const touristPoints = generatePointsAroundCenter(city.center, 5, 0.005);
      touristPoints.forEach(coord => {
        heatmapPoints.push({
          coordinates: coord,
          intensity: 0.7 + Math.random() * 0.25,
          sentiment: 0.7 + Math.random() * 0.25,
          category: '観光',
          city: city.name,
          nearSpot: spot
        });
      });
    });
  });
  
  return heatmapPoints;
}

// Get prefecture bounds for map viewport
export function getHiroshimaPrefectureBounds() {
  return {
    north: 35.0,
    south: 34.0,
    east: 133.5,
    west: 132.0,
    center: [132.75, 34.5],
    defaultZoom: 8.5
  };
}

// Generate all data for the prefecture
export function generateAllPrefectureData() {
  return {
    accommodation: generateAccommodationData(),
    consumption: generateConsumptionData(),
    mobility: generateMobilityData(),
    landmarks: generateLandmarkData(),
    events: generateEventData(),
    heatmap: generateSNSHeatmapData(),
    bounds: getHiroshimaPrefectureBounds()
  };
}