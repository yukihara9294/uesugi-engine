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
  selectedLayers, 
  selectedCategories,
  loading 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 既に初期化済みの場合はスキップ
    if (map.current) return;

    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
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
      if (window.mapboxgl) {
        initMap();
      } else if (retryCount < 5) {
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          setTimeout(initMap, 500); // 十分な待機時間
        };
        script.onerror = () => {
          setRetryCount(prev => prev + 1);
          setTimeout(loadMapbox, 1000);
        };
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      if (!mapContainer.current || map.current) return;

      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN;
        
        // フォントを含む完全なスタイル定義
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {},
            layers: [{
              id: 'background',
              type: 'background',
              paint: { 'background-color': '#0a0a0a' }
            }],
            glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf' // フォント追加
          },
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
          // 既知のエラーは無視
          if (e.error?.message?.includes('sub')) return;
          console.warn('Map error:', e.error?.message || e.message);
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
  }, [viewport.longitude, viewport.latitude, viewport.zoom, retryCount]);

  // シンプルなデータ表示
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // ヒートマップのみ実装（最もシンプル）
    if (heatmapData && selectedLayers.includes('heatmap')) {
      try {
        // 既存のレイヤーを削除
        if (map.current.getLayer('simple-heatmap')) {
          map.current.removeLayer('simple-heatmap');
        }
        if (map.current.getSource('heatmap-source')) {
          map.current.removeSource('heatmap-source');
        }

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
      } catch (e) {
        console.error('Heatmap error:', e);
      }
    }

    // 宿泊施設をシンプルな点で表示
    if (accommodationData && selectedLayers.includes('accommodation')) {
      try {
        if (map.current.getLayer('simple-accommodation')) {
          map.current.removeLayer('simple-accommodation');
        }
        if (map.current.getSource('accommodation-source')) {
          map.current.removeSource('accommodation-source');
        }

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
      } catch (e) {
        console.error('Accommodation error:', e);
      }
    }

  }, [mapLoaded, heatmapData, accommodationData, selectedLayers]);

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
      ref={mapContainer} 
      sx={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#0a0a0a',
        position: 'relative'
      }} 
    >
      {/* データ状態表示 */}
      <Box sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 1,
        borderRadius: 1,
        fontSize: 12
      }}>
        <div>ヒートマップ: {heatmapData?.features?.length || 0}点</div>
        <div>宿泊施設: {accommodationData?.facilities?.length || 0}件</div>
        <div>気象: {weatherData?.current_weather?.length || 0}地点</div>
      </Box>
    </Box>
  );
};

export default MapMinimal;