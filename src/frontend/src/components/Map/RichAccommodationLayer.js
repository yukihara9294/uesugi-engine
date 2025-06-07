/**
 * リッチな宿泊施設レイヤーコンポーネント
 * 3Dバー、アニメーション、グラフ表現で宿泊施設データを可視化
 */

import React, { useEffect, useRef } from 'react';

const RichAccommodationLayer = ({ map, data, visible }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!map || !data) return;

    console.log('RichAccommodationLayer: Received data:', data);
    
    // APIレスポンスの構造に対応
    const facilitiesData = data.facilities || (Array.isArray(data) ? data : []);
    if (!Array.isArray(facilitiesData)) {
      console.error('RichAccommodationLayer: Invalid data format, expected array but got:', typeof facilitiesData);
      console.error('RichAccommodationLayer: Data structure:', data);
      return;
    }

    console.log('RichAccommodationLayer: Initializing with', facilitiesData.length, 'facilities');

    try {
      // 既存レイヤーのクリーンアップ
      const layers = ['accommodation-3d-bars', 'accommodation-icons', 'accommodation-labels', 'accommodation-pulse'];
      layers.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('accommodation-source')) {
        map.removeSource('accommodation-source');
      }

      // GeoJSONデータの作成
      const features = facilitiesData.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            item.location?.lon || item.longitude,
            item.location?.lat || item.latitude
          ]
        },
        properties: {
          name: item.facility_name || item.name,
          type: item.facility_type || item.type,
          occupancy_rate: item.occupancy_rate || 0,
          height: (item.occupancy_rate || 0) * 100, // 稼働率を高さに変換
          avg_price: item.average_price || item.avg_price || 0,
          total_rooms: item.total_rooms || item.room_count || 0,
          occupied_rooms: item.occupied_rooms || 0,
          total_guests: item.total_guests || 0,
          area: item.area || ''
        }
      }));

      // ソースを追加
      map.addSource('accommodation-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // パルスアニメーションレイヤー（背景）- より大きく
      map.addLayer({
        id: 'accommodation-pulse',
        type: 'circle',
        source: 'accommodation-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, 40,
            0.5, 55,
            1, 70
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, 'rgba(76, 175, 80, 0.5)',
            0.5, 'rgba(255, 193, 7, 0.5)',
            0.8, 'rgba(255, 87, 34, 0.5)',
            1, 'rgba(244, 67, 54, 0.5)'
          ],
          'circle-blur': 1.5,
          'circle-opacity': 0
        }
      });

      // 3D風の円柱表現（より高く、目立つように）
      map.addLayer({
        id: 'accommodation-3d-bars',
        type: 'fill-extrusion',
        source: 'accommodation-source',
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'occupancy_rate'],
            0, '#4CAF50',
            0.5, '#FFC107',
            0.8, '#FF5722',
            1, '#F44336'
          ],
          'fill-extrusion-height': ['*', ['get', 'height'], 3], // 3倍の高さに
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.9 // より不透明に
        }
      });

      // アイコンレイヤー（アイコンの代わりにテキストを使用）
      map.addLayer({
        id: 'accommodation-icons',
        type: 'symbol',
        source: 'accommodation-source',
        layout: {
          'text-field': '🏨',
          'text-size': 30, // より大きく
          'text-allow-overlap': true,
          'text-offset': [0, -1]
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // ラベルレイヤー（詳細情報）
      map.addLayer({
        id: 'accommodation-labels',
        type: 'symbol',
        source: 'accommodation-source',
        layout: {
          'text-field': [
            'format',
            ['get', 'name'], { 'font-scale': 1.2, 'text-font': ['literal', ['Open Sans Bold', 'Arial Unicode MS Bold']] },
            '\n',
            ['concat', '稼働率: ', ['to-string', ['round', ['*', ['get', 'occupancy_rate'], 100]]], '%'],
            { 'font-scale': 0.9, 'text-font': ['literal', ['Open Sans Regular', 'Arial Unicode MS Regular']] },
            '\n',
            ['concat', '¥', ['to-string', ['round', ['get', 'avg_price']]], '/泊'],
            { 'font-scale': 0.8, 'text-font': ['literal', ['Open Sans Regular', 'Arial Unicode MS Regular']] }
          ],
          'text-size': 12,
          'text-anchor': 'bottom',
          'text-offset': [0, -4],
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 2
        }
      });

      // アニメーション効果
      let opacity = 0;
      let increasing = true;
      
      const animatePulse = () => {
        if (increasing) {
          opacity += 0.02;
          if (opacity >= 0.6) increasing = false;
        } else {
          opacity -= 0.02;
          if (opacity <= 0) {
            opacity = 0; // 負の値を防ぐ
            increasing = true;
          }
        }
        
        if (map.getLayer('accommodation-pulse')) {
          try {
            map.setPaintProperty('accommodation-pulse', 'circle-opacity', Math.max(0, opacity));
          } catch (e) {
            // エラーを無視
          }
        }
        
        animationRef.current = requestAnimationFrame(animatePulse);
      };
      
      if (visible) {
        animatePulse();
      }

      // ホバー時のポップアップ
      if (!window.mapboxgl || !window.mapboxgl.Popup) {
        console.warn('RichAccommodationLayer: Mapbox GL Popup not available');
        return;
      }
      
      const popup = new window.mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25
      });

      map.on('mouseenter', 'accommodation-3d-bars', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        
        // グラフ付きのリッチなポップアップ
        const occupancyBar = `
          <div style="background: #f0f0f0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: ${props.occupancy_rate > 0.8 ? '#F44336' : props.occupancy_rate > 0.5 ? '#FFC107' : '#4CAF50'}; 
                        width: ${props.occupancy_rate * 100}%; height: 100%;"></div>
          </div>
        `;
        
        const html = `
          <div style="padding: 15px; min-width: 250px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${props.name}</h3>
            <div style="margin-bottom: 10px;">
              <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #1976d2;">
                ${props.type}
              </span>
              <span style="background: #fff3e0; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #f57c00; margin-left: 5px;">
                ${props.area}
              </span>
            </div>
            <div style="margin: 10px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #666; font-size: 13px;">稼働率</span>
                <span style="color: #333; font-weight: bold; font-size: 13px;">${Math.round(props.occupancy_rate * 100)}%</span>
              </div>
              ${occupancyBar}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
              <div style="background: #f5f5f5; padding: 8px; border-radius: 8px; text-align: center;">
                <div style="color: #666; font-size: 11px;">平均価格</div>
                <div style="color: #333; font-weight: bold; font-size: 14px;">¥${props.avg_price?.toLocaleString()}</div>
              </div>
              <div style="background: #f5f5f5; padding: 8px; border-radius: 8px; text-align: center;">
                <div style="color: #666; font-size: 11px;">客室数</div>
                <div style="color: #333; font-weight: bold; font-size: 14px;">${props.occupied_rooms}/${props.total_rooms}</div>
              </div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
              <div style="color: #666; font-size: 12px;">現在のゲスト数: <strong>${props.total_guests}人</strong></div>
            </div>
          </div>
        `;
        
        popup.setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'accommodation-3d-bars', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // レイヤーの表示/非表示
      const layerIds = ['accommodation-pulse', 'accommodation-3d-bars', 'accommodation-icons', 'accommodation-labels'];
      layerIds.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      });

      console.log('RichAccommodationLayer: Successfully initialized');

    } catch (error) {
      console.error('RichAccommodationLayer: Error:', error);
    }

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

  }, [map, data, visible]);

  return null;
};

export default RichAccommodationLayer;