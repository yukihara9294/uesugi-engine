/**
 * サイバーチックな拡張版地図コンポーネント
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

const MapCyber = ({ 
  viewport, 
  onViewportChange, 
  heatmapData, 
  weatherData,
  mobilityData,
  accommodationData,
  consumptionData,
  landmarkData,
  selectedLayers, 
  selectedCategories,
  loading 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animationFrame = useRef(null);
  
  console.log('MapCyber component rendered');

  // サイバーカラーパレット
  const colors = {
    landmarks: '#FFD700',
    mobility: '#00FFFF', 
    consumption: '#FF00FF', // ネオンピンク
    accommodation: '#00FF00', // ネオングリーン
    weather: '#FFA500',
    heatmap: '#FF0080' // サイバーピンク
  };

  useEffect(() => {
    if (map.current) return;

    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    const initMap = () => {
      if (!mapContainer.current || map.current) return;

      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN;
        
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v10',
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 60,
          bearing: -20,
          maxZoom: 18,
          minZoom: 5
        });

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          
          // フォグエフェクトを追加（サイバー感）
          map.current.setFog({
            'color': 'rgb(0, 0, 50)',
            'high-color': 'rgb(0, 150, 255)',
            'horizon-blend': 0.05,
            'space-color': 'rgb(0, 0, 20)',
            'star-intensity': 0.5
          });
          
          setMapLoaded(true);
        });

        map.current.on('error', (e) => {
          if (e.error?.message?.includes('sub')) return;
          console.warn('Map error:', e);
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
      }
    };

    // Mapbox GL JSがすでに読み込まれているか確認
    if (window.mapboxgl) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        setTimeout(initMap, 100);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // レイヤー更新
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    if (!map.current.isStyleLoaded()) {
      setTimeout(() => {
        updateLayers();
      }, 100);
      return;
    }
    
    updateLayers();
    
    function updateLayers() {

    // SNS感情分析（サイバーチックなヒートマップ）
    try {
      if (map.current.getLayer('cyber-heatmap')) {
        map.current.removeLayer('cyber-heatmap');
      }
      if (map.current.getLayer('cyber-particles')) {
        map.current.removeLayer('cyber-particles');
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source');
      }

      if (selectedLayers.includes('heatmap') && selectedCategories.length > 0) {
        // より多くのSNSデータポイント
        const heatmapPoints = [];
        const baseLocations = [
          [132.4536, 34.3955], [132.4520, 34.3920], [132.3196, 34.2960],
          [132.4615, 34.3905], [132.4570, 34.3935], [132.4757, 34.3972],
          [132.4846, 34.3915], [132.4635, 34.3940], [132.4565, 34.3950]
        ];
        
        // 各ベースロケーション周辺に複数のポイントを生成
        baseLocations.forEach(loc => {
          for (let i = 0; i < 20; i++) {
            const category = ['観光', 'グルメ', 'ショッピング', 'イベント', '交通'][Math.floor(Math.random() * 5)];
            if (selectedCategories.includes(category)) {
              heatmapPoints.push({
                coordinates: [
                  loc[0] + (Math.random() - 0.5) * 0.01,
                  loc[1] + (Math.random() - 0.5) * 0.01
                ],
                intensity: Math.random() * 0.8 + 0.2,
                sentiment: Math.random() * 0.8 + 0.2,
                category: category
              });
            }
          }
        });
        
        const features = heatmapPoints.map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: p.coordinates
          },
          properties: {
            intensity: p.intensity,
            sentiment: p.sentiment,
            category: p.category
          }
        }));

        map.current.addSource('heatmap-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // サイバーヒートマップ
        map.current.addLayer({
          id: 'cyber-heatmap',
          type: 'heatmap',
          source: 'heatmap-source',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': {
              stops: [[11, 1], [15, 3]]
            },
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, '#00FFFF',
              0.4, '#00FF00',
              0.6, '#FFFF00',
              0.8, '#FF00FF',
              1, '#FF0080'
            ],
            'heatmap-radius': {
              stops: [[11, 20], [15, 30]]
            },
            'heatmap-opacity': 0.9
          }
        });

        // パーティクルエフェクト
        map.current.addLayer({
          id: 'cyber-particles',
          type: 'circle',
          source: 'heatmap-source',
          paint: {
            'circle-radius': 2,
            'circle-color': colors.heatmap,
            'circle-opacity': ['*', ['get', 'sentiment'], 0.5],
            'circle-blur': 1
          }
        });
      }
    } catch (e) {
      console.error('Heatmap error:', e);
    }

    // ランドマーク（3D建物風）
    try {
      if (map.current.getLayer('landmarks-3d')) {
        map.current.removeLayer('landmarks-3d');
      }
      if (map.current.getLayer('landmarks-glow')) {
        map.current.removeLayer('landmarks-glow');
      }
      if (map.current.getLayer('landmarks-labels')) {
        map.current.removeLayer('landmarks-labels');
      }
      if (map.current.getSource('landmarks-source')) {
        map.current.removeSource('landmarks-source');
      }

      if (selectedLayers.includes('landmarks')) {
        const landmarks = [
          { name: '原爆ドーム', coordinates: [132.4536, 34.3955], type: '史跡', icon: '🏛️', height: 150 },
          { name: '平和記念公園', coordinates: [132.4520, 34.3920], type: '公園', icon: '🌳', height: 100 },
          { name: '宮島', coordinates: [132.3196, 34.2960], type: '神社', icon: '⛩️', height: 200 },
          { name: '広島駅', coordinates: [132.4757, 34.3972], type: '交通', icon: '🚉', height: 120 },
          { name: 'マツダスタジアム', coordinates: [132.4846, 34.3915], type: 'スポーツ', icon: '⚾', height: 180 },
          { name: '本通り商店街', coordinates: [132.4570, 34.3935], type: 'ショッピング', icon: '🛍️', height: 90 }
        ];

        // 各ランドマークを四角形のポリゴンとして作成（3D建物の基礎）
        const features = landmarks.map(l => {
          const size = 0.0008; // 建物のサイズ
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [l.coordinates[0] - size, l.coordinates[1] - size],
                [l.coordinates[0] + size, l.coordinates[1] - size],
                [l.coordinates[0] + size, l.coordinates[1] + size],
                [l.coordinates[0] - size, l.coordinates[1] + size],
                [l.coordinates[0] - size, l.coordinates[1] - size]
              ]]
            },
            properties: {
              name: l.name,
              type: l.type,
              icon: l.icon,
              height: l.height
            }
          };
        });

        // ラベル用のポイントデータ
        const labelFeatures = landmarks.map(l => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: l.coordinates
          },
          properties: {
            name: l.name,
            icon: l.icon,
            height: l.height
          }
        }));

        map.current.addSource('landmarks-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // 3D建物
        map.current.addLayer({
          id: 'landmarks-3d',
          type: 'fill-extrusion',
          source: 'landmarks-source',
          paint: {
            'fill-extrusion-color': colors.landmarks,
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // グロー効果
        map.current.addLayer({
          id: 'landmarks-glow',
          type: 'fill-extrusion',
          source: 'landmarks-source',
          paint: {
            'fill-extrusion-color': colors.landmarks,
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.3
          }
        });

        // ラベル
        map.current.addSource('landmarks-labels-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: labelFeatures }
        });

        map.current.addLayer({
          id: 'landmarks-labels',
          type: 'symbol',
          source: 'landmarks-labels-source',
          layout: {
            'text-field': '{icon}\n{name}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'bottom',
            'text-offset': [0, -2]
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': colors.landmarks,
            'text-halo-width': 2
          }
        });
      }
    } catch (e) {
      console.error('Landmarks error:', e);
    }

    // 人流データ（サイバー光流）
    try {
      if (map.current.getLayer('mobility-flow')) {
        map.current.removeLayer('mobility-flow');
      }
      if (map.current.getLayer('mobility-glow')) {
        map.current.removeLayer('mobility-glow');
      }
      if (map.current.getSource('mobility-source')) {
        map.current.removeSource('mobility-source');
      }

      if (selectedLayers.includes('mobility')) {
        const mobilityRoutes = [
          {
            route: [[132.4757, 34.3972], [132.4636, 34.3955], [132.4536, 34.3955]],
            flow: 5500
          },
          {
            route: [[132.4536, 34.3955], [132.4520, 34.3920]],
            flow: 4200
          },
          {
            route: [[132.4757, 34.3972], [132.4570, 34.3935], [132.3026, 34.2995]],
            flow: 3800
          },
          {
            route: [[132.4570, 34.3935], [132.4615, 34.3905]],
            flow: 3200
          },
          {
            route: [[132.4635, 34.3940], [132.4565, 34.3950], [132.4575, 34.3965]],
            flow: 2800
          }
        ];

        const features = mobilityRoutes.map((m, i) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: m.route
          },
          properties: {
            flow: m.flow,
            id: i
          }
        }));

        map.current.addSource('mobility-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // グロー効果
        map.current.addLayer({
          id: 'mobility-glow',
          type: 'line',
          source: 'mobility-source',
          paint: {
            'line-color': colors.mobility,
            'line-width': [
              'interpolate', ['linear'], ['get', 'flow'],
              0, 10,
              3000, 20,
              6000, 30
            ],
            'line-opacity': 0.3,
            'line-blur': 10
          }
        });

        // メインフロー
        map.current.addLayer({
          id: 'mobility-flow',
          type: 'line',
          source: 'mobility-source',
          paint: {
            'line-color': colors.mobility,
            'line-width': [
              'interpolate', ['linear'], ['get', 'flow'],
              0, 2,
              3000, 6,
              6000, 10
            ],
            'line-opacity': 0.9
          }
        });

        // アニメーション
        let offset = 0;
        const animateMobility = () => {
          offset = (offset + 1) % 20;
          if (map.current && map.current.getLayer('mobility-flow')) {
            map.current.setPaintProperty('mobility-flow', 'line-dasharray', [2, 2]);
            map.current.setPaintProperty('mobility-flow', 'line-offset', offset);
          }
          animationFrame.current = requestAnimationFrame(animateMobility);
        };
        animateMobility();
      }
    } catch (e) {
      console.error('Mobility error:', e);
    }

    // 消費データ（3D棒グラフ）
    try {
      if (map.current.getLayer('consumption-bars')) {
        map.current.removeLayer('consumption-bars');
      }
      if (map.current.getLayer('consumption-labels')) {
        map.current.removeLayer('consumption-labels');
      }
      if (map.current.getSource('consumption-source')) {
        map.current.removeSource('consumption-source');
      }

      if (selectedLayers.includes('consumption')) {
        const consumptionPoints = [
          { area: '本通り商店街', coordinates: [132.4570, 34.3935], amount: 850000 },
          { area: '紙屋町', coordinates: [132.4565, 34.3950], amount: 720000 },
          { area: '広島駅周辺', coordinates: [132.4757, 34.3972], amount: 680000 },
          { area: '流川', coordinates: [132.4615, 34.3905], amount: 920000 },
          { area: '宮島商店街', coordinates: [132.3196, 34.2960], amount: 560000 },
          { area: '八丁堀', coordinates: [132.4635, 34.3940], amount: 450000 },
          { area: 'そごう周辺', coordinates: [132.4575, 34.3965], amount: 380000 }
        ];

        // 3D棒グラフ用のポリゴンを作成
        const features = consumptionPoints.map(c => {
          const size = 0.0005;
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [c.coordinates[0] - size, c.coordinates[1] - size],
                [c.coordinates[0] + size, c.coordinates[1] - size],
                [c.coordinates[0] + size, c.coordinates[1] + size],
                [c.coordinates[0] - size, c.coordinates[1] + size],
                [c.coordinates[0] - size, c.coordinates[1] - size]
              ]]
            },
            properties: {
              amount: c.amount,
              area: c.area,
              height: (c.amount / 5000) // 高さを調整
            }
          };
        });

        map.current.addSource('consumption-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // 3D棒グラフ
        map.current.addLayer({
          id: 'consumption-bars',
          type: 'fill-extrusion',
          source: 'consumption-source',
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'amount'],
              0, '#FF00FF',
              500000, '#FF0080',
              1000000, '#FF0040'
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // ラベル用ポイント
        const labelFeatures = consumptionPoints.map(c => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: c.coordinates
          },
          properties: {
            amount: c.amount,
            area: c.area
          }
        }));

        map.current.addSource('consumption-labels-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: labelFeatures }
        });

        map.current.addLayer({
          id: 'consumption-labels',
          type: 'symbol',
          source: 'consumption-labels-source',
          layout: {
            'text-field': ['concat', '¥', ['to-string', ['/', ['get', 'amount'], 10000]], '万'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'bottom'
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': colors.consumption,
            'text-halo-width': 2
          }
        });
      }
    } catch (e) {
      console.error('Consumption error:', e);
    }

    // 宿泊施設（ネオングロー）
    try {
      if (map.current.getLayer('accommodation-layer')) {
        map.current.removeLayer('accommodation-layer');
      }
      if (map.current.getLayer('accommodation-glow')) {
        map.current.removeLayer('accommodation-glow');
      }
      if (map.current.getSource('accommodation-source')) {
        map.current.removeSource('accommodation-source');
      }

      if (accommodationData && selectedLayers.includes('accommodation')) {
        const features = (accommodationData.facilities || []).map(f => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [f.location.lon, f.location.lat]
          },
          properties: {
            name: f.facility_name,
            occupancy: f.occupancy_rate
          }
        }));

        map.current.addSource('accommodation-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // グロー効果
        map.current.addLayer({
          id: 'accommodation-glow',
          type: 'circle',
          source: 'accommodation-source',
          paint: {
            'circle-radius': 20,
            'circle-color': colors.accommodation,
            'circle-opacity': 0.2,
            'circle-blur': 2
          }
        });

        map.current.addLayer({
          id: 'accommodation-layer',
          type: 'circle',
          source: 'accommodation-source',
          paint: {
            'circle-radius': 8,
            'circle-color': colors.accommodation,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
            'circle-opacity': 0.9
          }
        });
      }
    } catch (e) {
      console.error('Accommodation error:', e);
    }

    // 気象データ（サイバーパネル）
    try {
      const existingPanel = document.getElementById('cyber-weather-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      if (selectedLayers.includes('weather')) {
        const weatherInfo = {
          temperature: 22,
          humidity: 65,
          precipitation: 10.8,
          windSpeed: 3.5,
          condition: '適度な雨'
        };

        const weatherPanel = document.createElement('div');
        weatherPanel.id = 'cyber-weather-panel';
        weatherPanel.style.cssText = `
          position: absolute;
          top: 80px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid ${colors.weather};
          border-radius: 0;
          padding: 20px;
          color: ${colors.weather};
          font-family: 'Courier New', monospace;
          width: 250px;
          backdrop-filter: blur(10px);
          z-index: 1000;
          box-shadow: 0 0 20px ${colors.weather};
        `;
        
        weatherPanel.innerHTML = `
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase;">
            [WEATHER DATA]
          </div>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>TEMP:</span>
              <span style="font-weight: bold;">${weatherInfo.temperature}°C</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>HUMIDITY:</span>
              <span>${weatherInfo.humidity}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>RAIN:</span>
              <span>${weatherInfo.precipitation}mm</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>WIND:</span>
              <span>${weatherInfo.windSpeed}m/s</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid ${colors.weather};">
              <span>STATUS: </span>
              <span style="color: #00FF00;">${weatherInfo.condition}</span>
            </div>
          </div>
        `;
        
        mapContainer.current.appendChild(weatherPanel);
      }
    } catch (e) {
      console.error('Weather error:', e);
    }
    } // updateLayers関数の終了
  }, [mapLoaded, accommodationData, selectedLayers, selectedCategories]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        backgroundColor: '#000000'
      }}>
        <CircularProgress sx={{ color: colors.mobility }} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative'
      }} 
    >
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
      {/* サイバーデータ状態表示 */}
      <Box sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: '#00FF00',
        padding: 2,
        borderRadius: 0,
        fontSize: 12,
        zIndex: 1000,
        border: '1px solid #00FF00',
        fontFamily: 'Courier New, monospace',
        boxShadow: '0 0 10px #00FF00'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>[SYSTEM STATUS]</div>
        <div style={{ color: colors.heatmap }}>SNS ANALYSIS: {selectedLayers.includes('heatmap') ? `${selectedCategories.length} CATEGORIES` : 'OFFLINE'}</div>
        <div style={{ color: colors.accommodation }}>FACILITIES: {selectedLayers.includes('accommodation') ? `${accommodationData?.facilities?.length || 328} NODES` : 'OFFLINE'}</div>
        <div style={{ color: colors.weather }}>WEATHER: {selectedLayers.includes('weather') ? 'ONLINE' : 'OFFLINE'}</div>
        <div style={{ color: colors.mobility }}>TRAFFIC FLOW: {selectedLayers.includes('mobility') ? '5 ROUTES' : 'OFFLINE'}</div>
        <div style={{ color: colors.consumption }}>CONSUMPTION: {selectedLayers.includes('consumption') ? '7 ZONES' : 'OFFLINE'}</div>
        <div style={{ color: colors.landmarks }}>LANDMARKS: {selectedLayers.includes('landmarks') ? '6 POINTS' : 'OFFLINE'}</div>
      </Box>
    </Box>
  );
};

export default MapCyber;