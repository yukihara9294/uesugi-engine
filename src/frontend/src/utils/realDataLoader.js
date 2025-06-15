/**
 * 実データローダー
 * 広島GTFS、山口県オープンデータなどの実データを読み込み、マップ表示用に変換
 */

import { apiClient, realDataService } from '../services/api';

// 広島電鉄GTFSデータの読み込み
export async function loadHiroshimaGTFSData() {
  try {
    console.log('Loading Hiroshima GTFS data...');
    
    const response = await realDataService.getTransportGTFS();
    console.log('GTFS data loaded:', response);
    
    // GeoJSON形式に変換
    if (response && response.data) {
      return {
        type: 'FeatureCollection',
        features: response.data.map(stop => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [stop.stop_lon, stop.stop_lat]
          },
          properties: {
            ...stop,
            category: 'transport'
          }
        }))
      };
    }
    return generateSampleGTFSData();
    
  } catch (error) {
    console.error('Failed to load GTFS data:', error);
    return generateSampleGTFSData();
  }
}

// 山口県観光施設データの読み込み
export async function loadYamaguchiTourismData() {
  try {
    console.log('Loading Yamaguchi tourism data...');
    
    const response = await realDataService.getTourismFacilities();
    console.log('Tourism data loaded:', response);
    
    if (response && response.data) {
      return {
        type: 'FeatureCollection',
        features: response.data.map(facility => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [facility.longitude || 131.4705, facility.latitude || 34.1858]
          },
          properties: {
            ...facility,
            category: 'tourism'
          }
        }))
      };
    }
    return null;
    
  } catch (error) {
    console.error('Failed to load Yamaguchi tourism data:', error);
    return null;
  }
}

// 実際の宿泊施設データ（e-Statや観光庁データ）
export async function loadRealAccommodationData(prefecture) {
  try {
    console.log(`Loading real accommodation data for ${prefecture}...`);
    
    const response = await realDataService.getAccommodation(prefecture);
    console.log('Accommodation data loaded:', response);
    
    // Check if response is already in GeoJSON format
    if (response && response.type === 'FeatureCollection') {
      return response;
    }
    
    // Handle older array format
    if (response && response.data && Array.isArray(response.data)) {
      return {
        type: 'FeatureCollection',
        features: response.data.map(hotel => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [hotel.longitude, hotel.latitude]
          },
          properties: {
            ...hotel,
            category: 'hotel',
            height: hotel.capacity ? hotel.capacity * 2 : 50
          }
        }))
      };
    }
    return null;
    
  } catch (error) {
    console.error('Failed to load real accommodation data:', error);
    return null;
  }
}

// 実際の人流データ（モバイル空間統計など）
export async function loadRealMobilityData(prefecture, cityOnly = false) {
  const startTime = Date.now();
  try {
    console.log(`[${new Date().toISOString()}] Loading real mobility data for ${prefecture}... (cityOnly: ${cityOnly})`);
    
    const response = await realDataService.getMobility(prefecture, cityOnly);
    const loadTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Mobility data loaded in ${loadTime}ms`);
    console.log('Raw API response:', response);
    console.log('Response type:', typeof response);
    console.log('Has flows:', !!response?.flows);
    console.log('Has particles:', !!response?.particles);
    
    // レスポンスがdata属性を持つ場合
    const data = response.data || response;
    
    // APIが新しい形式（flowsとparticles）を返す場合
    if (data && data.flows && data.particles) {
      const result = {
        flows: data.flows,
        particles: data.particles
      };
      console.log('Returning new format mobility data:', result);
      console.log('Flows count:', data.flows.features?.length);
      console.log('Particles count:', data.particles.features?.length);
      // 広島市内のフローを確認
      const hiroshimaCityKeywords = ['広島', '紙屋町', '八丁堀', '平和記念', '本通り', '広島城', 
                                      'マツダスタジアム', '宇品', '横川', '西広島', 
                                      '安佐南区', '安佐北区', '佐伯区', '安芸区', '南区', '東区', '西区', '中区'];
      const isHiroshimaCity = (name) => hiroshimaCityKeywords.some(keyword => name?.includes(keyword));
      
      const hiroshimaFlows = data.flows.features.filter(f => 
        isHiroshimaCity(f.properties.origin_name) && 
        isHiroshimaCity(f.properties.destination_name)
      );
      console.log('Hiroshima city flows:', hiroshimaFlows.length);
      if (hiroshimaFlows.length > 0) {
        console.log('Sample Hiroshima flow:', hiroshimaFlows[0]);
      }
      
      // 最初の10フローを確認
      console.log('First 10 flows origin->dest:');
      data.flows.features.slice(0, 10).forEach((f, i) => {
        console.log(`  ${i+1}. ${f.properties.origin_name} → ${f.properties.destination_name} (${f.properties.volume})`);
      });
      return result;
    }
    // 古い形式（配列のflows）の場合
    else if (data && data.flows && Array.isArray(data.flows)) {
      return {
        flows: {
          type: 'FeatureCollection',
          features: data.flows.map(flow => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [flow.origin.lon, flow.origin.lat],
                [flow.destination.lon, flow.destination.lat]
              ]
            },
            properties: {
              origin_name: flow.origin.name,
              destination_name: flow.destination.name,
              volume: flow.volume,
              intensity: Math.min(100, flow.volume / 500),
              category: 'mobility'
            }
          }))
        },
        particles: {
          type: 'FeatureCollection',
          features: []  // 空の配列にする（nullではなく）
        }
      };
    }
    // 単一のGeoJSON FeatureCollectionの場合
    else if (data && data.type === 'FeatureCollection') {
      return data;
    }
    
    console.log('No valid mobility data format found');
    return null;
    
  } catch (error) {
    console.error('Failed to load real mobility data:', error);
    return null;
  }
}

// 実際のイベントデータ
export async function loadRealEventData(prefecture) {
  try {
    console.log(`Loading real event data for ${prefecture}...`);
    
    const response = await realDataService.getEvents(prefecture);
    console.log('Event data loaded:', response);
    
    if (response && response.data) {
      return {
        type: 'FeatureCollection',
        features: response.data.map(event => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [event.longitude || 132.4597, event.latitude || 34.3966]
          },
          properties: {
            ...event,
            category: event.category || 'event',
            impact: event.impact || 'medium'
          }
        }))
      };
    }
    return null;
    
  } catch (error) {
    console.error('Failed to load real event data:', error);
    return null;
  }
}

// サンプルGTFSデータの生成
function generateSampleGTFSData() {
  // 広島電鉄の主要路線サンプル
  const majorStops = [
    { id: 'hiroshima-station', name: '広島駅', coordinates: [132.4751, 34.3978] },
    { id: 'kamiyacho', name: '紙屋町', coordinates: [132.4574, 34.3952] },
    { id: 'genbaku-dome', name: '原爆ドーム前', coordinates: [132.4536, 34.3955] },
    { id: 'hiroden-nishi', name: '広電西広島', coordinates: [132.4300, 34.3665] },
    { id: 'miyajimaguchi', name: '広電宮島口', coordinates: [132.3028, 34.3137] }
  ];

  const routes = [
    {
      id: 'route-2',
      name: '2号線（広島駅～広電宮島口）',
      color: '#FF5722',
      stops: ['hiroshima-station', 'kamiyacho', 'genbaku-dome', 'hiroden-nishi', 'miyajimaguchi']
    },
    {
      id: 'route-6',
      name: '6号線（広島駅～江波）',
      color: '#4CAF50',
      stops: ['hiroshima-station', 'kamiyacho', 'genbaku-dome']
    }
  ];

  return {
    type: 'FeatureCollection',
    features: [
      ...majorStops.map(stop => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: stop.coordinates
        },
        properties: {
          id: stop.id,
          name: stop.name,
          type: 'bus_stop',
          routes: routes.filter(r => r.stops.includes(stop.id)).map(r => r.id)
        }
      }))
    ]
  };
}

// 最小限の宿泊施設データ
function generateMinimalAccommodationData(prefecture) {
  const sampleHotels = {
    '広島県': [
      { name: 'グランドプリンスホテル広島', coordinates: [132.4526, 34.3643], capacity: 510 },
      { name: 'シェラトングランドホテル広島', coordinates: [132.4751, 34.3978], capacity: 238 },
      { name: 'リーガロイヤルホテル広島', coordinates: [132.4593, 34.3905], capacity: 491 }
    ],
    '山口県': [
      { name: '湯田温泉 松田屋ホテル', coordinates: [131.4590, 34.1603], capacity: 65 },
      { name: '下関グランドホテル', coordinates: [130.9400, 33.9570], capacity: 82 }
    ]
  };

  const hotels = sampleHotels[prefecture] || [];
  
  return {
    type: 'FeatureCollection',
    features: hotels.map((hotel, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: hotel.coordinates
      },
      properties: {
        id: `hotel-${idx}`,
        name: hotel.name,
        capacity: hotel.capacity,
        occupancy_rate: 0.65 + Math.random() * 0.25
      }
    }))
  };
}

// 消費データの読み込み
export async function loadConsumptionData(prefecture) {
  try {
    console.log('Loading consumption data...');
    
    // 消費データAPIを呼び出し
    const response = await apiClient.get(`/api/v1/real/consumption/real/${prefecture}`);
    console.log('Consumption data loaded:', response);
    
    // GeoJSON形式に変換
    const features = [];
    
    // 店舗データをGeoJSONフィーチャーに変換
    const stores = response.stores || response.top_stores || [];
    if (Array.isArray(stores)) {
      stores.forEach(store => {
        if (store.location && store.location.coordinates) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: store.location.coordinates
            },
            properties: {
              id: store.store_id,
              name: store.store_name,
              category: store.store_category,
              amount: store.total_amount || 0,
              transactions: store.transaction_count || 0,
              area: store.area || ''
            }
          });
        }
      });
    }
    
    // エリアサマリーデータもGeoJSONに追加（エリアの中心点に配置）
    const areaCenters = {
      '広島市中区': [132.4572, 34.3954],
      '広島市西区': [132.4340, 34.3940],
      '広島市南区': [132.4680, 34.3800],
      '広島市東区': [132.4820, 34.3960],
      '広島市北区': [132.4730, 34.4480],
      '山口市': [131.4714, 34.1858],
      '下関市': [130.9239, 33.9507],
      '宇部市': [131.2439, 33.9533],
      '周南市': [131.8050, 34.0517],
      '岩国市': [132.2192, 34.1656]
    };
    
    if (response.area_summary) {
      Object.entries(response.area_summary).forEach(([area, data]) => {
        if (areaCenters[area]) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: areaCenters[area]
            },
            properties: {
              id: `area_${area}`,
              name: `${area}消費データ`,
              category: 'area_summary',
              amount: data.total_amount || 0,
              transactions: data.transaction_count || 0,
              area: area
            }
          });
        }
      });
    }
    
    console.log(`Loaded ${features.length} consumption data points`);
    
    if (features.length > 0) {
      return {
        type: 'FeatureCollection',
        features: features
      };
    }
    
    // データがない場合はサンプルデータを返す
    return generateSampleConsumptionData();
    
  } catch (error) {
    console.error('Failed to load consumption data:', error);
    return generateSampleConsumptionData();
  }
}

// サンプル消費データの生成
function generateSampleConsumptionData() {
  console.log('Generating sample consumption data...');
  
  const sampleData = [
    { name: '紙屋町商店街', coordinates: [132.4572, 34.3954], amount: 15000, area: '広島市中区' },
    { name: '本通り商店街', coordinates: [132.4615, 34.3934], amount: 12000, area: '広島市中区' },
    { name: '広島駅前商業施設', coordinates: [132.4753, 34.3974], amount: 18000, area: '広島市南区' },
    { name: '西広島商店街', coordinates: [132.4385, 34.3747], amount: 8000, area: '広島市西区' },
    { name: '横川商店街', coordinates: [132.4525, 34.4107], amount: 6000, area: '広島市西区' },
    { name: '山口駅前商店街', coordinates: [131.4714, 34.1858], amount: 9000, area: '山口市' },
    { name: '湯田温泉商店街', coordinates: [131.4583, 34.1636], amount: 7000, area: '山口市' },
    { name: '下関駅前商業施設', coordinates: [130.9239, 33.9507], amount: 11000, area: '下関市' },
    { name: '唐戸市場周辺', coordinates: [130.9417, 33.9567], amount: 10000, area: '下関市' },
    { name: '宇部新川駅前', coordinates: [131.2439, 33.9533], amount: 6500, area: '宇部市' }
  ];
  
  return {
    type: 'FeatureCollection',
    features: sampleData.map((data, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: data.coordinates
      },
      properties: {
        id: `consumption-${idx}`,
        name: data.name,
        category: 'shopping',
        amount: data.amount,
        transactions: Math.floor(data.amount / 60),
        area: data.area
      }
    }))
  };
}

// その他のヘルパー関数...

export { generateSampleGTFSData };