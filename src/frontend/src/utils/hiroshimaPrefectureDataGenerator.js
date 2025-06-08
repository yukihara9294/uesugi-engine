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
    touristSpots: ['原爆ドーム', '平和記念公園', '広島平和記念資料館', '広島城', '縮景園', 'MAZDA Zoom-Zoom スタジアム広島', '広島市現代美術館', '広島県立美術館', '比治山公園', '江波山公園'],
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
    touristSpots: ['福山城', '鞆の浦', 'みろくの里', '福山市立動物園', '明王院', '福山八幡宮'],
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
    touristSpots: ['大和ミュージアム', '海上自衛隊呉史料館（てつのくじら館）', '音戸の瀬戸', '呉市海事歴史科学館', 'アレイからすこじま', '灰ヶ峰'],
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
    touristSpots: ['西条酒蔵通り', '正福寺山公園', '鏡山公園', '安芸国分寺', '三ツ城古墳'],
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
    touristSpots: ['千光寺', '千光寺公園', '尾道市立美術館', '浄土寺', '西國寺', '尾道商店街', 'しまなみ海道', '向島', '因島水軍城'],
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
    touristSpots: ['厳島神社', '弥山', '紅葉谷公園', '大聖院', '千畳閣', '宮島水族館', '宮島ロープウェー'],
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
    touristSpots: ['三原城跡', '佛通寺', '白竜湖', '筆影山', '竜王山'],
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
    touristSpots: ['奥田元宋・小由女美術館', '尾関山公園', '霧の海展望台', '君田温泉森の泉', '三次もののけミュージアム'],
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

// Real hotel coordinates mapping
const REAL_HOTELS = {
  // Hiroshima City Hotels
  hiroshima: [
    // City Center / Peace Park Area
    { name: 'シェラトングランドホテル広島', coordinates: [132.4757, 34.3972], type: 'シティホテル', capacity: 238, district: '東区' },
    { name: 'ホテルグランヴィア広島', coordinates: [132.4758, 34.3979], type: 'シティホテル', capacity: 407, district: '南区' },
    { name: 'リーガロイヤルホテル広島', coordinates: [132.4584, 34.3955], type: 'シティホテル', capacity: 491, district: '中区' },
    { name: 'ANAクラウンプラザ広島', coordinates: [132.4571, 34.3946], type: 'シティホテル', capacity: 402, district: '中区' },
    { name: '広島ワシントンホテル', coordinates: [132.4595, 34.3939], type: 'ビジネスホテル', capacity: 266, district: '中区' },
    { name: 'オリエンタルホテル広島', coordinates: [132.4625, 34.3946], type: 'シティホテル', capacity: 227, district: '中区' },
    { name: 'ダイワロイネットホテル広島', coordinates: [132.4578, 34.3956], type: 'ビジネスホテル', capacity: 232, district: '中区' },
    { name: '三井ガーデンホテル広島', coordinates: [132.4597, 34.3923], type: 'ビジネスホテル', capacity: 281, district: '中区' },
    { name: 'ホテルサンルート広島', coordinates: [132.4591, 34.3962], type: 'ビジネスホテル', capacity: 284, district: '中区' },
    { name: 'グランドプリンスホテル広島', coordinates: [132.4250, 34.3655], type: 'シティホテル', capacity: 510, district: '南区' },
    
    // Hiroshima Station Area
    { name: 'ホテルセンチュリー21広島', coordinates: [132.4752, 34.3965], type: 'ビジネスホテル', capacity: 137, district: '南区' },
    { name: 'ヴィアイン広島新幹線口', coordinates: [132.4740, 34.3985], type: 'ビジネスホテル', capacity: 228, district: '南区' },
    { name: 'アパホテル広島駅前大橋', coordinates: [132.4765, 34.3958], type: 'ビジネスホテル', capacity: 727, district: '南区' },
    { name: 'ホテル川島', coordinates: [132.4753, 34.3960], type: 'ビジネスホテル', capacity: 80, district: '南区' },
    { name: 'アークホテル広島駅南', coordinates: [132.4745, 34.3945], type: 'ビジネスホテル', capacity: 195, district: '南区' },
    
    // Hondori / Hatchobori Area
    { name: 'カンデオホテルズ広島八丁堀', coordinates: [132.4608, 34.3935], type: 'ビジネスホテル', capacity: 203, district: '中区' },
    { name: 'ホテル法華クラブ広島', coordinates: [132.4620, 34.3943], type: 'ビジネスホテル', capacity: 386, district: '中区' },
    { name: 'パークサイドホテル広島平和公園前', coordinates: [132.4545, 34.3925], type: 'ビジネスホテル', capacity: 90, district: '中区' },
    { name: 'コンフォートホテル広島大手町', coordinates: [132.4553, 34.3943], type: 'ビジネスホテル', capacity: 252, district: '中区' },
    { name: 'ドーミーイン広島', coordinates: [132.4535, 34.3960], type: 'ビジネスホテル', capacity: 225, district: '中区' },
    
    // Other Areas
    { name: 'ホテルJALシティ広島', coordinates: [132.4610, 34.3978], type: 'ビジネスホテル', capacity: 169, district: '中区' },
    { name: 'ネストホテル広島八丁堀', coordinates: [132.4615, 34.3940], type: 'ビジネスホテル', capacity: 121, district: '中区' },
    { name: 'ネストホテル広島駅前', coordinates: [132.4735, 34.3965], type: 'ビジネスホテル', capacity: 103, district: '南区' },
    { name: 'チサンホテル広島', coordinates: [132.4592, 34.3870], type: 'ビジネスホテル', capacity: 171, district: '中区' },
    { name: 'ユニゾイン広島', coordinates: [132.4602, 34.3958], type: 'ビジネスホテル', capacity: 178, district: '中区' }
  ],
  
  // Miyajima Area Hotels
  hatsukaichi: [
    { name: '宮島グランドホテル有もと', coordinates: [132.3215, 34.2945], type: '旅館', capacity: 55, district: '宮島' },
    { name: '岩惣', coordinates: [132.3150, 34.2890], type: '旅館', capacity: 40, district: '宮島' },
    { name: '錦水館', coordinates: [132.3198, 34.2935], type: '旅館', capacity: 42, district: '宮島' },
    { name: '宮島ホテルまこと', coordinates: [132.3205, 34.2940], type: '旅館', capacity: 31, district: '宮島' },
    { name: 'ホテル宮島別荘', coordinates: [132.3210, 34.2950], type: '旅館', capacity: 41, district: '宮島' },
    { name: '宮島シーサイドホテル', coordinates: [132.3120, 34.2880], type: 'ビジネスホテル', capacity: 35, district: '宮島' },
    { name: '蔵宿いろは', coordinates: [132.3195, 34.2932], type: '旅館', capacity: 19, district: '宮島' },
    { name: 'ホテルみや離宮', coordinates: [132.3180, 34.2920], type: '旅館', capacity: 35, district: '宮島' },
    { name: '宮島コーラルホテル', coordinates: [132.3142, 34.3080], type: 'ビジネスホテル', capacity: 68, district: '廿日市' },
    { name: '安芸グランドホテル', coordinates: [132.3225, 34.3050], type: 'ビジネスホテル', capacity: 81, district: '廿日市' }
  ],
  
  // Fukuyama Hotels
  fukuyama: [
    { name: 'ベッセルホテル福山', coordinates: [133.3635, 34.4882], type: 'ビジネスホテル', capacity: 120, district: '中心部' },
    { name: 'ベッセルイン福山駅北口', coordinates: [133.3628, 34.4890], type: 'ビジネスホテル', capacity: 150, district: '中心部' },
    { name: 'キャッスルイン福山', coordinates: [133.3615, 34.4875], type: 'ビジネスホテル', capacity: 260, district: '中心部' },
    { name: 'ホテルエリアワン福山', coordinates: [133.3622, 34.4868], type: 'ビジネスホテル', capacity: 177, district: '中心部' },
    { name: 'ルートイン福山駅前', coordinates: [133.3618, 34.4878], type: 'ビジネスホテル', capacity: 201, district: '中心部' },
    { name: 'リッチモンドホテル福山駅前', coordinates: [133.3630, 34.4885], type: 'ビジネスホテル', capacity: 243, district: '中心部' },
    { name: 'カンデオホテルズ福山', coordinates: [133.3625, 34.4880], type: 'ビジネスホテル', capacity: 164, district: '中心部' },
    { name: '福山ニューキャッスルホテル', coordinates: [133.3627, 34.4900], type: 'シティホテル', capacity: 218, district: '中心部' },
    { name: '鞆の浦温泉ホテル鴎風亭', coordinates: [133.3833, 34.3833], type: '旅館', capacity: 45, district: '東部' },
    { name: '景勝館漣亭', coordinates: [133.3835, 34.3830], type: '旅館', capacity: 21, district: '東部' }
  ],
  
  // Onomichi Hotels
  onomichi: [
    { name: 'グリーンヒルホテル尾道', coordinates: [133.2032, 34.4085], type: 'ビジネスホテル', capacity: 95, district: '中心部' },
    { name: '尾道国際ホテル', coordinates: [133.2050, 34.4095], type: 'ビジネスホテル', capacity: 85, district: '中心部' },
    { name: 'ホテルα-1尾道', coordinates: [133.2042, 34.4088], type: 'ビジネスホテル', capacity: 152, district: '中心部' },
    { name: '尾道ロイヤルホテル', coordinates: [133.2038, 34.4092], type: 'ビジネスホテル', capacity: 71, district: '中心部' },
    { name: 'ベッセルホテル尾道', coordinates: [133.2055, 34.4098], type: 'ビジネスホテル', capacity: 120, district: '中心部' },
    { name: 'LOG', coordinates: [133.1950, 34.4060], type: 'ゲストハウス', capacity: 12, district: '中心部' },
    { name: 'ONOMICHI U2', coordinates: [133.1945, 34.4055], type: 'ゲストハウス', capacity: 28, district: '中心部' },
    { name: 'みはらし亭', coordinates: [133.2030, 34.4105], type: 'ゲストハウス', capacity: 10, district: '中心部' },
    { name: 'ベラビスタ スパ&マリーナ 尾道', coordinates: [133.2150, 34.3890], type: 'シティホテル', capacity: 45, district: '向島' },
    { name: '尾道やすらぎの宿しーそー', coordinates: [133.2140, 34.3885], type: '旅館', capacity: 8, district: '向島' }
  ],
  
  // Kure Hotels
  kure: [
    { name: 'クレイトンベイホテル', coordinates: [132.5552, 34.2415], type: 'シティホテル', capacity: 194, district: '中心部' },
    { name: 'コンフォートホテル呉', coordinates: [132.5658, 34.2492], type: 'ビジネスホテル', capacity: 151, district: '中心部' },
    { name: 'ビューポートくれホテル', coordinates: [132.5560, 34.2420], type: 'ビジネスホテル', capacity: 122, district: '中心部' },
    { name: '呉阪急ホテル', coordinates: [132.5655, 34.2488], type: 'ビジネスホテル', capacity: 167, district: '中心部' },
    { name: '呉森沢ホテル', coordinates: [132.5650, 34.2485], type: 'ビジネスホテル', capacity: 90, district: '中心部' },
    { name: 'ホテルエリアワン呉', coordinates: [132.5648, 34.2482], type: 'ビジネスホテル', capacity: 85, district: '中心部' }
  ],
  
  // Higashi-Hiroshima Hotels
  higashihiroshima: [
    { name: 'ホテルグランカーサ', coordinates: [132.7430, 34.4290], type: 'ビジネスホテル', capacity: 120, district: '西条' },
    { name: '東横イン東広島西条駅前', coordinates: [132.7425, 34.4285], type: 'ビジネスホテル', capacity: 180, district: '西条' },
    { name: 'ホテルヴァン・コーネル', coordinates: [132.7435, 34.4295], type: 'ビジネスホテル', capacity: 95, district: '西条' },
    { name: 'ビジネスホテルサンライズ21', coordinates: [132.7420, 34.4280], type: 'ビジネスホテル', capacity: 75, district: '西条' },
    { name: 'ホテルルートイン東広島西条駅前', coordinates: [132.7428, 34.4288], type: 'ビジネスホテル', capacity: 195, district: '西条' }
  ],
  
  // Mihara Hotels
  mihara: [
    { name: 'ホテルトドロキ', coordinates: [133.0790, 34.4008], type: 'ビジネスホテル', capacity: 80, district: '中心部' },
    { name: 'ビジネスホテルヤッサ', coordinates: [133.0795, 34.4013], type: 'ビジネスホテル', capacity: 65, district: '中心部' },
    { name: 'グリーンヒルホテル三原', coordinates: [133.0792, 34.4010], type: 'ビジネスホテル', capacity: 90, district: '中心部' },
    { name: '三原国際ホテル', coordinates: [133.0798, 34.4015], type: 'ビジネスホテル', capacity: 72, district: '中心部' }
  ],
  
  // Miyoshi Hotels
  miyoshi: [
    { name: '三次グランドホテル', coordinates: [132.8525, 34.8055], type: 'ビジネスホテル', capacity: 70, district: '中心部' },
    { name: '三次ロイヤルホテル', coordinates: [132.8528, 34.8060], type: 'ビジネスホテル', capacity: 60, district: '中心部' },
    { name: '君田温泉森の泉', coordinates: [132.8400, 34.7900], type: '旅館', capacity: 25, district: '周辺部' }
  ]
};

// Generate accommodation facilities using real hotel data
export function generateAccommodationData() {
  const accommodations = [];
  
  // Add all real hotels first
  Object.entries(REAL_HOTELS).forEach(([cityKey, hotels]) => {
    const city = HIROSHIMA_CITIES[cityKey];
    if (!city) return;
    
    hotels.forEach((hotel, idx) => {
      const occupancy = 0.5 + Math.random() * 0.4; // 50-90% occupancy
      
      accommodations.push({
        id: `${cityKey}-real-hotel-${idx}`,
        coordinates: hotel.coordinates,
        name: hotel.name,
        type: hotel.type,
        occupancy: occupancy,
        capacity: hotel.capacity,
        city: city.name,
        district: hotel.district,
        isRealHotel: true
      });
    });
  });
  
  // Add some additional generated hotels to fill gaps
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    const cityKey = Object.keys(HIROSHIMA_CITIES).find(key => HIROSHIMA_CITIES[key] === city);
    const realHotelCount = REAL_HOTELS[cityKey]?.length || 0;
    
    // Only add generated hotels if there are fewer than 10 real hotels
    if (realHotelCount < 10) {
      const additionalHotels = 10 - realHotelCount;
      
      city.districts.forEach(district => {
        const districtHotels = Math.floor(additionalHotels * (district.population / city.population));
        const points = generatePointsAroundCenter(district.center, districtHotels, 0.015);
        
        points.forEach((coord, idx) => {
          const hotelTypes = ['ビジネスホテル', 'ゲストハウス'];
          const type = hotelTypes[Math.floor(Math.random() * hotelTypes.length)];
          const occupancy = 0.5 + Math.random() * 0.4;
          
          const genericNames = {
            'ビジネスホテル': [
              'ビジネスホテル駅前', 'スマイルホテル', 'ホテルリブマックス',
              'スーパーホテル', 'ビジネスホテルサンシャイン'
            ],
            'ゲストハウス': [
              'ゲストハウス', 'バックパッカーズ', 'ホステル',
              'ゲストハウスアキ', 'BASE'
            ]
          };
          
          const nameOptions = genericNames[type];
          const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
          const suffix = district.name;
          
          accommodations.push({
            id: `${city.nameEn}-${district.name}-gen-hotel-${idx}`,
            coordinates: coord,
            name: `${baseName}${suffix}`,
            type: type,
            occupancy: occupancy,
            capacity: type === 'ビジネスホテル' ? 50 + Math.floor(Math.random() * 50) :
                     10 + Math.floor(Math.random() * 20),
            city: city.name,
            district: district.name,
            isRealHotel: false
          });
        });
      });
    }
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
      // Generate initial points - reduced from 25 to 5 base points
      const pointCount = Math.floor(5 + (city.population / 100000) * 3);
      const centerOffset = [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      const rawPoints = generatePointsAroundCenter(centerOffset, pointCount, 0.005);
      
      // Cluster every 5 points into 1 - no change needed as we already reduced points
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
        // Generate clustered points around tourist area - reduced from 15 to 5
        const touristPointCount = 5; // Will be clustered to 1
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
    // Hiroshima City landmarks
    '原爆ドーム': [132.4530, 34.3930],
    '平和記念公園': [132.4500, 34.3920],
    '広島平和記念資料館': [132.4520, 34.3915],
    '広島城': [132.4590, 34.4027],
    '縮景園': [132.4677, 34.4004],
    'MAZDA Zoom-Zoom スタジアム広島': [132.4840, 34.3925],
    '広島市現代美術館': [132.4730, 34.3840],
    '広島県立美術館': [132.4680, 34.4020],
    'ひろしま美術館': [132.4580, 34.3970],
    '比治山公園': [132.4720, 34.3830],
    '江波山公園': [132.4350, 34.3680],
    '黄金山': [132.4850, 34.3480],
    
    // Hatsukaichi City / Miyajima landmarks
    '厳島神社': [132.3185, 34.2908],
    '弥山': [132.3200, 34.2800],
    '紅葉谷公園': [132.3150, 34.2850],
    '大聖院': [132.3170, 34.2880],
    '千畳閣': [132.3190, 34.2910],
    '宮島水族館': [132.3130, 34.2860],
    '宮島ロープウェー': [132.3160, 34.2830],
    
    // Fukuyama City landmarks
    '福山城': [133.3627, 34.4900],
    '鞆の浦': [133.3833, 34.3833],
    'みろくの里': [133.3100, 34.4300],
    '福山市立動物園': [133.3500, 34.4700],
    '明王院': [133.3750, 34.4800],
    '福山八幡宮': [133.3640, 34.4880],
    
    // Kure City landmarks
    '大和ミュージアム': [132.5550, 34.2410],
    '海上自衛隊呉史料館（てつのくじら館）': [132.5560, 34.2420],
    '音戸の瀬戸': [132.5283, 34.1619],
    '呉市海事歴史科学館': [132.5540, 34.2400],
    'アレイからすこじま': [132.5450, 34.2350],
    '灰ヶ峰': [132.5850, 34.2650],
    
    // Higashi-Hiroshima City landmarks
    '西条酒蔵通り': [132.7426, 34.4286],
    '正福寺山公園': [132.7600, 34.4200],
    '鏡山公園': [132.7550, 34.4150],
    '安芸国分寺': [132.7350, 34.4230],
    '三ツ城古墳': [132.7480, 34.4320],
    
    // Onomichi City landmarks
    '千光寺': [133.2050, 34.4100],
    '千光寺公園': [133.2040, 34.4110],
    '尾道市立美術館': [133.2060, 34.4120],
    '浄土寺': [133.1950, 34.4080],
    '西國寺': [133.2000, 34.4090],
    '尾道商店街': [133.2050, 34.4090],
    'しまなみ海道': [133.2100, 34.3900],
    '向島': [133.2150, 34.3890],
    '因島水軍城': [133.1800, 34.3200],
    
    // Mihara City landmarks
    '三原城跡': [133.0794, 34.4011],
    '佛通寺': [133.0900, 34.4500],
    '白竜湖': [133.1200, 34.4200],
    '筆影山': [133.1050, 34.3950],
    '竜王山': [133.0950, 34.4150],
    
    // Miyoshi City landmarks
    '奥田元宋・小由女美術館': [132.8526, 34.8058],
    '尾関山公園': [132.8600, 34.8100],
    '霧の海展望台': [132.8700, 34.8200],
    '君田温泉森の泉': [132.8400, 34.7900],
    '三次もののけミュージアム': [132.8550, 34.8080]
  };
  
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    city.touristSpots.forEach((spot, idx) => {
      // Use actual coordinates if available, otherwise generate near city center
      const coord = actualLandmarkCoordinates[spot] || [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      
      // Height based on landmark importance
      const importantLandmarks = [
        '原爆ドーム', '厳島神社', '福山城', '大和ミュージアム', '広島城',
        '平和記念公園', '広島平和記念資料館', 'MAZDA Zoom-Zoom スタジアム広島',
        '千光寺', '鞆の浦', '弥山'
      ];
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

// Real event venues with actual coordinates
const EVENT_VENUES = {
  // Concert and sports venues
  sports_concert: [
    { 
      name: '広島グリーンアリーナ', 
      coordinates: [132.4498, 34.3967], 
      city: '広島市',
      capacity: 10000,
      types: ['コンサート', 'スポーツ']
    },
    { 
      name: 'マツダ Zoom-Zoom スタジアム広島', 
      coordinates: [132.4840, 34.3925], 
      city: '広島市',
      capacity: 33000,
      types: ['スポーツ']
    },
    { 
      name: 'エディオンスタジアム広島', 
      coordinates: [132.3932, 34.4412], 
      city: '広島市',
      capacity: 36894,
      types: ['スポーツ']
    },
    { 
      name: '広島文化学園HBGホール', 
      coordinates: [132.4668, 34.3848], 
      city: '広島市',
      capacity: 2001,
      types: ['コンサート']
    },
    { 
      name: 'JMSアステールプラザ', 
      coordinates: [132.4478, 34.3892], 
      city: '広島市',
      capacity: 1200,
      types: ['コンサート', '展示会']
    },
    { 
      name: '広島国際会議場', 
      coordinates: [132.4518, 34.3925], 
      city: '広島市',
      capacity: 1504,
      types: ['コンサート', '展示会']
    },
    { 
      name: 'ふくやま芸術文化ホール（リーデンローズ）', 
      coordinates: [133.3670, 34.4820], 
      city: '福山市',
      capacity: 2003,
      types: ['コンサート']
    },
    { 
      name: '福山市民球場', 
      coordinates: [133.3550, 34.4900], 
      city: '福山市',
      capacity: 10000,
      types: ['スポーツ']
    },
    { 
      name: '呉市総合体育館（オークアリーナ）', 
      coordinates: [132.5480, 34.2380], 
      city: '呉市',
      capacity: 5000,
      types: ['スポーツ', 'コンサート']
    },
    { 
      name: '東広島運動公園体育館', 
      coordinates: [132.7650, 34.4050], 
      city: '東広島市',
      capacity: 3000,
      types: ['スポーツ']
    }
  ],
  
  // Festival and outdoor event venues
  festival: [
    { 
      name: '平和大通り', 
      coordinates: [132.4550, 34.3880], 
      city: '広島市',
      types: ['祭り', '花火']
    },
    { 
      name: '平和記念公園', 
      coordinates: [132.4500, 34.3920], 
      city: '広島市',
      types: ['祭り', '展示会']
    },
    { 
      name: '宮島桟橋前広場', 
      coordinates: [132.3220, 34.2970], 
      city: '廿日市市',
      types: ['祭り']
    },
    { 
      name: '厳島神社', 
      coordinates: [132.3185, 34.2908], 
      city: '廿日市市',
      types: ['祭り']
    },
    { 
      name: '福山城公園', 
      coordinates: [133.3627, 34.4900], 
      city: '福山市',
      types: ['祭り', '花火']
    },
    { 
      name: '芦田川河川敷', 
      coordinates: [133.3700, 34.4850], 
      city: '福山市',
      types: ['花火']
    },
    { 
      name: '呉みなと祭会場（呉港）', 
      coordinates: [132.5500, 34.2400], 
      city: '呉市',
      types: ['祭り', '花火']
    },
    { 
      name: '尾道水道', 
      coordinates: [133.2000, 34.4080], 
      city: '尾道市',
      types: ['祭り', '花火']
    },
    { 
      name: '千光寺公園', 
      coordinates: [133.2040, 34.4110], 
      city: '尾道市',
      types: ['祭り']
    },
    { 
      name: '西条中央公園', 
      coordinates: [132.7400, 34.4300], 
      city: '東広島市',
      types: ['祭り']
    },
    { 
      name: '宮島口みなとフェスティバル会場', 
      coordinates: [132.3030, 34.3130], 
      city: '廿日市市',
      types: ['祭り', '花火']
    }
  ],
  
  // Museums and exhibition venues
  exhibition: [
    { 
      name: 'ひろしま美術館', 
      coordinates: [132.4580, 34.3970], 
      city: '広島市',
      types: ['展示会']
    },
    { 
      name: '広島県立美術館', 
      coordinates: [132.4680, 34.4020], 
      city: '広島市',
      types: ['展示会']
    },
    { 
      name: '広島市現代美術館', 
      coordinates: [132.4730, 34.3840], 
      city: '広島市',
      types: ['展示会']
    },
    { 
      name: '広島平和記念資料館', 
      coordinates: [132.4520, 34.3915], 
      city: '広島市',
      types: ['展示会']
    },
    { 
      name: 'マツダミュージアム', 
      coordinates: [132.4850, 34.3650], 
      city: '広島市',
      types: ['展示会']
    },
    { 
      name: '大和ミュージアム', 
      coordinates: [132.5550, 34.2410], 
      city: '呉市',
      types: ['展示会']
    },
    { 
      name: '海上自衛隊呉史料館（てつのくじら館）', 
      coordinates: [132.5560, 34.2420], 
      city: '呉市',
      types: ['展示会']
    },
    { 
      name: '尾道市立美術館', 
      coordinates: [133.2060, 34.4120], 
      city: '尾道市',
      types: ['展示会']
    },
    { 
      name: 'ふくやま美術館', 
      coordinates: [133.3650, 34.4870], 
      city: '福山市',
      types: ['展示会']
    },
    { 
      name: '広島産業会館', 
      coordinates: [132.4620, 34.3790], 
      city: '広島市',
      types: ['展示会']
    }
  ]
};

// Generate event data based on venues and population
export function generateEventData() {
  const events = [];
  
  // Event templates for each category with venue-specific names
  const eventTemplates = {
    '祭り': {
      icon: '🎊',
      seasonal: true,
      events: [
        { name: 'ひろしまフラワーフェスティバル', venue: '平和大通り', city: '広島市' },
        { name: '宮島管絃祭', venue: '厳島神社', city: '廿日市市' },
        { name: '胡子大祭（えびす講）', venue: '平和記念公園', city: '広島市' },
        { name: 'とうかさん大祭', venue: '平和記念公園', city: '広島市' },
        { name: '尾道みなと祭', venue: '尾道水道', city: '尾道市' },
        { name: '福山ばら祭', venue: '福山城公園', city: '福山市' },
        { name: '宮島口みなとフェスティバル', venue: '宮島口みなとフェスティバル会場', city: '廿日市市' },
        { name: '呉みなと祭', venue: '呉みなと祭会場（呉港）', city: '呉市' },
        { name: '西条酒まつり', venue: '西条中央公園', city: '東広島市' }
      ]
    },
    'スポーツ': {
      icon: '⚽',
      seasonal: false,
      events: [
        { name: 'サンフレッチェ広島 vs ヴィッセル神戸', venue: 'エディオンスタジアム広島', city: '広島市', capacity: 36894 },
        { name: '広島東洋カープ vs 阪神タイガース', venue: 'マツダ Zoom-Zoom スタジアム広島', city: '広島市', capacity: 33000 },
        { name: '広島ドラゴンフライズ vs 島根スサノオマジック', venue: '広島グリーンアリーナ', city: '広島市', capacity: 10000 },
        { name: 'サンフレッチェ広島 vs 横浜F・マリノス', venue: 'エディオンスタジアム広島', city: '広島市', capacity: 36894 },
        { name: '広島東洋カープ vs 読売ジャイアンツ', venue: 'マツダ Zoom-Zoom スタジアム広島', city: '広島市', capacity: 33000 },
        { name: '福山シティFC ホームゲーム', venue: '福山市民球場', city: '福山市', capacity: 10000 },
        { name: 'ひろしま国際平和マラソン', venue: '平和記念公園', city: '広島市' }
      ]
    },
    'コンサート': {
      icon: '🎵',
      seasonal: false,
      events: [
        { name: 'Perfume LIVE 2024', venue: '広島グリーンアリーナ', city: '広島市', capacity: 10000 },
        { name: '広島交響楽団第420回定期演奏会', venue: '広島文化学園HBGホール', city: '広島市', capacity: 2001 },
        { name: 'ポルノグラフィティ 凱旋ライブ', venue: '広島グリーンアリーナ', city: '広島市', capacity: 10000 },
        { name: '矢沢永吉 LIVE TOUR 2024', venue: '広島グリーンアリーナ', city: '広島市', capacity: 10000 },
        { name: 'クラシックコンサート', venue: '広島文化学園HBGホール', city: '広島市', capacity: 2001 },
        { name: 'HIROSHIMA MUSIC FESTIVAL', venue: 'JMSアステールプラザ', city: '広島市', capacity: 1200 },
        { name: '広島アジア音楽祭', venue: '広島国際会議場', city: '広島市', capacity: 1504 },
        { name: 'リーデンローズ・ニューイヤーコンサート', venue: 'ふくやま芸術文化ホール（リーデンローズ）', city: '福山市', capacity: 2003 },
        { name: 'オークアリーナ・ロックフェス', venue: '呉市総合体育館（オークアリーナ）', city: '呉市', capacity: 5000 }
      ]
    },
    '展示会': {
      icon: '🎨',
      seasonal: false,
      events: [
        { name: '印象派展', venue: 'ひろしま美術館', city: '広島市' },
        { name: '日本画の巨匠展', venue: '広島県立美術館', city: '広島市' },
        { name: 'ヒロシマ・アート・ドキュメント', venue: '広島市現代美術館', city: '広島市' },
        { name: '瀬戸内海写真展', venue: '尾道市立美術館', city: '尾道市' },
        { name: '備後の伝統工芸展', venue: 'ふくやま美術館', city: '福山市' },
        { name: 'マツダ100年の歴史展', venue: 'マツダミュージアム', city: '広島市' },
        { name: '被爆資料特別展', venue: '広島平和記念資料館', city: '広島市' },
        { name: '地場産業フェア', venue: '広島産業会館', city: '広島市' },
        { name: '戦艦大和と呉の歴史', venue: '大和ミュージアム', city: '呉市' },
        { name: '潜水艦の技術展', venue: '海上自衛隊呉史料館（てつのくじら館）', city: '呉市' }
      ]
    },
    '花火': {
      icon: '🎆',
      seasonal: true,
      events: [
        { name: '宮島水中花火大会', venue: '宮島桟橋前広場', city: '廿日市市' },
        { name: '広島みなと 夢 花火大会', venue: '平和大通り', city: '広島市' },
        { name: 'ふくやま夏まつり あしだ川花火大会', venue: '芦田川河川敷', city: '福山市' },
        { name: '呉海上花火大会', venue: '呉みなと祭会場（呉港）', city: '呉市' },
        { name: '尾道住吉花火まつり', venue: '尾道水道', city: '尾道市' },
        { name: '宮島口納涼花火大会', venue: '宮島口みなとフェスティバル会場', city: '廿日市市' }
      ]
    }
  };
  
  // Collect all venues
  const allVenues = [
    ...EVENT_VENUES.sports_concert,
    ...EVENT_VENUES.festival,
    ...EVENT_VENUES.exhibition
  ];
  
  // Create venue lookup map
  const venueMap = {};
  allVenues.forEach(venue => {
    venueMap[venue.name] = venue;
  });
  
  // Keep track of used events to avoid duplicates
  const usedEvents = new Set();
  
  // Generate events for each category
  Object.entries(eventTemplates).forEach(([category, categoryData]) => {
    categoryData.events.forEach(eventData => {
      // Skip if we've already used this event
      const eventKey = `${eventData.name}-${eventData.venue}`;
      if (usedEvents.has(eventKey)) return;
      usedEvents.add(eventKey);
      
      // Find the venue
      const venue = venueMap[eventData.venue];
      if (!venue) return;
      
      // Find the city
      const cityKey = Object.keys(HIROSHIMA_CITIES).find(key => 
        HIROSHIMA_CITIES[key].name === eventData.city
      );
      if (!cityKey) return;
      const city = HIROSHIMA_CITIES[cityKey];
      
      // Calculate attendance based on venue capacity and event type
      let attendance;
      if (eventData.capacity) {
        // For venues with known capacity, use 60-90% of capacity
        attendance = Math.floor(eventData.capacity * (0.6 + Math.random() * 0.3));
      } else {
        // For outdoor venues, estimate based on event type
        const attendanceMultiplier = {
          '祭り': 0.3,
          'スポーツ': 0.15,
          'コンサート': 0.1,
          '展示会': 0.05,
          '花火': 0.4
        };
        const baseAttendance = city.population * attendanceMultiplier[category];
        attendance = Math.floor(baseAttendance * (0.5 + Math.random() * 0.5));
      }
      
      // Impact radius based on event type and attendance
      const baseRadius = attendance > 20000 ? 50 : 
                        attendance > 10000 ? 40 :
                        attendance > 5000 ? 30 : 20;
      const impactRadius = category === '祭り' ? baseRadius * 1.5 :
                          category === '花火' ? baseRadius * 1.8 :
                          baseRadius;
      
      events.push({
        id: `event-${events.length}`,
        coordinates: venue.coordinates,
        name: eventData.name,
        category: category,
        icon: categoryData.icon,
        impact_radius: impactRadius,
        expected_attendance: attendance,
        city: city.name,
        location: venue.name,
        venue_type: venue.types ? venue.types.join(', ') : category,
        date: categoryData.seasonal ? 
              `${Math.floor(Math.random() * 4) + 5}月${Math.floor(Math.random() * 28) + 1}日` : 
              '通年'
      });
    });
  });
  
  // Add some additional random events for smaller cities
  Object.values(HIROSHIMA_CITIES).forEach(city => {
    const cityKey = Object.keys(HIROSHIMA_CITIES).find(key => HIROSHIMA_CITIES[key] === city);
    
    // Skip cities that already have many events
    const cityEventCount = events.filter(e => e.city === city.name).length;
    if (cityEventCount >= 5) return;
    
    // Add 1-2 local events for smaller cities
    const additionalEvents = Math.min(2, 5 - cityEventCount);
    
    for (let i = 0; i < additionalEvents; i++) {
      const categories = ['祭り', '展示会'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categoryData = eventTemplates[category];
      
      const localEventNames = {
        '祭り': [`${city.name}夏祭り`, `${city.name}秋祭り`, `${city.name}地域まつり`],
        '展示会': [`${city.name}歴史展`, `${city.name}産業展`, `${city.name}文化展`]
      };
      
      const eventName = localEventNames[category][Math.floor(Math.random() * localEventNames[category].length)];
      
      // Place event in city center or commercial area
      const coord = [
        city.center[0] + (Math.random() - 0.5) * 0.005,
        city.center[1] + (Math.random() - 0.5) * 0.005
      ];
      
      const attendance = Math.floor(city.population * 0.02 * (0.5 + Math.random() * 0.5));
      
      events.push({
        id: `event-${events.length}`,
        coordinates: coord,
        name: eventName,
        category: category,
        icon: categoryData.icon,
        impact_radius: 20,
        expected_attendance: attendance,
        city: city.name,
        location: city.commercialAreas[0] || '市中心部',
        venue_type: '地域会場',
        date: categoryData.seasonal ? 
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
    north: 34.9,
    south: 34.1,
    east: 133.4,
    west: 132.1,
    center: [132.75, 34.5],
    defaultZoom: 9.2 // Better zoom level to see entire prefecture
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