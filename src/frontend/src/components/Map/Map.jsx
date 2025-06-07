/**
 * 地図コンポーネント（Mapbox GL JS使用）
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import CyberFlowLayer from './CyberFlowLayer';

const Map = ({ 
  viewport, 
  onViewportChange, 
  heatmapData, 
  weatherData,
  mobilityData,
  selectedLayers, 
  selectedCategories,
  loading,
  onError 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxError, setMapboxError] = useState(null);

  // Mapboxの初期化
  useEffect(() => {
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    console.log('Mapbox Token available:', !!MAPBOX_TOKEN);
    console.log('Token length:', MAPBOX_TOKEN?.length);
    
    if (!MAPBOX_TOKEN) {
      setMapboxError('Mapboxアクセストークンが設定されていません');
      return;
    }

    // アクセストークンをグローバルに保存
    window.MAPBOX_ACCESS_TOKEN = MAPBOX_TOKEN;
    
    // 既にMapboxが読み込まれているかチェック
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      try {
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 45,
          bearing: 0,
          antialias: true
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          console.log('Mapbox map loaded successfully');
          
          // サイバーチックなスタイリングを追加
          setTimeout(() => {
            try {
              // 道路を光らせる
              ['road-primary', 'road-secondary-tertiary', 'road-street', 'road-street-low'].forEach(layer => {
                if (map.current.getLayer(layer)) {
                  map.current.setPaintProperty(layer, 'line-color', '#00ccff');
                  map.current.setPaintProperty(layer, 'line-opacity', 0.8);
                }
              });
              
              // 建物を暗くする
              if (map.current.getLayer('building')) {
                map.current.setPaintProperty('building', 'fill-color', '#0a0a0a');
                map.current.setPaintProperty('building', 'fill-opacity', 0.8);
              }
              
              // 背景を暗くする
              if (map.current.getLayer('background')) {
                map.current.setPaintProperty('background', 'background-color', '#000000');
              }
            } catch (e) {
              console.log('Custom styling applied partially:', e);
            }
          }, 1000);
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

        map.current.on('error', (error) => {
          console.error('Mapbox error:', error);
          // 特定のエラーは無視
          if (error.error && error.error.message) {
            const msg = error.error.message;
            if (msg.includes('already a source') || 
                msg.includes('does not exist') ||
                msg.includes('Cannot read properties')) {
              return;
            }
          }
          // Wtエラーも無視（Mapbox内部エラー）
          if (error.toString && error.toString().includes('Wt')) {
            return;
          }
          // マップが正常に動作している場合はエラーを表示しない
          if (map.current && map.current.loaded()) {
            return;
          }
          setMapboxError('地図の読み込みでエラーが発生しました');
        });

      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
        setMapboxError('地図の初期化に失敗しました');
      }
      
      return;
    }

    // Mapbox GL JSを動的にロード
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      try {
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 45,
          bearing: 0
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          console.log('Mapbox map loaded successfully');
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

        map.current.on('error', (error) => {
          console.error('Mapbox error:', error);
          // 特定のエラーは無視
          if (error.error && error.error.message) {
            const msg = error.error.message;
            if (msg.includes('already a source') || 
                msg.includes('does not exist') ||
                msg.includes('Cannot read properties')) {
              return;
            }
          }
          // Wtエラーも無視（Mapbox内部エラー）
          if (error.toString && error.toString().includes('Wt')) {
            return;
          }
          // マップが正常に動作している場合はエラーを表示しない
          if (map.current && map.current.loaded()) {
            return;
          }
          setMapboxError('地図の読み込みでエラーが発生しました');
        });

      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
        setMapboxError('地図の初期化に失敗しました');
      }
    };

    script.onerror = () => {
      setMapboxError('Mapbox GLライブラリの読み込みに失敗しました');
    };

    document.head.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // ヒートマップデータの更新
  useEffect(() => {
    if (!mapLoaded || !map.current || !heatmapData) return;

    try {
      // 既存のレイヤーとソースを削除
      if (map.current.getLayer('heatmap-points')) {
        map.current.removeLayer('heatmap-points');
      }
      if (map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer');
      }
      if (map.current.getSource('heatmap-data')) {
        map.current.removeSource('heatmap-data');
      }

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
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ]
        }
      });

      // ポイントレイヤーを追加（高ズーム時）
      map.current.addLayer({
        id: 'heatmap-points',
        type: 'circle',
        source: 'heatmap-data',
        minzoom: 12,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 3,
            1, 8
          ],
          'circle-color': [
            'case',
            ['>=', ['get', 'sentiment_score'], 0.3], '#4CAF50',
            ['<=', ['get', 'sentiment_score'], -0.3], '#F44336',
            '#FF9800'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      console.log(`Heatmap updated with ${heatmapData.features?.length || 0} points`);
      
    } catch (error) {
      console.error('Failed to update heatmap:', error);
      if (onError) onError(error);
    }
  }, [mapLoaded, heatmapData, selectedCategories]);

  // 気象データの表示
  useEffect(() => {
    if (!mapLoaded || !map.current || !weatherData || !selectedLayers.includes('weather')) return;

    try {
      // 既存の気象レイヤーを削除
      if (map.current.getLayer('weather-layer')) {
        map.current.removeLayer('weather-layer');
      }
      if (map.current.getSource('weather-data')) {
        map.current.removeSource('weather-data');
      }

      // 気象データをGeoJSONに変換
      const weatherGeoJSON = {
        type: 'FeatureCollection',
        features: weatherData.current_weather?.map(weather => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [weather.longitude, weather.latitude]
          },
          properties: {
            temperature: weather.temperature,
            condition: weather.weather_condition,
            landmark: weather.landmark_name
          }
        })) || []
      };

      map.current.addSource('weather-data', {
        type: 'geojson',
        data: weatherGeoJSON
      });

      map.current.addLayer({
        id: 'weather-layer',
        type: 'symbol',
        source: 'weather-data',
        layout: {
          'text-field': ['concat', ['get', 'temperature'], '°C'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, -2]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

    } catch (error) {
      console.error('Failed to update weather layer:', error);
    }
  }, [mapLoaded, weatherData, selectedLayers]);

  if (mapboxError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%' 
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {mapboxError}
          <br />
          <small>
            .envファイルでREACT_APP_MAPBOX_ACCESS_TOKENを設定してください
          </small>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      
      {(loading || !mapLoaded) && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: 2,
          borderRadius: 1
        }}>
          <CircularProgress size={24} color="primary" />
          <span>{loading ? 'データ読み込み中...' : '地図初期化中...'}</span>
        </Box>
      )}
      
      {/* サイバー人流レイヤー */}
      {mapLoaded && map.current && (
        <CyberFlowLayer 
          map={map.current} 
          mobilityData={mobilityData}
          visible={selectedLayers.includes('mobility')}
        />
      )}
    </Box>
  );
};

export default Map;