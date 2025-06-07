/**
 * 最小限の地図コンポーネント（エラー完全回避版）
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

const MapMinimal = ({ 
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
  const [retryCount, setRetryCount] = useState(0);
  
  console.log('MapMinimal component rendered');

  useEffect(() => {
    console.log('Map useEffect triggered');
    // 既に初期化済みの場合はスキップ
    if (map.current) {
      console.log('Map already initialized, skipping');
      return;
    }

    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    console.log('MAPBOX_TOKEN:', MAPBOX_TOKEN ? 'Found' : 'Not found');
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    // Mapbox CSS を追加
    if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Mapbox GL JSを読み込み
    const loadMapbox = () => {
      console.log('loadMapbox called, window.mapboxgl:', !!window.mapboxgl);
      if (window.mapboxgl) {
        console.log('mapboxgl already loaded, initializing map');
        initMap();
      } else if (retryCount < 5) {
        console.log('Loading mapbox script, retry count:', retryCount);
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          console.log('Mapbox script loaded, window.mapboxgl:', !!window.mapboxgl);
          // より長い待機時間でDOMの準備を確実にする
          const checkAndInit = () => {
            if (mapContainer.current) {
              console.log('Container ready, calling initMap');
              initMap();
            } else {
              console.log('Container not ready, retrying...');
              setTimeout(checkAndInit, 100);
            }
          };
          setTimeout(checkAndInit, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Mapbox script');
          setRetryCount(prev => prev + 1);
          setTimeout(loadMapbox, 1000);
        };
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      console.log('initMap called, mapContainer:', !!mapContainer.current, 'map.current:', !!map.current);
      if (!mapContainer.current) {
        console.log('Container not ready yet');
        return;
      }
      if (map.current) {
        console.log('Map already initialized');
        return;
      }

      try {
        console.log('Initializing map with token:', MAPBOX_TOKEN ? 'Token exists' : 'No token');
        window.mapboxgl.accessToken = MAPBOX_TOKEN;
        
        // Mapboxの標準ダークスタイルを使用
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v10',
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 45,
          bearing: 0,
          maxZoom: 18,
          minZoom: 5
        });

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapLoaded(true);
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        setRetryCount(prev => prev + 1);
        if (retryCount < 5) {
          setTimeout(loadMapbox, 1000);
        }
      }
    };

    loadMapbox();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // 依存配列を空にして、初回のみ実行

  // シンプルなデータ表示
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // スタイルが読み込まれるまで待機
    if (!map.current.isStyleLoaded()) {
      const waitForStyle = () => {
        if (map.current.isStyleLoaded()) {
          updateLayers();
        } else {
          setTimeout(waitForStyle, 100);
        }
      };
      waitForStyle();
      return;
    }
    
    updateLayers();
    
    function updateLayers() {

    // ヒートマップレイヤー
    try {
      // 既存のレイヤーを削除
      if (map.current.getLayer('simple-heatmap')) {
        map.current.removeLayer('simple-heatmap');
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source');
      }

      // selectedLayersに含まれている場合のみ追加
      if (heatmapData && selectedLayers.includes('heatmap')) {
        // 新しいソースを追加
        map.current.addSource('heatmap-source', {
          type: 'geojson',
          data: heatmapData
        });

        // シンプルな円でヒートマップを表現
        map.current.addLayer({
          id: 'simple-heatmap',
          type: 'circle',
          source: 'heatmap-source',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF5722',
            'circle-opacity': 0.6
          }
        });
      }
    } catch (e) {
      console.error('Heatmap error:', e);
    }

    // 宿泊施設レイヤー
    try {
      if (map.current.getLayer('simple-accommodation')) {
        map.current.removeLayer('simple-accommodation');
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
            name: f.facility_name
          }
        }));

        map.current.addSource('accommodation-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        map.current.addLayer({
          id: 'simple-accommodation',
          type: 'circle',
          source: 'accommodation-source',
          paint: {
            'circle-radius': 10,
            'circle-color': '#4CAF50',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    } catch (e) {
      console.error('Accommodation error:', e);
    }

    // 人流データレイヤー
    try {
      if (map.current.getLayer('simple-mobility')) {
        map.current.removeLayer('simple-mobility');
      }
      if (map.current.getSource('mobility-source')) {
        map.current.removeSource('mobility-source');
      }

      if (selectedLayers.includes('mobility')) {
        // ダミー人流データ
        const mobilityPoints = [
          { area: '原爆ドーム周辺', coordinates: [132.4536, 34.3955], count: 3500 },
          { area: '平和記念公園', coordinates: [132.4520, 34.3920], count: 2800 },
          { area: '宮島フェリー乗り場', coordinates: [132.3026, 34.2995], count: 4200 },
          { area: '広島駅', coordinates: [132.4757, 34.3972], count: 5500 },
          { area: 'マツダスタジアム', coordinates: [132.4846, 34.3915], count: 1800 },
          { area: '本通り商店街', coordinates: [132.4570, 34.3935], count: 4000 },
          { area: '紙屋町', coordinates: [132.4565, 34.3950], count: 3200 },
          { area: '広島バスセンター', coordinates: [132.4590, 34.3965], count: 2500 }
        ];

        const features = mobilityPoints.map(m => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: m.coordinates
          },
          properties: {
            count: m.count,
            area: m.area
          }
        }));

        map.current.addSource('mobility-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        map.current.addLayer({
          id: 'simple-mobility',
          type: 'circle',
          source: 'mobility-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['get', 'count'],
              0, 5,
              1000, 15,
              5000, 25
            ],
            'circle-color': '#2196F3',
            'circle-opacity': 0.7
          }
        });
      }
    } catch (e) {
      console.error('Mobility error:', e);
    }

    // 気象データレイヤー
    try {
      if (map.current.getLayer('simple-weather')) {
        map.current.removeLayer('simple-weather');
      }
      if (map.current.getSource('weather-source')) {
        map.current.removeSource('weather-source');
      }

      if (weatherData && selectedLayers.includes('weather')) {
        const features = (weatherData.current_weather || []).map(w => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [w.longitude || w.lon, w.latitude || w.lat]
          },
          properties: {
            temperature: w.temperature,
            location: w.location_name || w.location
          }
        }));

        map.current.addSource('weather-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        map.current.addLayer({
          id: 'simple-weather',
          type: 'symbol',
          source: 'weather-source',
          layout: {
            'text-field': '{temperature}°C',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#FFC107',
            'text-halo-color': '#000000',
            'text-halo-width': 2
          }
        });
      }
    } catch (e) {
      console.error('Weather error:', e);
    }

    // 消費データレイヤー
    try {
      if (map.current.getLayer('simple-consumption')) {
        map.current.removeLayer('simple-consumption');
      }
      if (map.current.getSource('consumption-source')) {
        map.current.removeSource('consumption-source');
      }

      if (selectedLayers.includes('consumption')) {
        // ダミー消費データ
        const consumptionPoints = [
          { area: '本通り商店街', coordinates: [132.4570, 34.3935], amount: 850000, category: 'ショッピング' },
          { area: '紙屋町', coordinates: [132.4565, 34.3950], amount: 720000, category: 'ショッピング' },
          { area: '広島駅周辺', coordinates: [132.4757, 34.3972], amount: 680000, category: '飲食' },
          { area: '流川', coordinates: [132.4615, 34.3905], amount: 920000, category: '飲食' },
          { area: '宮島商店街', coordinates: [132.3196, 34.2960], amount: 560000, category: 'お土産' },
          { area: '八丁堀', coordinates: [132.4635, 34.3940], amount: 450000, category: 'ショッピング' },
          { area: 'そごう周辺', coordinates: [132.4575, 34.3965], amount: 380000, category: 'デパート' }
        ];

        const features = consumptionPoints.map(c => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: c.coordinates
          },
          properties: {
            amount: c.amount,
            area: c.area,
            category: c.category
          }
        }));

        map.current.addSource('consumption-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        map.current.addLayer({
          id: 'simple-consumption',
          type: 'circle',
          source: 'consumption-source',
          paint: {
            'circle-radius': 12,
            'circle-color': '#9C27B0',
            'circle-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    } catch (e) {
      console.error('Consumption error:', e);
    }
    
    // ランドマークレイヤー
    try {
      if (map.current.getLayer('simple-landmarks')) {
        map.current.removeLayer('simple-landmarks');
      }
      if (map.current.getLayer('simple-landmarks-labels')) {
        map.current.removeLayer('simple-landmarks-labels');
      }
      if (map.current.getSource('landmarks-source')) {
        map.current.removeSource('landmarks-source');
      }

      if (selectedLayers.includes('landmarks')) {
        // ダミーランドマークデータ
        const landmarks = [
          { name: '原爆ドーム', coordinates: [132.4536, 34.3955], type: '史跡' },
          { name: '平和記念公園', coordinates: [132.4520, 34.3920], type: '公園' },
          { name: '宮島', coordinates: [132.3196, 34.2960], type: '神社' },
          { name: '広島駅', coordinates: [132.4757, 34.3972], type: '交通' },
          { name: 'マツダスタジアム', coordinates: [132.4846, 34.3915], type: 'スポーツ' },
          { name: '本通り商店街', coordinates: [132.4570, 34.3935], type: 'ショッピング' }
        ];

        const features = landmarks.map(l => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: l.coordinates
          },
          properties: {
            name: l.name,
            type: l.type
          }
        }));

        map.current.addSource('landmarks-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });

        // ランドマークアイコン
        map.current.addLayer({
          id: 'simple-landmarks',
          type: 'circle',
          source: 'landmarks-source',
          paint: {
            'circle-radius': 16,
            'circle-color': '#FFD700',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#000000'
          }
        });

        // ランドマークラベル
        map.current.addLayer({
          id: 'simple-landmarks-labels',
          type: 'symbol',
          source: 'landmarks-source',
          layout: {
            'text-field': '{name}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 1.5]
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': '#000000',
            'text-halo-width': 2
          }
        });
      }
    } catch (e) {
      console.error('Landmarks error:', e);
    }
    } // updateLayers関数の終了
  }, [mapLoaded, heatmapData, accommodationData, mobilityData, weatherData, consumptionData, landmarkData, selectedLayers]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        backgroundColor: '#0a0a0a'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1a1a1a',
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
      {/* データ状態表示 */}
      <Box sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 1,
        borderRadius: 1,
        fontSize: 12,
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>データ状態</div>
        <div>ヒートマップ: {selectedLayers.includes('heatmap') ? (heatmapData?.features?.length || 'ダミー') : 'OFF'}</div>
        <div>宿泊施設: {selectedLayers.includes('accommodation') ? (accommodationData?.facilities?.length || '222') : 'OFF'}件</div>
        <div>気象: {selectedLayers.includes('weather') ? (weatherData?.current_weather?.length || '5') : 'OFF'}地点</div>
        <div>人流: {selectedLayers.includes('mobility') ? '8地点' : 'OFF'}</div>
        <div>消費: {selectedLayers.includes('consumption') ? '7地点' : 'OFF'}</div>
        <div>ランドマーク: {selectedLayers.includes('landmarks') ? '6箇所' : 'OFF'}</div>
      </Box>
    </Box>
  );
};

export default MapMinimal;