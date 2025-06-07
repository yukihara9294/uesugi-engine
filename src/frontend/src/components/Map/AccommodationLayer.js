/**
 * 宿泊施設レイヤーコンポーネント
 * 宿泊施設の位置、稼働率、価格などを可視化
 */

import React, { useEffect } from 'react';

const AccommodationLayer = ({ map, data, visible }) => {
  useEffect(() => {
    if (!map || !data || !visible) return;

    // データが正しい形式かチェック
    const facilitiesData = data.facilities || data;
    if (!Array.isArray(facilitiesData)) {
      console.error('Accommodation data is not in expected format:', data);
      return;
    }

    // 宿泊施設をポイントとして表示するソースを追加
    if (!map.getSource('accommodation-source')) {
      map.addSource('accommodation-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // 宿泊施設のポイントレイヤー
      map.addLayer({
        id: 'accommodation-points',
        type: 'circle',
        source: 'accommodation-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, 8,
            50, 12,
            100, 16
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
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.6
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
    }

    // データを更新
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

    map.getSource('accommodation-source').setData({
      type: 'FeatureCollection',
      features
    });

    // レイヤーの表示/非表示
    map.setLayoutProperty('accommodation-points', 'visibility', visible ? 'visible' : 'none');
    map.setLayoutProperty('accommodation-labels', 'visibility', visible ? 'visible' : 'none');

  }, [map, data, visible]);

  return null;
};

export default AccommodationLayer;