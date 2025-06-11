/**
 * 消費データレイヤーコンポーネント
 * 店舗別の消費データを3Dグラフとアニメーションで可視化
 */

import React, { useEffect, useRef } from 'react';
import { safeGet, safeDivide } from '../../utils/mapboxExpressionHelpers';

const ConsumptionLayer = ({ map, data, visible }) => {
  const animationRef = useRef(null);
  const pulseStartTime = useRef(Date.now());

  useEffect(() => {
    if (!map || !data) return;

    console.log('ConsumptionLayer: Received data:', data);
    
    // APIレスポンスの構造に対応
    const storesData = data.top_stores || [];
    if (!Array.isArray(storesData)) {
      console.error('ConsumptionLayer: Invalid data format');
      return;
    }

    console.log('ConsumptionLayer: Initializing with', storesData.length, 'stores');

    try {
      // 既存レイヤーのクリーンアップ
      const layers = ['consumption-3d-bars', 'consumption-base', 'consumption-icons', 'consumption-labels', 'consumption-glow'];
      layers.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('consumption-source')) {
        map.removeSource('consumption-source');
      }

      // カテゴリ別の色
      const categoryColors = {
        '飲食': '#FF6B6B',
        '物販': '#4ECDC4',
        'サービス': '#FFE66D',
        '観光施設': '#A8E6CF',
        '交通': '#C7B3E5',
        '宿泊': '#FF8B94'
      };

      // GeoJSONデータの作成
      const features = storesData.map((store, index) => {
        const color = categoryColors[store.store_category] || '#999999';
        // 取引額に基づいて高さを計算（最大50m、元の1/4）
        // より多様な高さのバリエーションを追加
        const baseHeight = (store.total_amount / 1000000) * 12.5; // 元の50を12.5に
        const variation = Math.sin(index * 0.5) * 5 + Math.cos(index * 0.3) * 3; // 変動を追加
        const height = Math.min(50, Math.max(10, baseHeight + variation));
        
        // 半径も1/2に縮小
        const radius = Math.sqrt(store.transaction_count) * 1;
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [store.location.lon, store.location.lat]
          },
          properties: {
            ...store,
            color: color,
            height: height,
            radius: radius
          }
        };
      });

      // ソースを追加
      map.addSource('consumption-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // グロー効果レイヤー
      map.addLayer({
        id: 'consumption-glow',
        type: 'circle',
        source: 'consumption-source',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-blur': 2,
          'circle-opacity': 0
        }
      });

      // ベース円レイヤー（サイズ縮小）
      map.addLayer({
        id: 'consumption-base',
        type: 'circle',
        source: 'consumption-source',
        paint: {
          'circle-radius': 10, // 固定サイズに簡略化
          'circle-color': '#4ECDC4', // 固定色に簡略化
          'circle-opacity': 0.8
        }
      });

      // 3D棒グラフ
      map.addLayer({
        id: 'consumption-3d-bars',
        type: 'fill-extrusion',
        source: 'consumption-source',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.9
        }
      });

      // カテゴリアイコン
      const categoryIcons = {
        '飲食': '🍽️',
        '物販': '🛍️',
        'サービス': '💼',
        '観光施設': '🏛️',
        '交通': '🚊',
        '宿泊': '🏨'
      };

      // アイコンレイヤー
      map.addLayer({
        id: 'consumption-icons',
        type: 'symbol',
        source: 'consumption-source',
        layout: {
          'text-field': ['get', 'store_category'],
          'text-size': 0,
          'text-transform': 'none',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // 店舗名ラベル
      map.addLayer({
        id: 'consumption-labels',
        type: 'symbol',
        source: 'consumption-source',
        layout: {
          'text-field': [
            'format',
            ['get', 'store_name'],
            { 'font-scale': 0.9, 'text-font': ['literal', ['Open Sans Bold', 'Arial Unicode MS Bold']] },
            '\n',
            ['concat', '¥', ['to-string', ['round', ['/', ['get', 'total_amount'], 1000]]], 'k'],
            { 'font-scale': 0.8 }
          ],
          'text-size': 14,
          'text-anchor': 'bottom',
          'text-offset': [0, -2],
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 2
        }
      });

      // アイコンテキストの更新
      features.forEach(feature => {
        const icon = categoryIcons[feature.properties.store_category] || '📍';
        feature.properties.icon = icon;
      });

      map.getSource('consumption-source').setData({
        type: 'FeatureCollection',
        features
      });

      map.setLayoutProperty('consumption-icons', 'text-field', ['get', 'icon']);
      map.setLayoutProperty('consumption-icons', 'text-size', 28);

      // パルスアニメーション
      const animatePulse = () => {
        const duration = 3000; // 3秒周期
        const elapsed = Date.now() - pulseStartTime.current;
        const progress = (elapsed % duration) / duration;
        
        // サイン波でスムーズなアニメーション
        const opacity = Math.sin(progress * Math.PI) * 0.6;
        const radiusMultiplier = 1 + Math.sin(progress * Math.PI) * 0.5;
        
        if (map.getLayer('consumption-glow')) {
          try {
            map.setPaintProperty('consumption-glow', 'circle-opacity', opacity);
            map.setPaintProperty('consumption-glow', 'circle-radius', [
              '*',
              ['get', 'radius'],
              radiusMultiplier * 2
            ]);
          } catch (e) {
            // エラーを無視
          }
        }
        
        animationRef.current = requestAnimationFrame(animatePulse);
      };

      if (visible) {
        pulseStartTime.current = Date.now();
        animatePulse();
      }

      // ホバー時のポップアップ
      if (!window.mapboxgl || !window.mapboxgl.Popup) {
        console.warn('ConsumptionLayer: Mapbox GL Popup not available');
        return;
      }
      
      const popup = new window.mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25
      });

      map.on('mouseenter', 'consumption-3d-bars', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        
        // 円グラフ風の表示
        const touristPercentage = Math.round(props.tourist_ratio * 100);
        const localPercentage = 100 - touristPercentage;
        
        const html = `
          <div style="padding: 15px; min-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 8px;">${categoryIcons[props.store_category] || '📍'}</span>
              ${props.store_name}
            </h3>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <span style="background: ${props.color}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">
                ${props.store_category}
              </span>
              <span style="background: #e0e0e0; color: #666; padding: 4px 12px; border-radius: 16px; font-size: 12px;">
                ${props.area}
              </span>
            </div>
            
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <div style="color: #666; font-size: 12px;">取引件数</div>
                  <div style="color: #333; font-size: 20px; font-weight: bold;">${props.transaction_count}</div>
                </div>
                <div>
                  <div style="color: #666; font-size: 12px;">売上総額</div>
                  <div style="color: #333; font-size: 20px; font-weight: bold;">¥${(props.total_amount / 1000000).toFixed(1)}M</div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 10px;">
              <div style="color: #666; font-size: 12px; margin-bottom: 5px;">平均単価</div>
              <div style="color: #333; font-size: 16px; font-weight: bold;">¥${Math.round(props.average_amount).toLocaleString()}</div>
            </div>
            
            <div>
              <div style="color: #666; font-size: 12px; margin-bottom: 5px;">顧客構成</div>
              <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: #FF6B6B; width: ${touristPercentage}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                  ${touristPercentage > 20 ? `観光客 ${touristPercentage}%` : ''}
                </div>
                <div style="background: #4ECDC4; width: ${localPercentage}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                  ${localPercentage > 20 ? `地元客 ${localPercentage}%` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
        
        popup.setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'consumption-3d-bars', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // レイヤーの表示/非表示
      const layerIds = ['consumption-glow', 'consumption-base', 'consumption-3d-bars', 'consumption-icons', 'consumption-labels'];
      layerIds.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      });

      console.log('ConsumptionLayer: Successfully initialized');

    } catch (error) {
      console.error('ConsumptionLayer: Error:', error);
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

export default ConsumptionLayer;