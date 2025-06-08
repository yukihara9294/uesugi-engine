/**
 * Uesugi Engine - マップコンポーネント（拡張版）
 * 3D表示と高度なデータ可視化を実装
 */

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, CircularProgress, Typography } from '@mui/material';
import { 
  generateAllPrefectureData,
  getHiroshimaPrefectureBounds,
  TRANSPORTATION_ROUTES 
} from '../../utils/hiroshimaPrefectureDataGenerator';

// Mapbox access token from environment variable
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoieXVraWhhcmE5Mjk0IiwiYSI6ImNtYmh1MG1kbTAxOHYyanBseWMyYzU0bzgifQ.qXWlSlsfZfHWKWJ1JPdvOg';
console.log('Mapbox token loaded:', MAPBOX_TOKEN ? 'Token present' : 'No token');
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapEnhancedFixed = ({ 
  viewport,
  onViewportChange,
  heatmapData,
  weatherData,
  mobilityData,
  accommodationData,
  consumptionData,
  landmarkData,
  eventData,
  selectedLayers,
  selectedCategories,
  loading,
  onError,
  leftSidebarOpen,
  rightSidebarOpen 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const animationFrame = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [layersInitialized, setLayersInitialized] = useState(false);
  const layersInitializedRef = useRef(false);
  const layerRegistry = useRef({});
  
  // Store generated data to prevent regeneration on toggle
  const dataCache = useRef({
    heatmapData: null,
    landmarksData: null,
    accommodationData: null,
    consumptionData: null,
    mobilityData: null,
    eventsData: null,
    prefectureData: null
  });
  
  // Generate prefecture data once
  if (!dataCache.current.prefectureData) {
    console.log('Generating prefecture data...');
    dataCache.current.prefectureData = generateAllPrefectureData();
    console.log('Prefecture data generated:', dataCache.current.prefectureData);
  }

  // カラーパレット
  const colors = {
    landmarks: '#FFD700',
    accommodation: '#4CAF50',
    consumption: '#FF69B4',
    mobility: '#00FFFF',
    events: '#FF6B6B',
    heatmap: '#FF5722'
  };

  // レイヤー管理用のヘルパー関数
  const registerLayer = (layerId, layerType) => {
    layerRegistry.current[layerId] = { id: layerId, type: layerType };
  };

  const toggleLayerVisibility = (layerId, visible) => {
    console.log(`toggleLayerVisibility called for ${layerId}, visible: ${visible}`);
    if (map.current && map.current.getLayer(layerId)) {
      console.log(`Setting ${layerId} visibility to ${visible ? 'visible' : 'none'}`);
      map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    } else {
      console.warn(`Layer ${layerId} not found on map`);
    }
  };

  const isLayerVisible = (layerType) => {
    return selectedLayers.includes(layerType);
  };

  // SNS感情分析レイヤーの初期化
  const initializeHeatmapLayers = () => {
    // Use prefecture data
    const heatmapPoints = dataCache.current.prefectureData.heatmap;
    
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
      layout: {
        visibility: 'none'
      },
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
        'heatmap-opacity': 0.85
      }
    });
    registerLayer('cyber-heatmap', 'heatmap');

    // パーティクルエフェクト
    map.current.addLayer({
      id: 'cyber-particles',
      type: 'circle',
      source: 'heatmap-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': 2,
        'circle-color': [
          'match',
          ['get', 'category'],
          '観光', '#00FFFF',
          'グルメ', '#FF00FF',
          'ショッピング', '#FFFF00',
          'イベント', '#00FF00',
          '交通', '#FF0080',
          '#FFFFFF'
        ],
        'circle-opacity': 0.8,
        'circle-blur': 0.5
      }
    });
    registerLayer('cyber-particles', 'heatmap');
  };

  // ランドマークレイヤーの初期化
  const initializeLandmarkLayers = () => {
    const landmarks = dataCache.current.prefectureData.landmarks;

    // ポイントソース
    map.current.addSource('landmarks-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: landmarks.map(l => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: l.coordinates },
          properties: { name: l.name, height: l.height }
        }))
      }
    });

    // 3Dランドマーク用のソース
    const buildingFeatures = landmarks.map(l => {
      const size = 0.0006; // Slightly smaller for prefecture scale
      const coords = l.coordinates;
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [coords[0] - size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] - size/2]
          ]]
        },
        properties: {
          name: l.name,
          height: l.height * 3,
          base_height: 0,
          color: colors.landmarks
        }
      };
    });

    map.current.addSource('landmarks-buildings-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: buildingFeatures }
    });

    // 3D建物レイヤー
    map.current.addLayer({
      id: 'landmarks-3d',
      type: 'fill-extrusion',
      source: 'landmarks-buildings-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9
      }
    });
    registerLayer('landmarks-3d', 'landmarks');

    // ラベルレイヤー
    map.current.addLayer({
      id: 'landmarks-labels',
      type: 'symbol',
      source: 'landmarks-source',
      layout: {
        visibility: 'none',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-offset': [0, -2],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': colors.landmarks,
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });
    registerLayer('landmarks-labels', 'landmarks');
  };

  // 宿泊施設レイヤーの初期化
  const initializeAccommodationLayers = () => {
    const accommodations = dataCache.current.prefectureData.accommodation;

    const accommodationFeatures = accommodations.map(a => {
      const size = 0.0002; // Smaller for prefecture scale
      const coords = a.coordinates;
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [coords[0] - size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] - size/2]
          ]]
        },
        properties: {
          name: a.name,
          height: 10 + a.occupancy * 50, // Taller buildings for visibility
          base_height: 0,
          occupancy: a.occupancy,
          color: colors.accommodation
        }
      };
    });

    map.current.addSource('accommodation-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: accommodationFeatures }
    });

    // 3D棒グラフ
    map.current.addLayer({
      id: 'accommodation-3d',
      type: 'fill-extrusion',
      source: 'accommodation-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': colors.accommodation,
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
    registerLayer('accommodation-3d', 'accommodation');
  };

  // 消費データレイヤーの初期化
  const initializeConsumptionLayers = () => {
    const consumptionData = dataCache.current.prefectureData.consumption;

    const consumptionFeatures = consumptionData.map(c => {
      const size = 0.0003; // Adjusted for prefecture scale
      const coords = c.coordinates;
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [coords[0] - size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] - size/2],
            [coords[0] + size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] + size/2],
            [coords[0] - size/2, coords[1] - size/2]
          ]]
        },
        properties: {
          amount: c.amount,
          category: c.category,
          height: Math.sqrt(c.amount) / 50, // Adjusted for larger amounts
          color: colors.consumption
        }
      };
    });

    map.current.addSource('consumption-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: consumptionFeatures }
    });

    // 3D棒グラフ（縦方向）
    map.current.addLayer({
      id: 'consumption-3d',
      type: 'fill-extrusion',
      source: 'consumption-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': colors.consumption,
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
    registerLayer('consumption-3d', 'consumption');
  };

  // 人流データレイヤーの初期化
  const initializeMobilityLayers = () => {
    // Use prefecture mobility data
    const mobilityData = dataCache.current.prefectureData.mobility;
    const roadFlows = mobilityData.routes;

    const getCongestionColor = (congestion) => {
      if (congestion >= 0.8) return '#FF0000';
      if (congestion >= 0.5) return '#FFFF00';
      return '#00FF00';
    };
    
    // Add congestion points
    const congestionFeatures = mobilityData.congestionPoints.map((point, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.coordinates
      },
      properties: {
        level: point.level,
        radius: point.radius * 1000, // Convert to meters for visualization
        type: point.type,
        name: point.name,
        color: getCongestionColor(point.level)
      }
    }));
    
    map.current.addSource('mobility-congestion-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: congestionFeatures }
    });
    
    // Congestion areas visualization
    map.current.addLayer({
      id: 'mobility-congestion',
      type: 'circle',
      source: 'mobility-congestion-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': {
          property: 'radius',
          type: 'identity'
        },
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.3,
        'circle-blur': 0.8
      }
    });
    registerLayer('mobility-congestion', 'mobility');

    const roadFeatures = roadFlows.map((flow, i) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: flow.points || flow.route
      },
      properties: {
        congestion: flow.congestion,
        color: getCongestionColor(flow.congestion),
        name: flow.name,
        type: flow.type,
        flow_speed: flow.flow_speed,
        id: flow.id || i
      }
    }));

    map.current.addSource('mobility-roads-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: roadFeatures }
    });

    // 道路のグロー効果
    map.current.addLayer({
      id: 'mobility-roads-glow',
      type: 'line',
      source: 'mobility-roads-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 20,
        'line-opacity': 0.3,
        'line-blur': 10
      }
    });
    registerLayer('mobility-roads-glow', 'mobility');

    // 道路のメインライン
    map.current.addLayer({
      id: 'mobility-roads',
      type: 'line',
      source: 'mobility-roads-source',
      layout: {
        visibility: 'none',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 6,
        'line-opacity': 0.8
      }
    });
    registerLayer('mobility-roads', 'mobility');

    // パーティクル用の空ソース
    map.current.addSource('mobility-road-particles-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.current.addLayer({
      id: 'mobility-road-particles',
      type: 'circle',
      source: 'mobility-road-particles-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': 3,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.8,
        'circle-blur': 0.5
      }
    });
    registerLayer('mobility-road-particles', 'mobility');

    // アニメーション開始
    startMobilityAnimation(roadFlows, getCongestionColor);
  };

  // 人流アニメーション
  const startMobilityAnimation = (roadFlows, getCongestionColor) => {
    let particleOffset = 0;
    
    const animate = () => {
      if (!map.current || !isLayerVisible('mobility')) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }

      particleOffset = (particleOffset + 1) % 100;
      
      const roadParticles = [];
      roadFlows.forEach((flow, flowIndex) => {
        const route = flow.points || flow.route;
        const routeLength = route.length;
        const particleCount = Math.floor(flow.congestion * 10) + 3;
        
        for (let i = 0; i < particleCount; i++) {
          const progress = ((particleOffset + i * (100 / particleCount)) % 100) / 100;
          const segmentIndex = Math.floor(progress * (routeLength - 1));
          const segmentProgress = (progress * (routeLength - 1)) % 1;
          
          if (segmentIndex < routeLength - 1) {
            const start = route[segmentIndex];
            const end = route[segmentIndex + 1];
            const lng = start[0] + (end[0] - start[0]) * segmentProgress;
            const lat = start[1] + (end[1] - start[1]) * segmentProgress;
            
            roadParticles.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: {
                flowId: flow.id || flowIndex,
                congestion: flow.congestion,
                color: getCongestionColor(flow.congestion),
                type: flow.type
              }
            });
          }
        }
      });

      if (map.current.getSource('mobility-road-particles-source')) {
        map.current.getSource('mobility-road-particles-source').setData({
          type: 'FeatureCollection',
          features: roadParticles
        });
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // イベントレイヤーの初期化
  const initializeEventLayers = () => {
    const events = dataCache.current.prefectureData.events;

    // イベントポイント
    map.current.addSource('events-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: events.map(e => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: e.coordinates },
          properties: { 
            name: e.name,
            category: e.category,
            icon: e.icon
          }
        }))
      }
    });

    // イベント影響範囲
    const impactFeatures = events.map(e => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: e.coordinates },
      properties: { radius: e.impact_radius }
    }));

    map.current.addSource('events-impact-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: impactFeatures }
    });

    // 影響範囲の表示
    map.current.addLayer({
      id: 'events-impact',
      type: 'circle',
      source: 'events-impact-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': {
          property: 'radius',
          type: 'identity'
        },
        'circle-color': colors.events,
        'circle-opacity': 0.2
      }
    });
    registerLayer('events-impact', 'events');

    // イベントラベル
    map.current.addLayer({
      id: 'events-labels',
      type: 'symbol',
      source: 'events-source',
      layout: {
        visibility: 'none',
        'text-field': ['get', 'icon'],
        'text-size': 24,
        'text-allow-overlap': true
      }
    });
    registerLayer('events-labels', 'events');
  };

  // 全レイヤーの初期化（一度だけ実行）
  const initializeAllLayers = () => {
    console.log('initializeAllLayers called');
    console.log('map.current:', map.current);
    console.log('isStyleLoaded:', map.current ? map.current.isStyleLoaded() : 'no map');
    
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for layers, returning');
      return;
    }

    console.log('Initializing all layers...');
    console.log('Current layerRegistry before init:', layerRegistry.current);

    // SNS感情分析レイヤーの初期化
    initializeHeatmapLayers();
    
    // ランドマークレイヤーの初期化
    initializeLandmarkLayers();
    
    // 宿泊施設レイヤーの初期化
    initializeAccommodationLayers();
    
    // 消費データレイヤーの初期化
    initializeConsumptionLayers();
    
    // 人流データレイヤーの初期化
    initializeMobilityLayers();
    
    // イベントレイヤーの初期化
    initializeEventLayers();
    
    console.log('All layers initialized');
    console.log('Final layerRegistry:', layerRegistry.current);
    
    // レイヤーが実際に追加されたか確認
    const layerIds = Object.keys(layerRegistry.current);
    console.log('Checking if layers exist on map:');
    layerIds.forEach(layerId => {
      const exists = map.current && map.current.getLayer(layerId);
      console.log(`  ${layerId}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
  };

  // 地図の初期化
  useEffect(() => {
    console.log('Map useEffect triggered, loading:', loading);
    
    // ローディング中はマップを初期化しない
    if (loading) {
      console.log('Still loading, skipping map initialization');
      return;
    }

    console.log('Loading complete, initializing map...');
    
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'YOUR_MAPBOX_TOKEN_HERE') {
      console.error('Mapbox access token is not set or is invalid');
      onError?.(new Error('Mapbox access token is not set. Please add REACT_APP_MAPBOX_ACCESS_TOKEN to your .env file'));
      return;
    }

    let isMounted = true;

    const waitForContainer = () => {
      const container = document.getElementById('map-container-fixed');
      if (!container) {
        console.error('Map container not found');
        if (isMounted && retryCount < 10) {
          setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
              waitForContainer();
            }
          }, 100);
        }
        return;
      }
      
      console.log('Map container found, dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      return container;
    };

    const loadMapbox = () => {
      if (map.current) {
        console.log('Map already initialized');
        return;
      }

      const container = waitForContainer();
      if (!container || !isMounted) return;

      console.log('Initializing Mapbox with viewport:', viewport);

      try {
        // Use prefecture bounds for initial viewport
        const bounds = dataCache.current.prefectureData.bounds;
        const initialCenter = viewport.longitude && viewport.latitude ? 
          [viewport.longitude, viewport.latitude] : bounds.center;
        const initialZoom = viewport.zoom || bounds.defaultZoom;
        
        map.current = new mapboxgl.Map({
          container: container,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: initialCenter,
          zoom: initialZoom,
          pitch: 45,
          bearing: -17.6,
          antialias: true,
          preserveDrawingBuffer: true,
          trackResize: true,
          maxBounds: [[bounds.west - 0.5, bounds.south - 0.5], [bounds.east + 0.5, bounds.north + 0.5]]
        });

        map.current.on('load', () => {
          if (!isMounted) return;
          
          console.log('Map loaded successfully');
          
          // 3D地形を有効化
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          // 3D建物レイヤーを追加
          const layers = map.current.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
          )?.id;

          try {
            map.current.addLayer({
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#333',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            }, labelLayerId);
          } catch (e) {
            console.warn('Could not add 3D buildings:', e);
          }
          
          setMapLoaded(true);
          console.log('Map loaded state set to true');
          
          // Wait for style to be fully loaded before initializing layers
          const initializeLayers = () => {
            console.log('Checking if style is loaded...');
            if (map.current && map.current.isStyleLoaded()) {
              console.log('Style is loaded, initializing layers');
              if (!layersInitializedRef.current) {
                console.log('Calling initializeAllLayers');
                initializeAllLayers();
                layersInitializedRef.current = true;
                setLayersInitialized(true);
                console.log('Layers initialized successfully');
              } else {
                console.log('Layers already initialized');
              }
            } else {
              console.log('Style not loaded yet, retrying in 100ms...');
              setTimeout(initializeLayers, 100);
            }
          };
          
          // Start checking for style load
          initializeLayers();
        });

        // Also listen for styledata event which fires when style is fully loaded
        map.current.on('styledata', () => {
          console.log('Style data loaded event fired');
          if (!layersInitializedRef.current && map.current && map.current.isStyleLoaded()) {
            console.log('Initializing layers from styledata event');
            initializeAllLayers();
            layersInitializedRef.current = true;
            setLayersInitialized(true);
          }
        });

        map.current.on('error', (e) => {
          // 既知のエラーは無視
          if (e.error && e.error.message && e.error.message.includes('sub')) {
            return;
          }
          console.warn('Map error:', e);
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        if (isMounted) {
          setRetryCount(prev => prev + 1);
          if (retryCount < 5) {
            setTimeout(() => {
              if (isMounted) loadMapbox();
            }, 1000);
          }
        }
      }
    };

    // 即座に初期化を試みる
    loadMapbox();

    return () => {
      isMounted = false;
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
        setLayersInitialized(false);
      }
    };
  }, [loading]); // loading状態が変わったときのみ再実行

  // レイヤー表示更新（データのみ更新、表示/非表示の切り替え）
  useEffect(() => {
    console.log('Layer visibility update effect triggered');
    console.log('mapLoaded:', mapLoaded, 'layersInitialized:', layersInitialized);
    console.log('selectedLayers:', selectedLayers);
    console.log('layerRegistry:', layerRegistry.current);
    
    if (!mapLoaded || !map.current || !layersInitialized) {
      console.log('Skipping layer visibility update - not ready');
      return;
    }

    // 各レイヤータイプに属するレイヤーの表示/非表示を切り替え
    Object.entries(layerRegistry.current).forEach(([layerId, layerInfo]) => {
      const shouldBeVisible = selectedLayers.includes(layerInfo.type);
      
      // SNSレイヤーの場合は、カテゴリも確認
      if (layerInfo.type === 'heatmap') {
        toggleLayerVisibility(layerId, shouldBeVisible && selectedCategories.length > 0);
      } else {
        toggleLayerVisibility(layerId, shouldBeVisible);
      }
    });

    // データ更新が必要な場合はここで行う
    updateLayerData();
  }, [selectedLayers, selectedCategories, mapLoaded, layersInitialized]);

  // レイヤーデータの更新（必要に応じて）
  const updateLayerData = () => {
    // SNSデータのカテゴリフィルタリング更新
    if (selectedLayers.includes('heatmap') && selectedCategories.length > 0) {
      updateHeatmapData();
    }
  };

  // SNSデータの更新
  const updateHeatmapData = () => {
    if (!map.current || !map.current.getSource('heatmap-source')) return;

    // Make sure we have cached data
    if (!dataCache.current.heatmapData) {
      console.warn('No cached heatmap data available');
      return;
    }

    // Use cached data and filter by selected categories
    const heatmapData = dataCache.current.prefectureData.heatmap;
    const filteredPoints = heatmapData.filter(point => 
      selectedCategories.includes(point.category)
    );
    
    const features = filteredPoints.map(p => ({
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

    map.current.getSource('heatmap-source').setData({
      type: 'FeatureCollection',
      features
    });
  };

  // ビューポート変更の処理
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.on('move', () => {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      onViewportChange({
        latitude: center.lat,
        longitude: center.lng,
        zoom: zoom,
      });
    });
  }, [mapLoaded, onViewportChange]);

  // マップコンテナのリサイズ処理
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleResize = () => {
      map.current.resize();
    };

    window.addEventListener('resize', handleResize);
    
    // Trigger resize after a short delay to handle sidebar transitions
    const resizeTimer = setTimeout(() => {
      if (map.current) {
        map.current.resize();
      }
    }, 350); // Slightly longer than transition duration
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [mapLoaded, selectedLayers]); // Also resize when layers change (which happens with sidebar toggle)

  // Trigger map resize when sidebars toggle
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Trigger resize after sidebar animation completes
    const resizeTimer = setTimeout(() => {
      if (map.current) {
        console.log('Triggering map resize after sidebar toggle');
        map.current.resize();
      }
    }, 350); // Match sidebar transition duration
    
    return () => clearTimeout(resizeTimer);
  }, [leftSidebarOpen, rightSidebarOpen, mapLoaded]); // Resize when sidebars open/close

  return (
    <Box 
      id="map-container-fixed"
      sx={{ 
        position: 'relative',
        width: '100%', 
        height: '100%',
        background: '#000'
      }}
    >
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          textAlign: 'center',
          color: 'white'
        }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            地図を読み込んでいます...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapEnhancedFixed;