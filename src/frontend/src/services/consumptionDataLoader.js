/**
 * 消費データローダー
 * 実際の消費データをAPIから取得
 */

import { mobilityService } from './api';

export const consumptionDataLoader = {
  /**
   * 消費データを取得
   * @param {Object} params - パラメータ
   * @returns {Promise<Object>} 消費データ
   */
  async loadConsumptionData(params = {}) {
    try {
      console.log('Loading consumption data...');
      
      // APIから消費データを取得
      const response = await mobilityService.getConsumption(params);
      
      // GeoJSON形式に変換
      const features = [];
      
      // 店舗データをGeoJSONフィーチャーに変換
      if (response.stores && Array.isArray(response.stores)) {
        response.stores.forEach(store => {
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
        '山口市': [131.4714, 34.1858],
        '下関市': [130.9239, 33.9507],
        '宇部市': [131.2439, 33.9533]
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
      
      return {
        type: 'FeatureCollection',
        features: features
      };
      
    } catch (error) {
      console.error('Error loading consumption data:', error);
      
      // エラー時はダミーデータを返す
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [132.4572, 34.3954]
            },
            properties: {
              id: 'dummy_1',
              name: '紙屋町商店街',
              category: 'shopping',
              amount: 15000,
              transactions: 250,
              area: '広島市中区'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [131.4714, 34.1858]
            },
            properties: {
              id: 'dummy_2',
              name: '山口駅前商店街',
              category: 'shopping',
              amount: 8000,
              transactions: 120,
              area: '山口市'
            }
          }
        ]
      };
    }
  }
};

export default consumptionDataLoader;