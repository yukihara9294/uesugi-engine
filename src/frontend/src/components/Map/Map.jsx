/**
 * 地図コンポーネント（Mapbox GL JS使用）
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
import MapErrorBoundary from './MapErrorBoundary';
import MapSimple from './MapSimple';

const Map = ({ 
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
  const errorCountRef = useRef({});

  // Mapboxの初期化
  useEffect(() => {
    // 初期化フラグチェック
    let isInitialized = false;
    
    const initMap = async () => {
      // 既にマップが初期化されている場合はスキップ
      if (map.current || isInitialized) return;
      isInitialized = true;
      
      const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      console.log('Mapbox Token available:', !!MAPBOX_TOKEN);
      console.log('Token length:', MAPBOX_TOKEN?.length);
      
      if (!MAPBOX_TOKEN) {
        setMapboxError('Mapboxアクセストークンが設定されていません');
        return;
      }

      // アクセストークンをグローバルに保存
      window.MAPBOX_ACCESS_TOKEN = MAPBOX_TOKEN;
    
    const MAX_ERROR_LOG = 3; // 同じエラーは3回までログ出力
    
    // グローバルエラーハンドラーを設定（Mapbox内部エラーをキャッチ）
    const handleGlobalError = (event) => {
      try {
        // エラーメッセージの安全な取得
        const errorMessage = event?.error?.message || event?.message || '';
        
        // Mapbox内部エラーのパターンをチェック
        if (errorMessage.includes("Cannot read properties of undefined (reading 'sub')") ||
            errorMessage.includes("handleError") ||
            (event?.filename && event.filename.includes('mapbox-gl'))) {
          
          // エラーの種類でカウント
          const errorKey = errorMessage.substring(0, 50);
          if (!errorCountRef.current[errorKey]) {
            errorCountRef.current[errorKey] = 0;
          }
          errorCountRef.current[errorKey]++;
          
          // 最初の数回だけログ出力
          if (errorCountRef.current[errorKey] <= MAX_ERROR_LOG) {
            console.warn(`Caught Mapbox internal error (${errorCountRef.current[errorKey]}/${MAX_ERROR_LOG}):`, errorMessage.substring(0, 100) + '...');
          } else if (errorCountRef.current[errorKey] === MAX_ERROR_LOG + 1) {
            console.warn('Suppressing further Mapbox internal errors of this type...');
          }
          
          event.preventDefault(); // エラーの伝播を防ぐ
          return;
        }
        
        // スタックトレースもチェック
        const stack = event?.error?.stack || '';
        if (stack.includes('mapbox-gl') && stack.includes('handleError')) {
          event.preventDefault();
        }
      } catch (e) {
        // エラーハンドラー自体でのエラーは無視
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    // クリーンアップ時にイベントリスナーを削除
    const cleanup = () => {
      window.removeEventListener('error', handleGlobalError);
    };
    
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
          
          // エラーオブジェクトの存在チェック
          if (!error) return;
          
          // 特定のエラーは無視
          try {
            // error.error.messageの安全なアクセス
            const errorMessage = error?.error?.message || '';
            if (errorMessage && (
                errorMessage.includes('already a source') || 
                errorMessage.includes('does not exist') ||
                errorMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // error.messageの直接チェック
            const directMessage = error?.message || '';
            if (directMessage && (
                directMessage.includes('already a source') || 
                directMessage.includes('does not exist') ||
                directMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // toString()の安全な呼び出し
            const errorString = typeof error.toString === 'function' ? error.toString() : String(error);
            if (errorString.includes('Wt') || errorString.includes('Cannot read properties')) {
              return;
            }
          } catch (e) {
            // エラーオブジェクトへのアクセス中のエラーは無視
            console.warn('Error while processing Mapbox error:', e);
            return;
          }
          
          // マップが正常に動作している場合はエラーを表示しない
          if (map.current && typeof map.current.loaded === 'function' && map.current.loaded()) {
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
    // 既存のマップがある場合はクリーンアップ
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Mapbox GL JSが既にロードされている場合
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      try {
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {},
            layers: [
              {
                id: 'background',
                type: 'background',
                paint: {
                  'background-color': '#0a0a0a'
                }
              }
            ]
          },
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 45,
          bearing: 0,
          // パフォーマンス最適化
          antialias: true,
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          maxTileCacheSize: 50,
          trackResize: false,
          renderWorldCopies: false
        });

        map.current.on('load', () => {
          // 広島県の境界線を追加
          map.current.addSource('hiroshima-boundary', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [131.5, 33.8],
                  [133.5, 33.8],
                  [133.5, 35.0],
                  [131.5, 35.0],
                  [131.5, 33.8]
                ]]
              }
            }
          });

          map.current.addLayer({
            id: 'hiroshima-boundary-line',
            type: 'line',
            source: 'hiroshima-boundary',
            paint: {
              'line-color': '#667eea',
              'line-width': 2,
              'line-opacity': 0.3
            }
          });

          // 少し遅延を入れてからロード完了とする
          setTimeout(() => {
            setMapLoaded(true);
            console.log('Mapbox map loaded successfully');
          }, 100);
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
          
          // エラーオブジェクトの存在チェック
          if (!error) return;
          
          // 特定のエラーは無視
          try {
            // error.error.messageの安全なアクセス
            const errorMessage = error?.error?.message || '';
            if (errorMessage && (
                errorMessage.includes('already a source') || 
                errorMessage.includes('does not exist') ||
                errorMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // error.messageの直接チェック
            const directMessage = error?.message || '';
            if (directMessage && (
                directMessage.includes('already a source') || 
                directMessage.includes('does not exist') ||
                directMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // toString()の安全な呼び出し
            const errorString = typeof error.toString === 'function' ? error.toString() : String(error);
            if (errorString.includes('Wt') || errorString.includes('Cannot read properties')) {
              return;
            }
          } catch (e) {
            // エラーオブジェクトへのアクセス中のエラーは無視
            console.warn('Error while processing Mapbox error:', e);
            return;
          }
          
          // マップが正常に動作している場合はエラーを表示しない
          if (map.current && typeof map.current.loaded === 'function' && map.current.loaded()) {
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
    
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      // 既に破棄されている場合はスキップ
      if (!mapContainer.current) return;
      
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      try {
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {},
            layers: [
              {
                id: 'background',
                type: 'background',
                paint: {
                  'background-color': '#0a0a0a'
                }
              }
            ]
          },
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          pitch: 45,
          bearing: 0,
          // パフォーマンス最適化
          antialias: true,
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          maxTileCacheSize: 50,
          trackResize: false,
          renderWorldCopies: false
        });

        map.current.on('load', () => {
          // 広島県の境界線を追加
          map.current.addSource('hiroshima-boundary', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [131.5, 33.8],
                  [133.5, 33.8],
                  [133.5, 35.0],
                  [131.5, 35.0],
                  [131.5, 33.8]
                ]]
              }
            }
          });

          map.current.addLayer({
            id: 'hiroshima-boundary-line',
            type: 'line',
            source: 'hiroshima-boundary',
            paint: {
              'line-color': '#667eea',
              'line-width': 2,
              'line-opacity': 0.3
            }
          });

          // 少し遅延を入れてからロード完了とする
          setTimeout(() => {
            setMapLoaded(true);
            console.log('Mapbox map loaded successfully');
          }, 100);
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
          
          // エラーオブジェクトの存在チェック
          if (!error) return;
          
          // 特定のエラーは無視
          try {
            // error.error.messageの安全なアクセス
            const errorMessage = error?.error?.message || '';
            if (errorMessage && (
                errorMessage.includes('already a source') || 
                errorMessage.includes('does not exist') ||
                errorMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // error.messageの直接チェック
            const directMessage = error?.message || '';
            if (directMessage && (
                directMessage.includes('already a source') || 
                directMessage.includes('does not exist') ||
                directMessage.includes('Cannot read properties'))) {
              return;
            }
            
            // toString()の安全な呼び出し
            const errorString = typeof error.toString === 'function' ? error.toString() : String(error);
            if (errorString.includes('Wt') || errorString.includes('Cannot read properties')) {
              return;
            }
          } catch (e) {
            // エラーオブジェクトへのアクセス中のエラーは無視
            console.warn('Error while processing Mapbox error:', e);
            return;
          }
          
          // マップが正常に動作している場合はエラーを表示しない
          if (map.current && typeof map.current.loaded === 'function' && map.current.loaded()) {
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
    
    // 初期化実行
    initMap();
    
    return () => {
      cleanup(); // グローバルエラーハンドラーを削除
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // scriptのクリーンアップは不要（グローバルに1つだけ）
    };
  }, []); // 空の依存配列で初回のみ実行

  // ヒートマップデータの更新
  useEffect(() => {
    if (!mapLoaded || !map.current || !heatmapData) return;
    
    const showHeatmap = selectedLayers.includes('heatmap');

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
            0, 2,  // より強い強度
            15, 5
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
            0, 5,  // より大きな半径
            15, 30
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

      // レイヤーの表示/非表示を設定
      if (map.current.getLayer('heatmap-layer')) {
        map.current.setLayoutProperty('heatmap-layer', 'visibility', showHeatmap ? 'visible' : 'none');
      }
      if (map.current.getLayer('heatmap-points')) {
        map.current.setLayoutProperty('heatmap-points', 'visibility', showHeatmap ? 'visible' : 'none');
      }

      console.log(`Heatmap updated with ${heatmapData.features?.length || 0} points, visible: ${showHeatmap}`);
      
    } catch (error) {
      console.error('Failed to update heatmap:', error);
      if (onError) onError(error);
    }
  }, [mapLoaded, heatmapData, selectedCategories, selectedLayers]);

  // 気象データの表示（WeatherLayerコンポーネントに移行）
  useEffect(() => {
    // WeatherLayerコンポーネントで処理するため、ここでは何もしない
    return;

    try {
      // 既存の気象レイヤーを削除
      if (map.current.getLayer('weather-layer')) {
        map.current.removeLayer('weather-layer');
      }
      if (map.current.getSource('weather-data')) {
        map.current.removeSource('weather-data');
      }

      // 気象データをGeoJSONに変換
      const weatherArray = weatherData.current_weather || weatherData;
      console.log('Weather Layer - weather data structure:', weatherData);
      console.log('Weather Layer - weather array:', weatherArray);
      
      const weatherGeoJSON = {
        type: 'FeatureCollection',
        features: (Array.isArray(weatherArray) ? weatherArray : []).map(weather => ({
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
      console.log('Weather Layer - GeoJSON features:', weatherGeoJSON.features.length);
      console.log('Weather Layer - Sample feature:', weatherGeoJSON.features[0]);

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
      
      console.log('Weather Layer - Layer added successfully');

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
      
      {/* 気象データレイヤー */}
      {console.log('Map - WeatherLayer render check:', { mapLoaded, hasMap: !!map.current, hasWeatherData: !!weatherData, weatherDataStructure: weatherData })}
      {mapLoaded && map.current && weatherData && (
        <WeatherLayer
          map={map.current}
          data={weatherData}
          visible={selectedLayers.includes('weather')}
        />
      )}
      
      {/* 宿泊施設レイヤー（リッチ版） */}
      {console.log('Map - RichAccommodationLayer render check:', { mapLoaded, hasMap: !!map.current, hasAccommodationData: !!accommodationData, accommodationDataStructure: accommodationData })}
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
      
      {/* レイヤー状態表示（デバッグ用） */}
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

// エラーバウンダリーでラップしてエクスポート
const MapWithErrorBoundary = (props) => (
  <MapErrorBoundary>
    <MapSimple {...props} />
  </MapErrorBoundary>
);

export default MapWithErrorBoundary;