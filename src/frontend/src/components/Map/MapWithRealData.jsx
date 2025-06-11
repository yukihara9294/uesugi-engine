import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapEnhanced.css';
import { 
  loadHiroshimaGTFSData,
  loadYamaguchiTourismData,
  loadRealAccommodationData,
  loadRealMobilityData,
  loadRealEventData
} from '../../utils/realDataLoader';
import { 
  generateHeatmapData,
  generateLandmarks,
  generateHotels,
  generateMobilityData,
  generateEventData,
  generateConsumptionData
} from '../../utils/dataGenerator';
import { realDataService } from '../../services/api';

// Mapbox token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is not set. Please check your .env.local file.');
  console.error('Looking for REACT_APP_MAPBOX_TOKEN in environment variables.');
} else {
  console.log('Mapbox token found, length:', MAPBOX_TOKEN.length);
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const MapWithRealData = ({ 
  layers = {}, 
  categoryFilter, 
  selectedPrefecture = '広島県',
  leftSidebarOpen,
  rightSidebarOpen,
  loading,
  prefectureData = null
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [realDataLoaded, setRealDataLoaded] = useState(false);
  const layersInitialized = useRef(false);
  const animationFrame = useRef(null);

  // 都道府県ごとの初期座標
  const prefectureCoordinates = {
    '広島県': { center: [132.4597, 34.3966], zoom: 11 },
    '山口県': { center: [131.4705, 34.1858], zoom: 10 },
    '福岡県': { center: [130.4017, 33.6064], zoom: 11 },
    '大阪府': { center: [135.5202, 34.6863], zoom: 11 },
    '東京都': { center: [139.6917, 35.6895], zoom: 11 }
  };

  // 実データの読み込み（ダミーデータへのフォールバック付き）
  const loadRealData = useCallback(async () => {
    console.log('Loading real data for', selectedPrefecture);
    console.log('Prefecture data available:', !!prefectureData, prefectureData);
    
    try {
      // 並列でデータ読み込み
      const [gtfsData, tourismData, accommodationData, mobilityData, eventData] = await Promise.all([
        selectedPrefecture === '広島県' ? loadHiroshimaGTFSData() : Promise.resolve(null),
        selectedPrefecture === '山口県' ? loadYamaguchiTourismData() : Promise.resolve(null),
        loadRealAccommodationData(selectedPrefecture),
        loadRealMobilityData(selectedPrefecture),
        loadRealEventData(selectedPrefecture)
      ]);

      // データをマップに適用
      if (map.current && mapLoaded) {
        // GTFSデータ（広島県のみ）- 現在はGTFSにサンプルデータあり
        if (gtfsData && selectedPrefecture === '広島県') {
          updateTransportLayer(gtfsData);
        }

        // 観光施設データ - prefectureDataまたはダミーデータを使用
        const landmarksData = prefectureData?.landmarks || generateLandmarks(selectedPrefecture);
        console.log('Landmarks data:', landmarksData ? 'Available' : 'Not available', landmarksData?.features?.length, 'features');
        console.log('Landmarks data structure:', landmarksData);
        if (landmarksData) {
          updateLandmarksLayer(landmarksData);
        }

        // 宿泊施設データ - prefectureDataまたはダミーデータを使用
        const hotelsData = accommodationData || prefectureData?.hotels || generateHotels(selectedPrefecture);
        if (hotelsData) {
          updateAccommodationLayer(hotelsData);
        }

        // 人流データ - prefectureDataまたはダミーデータを使用
        const mobilityDummyData = mobilityData || prefectureData?.mobility || generateMobilityData(selectedPrefecture);
        if (mobilityDummyData) {
          updateMobilityLayer(mobilityDummyData);
        }

        // イベントデータ - prefectureDataまたはダミーデータを使用
        const eventDummyData = eventData || prefectureData?.events || prefectureData?.eventData || generateEventData(selectedPrefecture);
        if (eventDummyData) {
          updateEventLayer(eventDummyData);
        }

        // 消費データ - prefectureDataまたはダミーデータを使用
        const consumptionData = prefectureData?.consumption || generateConsumptionData(selectedPrefecture);
        if (consumptionData) {
          updateConsumptionLayer(consumptionData);
        }

        // SNSヒートマップ - prefectureDataまたはダミーデータを使用
        const heatmapData = prefectureData?.heatmap || generateHeatmapData(selectedPrefecture);
        updateHeatmapLayer(heatmapData);

        // PLATEAU 3D建物データ
        updatePlateauLayer();

        setRealDataLoaded(true);
        console.log('Real data loaded successfully');
        
        // Apply initial layer visibility after all layers are created
        // This will be handled by the useEffect that watches realDataLoaded
      }
    } catch (error) {
      console.error('Failed to load real data:', error);
    }
  }, [selectedPrefecture, mapLoaded, prefectureData]);

  // マップ初期化
  const initializeMap = useCallback(() => {
    console.log('initializeMap called', {
      hasContainer: !!mapContainer.current,
      hasMap: !!map.current,
      hasToken: !!MAPBOX_TOKEN
    });
    
    if (!mapContainer.current || map.current) return;

    try {
      const coords = prefectureCoordinates[selectedPrefecture];
      console.log('Creating map with coordinates:', coords);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: coords.center,
        zoom: coords.zoom,
        pitch: 45,
        bearing: 0,
        antialias: true
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully!');
        setMapLoaded(true);
        
        try {
          // 3D地形を有効化
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          // 空の追加
          map.current.setFog({
            'color': 'rgb(30, 30, 50)',
            'high-color': 'rgb(20, 20, 40)',
            'horizon-blend': 0.02,
            'space-color': 'rgb(10, 10, 20)',
            'star-intensity': 0.6
          });
          console.log('3D terrain and fog added successfully');
        } catch (error) {
          console.error('Error adding 3D features:', error);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      // ナビゲーションコントロール
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, [selectedPrefecture]);

  // レイヤー更新関数

  const updateTransportLayer = (gtfsData) => {
    const sourceId = 'transport-stops';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(gtfsData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: gtfsData
      });

      // 停留所マーカー
      map.current.addLayer({
        id: 'transport-stops',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'coalesce',
            ['get', 'color'],
            '#4A90E2'  // Default blue color
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // 停留所ラベル
      map.current.addLayer({
        id: 'transport-labels',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'stop_name'],
            ''  // Empty string if no name
          ],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 14
      });
    }
  };

  const updateTourismLayer = (tourismData) => {
    const sourceId = 'tourism-facilities';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(tourismData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: tourismData
      });

      // 3D観光施設
      map.current.addLayer({
        id: 'tourism-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#FFD700',
          'fill-extrusion-height': 50,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });
    }
  };

  const updateAccommodationLayer = (accommodationData) => {
    const sourceId = 'accommodation';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(accommodationData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: accommodationData
      });

      // 3D宿泊施設（一時的に無効化）
      /*
      map.current.addLayer({
        id: 'accommodation-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#4A90E2',
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            40  // Default height
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        }
      });
      */

      // 宿泊施設の円形マーカー（3Dの代替）
      map.current.addLayer({
        id: 'accommodation-3d',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 8,
          'circle-color': '#4A90E2',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // ラベル
      map.current.addLayer({
        id: 'accommodation-labels',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'name'],
            ''  // Empty string if no name
          ],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 11,
          'text-offset': [0, 2]
        },
        paint: {
          'text-color': '#4A90E2',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 13
      });
    }
  };

  const updateMobilityLayer = (mobilityData) => {
    // パーティクル
    if (mobilityData.particles) {
      const particleSourceId = 'mobility-particles';
      
      if (map.current.getSource(particleSourceId)) {
        map.current.getSource(particleSourceId).setData(mobilityData.particles);
      } else {
        map.current.addSource(particleSourceId, {
          type: 'geojson',
          data: mobilityData.particles
        });

        map.current.addLayer({
          id: 'mobility-particles',
          type: 'circle',
          source: particleSourceId,
          paint: {
            'circle-radius': [
              'coalesce',
              ['get', 'size'],
              4  // Default size
            ],
            'circle-color': [
              'coalesce',
              ['get', 'color'],
              '#00FF00'  // Default green color
            ],
            'circle-opacity': 0.8,
            'circle-blur': 0.5
          }
        });
      }
    }

    // フロー
    if (mobilityData.flows) {
      const flowSourceId = 'mobility-flows';
      
      if (map.current.getSource(flowSourceId)) {
        map.current.getSource(flowSourceId).setData(mobilityData.flows);
      } else {
        map.current.addSource(flowSourceId, {
          type: 'geojson',
          data: mobilityData.flows
        });

        map.current.addLayer({
          id: 'mobility-flows',
          type: 'line',
          source: flowSourceId,
          paint: {
            'line-color': [
              'coalesce',
              ['get', 'color'],
              '#00FF00'  // Default green color
            ],
            'line-width': [
              'coalesce',
              ['get', 'width'],
              2  // Default width
            ],
            'line-opacity': 0.6
          }
        });
      }
    }

    // 人流アニメーション開始
    startMobilityAnimation();
  };

  const updateEventLayer = (eventData) => {
    const sourceId = 'events';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(eventData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: eventData
      });

      // イベント影響範囲
      map.current.addLayer({
        id: 'event-impact',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 20,
          'circle-color': '#FF6B6B',
          'circle-opacity': 0.1
        }
      });

      // イベントマーカー
      map.current.addLayer({
        id: 'event-markers',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 10,
          'circle-color': '#FF6B6B',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // イベント名
      map.current.addLayer({
        id: 'event-labels',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'name'],
            ''  // Empty string if no name
          ],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-offset': [0, 2]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }
  };

  const updateLandmarksLayer = (landmarksData) => {
    const sourceId = 'landmarks';
    
    console.log('updateLandmarksLayer called with:', {
      hasData: !!landmarksData,
      type: landmarksData?.type,
      featuresCount: landmarksData?.features?.length,
      firstFeature: landmarksData?.features?.[0]
    });
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(landmarksData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: landmarksData
      });

      // ランドマークのポイントレイヤー（赤い丸で表示）
      map.current.addLayer({
        id: 'landmarks-points',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 12,
          'circle-color': '#FF6B6B',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1,
          'circle-opacity': 0.9
        }
      });

      // 3Dランドマーク（一時的に無効化）
      /*
      map.current.addLayer({
        id: 'landmarks-3d',
        type: 'fill-extrusion',
        source: sourceId,
        filter: ['all',
          ['has', 'height'],
          ['>', ['get', 'height'], 50]
        ], // 50m以上の建物のみ3D表示
        paint: {
          'fill-extrusion-color': [
            'match',
            ['get', 'category'],
            'temple', '#D4AF37',
            'castle', '#8B4513',
            'park', '#228B22',
            'museum', '#4169E1',
            '超高層建築', '#667eea',
            '高層建築', '#764ba2',
            '#808080'
          ],
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            100  // Default height for landmarks
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.6
        },
        minzoom: 13 // ズームレベル13以上で表示
      });
      */

      // ランドマークラベル
      map.current.addLayer({
        id: 'landmarks-labels',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'name'],
            ''  // Empty string if no name
          ],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-offset': [0, 2]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 12
      });
    }
  };

  const updatePlateauLayer = () => {
    const sourceId = 'plateau-buildings';
    
    // PLATEAU 3D building data for Hiroshima
    const plateauData = {
      type: 'FeatureCollection',
      features: [
        // Hiroshima City Center
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4553, 34.3853] }, properties: { height: 120, floors: 30, name: '広島センタービル', type: 'office' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4590, 34.3939] }, properties: { height: 95, floors: 24, name: '広島ビジネスタワー', type: 'office' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4584, 34.3955] }, properties: { height: 85, floors: 21, name: 'リーガロイヤルホテル広島', type: 'hotel' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4757, 34.3972] }, properties: { height: 110, floors: 28, name: 'シェラトングランドホテル広島', type: 'hotel' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4758, 34.3979] }, properties: { height: 105, floors: 26, name: 'ホテルグランヴィア広島', type: 'hotel' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4610, 34.3935] }, properties: { height: 65, floors: 16, name: 'そごう広島店', type: 'commercial' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4590, 34.4027] }, properties: { height: 39, floors: 5, name: '広島城', type: 'cultural' }},
        // Add more buildings based on prefecture
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4520, 34.3915] }, properties: { height: 25, floors: 3, name: '広島平和記念資料館', type: 'cultural' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4530, 34.3930] }, properties: { height: 20, floors: 4, name: '原爆ドーム', type: 'cultural' }},
        // Fukuyama
        { type: 'Feature', geometry: { type: 'Point', coordinates: [133.3627, 34.4900] }, properties: { height: 65, floors: 16, name: '福山ニューキャッスルホテル', type: 'mixed' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [133.3627, 34.4900] }, properties: { height: 30, floors: 5, name: '福山城', type: 'cultural' }},
        // Kure
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.5552, 34.2415] }, properties: { height: 55, floors: 14, name: 'クレイトンベイホテル', type: 'hotel' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.5550, 34.2410] }, properties: { height: 30, floors: 4, name: '大和ミュージアム', type: 'cultural' }},
      ]
    };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(plateauData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: plateauData
      });

      // 3D buildings layer
      map.current.addLayer({
        id: 'plateau-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': [
            'match',
            ['get', 'type'],
            'office', '#4A90E2',
            'hotel', '#9B59B6',
            'residential', '#2ECC71',
            'commercial', '#F39C12',
            'mixed', '#7F8C8D',
            'cultural', '#E74C3C',
            '#808080'  // default color
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });

      // Building labels
      map.current.addLayer({
        id: 'plateau-labels',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-offset': [0, -2]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 13
      });
    }
  };

  const updateConsumptionLayer = (consumptionData) => {
    const sourceId = 'consumption';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(consumptionData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: consumptionData
      });

      // 消費ヒートマップ
      map.current.addLayer({
        id: 'consumption-heatmap',
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': [
            '/',
            [
              'coalesce',
              ['get', 'amount'],
              1000  // Default amount
            ],
            10000
          ],
          'heatmap-intensity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,255,0)',
            0.2, 'rgb(0,100,255)',
            0.4, 'rgb(0,255,255)',
            0.6, 'rgb(0,255,100)',
            0.8, 'rgb(255,255,0)',
            1, 'rgb(255,0,0)'
          ],
          'heatmap-radius': 40,
          'heatmap-opacity': 0.6
        }
      });

      // 消費ポイントマーカー
      map.current.addLayer({
        id: 'consumption-points',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 10,
          'circle-color': '#FF6B6B',
          'circle-opacity': 0.6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        },
        minzoom: 13
      });
    }
  };

  const updateHeatmapLayer = (heatmapData) => {
    const sourceId = 'sns-heatmap';
    
    // カテゴリフィルタリング
    const filteredData = categoryFilter && heatmapData?.features ? {
      ...heatmapData,
      features: heatmapData.features.filter(f => 
        f.properties && f.properties.category === categoryFilter
      )
    } : heatmapData || { type: 'FeatureCollection', features: [] };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(filteredData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: filteredData
      });

      map.current.addLayer({
        id: 'sns-heatmap',
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': 0.5,
          'heatmap-intensity': 0.8,
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
          'heatmap-radius': 30,
          'heatmap-opacity': 0.7
        }
      });
    }
  };

  // 人流アニメーション
  const startMobilityAnimation = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const animate = () => {
      if (!map.current || !map.current.getSource('mobility-particles')) {
        return;
      }

      // パーティクルの位置を更新
      const source = map.current.getSource('mobility-particles');
      if (source && source._data && source._data.features) {
        const updatedFeatures = source._data.features.map(feature => {
          if (!feature || !feature.geometry || !feature.geometry.coordinates || !feature.properties) {
            return feature;
          }
          
          const speed = feature.properties.speed || 0.5;
          const coords = feature.geometry.coordinates;
          
          // ランダムな方向に移動（座標が配列であることを確認）
          if (Array.isArray(coords) && coords.length >= 2) {
            coords[0] += (Math.random() - 0.5) * 0.0001 * speed;
            coords[1] += (Math.random() - 0.5) * 0.0001 * speed;
          }
          
          return feature;
        });

        source.setData({
          type: 'FeatureCollection',
          features: updatedFeatures
        });
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // レイヤー表示/非表示の更新
  const updateLayerVisibility = useCallback(() => {
    if (!map.current || !mapLoaded) {
      console.log('Map not ready for layer visibility update');
      return;
    }
    
    console.log('Updating layer visibility:', layers);

    const layerMapping = {
      landmarks: ['landmarks-points', 'landmarks-3d', 'landmarks-labels', 'transport-stops', 'transport-labels'],
      plateau: ['plateau-3d', 'plateau-labels'],  // PLATEAU 3D buildings
      accommodation: ['accommodation-3d', 'accommodation-labels'],  // Changed from hotels to accommodation
      mobility: ['mobility-particles', 'mobility-flows'],
      heatmap: ['sns-heatmap'],
      events: ['event-impact', 'event-markers', 'event-labels'],
      consumption: ['consumption-heatmap', 'consumption-points']
    };

    Object.entries(layerMapping).forEach(([key, layerIds]) => {
      const visibility = layers[key] ? 'visible' : 'none';
      layerIds.forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          console.log(`Setting ${layerId} visibility to ${visibility}`);
          map.current.setLayoutProperty(layerId, 'visibility', visibility);
        } else {
          console.log(`Layer ${layerId} not found yet`);
        }
      });
    });
  }, [layers, mapLoaded]);

  // エフェクト

  useEffect(() => {
    if (!loading) {
      initializeMap();
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
  }, [loading, initializeMap]);

  useEffect(() => {
    if (mapLoaded) {
      loadRealData();
    }
  }, [mapLoaded, selectedPrefecture, loadRealData]);

  useEffect(() => {
    // Update visibility after real data has been loaded and layers created
    if (realDataLoaded) {
      console.log('Real data loaded, updating layer visibility');
      updateLayerVisibility();
    }
  }, [layers, updateLayerVisibility, realDataLoaded]);

  useEffect(() => {
    if (map.current && mapLoaded) {
      setTimeout(() => {
        map.current.resize();
      }, 350);
    }
  }, [leftSidebarOpen, rightSidebarOpen, mapLoaded]);

  // カテゴリフィルター更新
  useEffect(() => {
    if (mapLoaded && map.current.getSource('sns-heatmap')) {
      const heatmapData = generateHeatmapData(selectedPrefecture);
      updateHeatmapLayer(heatmapData);
    }
  }, [categoryFilter, mapLoaded, selectedPrefecture]);

  return (
    <div className="map-wrapper" style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {!MAPBOX_TOKEN ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h3>Mapbox Token Missing</h3>
          <p>Please set REACT_APP_MAPBOX_TOKEN in your .env.local file</p>
        </div>
      ) : (
        <>
          <div 
            ref={mapContainer} 
            className="map-container" 
            style={{ width: '100%', height: '100%' }}
          />
          {!realDataLoaded && mapLoaded && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '20px',
              zIndex: 100
            }}>
              実データ読み込み中...
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapWithRealData;