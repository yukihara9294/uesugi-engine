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
import CyberFlowLayer from './CyberFlowLayer';

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

        // 人流データ - CyberFlowLayerで処理するため、ここではスキップ
        // const mobilityDummyData = mobilityData || prefectureData?.mobility || generateMobilityData(selectedPrefecture);
        // if (mobilityDummyData) {
        //   updateMobilityLayer(mobilityDummyData);
        // }

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

        // PLATEAU buildings are now handled with landmarks layer

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
    
    // PointデータをPolygonに変換
    const createPolygon = (center, size = 0.0005 / 3) => {  // 面積を1/3に
      const coords = [[
        [center[0] - size/2, center[1] - size/2],
        [center[0] + size/2, center[1] - size/2],
        [center[0] + size/2, center[1] + size/2],
        [center[0] - size/2, center[1] + size/2],
        [center[0] - size/2, center[1] - size/2]
      ]];
      return coords;
    };
    
    const polygonFeatures = accommodationData.features.map(feature => {
      if (feature.geometry.type === 'Point') {
        return {
          ...feature,
          geometry: {
            type: 'Polygon',
            coordinates: createPolygon(feature.geometry.coordinates)
          }
        };
      }
      return feature;
    });
    
    const polygonData = {
      type: 'FeatureCollection',
      features: polygonFeatures
    };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(polygonData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: polygonData
      });

      // 3D宿泊施設（ダミーデータ時の表現）
      map.current.addLayer({
        id: 'accommodation-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#4A90E2',
          'fill-extrusion-height': [
            '*',
            [
              'coalesce',
              ['get', 'capacity'],
              100
            ],
            0.3  // 収容人数に応じた高さ
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.5  // ダミーデータ時と同じ透明度50%
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
    // GeoJSON形式のデータとparticles/flows形式の両方に対応
    let flowsData, particlesData;
    
    console.log('updateMobilityLayer called with:', mobilityData);
    
    if (!mobilityData) {
      console.warn('No mobility data provided');
      return;
    }
    
    if (mobilityData.type === 'FeatureCollection') {
      // GeoJSON形式の場合（旧形式）
      flowsData = mobilityData;
      // パーティクルデータは生成しない（フローのみ表示）
    } else if (mobilityData.flows || mobilityData.particles) {
      // particles/flows形式の場合（実データAPIおよびダミーデータ）
      flowsData = mobilityData.flows;
      particlesData = mobilityData.particles;
      
      // Validate flow data
      if (flowsData && (!flowsData.type || flowsData.type !== 'FeatureCollection')) {
        console.warn('Invalid flows data format, expected FeatureCollection:', flowsData);
        flowsData = null;
      }
      
      // Validate particle data
      if (particlesData && (!particlesData.type || particlesData.type !== 'FeatureCollection')) {
        console.warn('Invalid particles data format, expected FeatureCollection:', particlesData);
        particlesData = null;
      }
    } else {
      console.warn('Unknown mobility data format:', mobilityData);
      return;
    }
    
    console.log('Processing mobility data - flows:', !!flowsData, 'particles:', !!particlesData);
    
    // フロー
    if (flowsData) {
      const flowSourceId = 'mobility-flows';
      
      if (map.current.getSource(flowSourceId)) {
        map.current.getSource(flowSourceId).setData(flowsData);
      } else {
        map.current.addSource(flowSourceId, {
          type: 'geojson',
          data: flowsData
        });

        map.current.addLayer({
          id: 'mobility-flows',
          type: 'line',
          source: flowSourceId,
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0, '#00FF00',
              50, '#FFFF00',
              100, '#FF0000'
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0, 2,
              50, 4,
              100, 6
            ],
            'line-opacity': 0.15,  // より透明に
            'line-blur': 1  // ぼかし効果
          }
        });
      }
    }
    
    // パーティクル（ダミーデータの場合のみ）
    if (particlesData) {
      const particleSourceId = 'mobility-particles';
      
      if (map.current.getSource(particleSourceId)) {
        map.current.getSource(particleSourceId).setData(particlesData);
      } else {
        map.current.addSource(particleSourceId, {
          type: 'geojson',
          data: particlesData
        });

        // パーティクル本体
        map.current.addLayer({
          id: 'mobility-particles',
          type: 'circle',
          source: particleSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 1,    // ズームレベル8で1px
              10, 2,   // ズームレベル10で2px
              12, 3,   // ズームレベル12で3px
              14, 4,   // ズームレベル14で4px
              16, 6    // ズームレベル16で6px
            ],
            'circle-color': [
              'coalesce',
              ['get', 'color'],
              '#00FFFF'
            ],
            'circle-opacity': [
              'coalesce',
              ['get', 'opacity'],
              0.8
            ],
            'circle-blur': 0.5,
            'circle-pitch-alignment': 'map',  // 3D表示のため
            'circle-pitch-scale': 'map'
          }
        });
        
        // パーティクルの影（高さを表現）
        try {
          map.current.addLayer({
            id: 'mobility-particles-shadow',
            type: 'circle',
            source: particleSourceId,
            paint: {
              'circle-radius': 3,
              'circle-color': '#000000',
              'circle-opacity': 0.2,
              'circle-blur': 2,
              'circle-translate': [0, 0],  // 影のオフセット
              'circle-translate-anchor': 'map'
            }
          }, 'mobility-particles');  // パーティクルの下に配置
        } catch (error) {
          console.warn('Failed to add mobility-particles-shadow layer:', error);
          // Try adding without the beforeId parameter
          try {
            map.current.addLayer({
              id: 'mobility-particles-shadow',
              type: 'circle',
              source: particleSourceId,
              paint: {
                'circle-radius': 3,
                'circle-color': '#000000',
                'circle-opacity': 0.2,
                'circle-blur': 2,
                'circle-translate': [0, 0],  // 影のオフセット
                'circle-translate-anchor': 'map'
              }
            });
          } catch (retryError) {
            console.error('Failed to add mobility-particles-shadow layer even without beforeId:', retryError);
          }
        }
      }
      
      // パーティクルがある場合のみアニメーション開始
      startMobilityAnimation();
    }
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

      // イベント影響範囲（オーブ風の表現）
      map.current.addLayer({
        id: 'event-impact',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 30,
            14, 60,
            16, 100
          ],
          'circle-color': '#FF6B6B',  // イベント情報の色に統一
          'circle-blur': 1,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.15,
            14, 0.1,
            16, 0.05
          ]
        }
      });

      // イベントマーカー（中心の光）
      map.current.addLayer({
        id: 'event-markers',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 8,
            14, 12,
            16, 16
          ],
          'circle-color': '#FF6B6B',  // イベント情報の色に統一
          'circle-blur': 0.5,
          'circle-opacity': 0.9
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
          'text-color': '#FF6B6B',  // イベント情報の色に統一
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }
  };

  const updateLandmarksLayer = (landmarksData) => {
    const sourceId = 'landmarks';
    
    // Also update PLATEAU buildings when landmarks are updated
    updatePlateauLayer();
    
    console.log('updateLandmarksLayer called with:', {
      hasData: !!landmarksData,
      type: landmarksData?.type,
      featuresCount: landmarksData?.features?.length,
      firstFeature: landmarksData?.features?.[0]
    });
    
    // Convert Point data to Polygon for 3D buildings that have height
    const createLandmarkPolygon = (center, size = 0.0005) => {
      return [[
        [center[0] - size/2, center[1] - size/2],
        [center[0] + size/2, center[1] - size/2],
        [center[0] + size/2, center[1] + size/2],
        [center[0] - size/2, center[1] + size/2],
        [center[0] - size/2, center[1] - size/2]
      ]];
    };
    
    // Separate point features and polygon features
    const pointFeatures = [];
    const polygonFeatures = [];
    
    landmarksData.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        // Keep as point for circle layer
        pointFeatures.push(feature);
        
        // Convert to polygon for 3D layer (全てのランドマークを円柱として表示)
        polygonFeatures.push({
          ...feature,
          geometry: {
            type: 'Polygon',
            coordinates: createLandmarkPolygon(feature.geometry.coordinates)
          },
          properties: {
            ...feature.properties,
            height: feature.properties?.height || 30  // デフォルト高さ設定
          }
        });
      }
    });
    
    // Create separate data for points and polygons
    const pointData = {
      type: 'FeatureCollection',
      features: pointFeatures
    };
    
    const polygonData = {
      type: 'FeatureCollection',
      features: polygonFeatures
    };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(pointData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: pointData
      });

      // ランドマークのポイントレイヤー（黄色に統一）
      // 3D表示が無効の場合のみ表示
      map.current.addLayer({
        id: 'landmarks-points',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#FFD700',  // 黄色に統一
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1,
          'circle-opacity': 0.8
        },
        minzoom: 15  // 3Dが表示されるズームレベルより大きく設定
      });
    }
    
    // Add 3D landmarks source and layer
    const landmarks3dSourceId = 'landmarks-3d-source';
    if (map.current.getSource(landmarks3dSourceId)) {
      map.current.getSource(landmarks3dSourceId).setData(polygonData);
    } else {
      map.current.addSource(landmarks3dSourceId, {
        type: 'geojson',
        data: polygonData
      });

      // 3Dランドマーク（ダミーデータ時の表現）
      map.current.addLayer({
        id: 'landmarks-3d',
        type: 'fill-extrusion',
        source: landmarks3dSourceId,
        paint: {
          'fill-extrusion-color': '#FFD700',  // 黄色に統一
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            50  // デフォルト高さ
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        },
        minzoom: 12  // より広いズームレベルで表示
      });

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
      
      // Add popup functionality for landmarks
      map.current.on('click', 'landmarks-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        
        const popupContent = `
          <div style="
            min-width: 180px;
            padding: 12px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid #FFD700;
            border-radius: 8px;
            font-family: 'DIN Pro Medium', 'Arial Unicode MS Regular', sans-serif;
          ">
            <h3 style="margin: 0 0 8px 0; color: #FFD700; font-size: 16px;">${properties.name || 'ランドマーク'}</h3>
            ${properties.category ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa; font-size: 14px;">カテゴリ:</span>
                <span style="color: #fff; font-size: 14px;">${properties.category}</span>
              </div>
            ` : ''}
            ${properties.description ? `
              <div style="color: #ccc; font-size: 13px; margin-top: 8px;">
                ${properties.description}
              </div>
            ` : ''}
          </div>
        `;
        
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'landmark-popup'
        })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
      });
      
      // Change cursor on hover
      map.current.on('mouseenter', 'landmarks-points', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'landmarks-points', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
  };

  const updatePlateauLayer = () => {
    const sourceId = 'plateau-buildings';
    
    // PointデータをPolygonに変換する関数
    const createBuildingPolygon = (center, size = 0.0008) => {
      return [[
        [center[0] - size/2, center[1] - size/2],
        [center[0] + size/2, center[1] - size/2],
        [center[0] + size/2, center[1] + size/2],
        [center[0] - size/2, center[1] + size/2],
        [center[0] - size/2, center[1] - size/2]
      ]];
    };
    
    // PLATEAU 3D building data for Hiroshima
    const plateauPointData = {
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
    
    // PointデータをPolygonデータに変換
    const plateauData = {
      type: 'FeatureCollection',
      features: plateauPointData.features.map(feature => ({
        ...feature,
        geometry: {
          type: 'Polygon',
          coordinates: createBuildingPolygon(feature.geometry.coordinates)
        }
      }))
    };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(plateauData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: plateauData
      });

      // PLATEAU 3D建物（宿泊施設と同じ表現、紫色）
      map.current.addLayer({
        id: 'plateau-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#9B59B6',  // 紫色
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            50  // Default height
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });

      // Add popup functionality for PLATEAU buildings
      map.current.on('click', 'plateau-3d', (e) => {
        const coordinates = e.features[0].geometry.coordinates[0][0];
        const properties = e.features[0].properties;
        
        // Calculate center of polygon
        const bounds = coordinates.reduce((bounds, coord) => {
          return [
            [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
            [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
          ];
        }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
        
        const center = [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2
        ];
        
        const popupContent = `
          <div style="
            min-width: 200px;
            padding: 12px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid #9B59B6;
            border-radius: 8px;
            font-family: 'DIN Pro Medium', 'Arial Unicode MS Regular', sans-serif;
          ">
            <h3 style="margin: 0 0 8px 0; color: #9B59B6; font-size: 16px;">${properties.name || '建物'}</h3>
            <div style="display: grid; gap: 6px; font-size: 14px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #aaa;">種別:</span>
                <span style="color: #fff;">${properties.type || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #aaa;">階数:</span>
                <span style="color: #fff;">${properties.floors || '-'}F</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #aaa;">高さ:</span>
                <span style="color: #fff;">${properties.height || '-'}m</span>
              </div>
            </div>
          </div>
        `;
        
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'plateau-popup'
        })
          .setLngLat(center)
          .setHTML(popupContent)
          .addTo(map.current);
      });
      
      // Change cursor on hover
      map.current.on('mouseenter', 'plateau-3d', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'plateau-3d', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
  };

  const updateConsumptionLayer = (consumptionData) => {
    const sourceId = 'consumption';
    
    // Validate and ensure data is properly formatted
    if (!consumptionData || !consumptionData.type || !consumptionData.features) {
      console.warn('Invalid consumption data format:', consumptionData);
      consumptionData = { type: 'FeatureCollection', features: [] };
    }
    
    // Convert Point features to Polygon features for fill-extrusion
    // Create small circles around each point
    const createCirclePolygon = (center, radiusInDegrees = 0.00006) => {  // 1/5のサイズ
      const steps = 8; // Number of vertices
      const coordinates = [[]];
      
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dx = radiusInDegrees * Math.cos(angle);
        const dy = radiusInDegrees * Math.sin(angle);
        coordinates[0].push([center[0] + dx, center[1] + dy]);
      }
      
      return coordinates;
    };
    
    // Convert features from Points to Polygons
    const polygonFeatures = (consumptionData.features || []).map(feature => {
      // Validate feature structure
      if (!feature || !feature.geometry || !feature.geometry.coordinates || !feature.properties) {
        console.warn('Invalid consumption feature:', feature);
        return null;
      }
      
      // Ensure amount property exists
      if (typeof feature.properties.amount === 'undefined') {
        feature.properties.amount = 0;
      }
      
      // Convert Point to Polygon
      if (feature.geometry.type === 'Point') {
        return {
          ...feature,
          geometry: {
            type: 'Polygon',
            coordinates: createCirclePolygon(feature.geometry.coordinates)
          }
        };
      }
      
      return feature;
    }).filter(f => f !== null);
    
    const validatedData = {
      type: 'FeatureCollection',
      features: polygonFeatures
    };
    
    console.log('Validated consumption data:', {
      featureCount: validatedData.features.length,
      sample: validatedData.features[0]
    });
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(validatedData);
    } else {
      try {
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: validatedData
        });

        // 消費データ3D棒グラフ
        map.current.addLayer({
          id: 'consumption-3d',
          type: 'fill-extrusion',
          source: sourceId,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'amount'],
              0, '#4CAF50',
              5000, '#FFEB3B',
              10000, '#FF9800',
              20000, '#F44336'
            ],
            'fill-extrusion-height': [
              '/',
              ['sqrt', ['get', 'amount']],  // ダミーデータ時と同じ計算式
              50
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.3  // 透明度30%
          }
        });

        // 消費ポイントのラベルは削除（金額表記なし）
      } catch (error) {
        console.error('Error creating consumption layers:', error);
        console.error('Layer data that caused error:', validatedData);
      }
    }
  };

  const updateHeatmapLayer = (heatmapData) => {
    const sourceId = 'sns-heatmap';
    
    console.log('updateHeatmapLayer called:', {
      hasData: !!heatmapData,
      featuresCount: heatmapData?.features?.length,
      categoryFilter: categoryFilter
    });
    
    // カテゴリフィルタリング
    // 重要: categoryFilterが空配列の場合は非表示（データなし）
    let filteredData;
    if (!heatmapData) {
      filteredData = { type: 'FeatureCollection', features: [] };
    } else if (!categoryFilter || categoryFilter.length === 0) {
      // カテゴリが選択されていない場合は非表示
      filteredData = { type: 'FeatureCollection', features: [] };
    } else {
      // カテゴリが選択されている場合のみフィルタリング
      filteredData = {
        ...heatmapData,
        features: heatmapData.features.filter(f => 
          f.properties && categoryFilter.includes(f.properties.category)
        )
      };
    }
    
    console.log('Filtered heatmap data:', {
      featuresCount: filteredData?.features?.length,
      isFiltered: categoryFilter && categoryFilter.length > 0
    });
    
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
            0, 'rgba(0,0,255,0)',      // 透明な青
            0.2, 'rgb(0,0,255)',       // 青
            0.4, 'rgb(0,255,255)',     // シアン
            0.5, 'rgb(255,255,255)',   // 白
            0.6, 'rgb(255,255,0)',     // 黄
            0.8, 'rgb(255,170,0)',     // オレンジ
            1, 'rgb(255,0,0)'          // 赤
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

    let progress = 0;
    let flowOpacityPhase = 0;
    
    const animate = () => {
      if (!map.current || !map.current.getSource('mobility-particles')) {
        return;
      }

      progress += 0.001; // よりスローなアニメーション
      if (progress > 1) progress = 0;
      
      // フローラインのフェードアニメーション
      flowOpacityPhase += 0.02;
      if (map.current.getLayer('mobility-flows')) {
        const opacity = 0.2 + Math.sin(flowOpacityPhase) * 0.15;
        map.current.setPaintProperty('mobility-flows', 'line-opacity', opacity);
      }

      // パーティクルの位置を更新
      const source = map.current.getSource('mobility-particles');
      if (source && source._data && source._data.features) {
        const updatedFeatures = source._data.features.map(feature => {
          if (!feature || !feature.geometry || !feature.geometry.coordinates || !feature.properties) {
            return feature;
          }
          
          const props = feature.properties;
          const speed = props.speed || 0.5;
          
          // 各パーティクルの個別の進捗を計算
          const particleProgress = (progress * speed + props.particle_index * 0.1) % 1;
          
          // 起点から終点への移動（弧を描く）
          if (props.origin_lon !== undefined && props.destination_lon !== undefined) {
            // ダミーデータ時と同じベジエ曲線計算
            const start = [props.origin_lon, props.origin_lat];
            const end = [props.destination_lon, props.destination_lat];
            const midpoint = [
              (start[0] + end[0]) / 2,
              (start[1] + end[1]) / 2
            ];
            
            // 距離を計算（弧の高さの基準）
            const distance = Math.sqrt(
              Math.pow(end[0] - start[0], 2) + 
              Math.pow(end[1] - start[1], 2)
            );
            
            // ベジエ曲線上の位置を計算
            const t = particleProgress;
            const x = start[0] * (1 - t) * (1 - t) + 2 * midpoint[0] * (1 - t) * t + end[0] * t * t;
            const y = start[1] * (1 - t) * (1 - t) + 2 * midpoint[1] * (1 - t) * t + end[1] * t * t;
            
            // 弧の高さ（中央で最大）- ダミーデータ時と同じ計算
            const height = 0.1;  // ダミーデータ時のデフォルト高さ
            const arcHeight = Math.sin(t * Math.PI) * height * distance;
            
            // 北向きに迂回（Y座標に正のオフセット）
            feature.geometry.coordinates = [
              x,
              y + arcHeight * 0.5  // ダミーデータ時と同じオフセット
            ];
            
            // 3D表現用の高さ情報
            feature.properties.elevation = Math.sin(particleProgress * Math.PI);
            
            // フェードイン・フェードアウトアニメーション
            const fadeIn = Math.min(1, particleProgress * 3);  // 最初の1/3でフェードイン
            const fadeOut = Math.min(1, (1 - particleProgress) * 3);  // 最後の1/3でフェードアウト
            feature.properties.opacity = Math.min(fadeIn, fadeOut) * 0.8;
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
      landmarks: ['landmarks-points', 'landmarks-3d', 'landmarks-labels', 'transport-stops', 'transport-labels', 'plateau-3d', 'plateau-labels'],  // PLATEAU buildings now included with landmarks
      plateau: [],  // Deprecated - PLATEAU is now part of landmarks
      accommodation: ['accommodation-3d', 'accommodation-labels'],  // Changed from hotels to accommodation
      mobility: ['mobility-particles', 'mobility-particles-shadow', 'mobility-flows'],
      heatmap: ['sns-heatmap'],
      events: ['event-impact', 'event-markers', 'event-labels'],
      consumption: ['consumption-3d']  // ラベルは削除
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
    if (mapLoaded && map.current && map.current.getSource('sns-heatmap')) {
      const heatmapData = prefectureData?.heatmap || generateHeatmapData(selectedPrefecture);
      updateHeatmapLayer(heatmapData);
    }
  }, [categoryFilter, mapLoaded, selectedPrefecture, prefectureData]);

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
          {/* CyberFlowLayer for mobility visualization */}
          {mapLoaded && map.current && prefectureData?.mobility && (
            <CyberFlowLayer
              map={map.current}
              mobilityData={prefectureData.mobility}
              visible={layers.mobility}
            />
          )}
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