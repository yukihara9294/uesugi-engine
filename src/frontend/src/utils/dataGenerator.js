/**
 * データジェネレーター
 * SNSヒートマップデータのみ生成（プライバシー保護のため）
 * その他は実データを使用
 */

import { generateAllPrefectureData } from './multiPrefectureDataGenerator';

// SNS感情分析ヒートマップデータの生成
export function generateHeatmapData(prefecture) {
  const prefectureConfig = {
    '広島県': {
      center: [132.4597, 34.3966],
      hotspots: [
        { name: '平和記念公園', lat: 34.3954, lon: 132.4534, intensity: 0.9 },
        { name: '原爆ドーム', lat: 34.3955, lon: 132.4535, intensity: 0.95 },
        { name: '宮島', lat: 34.2975, lon: 132.3194, intensity: 0.85 },
        { name: '広島城', lat: 34.4026, lon: 132.4593, intensity: 0.7 },
        { name: 'マツダスタジアム', lat: 34.3933, lon: 132.4845, intensity: 0.8 }
      ]
    },
    '山口県': {
      center: [131.4705, 34.1858],
      hotspots: [
        { name: '瑠璃光寺', lat: 34.1892, lon: 131.4744, intensity: 0.8 },
        { name: '錦帯橋', lat: 34.1667, lon: 132.1771, intensity: 0.85 },
        { name: '秋芳洞', lat: 34.2297, lon: 131.3039, intensity: 0.75 },
        { name: '角島大橋', lat: 34.3567, lon: 130.8903, intensity: 0.9 },
        { name: '萩城下町', lat: 34.4080, lon: 131.3990, intensity: 0.7 }
      ]
    },
    '福岡県': {
      center: [130.4017, 33.6064],
      hotspots: [
        { name: '太宰府天満宮', lat: 33.5217, lon: 130.5347, intensity: 0.9 },
        { name: '福岡タワー', lat: 33.5933, lon: 130.3515, intensity: 0.75 },
        { name: 'キャナルシティ博多', lat: 33.5899, lon: 130.4109, intensity: 0.8 },
        { name: '櫛田神社', lat: 33.5929, lon: 130.4106, intensity: 0.7 }
      ]
    },
    '大阪府': {
      center: [135.5202, 34.6863],
      hotspots: [
        { name: '大阪城', lat: 34.6873, lon: 135.5262, intensity: 0.9 },
        { name: '道頓堀', lat: 34.6685, lon: 135.5028, intensity: 0.95 },
        { name: 'USJ', lat: 34.6656, lon: 135.4323, intensity: 0.85 },
        { name: '通天閣', lat: 34.6525, lon: 135.5063, intensity: 0.8 }
      ]
    },
    '東京都': {
      center: [139.6917, 35.6895],
      hotspots: [
        { name: '浅草寺', lat: 35.7148, lon: 139.7967, intensity: 0.9 },
        { name: '東京スカイツリー', lat: 35.7101, lon: 139.8107, intensity: 0.85 },
        { name: '渋谷スクランブル交差点', lat: 35.6595, lon: 139.7004, intensity: 0.95 },
        { name: '東京タワー', lat: 35.6586, lon: 139.7454, intensity: 0.8 }
      ]
    }
  };

  const config = prefectureConfig[prefecture] || prefectureConfig['広島県'];
  const features = [];

  // 各ホットスポット周辺にポイントを生成
  config.hotspots.forEach(spot => {
    // 中心点
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [spot.lon, spot.lat]
      },
      properties: {
        intensity: spot.intensity,
        category: 'positive',
        sentiment: 0.8 + Math.random() * 0.2,
        keywords: ['観光', '楽しい', '美しい'],
        post_count: Math.floor(100 + Math.random() * 500)
      }
    });

    // 周辺にランダムなポイントを追加
    for (let i = 0; i < 20; i++) {
      const distance = Math.random() * 0.01;
      const angle = Math.random() * Math.PI * 2;
      const lat = spot.lat + distance * Math.sin(angle);
      const lon = spot.lon + distance * Math.cos(angle);

      const categories = ['positive', 'neutral', 'negative'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        properties: {
          intensity: (spot.intensity * 0.5) + (Math.random() * 0.5),
          category,
          sentiment: category === 'positive' ? 0.6 + Math.random() * 0.4 :
                    category === 'neutral' ? 0.3 + Math.random() * 0.4 :
                    Math.random() * 0.3,
          keywords: generateKeywords(category),
          post_count: Math.floor(10 + Math.random() * 100)
        }
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

// カテゴリに応じたキーワード生成
function generateKeywords(category) {
  const keywordSets = {
    positive: [
      ['素晴らしい', '感動', '最高'],
      ['楽しい', 'また来たい', 'おすすめ'],
      ['美しい', '綺麗', '感激'],
      ['美味しい', '満足', '幸せ']
    ],
    neutral: [
      ['普通', 'まあまあ', '可もなく不可もなく'],
      ['混雑', '待ち時間', '平日'],
      ['天気', '暑い', '寒い'],
      ['アクセス', '駐車場', '交通']
    ],
    negative: [
      ['混雑', '待った', '疲れた'],
      ['高い', '期待外れ', '残念'],
      ['汚い', '整備不足', '改善希望'],
      ['不便', 'わかりにくい', '遠い']
    ]
  };

  const sets = keywordSets[category] || keywordSets.neutral;
  return sets[Math.floor(Math.random() * sets.length)];
}

// 他の必要な関数をエクスポート（互換性のため）
export function generateLandmarks(prefecture = '広島県') {
  // Get prefecture data from multiPrefectureDataGenerator
  const prefectureData = generateAllPrefectureData(prefecture);
  return prefectureData.landmarks || { type: 'FeatureCollection', features: [] };
}

export function generateHotels(prefecture = '広島県') {
  // Get prefecture data from multiPrefectureDataGenerator
  const prefectureData = generateAllPrefectureData(prefecture);
  return prefectureData.hotels || prefectureData.accommodation || { type: 'FeatureCollection', features: [] };
}

export function generateMobilityData(prefecture = '広島県') {
  // Get prefecture data from multiPrefectureDataGenerator
  const prefectureData = generateAllPrefectureData(prefecture);
  return prefectureData.mobility || { particles: { type: 'FeatureCollection', features: [] }, flows: { type: 'FeatureCollection', features: [] } };
}

export function generateConsumptionData(prefecture = '広島県') {
  // Get prefecture data from multiPrefectureDataGenerator
  const prefectureData = generateAllPrefectureData(prefecture);
  return prefectureData.consumption || { type: 'FeatureCollection', features: [] };
}

export function generateEventData(prefecture = '広島県') {
  // Get prefecture data from multiPrefectureDataGenerator
  const prefectureData = generateAllPrefectureData(prefecture);
  return prefectureData.events || prefectureData.eventData || { type: 'FeatureCollection', features: [] };
}