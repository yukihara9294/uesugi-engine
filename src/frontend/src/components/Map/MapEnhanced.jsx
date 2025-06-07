/**
 * 拡張版地図コンポーネント
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

const MapEnhanced = ({ 
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
  const animationFrame = useRef(null);
  
  console.log('MapEnhanced component rendered');

  // カラーパレット（Sidebarと統一）
  const colors = {
    landmarks: '#FFD700',
    mobility: '#00FFFF', 
    consumption: '#FF69B4',
    accommodation: '#4CAF50',
    weather: '#FFA500',
    heatmap: '#FF5722'
  };

  useEffect(() => {
    console.log('Map useEffect triggered');
    
    // クリーンアップフラグ
    let isMounted = true;
    
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

    // コンテナの準備を待つ
    const waitForContainer = (callback) => {
      let attempts = 0;
      const checkContainer = () => {
        attempts++;
        console.log(`Checking container... attempt ${attempts}`);
        if (mapContainer.current) {
          console.log('Container is ready!');
          callback();
        } else if (attempts < 20 && isMounted) { // 最大2秒待つ
          setTimeout(checkContainer, 100);
        } else {
          console.error('Container never became ready');
        }
      };
      checkContainer();
    };

    // Mapbox GL JSを読み込み
    const loadMapbox = () => {
      console.log('loadMapbox called, window.mapboxgl:', !!window.mapboxgl);
      if (window.mapboxgl) {
        console.log('mapboxgl already loaded, waiting for container...');
        waitForContainer(initMap);
      } else {
        console.log('Loading mapbox script, retry count:', retryCount);
        
        // 既存のスクリプトタグを確認
        const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          console.log('Mapbox script loaded, window.mapboxgl:', !!window.mapboxgl);
          // スクリプトロード後、コンテナを待つ
          setTimeout(() => {
            if (window.mapboxgl && isMounted) {
              console.log('Mapbox loaded, waiting for container...');
              waitForContainer(initMap);
            } else if (!window.mapboxgl) {
              console.log('Mapbox still not available, retrying...');
              setRetryCount(prev => prev + 1);
              if (retryCount < 5 && isMounted) {
                setTimeout(loadMapbox, 1000);
              }
            }
          }, 500);
        };
        script.onerror = () => {
          console.error('Failed to load Mapbox script');
          if (isMounted) {
            setRetryCount(prev => prev + 1);
            if (retryCount < 5) {
              setTimeout(loadMapbox, 1000);
            }
          }
        };
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      console.log('initMap called, mapContainer:', !!mapContainer.current, 'map.current:', !!map.current);
      
      // コンポーネントがアンマウントされていたら処理を中止
      if (!isMounted) {
        console.log('Component unmounted, skipping map init');
        return;
      }
      
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
          pitch: 60, // より3D感を出すため角度を増やす
          bearing: 0,
          maxZoom: 18,
          minZoom: 5
        });

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          
          // コンポーネントがアンマウントされていたら処理を中止
          if (!isMounted) {
            console.log('Component unmounted during map load');
            return;
          }
          
          // 3D建物を追加（エラーを回避）
          try {
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers.find(
              layer => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
            )?.id;

            if (map.current.getLayer('3d-buildings')) {
              map.current.removeLayer('3d-buildings');
            }

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

    // DOMが準備できるまで少し待つ
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        loadMapbox();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []); // 依存配列を空にして、初回のみ実行

  // レイヤー更新
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

    // SNS感情分析レイヤー（サイバーチック）
    try {
      if (map.current.getLayer('cyber-heatmap')) {
        map.current.removeLayer('cyber-heatmap');
      }
      if (map.current.getLayer('cyber-particles')) {
        map.current.removeLayer('cyber-particles');
      }
      if (map.current.getLayer('cyber-grid')) {
        map.current.removeLayer('cyber-grid');
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source');
      }
      if (map.current.getSource('grid-source')) {
        map.current.removeSource('grid-source');
      }

      if (selectedLayers.includes('heatmap') && selectedCategories.length > 0) {
        // より多くのSNSデータポイント（サイバー感を出すため）
        const heatmapPoints = [];
        const baseLocations = [
          [132.4536, 34.3955], [132.4520, 34.3920], [132.3196, 34.2960],
          [132.4615, 34.3905], [132.4570, 34.3935], [132.4757, 34.3972],
          [132.4846, 34.3915], [132.4635, 34.3940], [132.4565, 34.3950]
        ];
        
        // 各ベースロケーション周辺に複数のポイントを生成
        baseLocations.forEach(loc => {
          for (let i = 0; i < 15; i++) {
            const category = ['観光', 'グルメ', 'ショッピング', 'イベント', '交通'][Math.floor(Math.random() * 5)];
            if (selectedCategories.includes(category)) {
              heatmapPoints.push({
                coordinates: [
                  loc[0] + (Math.random() - 0.5) * 0.008,
                  loc[1] + (Math.random() - 0.5) * 0.008
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
            'heatmap-opacity': 0.85
          }
        });

        // パーティクルエフェクト
        map.current.addLayer({
          id: 'cyber-particles',
          type: 'circle',
          source: 'heatmap-source',
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
            'circle-opacity': ['*', ['get', 'sentiment'], 0.5],
            'circle-blur': 1
          }
        });

        // グリッドエフェクト（サイバー感を追加）
        const gridLines = [];
        const bounds = map.current.getBounds();
        const step = 0.005;
        
        // 縦線
        for (let lng = Math.floor(bounds.getWest() / step) * step; lng <= bounds.getEast(); lng += step) {
          gridLines.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[lng, bounds.getSouth()], [lng, bounds.getNorth()]]
            }
          });
        }
        
        // 横線
        for (let lat = Math.floor(bounds.getSouth() / step) * step; lat <= bounds.getNorth(); lat += step) {
          gridLines.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[bounds.getWest(), lat], [bounds.getEast(), lat]]
            }
          });
        }

        map.current.addSource('grid-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: gridLines }
        });

        map.current.addLayer({
          id: 'cyber-grid',
          type: 'line',
          source: 'grid-source',
          paint: {
            'line-color': '#00FFFF',
            'line-width': 0.5,
            'line-opacity': 0.2
          }
        }, 'cyber-heatmap'); // ヒートマップの下に配置
      }
    } catch (e) {
      console.error('Heatmap error:', e);
    }

    // 宿泊施設レイヤー（3D棒グラフのみ、丸なし）
    try {
      const accommodationLayers = ['accommodation-layer', 'accommodation-3d-bars', 'accommodation-3d-base'];
      accommodationLayers.forEach(layer => {
        if (map.current.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      if (map.current.getSource('accommodation-source')) {
        map.current.removeSource('accommodation-source');
      }
      if (map.current.getSource('accommodation-bars-source')) {
        map.current.removeSource('accommodation-bars-source');
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

        // 宿泊施設の3D棒グラフ用のポリゴンフィーチャー（面積1/5、高さ3倍）
        const accommodationBars = features.map(f => {
          const size = 0.00004; // 棒の幅（元の1/5）
          const coords = f.geometry.coordinates;
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [coords[0] - size, coords[1] - size],
                [coords[0] + size, coords[1] - size],
                [coords[0] + size, coords[1] + size],
                [coords[0] - size, coords[1] + size],
                [coords[0] - size, coords[1] - size]
              ]]
            },
            properties: {
              ...f.properties,
              height: f.properties.occupancy * 6 // 稼働率を高さに変換（3倍）
            }
          };
        });

        // 3D棒グラフを追加
        map.current.addSource('accommodation-bars-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: accommodationBars }
        });

        // 3D棒グラフのベース（影）
        map.current.addLayer({
          id: 'accommodation-3d-base',
          type: 'fill',
          source: 'accommodation-bars-source',
          paint: {
            'fill-color': colors.accommodation,
            'fill-opacity': 0.3
          }
        });

        // 3D棒グラフ本体
        map.current.addLayer({
          id: 'accommodation-3d-bars',
          type: 'fill-extrusion',
          source: 'accommodation-bars-source',
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'occupancy'],
              0, '#81C784',
              50, '#4CAF50',
              100, '#2E7D32'
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // 円形マーカーは削除（3D棒グラフのみ表示）
      }
    } catch (e) {
      console.error('Accommodation error:', e);
    }

    // 人流データレイヤー（道路上の粒子＋施設間の弧）
    try {
      // 既存レイヤーの削除
      const mobilityLayers = [
        'mobility-roads', 'mobility-roads-glow', 'mobility-road-particles',
        'mobility-arcs', 'mobility-arc-particles', 'mobility-arc-trails'
      ];
      mobilityLayers.forEach(layer => {
        if (map.current.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      
      const mobilitySources = [
        'mobility-roads-source', 'mobility-road-particles-source',
        'mobility-arcs-source', 'mobility-arc-particles-source'
      ];
      mobilitySources.forEach(source => {
        if (map.current.getSource(source)) {
          map.current.removeSource(source);
        }
      });

      if (selectedLayers.includes('mobility')) {
        // 1. 道路上の人流データ（主要道路）
        const roadFlows = [
          // 平和大通り
          {
            route: [[132.4600, 34.3900], [132.4550, 34.3905], [132.4500, 34.3910], [132.4450, 34.3915]],
            congestion: 0.8, // 混雑度 (0-1)
            name: '平和大通り'
          },
          // 相生通り
          {
            route: [[132.4757, 34.3972], [132.4700, 34.3965], [132.4650, 34.3960], [132.4600, 34.3955], [132.4550, 34.3950]],
            congestion: 0.9,
            name: '相生通り'
          },
          // 中央通り
          {
            route: [[132.4570, 34.3935], [132.4565, 34.3945], [132.4560, 34.3955], [132.4555, 34.3965]],
            congestion: 0.6,
            name: '中央通り'
          },
          // 本通り
          {
            route: [[132.4600, 34.3935], [132.4580, 34.3935], [132.4560, 34.3935], [132.4540, 34.3935]],
            congestion: 0.7,
            name: '本通り'
          },
          // 流川通り
          {
            route: [[132.4615, 34.3905], [132.4610, 34.3915], [132.4605, 34.3925], [132.4600, 34.3935]],
            congestion: 0.5,
            name: '流川通り'
          }
        ];

        // 混雑度に応じた色を取得
        const getCongestionColor = (congestion) => {
          if (congestion >= 0.8) return '#FF0000'; // 赤（混雑）
          if (congestion >= 0.5) return '#FFFF00'; // 黄（やや混雑）
          return '#00FF00'; // 緑（空いている）
        };

        // 道路フローのGeoJSON
        const roadFeatures = roadFlows.map((flow, i) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: flow.route
          },
          properties: {
            congestion: flow.congestion,
            color: getCongestionColor(flow.congestion),
            name: flow.name,
            id: i
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
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 20,
            'line-opacity': 0.3,
            'line-blur': 10
          }
        });

        // 道路のメインライン
        map.current.addLayer({
          id: 'mobility-roads',
          type: 'line',
          source: 'mobility-roads-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 6,
            'line-opacity': 0.8
          }
        });

        // 2. 施設間の弧を描く移動（ランドマーク・宿泊施設間）
        const arcFlows = [
          {
            from: [132.4757, 34.3972], // 広島駅
            to: [132.4536, 34.3955],   // 原爆ドーム
            height: 0.02,               // 弧の高さ
            flow: 0.8,
            name: '広島駅→原爆ドーム'
          },
          {
            from: [132.4536, 34.3955], // 原爆ドーム
            to: [132.4520, 34.3920],   // 平和記念公園
            height: 0.015,
            flow: 0.7,
            name: '原爆ドーム→平和記念公園'
          },
          {
            from: [132.4757, 34.3972], // 広島駅
            to: [132.3196, 34.2960],   // 宮島
            height: 0.05,
            flow: 0.6,
            name: '広島駅→宮島'
          }
        ];

        // 弧を描くパスを生成
        const createArc = (from, to, height, steps = 30) => {
          const points = [];
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = from[0] + (to[0] - from[0]) * t;
            const y = from[1] + (to[1] - from[1]) * t;
            // 放物線の高さ計算
            const h = 4 * height * t * (1 - t);
            points.push([x, y + h]);
          }
          return points;
        };

        // 弧のGeoJSON
        const arcFeatures = arcFlows.map((flow, i) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: createArc(flow.from, flow.to, flow.height)
          },
          properties: {
            flow: flow.flow,
            name: flow.name,
            id: i
          }
        }));

        map.current.addSource('mobility-arcs-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: arcFeatures }
        });

        // 弧のライン
        map.current.addLayer({
          id: 'mobility-arcs',
          type: 'line',
          source: 'mobility-arcs-source',
          paint: {
            'line-color': '#00FFFF',
            'line-width': 3,
            'line-opacity': 0.6,
            'line-dasharray': [2, 2]
          }
        });

        // パーティクルアニメーション
        let particleOffset = 0;
        const animateMobility = () => {
          particleOffset = (particleOffset + 1) % 100;
          
          // 道路上のパーティクル
          const roadParticles = [];
          roadFlows.forEach((flow, flowIndex) => {
            const routeLength = flow.route.length;
            // 混雑度に応じてパーティクル数を調整
            const particleCount = Math.floor(flow.congestion * 10) + 3;
            
            for (let i = 0; i < particleCount; i++) {
              const progress = ((particleOffset + i * (100 / particleCount)) % 100) / 100;
              const segmentIndex = Math.floor(progress * (routeLength - 1));
              const segmentProgress = (progress * (routeLength - 1)) % 1;
              
              if (segmentIndex < routeLength - 1) {
                const start = flow.route[segmentIndex];
                const end = flow.route[segmentIndex + 1];
                const lng = start[0] + (end[0] - start[0]) * segmentProgress;
                const lat = start[1] + (end[1] - start[1]) * segmentProgress;
                
                roadParticles.push({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                  },
                  properties: {
                    flowId: flowIndex,
                    congestion: flow.congestion,
                    color: getCongestionColor(flow.congestion)
                  }
                });
              }
            }
          });

          // 弧上のパーティクル
          const arcParticles = [];
          arcFlows.forEach((flow, flowIndex) => {
            const arcPath = createArc(flow.from, flow.to, flow.height, 50);
            const particleCount = 5;
            
            for (let i = 0; i < particleCount; i++) {
              const progress = ((particleOffset * 0.5 + i * (100 / particleCount)) % 100) / 100;
              const index = Math.floor(progress * (arcPath.length - 1));
              
              if (index < arcPath.length) {
                arcParticles.push({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: arcPath[index]
                  },
                  properties: {
                    flowId: flowIndex,
                    flow: flow.flow
                  }
                });
              }
            }
          });

          // パーティクルレイヤーを更新
          if (map.current.getSource('mobility-road-particles-source')) {
            map.current.getSource('mobility-road-particles-source').setData({
              type: 'FeatureCollection',
              features: roadParticles
            });
          } else {
            map.current.addSource('mobility-road-particles-source', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: roadParticles }
            });

            map.current.addLayer({
              id: 'mobility-road-particles',
              type: 'circle',
              source: 'mobility-road-particles-source',
              paint: {
                'circle-radius': 3,
                'circle-color': ['get', 'color'],
                'circle-opacity': 0.9,
                'circle-blur': 0.5
              }
            });
          }

          if (map.current.getSource('mobility-arc-particles-source')) {
            map.current.getSource('mobility-arc-particles-source').setData({
              type: 'FeatureCollection',
              features: arcParticles
            });
          } else {
            map.current.addSource('mobility-arc-particles-source', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: arcParticles }
            });

            map.current.addLayer({
              id: 'mobility-arc-particles',
              type: 'circle',
              source: 'mobility-arc-particles-source',
              paint: {
                'circle-radius': 4,
                'circle-color': '#00FFFF',
                'circle-opacity': 0.8,
                'circle-blur': 1
              }
            });
          }

          animationFrame.current = requestAnimationFrame(animateMobility);
        };
        animateMobility();
      } else {
        // アニメーションを停止
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
          animationFrame.current = null;
        }
      }
    } catch (e) {
      console.error('Mobility error:', e);
    }

    // 気象データレイヤーは削除（ダッシュボードに移動）

    // 消費データレイヤー（3D棒グラフ）
    try {
      if (map.current.getLayer('consumption-3d-bars')) {
        map.current.removeLayer('consumption-3d-bars');
      }
      if (map.current.getLayer('consumption-3d-base')) {
        map.current.removeLayer('consumption-3d-base');
      }
      if (map.current.getLayer('consumption-labels')) {
        map.current.removeLayer('consumption-labels');
      }
      if (map.current.getSource('consumption-source')) {
        map.current.removeSource('consumption-source');
      }
      if (map.current.getSource('consumption-labels-source')) {
        map.current.removeSource('consumption-labels-source');
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

        // 3D棒グラフ用のポリゴンフィーチャーを作成
        const barFeatures = consumptionPoints.map(c => {
          const size = 0.0003; // 棒の幅
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
              category: c.category,
              height: (c.amount / 2000) // 高さを調整
            }
          };
        });

        // ラベル用のポイントフィーチャー
        const labelFeatures = consumptionPoints.map(c => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: c.coordinates
          },
          properties: {
            amount: c.amount,
            area: c.area,
            height: (c.amount / 2000)
          }
        }));

        map.current.addSource('consumption-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: barFeatures }
        });

        // 3D棒グラフのベース（影）
        map.current.addLayer({
          id: 'consumption-3d-base',
          type: 'fill',
          source: 'consumption-source',
          paint: {
            'fill-color': colors.consumption,
            'fill-opacity': 0.3
          }
        });

        // 3D棒グラフ本体
        map.current.addLayer({
          id: 'consumption-3d-bars',
          type: 'fill-extrusion',
          source: 'consumption-source',
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'amount'],
              0, '#FF69B4',
              500000, '#FF1493',
              1000000, '#C71585'
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // ラベル
        map.current.addSource('consumption-labels-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: labelFeatures }
        });

        map.current.addLayer({
          id: 'consumption-labels',
          type: 'symbol',
          source: 'consumption-labels-source',
          layout: {
            'text-field': ['concat', ['get', 'area'], '\n¥', ['to-string', ['/', ['get', 'amount'], 10000]], '万'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-anchor': 'bottom',
            'text-offset': [0, -1],
            'text-allow-overlap': true
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
    
    // ランドマークレイヤー（3Dアイコン）
    try {
      const landmarkLayers = ['landmarks-3d', 'landmarks-platforms', 'landmarks-labels'];
      landmarkLayers.forEach(layer => {
        if (map.current.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      if (map.current.getSource('landmarks-source')) {
        map.current.removeSource('landmarks-source');
      }
      if (map.current.getSource('landmarks-buildings-source')) {
        map.current.removeSource('landmarks-buildings-source');
      }
      if (map.current.getSource('landmarks-platforms-source')) {
        map.current.removeSource('landmarks-platforms-source');
      }

      if (selectedLayers.includes('landmarks')) {
        // ランドマークデータ（より印象的な3D表現用）
        const landmarks = [
          { name: '原爆ドーム', coordinates: [132.4536, 34.3955], type: '史跡', icon: '🏛️', height: 150, width: 0.0004, depth: 0.0004 },
          { name: '平和記念公園', coordinates: [132.4520, 34.3920], type: '公園', icon: '🌳', height: 80, width: 0.0006, depth: 0.0006 },
          { name: '宮島', coordinates: [132.3196, 34.2960], type: '神社', icon: '⛩️', height: 200, width: 0.0005, depth: 0.0003 },
          { name: '広島駅', coordinates: [132.4757, 34.3972], type: '交通', icon: '🚉', height: 120, width: 0.0007, depth: 0.0004 },
          { name: 'マツダスタジアム', coordinates: [132.4846, 34.3915], type: 'スポーツ', icon: '⚾', height: 100, width: 0.0008, depth: 0.0008 },
          { name: '本通り商店街', coordinates: [132.4570, 34.3935], type: 'ショッピング', icon: '🛍️', height: 90, width: 0.0003, depth: 0.0006 }
        ];

        // ポイントフィーチャー（ラベル用）
        const pointFeatures = landmarks.map(l => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: l.coordinates
          },
          properties: {
            name: l.name,
            type: l.type,
            icon: l.icon,
            height: l.height
          }
        }));

        // 3D建物用のポリゴンフィーチャー（すべて円柱形式）
        const buildingFeatures = landmarks.map(l => {
          const baseCoords = l.coordinates;
          const radius = 0.0004; // 統一された半径
          
          // すべて円柱形（マツダスタジアムスタイル、16角形で近似）
          const angles = [];
          for (let i = 0; i < 16; i++) {
            angles.push(i * 22.5); // 360度を16分割
          }
          
          const polygon = angles.map(angle => {
            const rad = angle * Math.PI / 180;
            return [
              baseCoords[0] + radius * Math.cos(rad),
              baseCoords[1] + radius * Math.sin(rad)
            ];
          });
          polygon.push(polygon[0]); // 閉じる
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            },
            properties: {
              ...l,
              color: colors.landmarks // 黄色で統一
            }
          };
        });

        // ベースプラットフォーム用のフィーチャー（円形）
        const platformFeatures = landmarks.map(l => {
          const baseCoords = l.coordinates;
          const platformRadius = 0.0005; // プラットフォームの半径
          
          // 円形プラットフォーム（16角形で近似）
          const angles = [];
          for (let i = 0; i < 16; i++) {
            angles.push(i * 22.5);
          }
          
          const polygon = angles.map(angle => {
            const rad = angle * Math.PI / 180;
            return [
              baseCoords[0] + platformRadius * Math.cos(rad),
              baseCoords[1] + platformRadius * Math.sin(rad)
            ];
          });
          polygon.push(polygon[0]);
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            },
            properties: {
              height: 5, // プラットフォームの高さ
              type: l.type
            }
          };
        });

        // ポイントデータソース（ラベル用）
        map.current.addSource('landmarks-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: pointFeatures }
        });

        // 3D建物データソース
        map.current.addSource('landmarks-buildings-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: buildingFeatures }
        });

        // プラットフォームデータソース
        map.current.addSource('landmarks-platforms-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: platformFeatures }
        });

        // ベースプラットフォーム（黄色）
        map.current.addLayer({
          id: 'landmarks-platforms',
          type: 'fill-extrusion',
          source: 'landmarks-platforms-source',
          paint: {
            'fill-extrusion-color': '#B8860B', // ダークゴールデンロッド
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
          }
        });

        // 3D建物
        map.current.addLayer({
          id: 'landmarks-3d',
          type: 'fill-extrusion',
          source: 'landmarks-buildings-source',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 5, // プラットフォームの上に配置
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // ランドマークラベル
        map.current.addLayer({
          id: 'landmarks-labels',
          type: 'symbol',
          source: 'landmarks-source',
          layout: {
            'text-field': '{icon}\n{name}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 16,
            'text-anchor': 'center',
            'text-offset': [0, -2],
            'text-allow-overlap': true
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
  }, [mapLoaded, heatmapData, accommodationData, mobilityData, weatherData, consumptionData, landmarkData, selectedLayers, selectedCategories]);

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
    </Box>
  );
};

export default MapEnhanced;