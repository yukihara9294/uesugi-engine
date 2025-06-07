/**
 * ランドマークレイヤーコンポーネント
 * 広島県の主要観光地・施設を表示
 */

import React, { useEffect } from 'react';

const LandmarkLayer = ({ map, visible }) => {
  // 広島県の主要ランドマーク
  const landmarks = [
    { name: '原爆ドーム', coordinates: [132.4536, 34.3955], type: '世界遺産' },
    { name: '宮島（厳島神社）', coordinates: [132.3198, 34.2960], type: '世界遺産' },
    { name: '広島駅', coordinates: [132.4753, 34.3979], type: '交通拠点' },
    { name: 'マツダスタジアム', coordinates: [132.4847, 34.3916], type: 'スポーツ施設' },
    { name: '本通り商店街', coordinates: [132.4577, 34.3947], type: 'ショッピング' },
    { name: '広島城', coordinates: [132.4586, 34.4026], type: '歴史的建造物' },
    { name: '縮景園', coordinates: [132.4661, 34.4009], type: '日本庭園' },
    { name: '平和記念公園', coordinates: [132.4503, 34.3916], type: '記念公園' }
  ];

  useEffect(() => {
    if (!map) return;

    console.log('LandmarkLayer: Initializing with', landmarks.length, 'landmarks');

    try {
      // 既存のレイヤーとソースをクリーンアップ
      if (map.getLayer('landmark-symbols')) {
        map.removeLayer('landmark-symbols');
      }
      if (map.getLayer('landmark-points')) {
        map.removeLayer('landmark-points');
      }
      if (map.getSource('landmark-source')) {
        map.removeSource('landmark-source');
      }

      // GeoJSONデータを作成
      const geojsonData = {
        type: 'FeatureCollection',
        features: landmarks.map(landmark => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: landmark.coordinates
          },
          properties: {
            name: landmark.name,
            type: landmark.type
          }
        }))
      };

      // ソースを追加
      map.addSource('landmark-source', {
        type: 'geojson',
        data: geojsonData
      });

      // ランドマークのポイントレイヤー
      map.addLayer({
        id: 'landmark-points',
        type: 'circle',
        source: 'landmark-source',
        paint: {
          'circle-radius': 8,
          'circle-color': '#FF6B6B',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9
        }
      });

      // ランドマークのラベルレイヤー
      map.addLayer({
        id: 'landmark-symbols',
        type: 'symbol',
        source: 'landmark-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 2
        }
      });

      // ポップアップの設定
      const popup = new window.mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on('mouseenter', 'landmark-points', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        const html = `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #333;">${properties.name}</h3>
            <p style="margin: 0; color: #666;">
              タイプ: ${properties.type}
            </p>
          </div>
        `;
        
        popup.setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'landmark-points', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      console.log('LandmarkLayer: Successfully added landmark layers');

    } catch (error) {
      console.error('LandmarkLayer: Error adding landmarks:', error);
    }

    // レイヤーの表示/非表示を設定
    if (map.getLayer('landmark-points')) {
      map.setLayoutProperty('landmark-points', 'visibility', visible ? 'visible' : 'none');
    }
    if (map.getLayer('landmark-symbols')) {
      map.setLayoutProperty('landmark-symbols', 'visibility', visible ? 'visible' : 'none');
    }

  }, [map, visible]);

  return null;
};

export default LandmarkLayer;