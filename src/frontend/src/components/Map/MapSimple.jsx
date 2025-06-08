/**
 * シンプルな地図コンポーネント（エラー回避版）
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import CyberFlowLayer from './CyberFlowLayer';
import RichAccommodationLayer from './RichAccommodationLayer';
import WeatherLayer from './WeatherLayer';
import LandmarkLayer from './LandmarkLayer';
import ConsumptionLayer from './ConsumptionLayer';
import LayerStatus from './LayerStatus';
import HeatmapLegend from './HeatmapLegend';

const MapSimple = ({ 
  viewport, 
  onViewportChange, 
  heatmapData, 
  weatherData,
  mobilityData,
  accommodationData,
  consumptionData,
  selectedLayers, 
  selectedCategories,
  loading,
  onError 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxError, setMapboxError] = useState(null);
  const initialized = useRef(false);

  // Mapboxの初期化（シンプル版）
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE') {
      setMapboxError('Mapboxアクセストークンが設定されていません。.envファイルにMAPBOX_ACCESS_TOKENを設定してください。');
      return;
    }

    // Mapbox GL JSが既にロードされているか確認
    if (!window.mapboxgl) {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        // DOMが準備できるまで少し待つ
        setTimeout(() => initializeMap(MAPBOX_TOKEN), 200);
      };
      script.onerror = () => setMapboxError('Mapbox GLの読み込みに失敗しました');
      document.head.appendChild(script);
    } else {
      // 既にMapboxがロードされている場合も少し待つ
      setTimeout(() => initializeMap(MAPBOX_TOKEN), 200);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const initializeMap = (token) => {
    try {
      // コンテナが存在することを確認
      if (!mapContainer.current) {
        console.error('Map container not ready');
        setTimeout(() => initializeMap(token), 100);
        return;
      }
      
      window.mapboxgl.accessToken = token;
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [{
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#0a0a0a' }
          }]
        },
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        pitch: 45,
        bearing: 0
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('move', () => {
        if (onViewportChange) {
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          onViewportChange({
            latitude: center.lat,
            longitude: center.lng,
            zoom: zoom
          });
        }
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapboxError('地図の初期化に失敗しました');
    }
  };

  // ヒートマップデータの更新
  useEffect(() => {
    if (!mapLoaded || !map.current || !heatmapData) return;
    
    const showHeatmap = selectedLayers.includes('heatmap');

    try {
      // 既存のレイヤーとソースを削除
      ['heatmap-points', 'heatmap-layer'].forEach(id => {
        if (map.current.getLayer(id)) map.current.removeLayer(id);
      });
      if (map.current.getSource('heatmap-data')) {
        map.current.removeSource('heatmap-data');
      }

      if (!showHeatmap) return;

      // 新しいデータを追加
      map.current.addSource('heatmap-data', {
        type: 'geojson',
        data: heatmapData
      });

      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-data',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 5],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 5, 15, 30]
        }
      });

      // ポイントレイヤー
      map.current.addLayer({
        id: 'heatmap-points',
        type: 'circle',
        source: 'heatmap-data',
        minzoom: 12,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0, 3, 1, 8],
          'circle-color': [
            'case',
            ['>=', ['get', 'sentiment_score'], 0.3], '#4CAF50',
            ['<=', ['get', 'sentiment_score'], -0.3], '#F44336',
            '#FF9800'
          ],
          'circle-opacity': 0.8
        }
      });
    } catch (error) {
      console.error('Heatmap update error:', error);
    }
  }, [mapLoaded, heatmapData, selectedCategories, selectedLayers]);

  // エラー表示
  if (mapboxError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        backgroundColor: '#0a0a0a'
      }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {mapboxError}
        </Alert>
      </Box>
    );
  }

  // ローディング表示
  if (loading && !mapLoaded) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        backgroundColor: '#0a0a0a'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box 
        ref={mapContainer} 
        sx={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#0a0a0a'
        }} 
      />
      
      {/* 人流レイヤー */}
      {mapLoaded && map.current && mobilityData && (
        <CyberFlowLayer
          map={map.current}
          data={mobilityData}
          visible={selectedLayers.includes('mobility')}
        />
      )}
      
      {/* 気象レイヤー */}
      {mapLoaded && map.current && weatherData && (
        <WeatherLayer
          map={map.current}
          data={weatherData}
          visible={selectedLayers.includes('weather')}
        />
      )}
      
      {/* 宿泊施設レイヤー */}
      {mapLoaded && map.current && accommodationData && (
        <RichAccommodationLayer
          map={map.current}
          data={accommodationData}
          visible={selectedLayers.includes('accommodation')}
        />
      )}
      
      {/* ランドマークレイヤー */}
      {mapLoaded && map.current && (
        <LandmarkLayer
          map={map.current}
          visible={selectedLayers.includes('landmarks')}
        />
      )}
      
      {/* 消費データレイヤー */}
      {mapLoaded && map.current && consumptionData && (
        <ConsumptionLayer
          map={map.current}
          data={consumptionData}
          visible={selectedLayers.includes('consumption')}
        />
      )}
      
      {/* ヒートマップ凡例 */}
      <HeatmapLegend
        visible={selectedLayers.includes('heatmap')}
        selectedCategories={selectedCategories}
      />
      
      {/* レイヤー状態表示 */}
      <LayerStatus
        selectedLayers={selectedLayers}
        heatmapData={heatmapData}
        weatherData={weatherData}
        mobilityData={mobilityData}
        accommodationData={accommodationData}
        consumptionData={consumptionData}
      />
    </Box>
  );
};

export default MapSimple;