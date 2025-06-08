import { useEffect } from 'react';

const EventLayer = ({ map, eventData, visible }) => {
  useEffect(() => {
    if (!map || !eventData) return;

    // イベントアイコンレイヤー
    const eventIconLayerId = 'event-icons';
    const eventIconSourceId = 'event-icons-source';
    
    // 影響範囲レイヤー  
    const impactZoneLayerId = 'event-impact-zones';
    const impactZoneSourceId = 'event-impact-zones-source';
    
    // パルスアニメーションレイヤー
    const pulseLayerId = 'event-pulse';
    const pulseSourceId = 'event-pulse-source';

    // カテゴリごとのアイコンカラー
    const categoryColors = {
      festival: '#FF6B6B',    // 赤
      sports: '#4ECDC4',      // ターコイズ
      concert: '#FFE66D',     // 黄色
      exhibition: '#A8E6CF',  // 緑
      market: '#C7CEEA'       // 紫
    };

    // カテゴリごとのアイコン
    const categoryIcons = {
      festival: '🎊',
      sports: '⚽',
      concert: '🎵',
      exhibition: '🎨',
      market: '🛍️'
    };

    // データを変換
    const iconFeatures = eventData.map(event => ({
      type: 'Feature',
      properties: {
        id: event.id,
        name: event.name,
        category: event.category,
        venue: event.venue,
        attendees: event.expected_attendees,
        icon: categoryIcons[event.category] || '📍',
        color: categoryColors[event.category] || '#888888'
      },
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude]
      }
    }));

    const impactZoneFeatures = eventData.map(event => ({
      type: 'Feature',
      properties: {
        id: event.id,
        name: event.name,
        radius: event.impact_radius,
        color: categoryColors[event.category] || '#888888'
      },
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude]
      }
    }));

    // レイヤーの削除
    const cleanup = () => {
      if (map.getLayer(pulseLayerId)) map.removeLayer(pulseLayerId);
      if (map.getLayer(eventIconLayerId)) map.removeLayer(eventIconLayerId);
      if (map.getLayer(impactZoneLayerId)) map.removeLayer(impactZoneLayerId);
      
      if (map.getSource(pulseSourceId)) map.removeSource(pulseSourceId);
      if (map.getSource(eventIconSourceId)) map.removeSource(eventIconSourceId);
      if (map.getSource(impactZoneSourceId)) map.removeSource(impactZoneSourceId);
    };

    cleanup();

    if (!visible) return;

    // 影響範囲レイヤーを追加
    map.addSource(impactZoneSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: impactZoneFeatures
      }
    });

    map.addLayer({
      id: impactZoneLayerId,
      type: 'circle',
      source: impactZoneSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['/', ['get', 'radius'], 100],
          15, ['/', ['get', 'radius'], 20],
          20, ['/', ['get', 'radius'], 5]
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.15,
        'circle-stroke-width': 2,
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-opacity': 0.3
      }
    });

    // パルスアニメーション用のレイヤー
    map.addSource(pulseSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: impactZoneFeatures
      }
    });

    map.addLayer({
      id: pulseLayerId,
      type: 'circle',
      source: pulseSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 20,
          15, 40,
          20, 80
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0,
        'circle-stroke-width': 3,
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-opacity': 0
      }
    });

    // イベントアイコンレイヤーを追加
    map.addSource(eventIconSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: iconFeatures
      }
    });

    map.addLayer({
      id: eventIconLayerId,
      type: 'symbol',
      source: eventIconSourceId,
      layout: {
        'text-field': ['get', 'icon'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 24,
          15, 32,
          20, 48
        ],
        'text-allow-overlap': true,
        'text-ignore-placement': true
      }
    });

    // パルスアニメーション
    let animationFrame;
    const animatePulse = (timestamp) => {
      const duration = 3000; // 3秒周期
      const t = (timestamp % duration) / duration;
      
      const radius = 20 + 30 * t;
      const opacity = 0.8 * (1 - t);
      
      map.setPaintProperty(pulseLayerId, 'circle-radius', [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, radius,
        15, radius * 2,
        20, radius * 4
      ]);
      
      map.setPaintProperty(pulseLayerId, 'circle-stroke-opacity', opacity);
      
      animationFrame = requestAnimationFrame(animatePulse);
    };

    animationFrame = requestAnimationFrame(animatePulse);

    // ホバー効果
    let hoveredEventId = null;

    map.on('mouseenter', eventIconLayerId, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        // ポップアップ表示
        const popup = new window.mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });
        
        popup.setLngLat(feature.geometry.coordinates)
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px;">${feature.properties.name}</h3>
              <p style="margin: 0; font-size: 14px;">会場: ${feature.properties.venue}</p>
              <p style="margin: 0; font-size: 14px;">予想来場者数: ${feature.properties.attendees.toLocaleString()}人</p>
            </div>
          `)
          .addTo(map);
        
        hoveredEventId = feature.properties.id;
      }
    });

    map.on('mouseleave', eventIconLayerId, () => {
      map.getCanvas().style.cursor = '';
      
      // ポップアップを削除
      const popups = document.getElementsByClassName('mapboxgl-popup');
      if (popups.length) {
        popups[0].remove();
      }
      
      hoveredEventId = null;
    });

    return () => {
      cleanup();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      map.off('mouseenter', eventIconLayerId);
      map.off('mouseleave', eventIconLayerId);
    };
  }, [map, eventData, visible]);

  return null;
};

export default EventLayer;