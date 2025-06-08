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
  
  // Define major tourist areas with exact locations
  const touristAreas = [
    { name: '宮島', coordinates: [132.3196, 34.2960], cityName: '廿日市市' }, // Miyajima
    { name: '平和記念公園', coordinates: [132.4500, 34.3920], cityName: '広島市' }, // Peace Memorial Park
    { name: '原爆ドーム', coordinates: [132.4530, 34.3930], cityName: '広島市' }, // Atomic Bomb Dome
    { name: '厳島神社', coordinates: [132.3185, 34.2908], cityName: '廿日市市' }, // Itsukushima Shrine
  ];
  
  // Helper function to check if a point is near a tourist area
  const isNearTouristArea = (coord, threshold = 0.01) => {
    return touristAreas.some(area => {
      const distance = Math.sqrt(
        Math.pow(coord[0] - area.coordinates[0], 2) + 
        Math.pow(coord[1] - area.coordinates[1], 2)
      );
      return distance < threshold;
    });
  };
  
  // Helper function to cluster points
  const clusterPoints = (points, clusterSize = 5) => {
    const clustered = [];
    for (let i = 0; i < points.length; i += clusterSize) {
      const cluster = points.slice(i, i + clusterSize);
      if (cluster.length > 0) {
        // Calculate centroid of cluster
        const centroid = [
          cluster.reduce((sum, p) => sum + p[0], 0) / cluster.length,
          cluster.reduce((sum, p) => sum + p[1], 0) / cluster.length
        ];
        clustered.push(centroid);
      }
    }
    return clustered;
  };
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.commercialAreas.forEach(area => {
      // Generate initial points (5x more than before for clustering)
      const pointCount = Math.floor(25 + (city.population / 100000) * 15);
      const centerOffset = [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      const rawPoints = generatePointsAroundCenter(centerOffset, pointCount, 0.005);
      
      // Cluster every 5 points into 1
      const clusteredPoints = clusterPoints(rawPoints, 5);
      
      clusteredPoints.forEach((coord, idx) => {
        const categories = ['飲食', 'ショッピング', '観光', 'エンターテイメント', 'サービス'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Base amount on city population and category with more variation
        const baseAmount = city.population * 0.1;
        const categoryMultiplier = {
          '飲食': 1.2,
          'ショッピング': 1.5,
          '観光': 0.8,
          'エンターテイメント': 0.6,
          'サービス': 0.7
        };
        
        // Check if this point is in a tourist area
        const isTouristArea = isNearTouristArea(coord);
        
        // Add more variation based on time, location, and randomness
        const timeVariation = Math.sin(idx * 0.3) * 0.3 + 0.7; // 0.4 to 1.0
        const locationVariation = area.includes('駅前') ? 1.3 : 1.0; // Station areas get boost
        const randomVariation = 0.2 + Math.random() * 1.3; // 0.2 to 1.5
        
        // Apply 20x multiplier for tourist areas
        const touristMultiplier = isTouristArea ? 20 : 1;
        
        // Since we're clustering 5 points into 1, multiply the amount by 5
        const clusterMultiplier = 5;
        
        const amount = baseAmount * categoryMultiplier[category] * timeVariation * 
                      locationVariation * randomVariation * touristMultiplier * clusterMultiplier;
        
        consumptionData.push({
          id: `${city.nameEn}-${area}-consumption-${idx}`,
          coordinates: coord,
          amount: Math.floor(amount),
          category: category,
          area: area,
          city: city.name,
          isTouristArea: isTouristArea,
          peak_time: Math.floor(Math.random() * 24) // Peak hour (0-23)
        });
      });
    });
    
    // Add extra consumption points specifically at tourist areas
    touristAreas.forEach((touristArea, idx) => {
      if (touristArea.cityName === city.name) {
        // Generate clustered points around tourist area
        const touristPointCount = 15; // Will be clustered to 3
        const touristRawPoints = generatePointsAroundCenter(touristArea.coordinates, touristPointCount, 0.003);
        const touristClusteredPoints = clusterPoints(touristRawPoints, 5);
        
        touristClusteredPoints.forEach((coord, pointIdx) => {
          const amount = city.population * 2.5 * (0.8 + Math.random() * 0.4) * 20 * 5; // Base * variation * tourist * cluster
          
          consumptionData.push({
            id: `${city.nameEn}-tourist-${touristArea.name}-consumption-${pointIdx}`,
            coordinates: coord,
            amount: Math.floor(amount),
            category: '観光',
            area: touristArea.name,
            city: city.name,
            isTouristArea: true,
            peak_time: Math.floor(10 + Math.random() * 6) // Tourist peak hours 10-16
          });
        });
      }
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
  
  // Define actual coordinates for major landmarks
  const actualLandmarkCoordinates = {
    '原爆ドーム': [132.4530, 34.3930],
    '平和記念公園': [132.4500, 34.3920],
    '広島城': [132.4590, 34.4027],
    '縮景園': [132.4677, 34.4004],
    'マツダスタジアム': [132.4840, 34.3925],
    '厳島神社': [132.3185, 34.2908],
    '弥山': [132.3200, 34.2800],
    '福山城': [133.3627, 34.4900],
    '鞆の浦': [133.3833, 34.3833],
    'みろくの里': [133.3100, 34.4300],
    '大和ミュージアム': [132.5550, 34.2410],
    '海上自衛隊呉史料館': [132.5560, 34.2420],
    '音戸の瀬戸': [132.5283, 34.1619],
    '西条酒蔵通り': [132.7426, 34.4286],
    '正福寺山公園': [132.7600, 34.4200],
    '千光寺': [133.2050, 34.4100],
    '尾道商店街': [133.2050, 34.4090],
    'しまなみ海道': [133.2100, 34.3900],
    '向島': [133.2150, 34.3890],
    'もみじの名所': [132.3200, 34.3000],
    '三原城跡': [133.0794, 34.4011],
    '佛通寺': [133.0900, 34.4500],
    '白竜湖': [133.1200, 34.4200],
    '奥田元宋・小由女美術館': [132.8526, 34.8058],
    '尾関山公園': [132.8600, 34.8100],
    '霧の海': [132.8700, 34.8200]
  };
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.touristSpots.forEach((spot, idx) => {
      // Use actual coordinates if available, otherwise generate near city center
      const coord = actualLandmarkCoordinates[spot] || [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      
      // Height based on landmark importance
      const importantLandmarks = ['原爆ドーム', '厳島神社', '福山城', '大和ミュージアム', '広島城'];
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
  
  // Realistic event names for each category
  const eventTypes = [
    { 
      category: '祭り', 
      icon: '🎊', 
      seasonal: true,
      names: [
        'フラワーフェスティバル',
        '管絃祭',
        '胡子大祭',
        '住吉神社例大祭',
        'とうかさん大祭',
        '秋祭り',
        '盆踊り大会',
        '七夕まつり'
      ]
    },
    { 
      category: 'スポーツ', 
      icon: '⚽', 
      seasonal: false,
      names: [
        'サンフレッチェ広島 vs ガンバ大阪',
        'カープ vs 巨人戦',
        '広島国際マラソン',
        '市民スポーツ大会',
        'プロバスケットボール試合',
        '高校野球県大会',
        'サッカーJ1リーグ戦',
        'ひろしまMIKANマラソン'
      ]
    },
    { 
      category: 'コンサート', 
      icon: '🎵', 
      seasonal: false,
      names: [
        'B\'z LIVE TOUR 2024',
        '広島交響楽団定期演奏会',
        'DREAMS COME TRUE コンサート',
        'Mr.Children Tour 2024',
        'ジャズフェスティバル',
        'クラシック音楽祭',
        '地元アーティストライブ',
        'K-POPフェスティバル'
      ]
    },
    { 
      category: '展示会', 
      icon: '🎨', 
      seasonal: false,
      names: [
        '現代アート展',
        '広島県美術展',
        '写真展「瀬戸内の風景」',
        '伝統工芸品展示会',
        'マンガ・アニメ展',
        '科学技術展',
        '歴史資料特別展',
        '地域産業展示会'
      ]
    },
    { 
      category: '花火', 
      icon: '🎆', 
      seasonal: true,
      names: [
        '宮島水中花火大会',
        '広島みなと夢花火大会',
        '福山夏まつり花火大会',
        '三原やっさ花火大会',
        '呉海上花火大会',
        '尾道住吉花火まつり',
        '因島水軍まつり花火大会',
        '江田島サマーフェスタ花火'
      ]
    }
  ];
  
  // Keep track of used names to avoid duplicates
  const usedNames = new Set();
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    // Number of events based on population
    const eventCount = Math.floor(2 + (city.population / 200000) * 2);
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Select a unique name from the category
      let eventName;
      let attempts = 0;
      do {
        const nameIndex = Math.floor(Math.random() * eventType.names.length);
        eventName = eventType.names[nameIndex];
        attempts++;
        // If we've tried too many times, add a number suffix to make it unique
        if (attempts > 10) {
          eventName = `${eventName} ${Math.floor(Math.random() * 100)}`;
          break;
        }
      } while (usedNames.has(eventName));
      
      usedNames.add(eventName);
      
      const coord = [
        city.center[0] + (Math.random() - 0.5) * 0.015,
        city.center[1] + (Math.random() - 0.5) * 0.015
      ];
      
      // Impact radius based on event type and city size
      const baseRadius = city.population > 200000 ? 40 : 25;
      const impactRadius = eventType.category === '祭り' ? baseRadius * 1.5 :
                          eventType.category === 'スポーツ' ? baseRadius :
                          baseRadius * 0.7;
      
      // Generate more realistic attendance based on event type
      const attendanceMultiplier = {
        '祭り': 0.3,
        'スポーツ': 0.15,
        'コンサート': 0.1,
        '展示会': 0.05,
        '花火': 0.4
      };
      
      const baseAttendance = city.population * attendanceMultiplier[eventType.category];
      const attendance = Math.floor(baseAttendance * (0.5 + Math.random() * 0.5));
      
      events.push({
        id: `${city.nameEn}-event-${i}`,
        coordinates: coord,
        name: eventName,
        category: eventType.category,
        icon: eventType.icon,
        impact_radius: impactRadius,
        expected_attendance: attendance,
        city: city.name,
        location: city.commercialAreas[Math.floor(Math.random() * city.commercialAreas.length)],
        date: eventType.seasonal ? 
              `${Math.floor(Math.random() * 4) + 5}月${Math.floor(Math.random() * 28) + 1}日` : 
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