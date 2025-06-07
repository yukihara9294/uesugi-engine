/**
 * 宿泊施設レイヤーコンポーネント
 * 宿泊施設の位置、稼働率、価格などを可視化
 */

import React, { useEffect } from 'react';

const AccommodationLayer = ({ map, data, visible }) => {
  useEffect(() => {
    console.log('AccommodationLayer - map exists:', !!map);
    console.log('AccommodationLayer - data:', data);
    console.log('AccommodationLayer - visible:', visible);
    
    if (!map || !data) return;

    // データが正しい形式かチェック
    const facilitiesData = data.facilities || data;
    if (!Array.isArray(facilitiesData)) {
      console.error('Accommodation data is not in expected format:', data);
      return;
    }

    try {
      // 既存のレイヤーをクリーンアップ
      if (map.getLayer('accommodation-glow')) {
        map.removeLayer('accommodation-glow');
      }
      if (map.getLayer('accommodation-points')) {
        map.removeLayer('accommodation-points');
      }
      if (map.getLayer('accommodation-labels')) {
        map.removeLayer('accommodation-labels');
      }
      if (map.getSource('accommodation-source')) {
        map.removeSource('accommodation-source');
      }

      // 宿泊施設をポイントとして表示するソースを追加
      console.log('AccommodationLayer - Adding source and layers...');
      
      map.addSource('accommodation-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      console.log('AccommodationLayer - Source added');

      // 宿泊施設のポイントレイヤー（外側のグロー効果）
      map.addLayer({
        id: 'accommodation-glow',
        type: 'circle',
        source: 'accommodation-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, 20,
            50, 28,
            100, 35
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, '#4CAF50',      // 低稼働率：緑
            50, '#FFC107',     // 中稼働率：黄色
            80, '#FF5722',     // 高稼働率：オレンジ
            100, '#F44336'     // 満室：赤
          ],
          'circle-opacity': 0.2,
          'circle-blur': 1
        }
      });

      // 宿泊施設のポイントレイヤー（メイン）
      map.addLayer({
        id: 'accommodation-points',
        type: 'circle',
        source: 'accommodation-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, 12,
            50, 16,
            100, 20
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, '#4CAF50',      // 低稼働率：緑
            50, '#FFC107',     // 中稼働率：黄色
            80, '#FF5722',     // 高稼働率：オレンジ
            100, '#F44336'     // 満室：赤
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9
        }
      });

      // 宿泊施設のラベルレイヤー
      map.addLayer({
        id: 'accommodation-labels',
        type: 'symbol',
        source: 'accommodation-source',
        layout: {
          'text-field': ['concat', 
            ['get', 'name'], 
            '\n',
            ['concat', 
              '稼働率: ', 
              ['to-string', ['round', ['get', 'occupancy_rate']]], 
              '%'
            ]
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 2
        }
      });

      // ホバー時のポップアップ
      const popup = new window.mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on('mouseenter', 'accommodation-points', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        const html = `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #333;">${properties.name}</h3>
            <p style="margin: 0; color: #666;">
              タイプ: ${properties.type}<br/>
              稼働率: ${Math.round(properties.occupancy_rate)}%<br/>
              平均価格: ¥${properties.avg_price?.toLocaleString()}/泊<br/>
              客室数: ${properties.room_count || '不明'}室<br/>
              ゲスト数: ${properties.total_guests || 0}人<br/>
              ${properties.rating ? `評価: ${properties.rating}/5` : ''}
            </p>
          </div>
        `;
        
        popup.setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'accommodation-points', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    } catch (error) {
      console.error('AccommodationLayer - Error adding layers:', error);
    }

    // データを更新
    console.log('AccommodationLayer - Processing facilities data:', facilitiesData.length, 'items');
    const features = facilitiesData.map(item => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          item.location?.lon || item.longitude || 0,
          item.location?.lat || item.latitude || 0
        ]
      },
      properties: {
        name: item.facility_name || item.name || '宿泊施設',
        type: item.facility_type || item.type || '宿泊施設',
        occupancy_rate: item.occupancy_rate || 0,
        avg_price: item.average_price || item.avg_price || 0,
        room_count: item.total_rooms || item.room_count || 0,
        rating: item.rating,
        total_guests: item.total_guests || 0,
        area: item.area || ''
      }
    }));

    console.log('AccommodationLayer - Features created:', features.length);
    console.log('AccommodationLayer - Sample feature:', features[0]);
    
    map.getSource('accommodation-source').setData({
      type: 'FeatureCollection',
      features
    });
    console.log('AccommodationLayer - Data set to source');

    // レイヤーの表示/非表示
    map.setLayoutProperty('accommodation-glow', 'visibility', visible ? 'visible' : 'none');
    map.setLayoutProperty('accommodation-points', 'visibility', visible ? 'visible' : 'none');
    map.setLayoutProperty('accommodation-labels', 'visibility', visible ? 'visible' : 'none');
    
    console.log('AccommodationLayer: Successfully updated with visibility:', visible);

    } catch (error) {
      console.error('AccommodationLayer: Error updating layers:', error);
    }

  }, [map, data, visible]);

  return null;
};

export default AccommodationLayer;