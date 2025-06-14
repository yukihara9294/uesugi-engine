import { useEffect, useRef, useState, useCallback } from 'react';
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
import { loadTransportData } from '../../services/transportDataLoader';
import { 
  generateHeatmapData,
  generateLandmarks,
  generateHotels,
  generateEventData,
  generateConsumptionData
} from '../../utils/dataGenerator';
import CyberFlowLayer from './CyberFlowLayer';
import TransportLayer from './TransportLayer';

// Mapbox token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
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
  console.log('MapWithRealData layers prop:', layers);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [realDataLoaded, setRealDataLoaded] = useState(false);
  const [realMobilityData, setRealMobilityData] = useState(null); // 実際のモビリティデータを保存
  const [transportData, setTransportData] = useState(null); // Public transport data
  // Remove unused refs

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
    
    // ローカルデータを先に設定（即時表示）- 但し人流データは除く
    if (prefectureData && map.current && mapLoaded) {
      // ローカルデータを即座に適用（人流データ以外）
      updateLandmarksLayer(prefectureData.landmarks || generateLandmarks(selectedPrefecture));
      updateAccommodationLayer(prefectureData.hotels || generateHotels(selectedPrefecture));
      updateEventLayer(prefectureData.events || prefectureData.eventData || generateEventData(selectedPrefecture));
      updateConsumptionLayer(prefectureData.consumption || generateConsumptionData(selectedPrefecture));
      updateHeatmapLayer(prefectureData.heatmap || generateHeatmapData(selectedPrefecture));
      updatePlateauLayer();
      
      // 人流データは実データが来るまで表示しない（ダミーデータを表示しない）
      // setRealMobilityData(null) を設定して、CyberFlowLayerがダミーデータを表示しないようにする
      setRealMobilityData(null);
      
      setRealDataLoaded(true);
    }
    
    try {
      // APIデータをタイムアウト付きで取得（バックグラウンド）
      const loadWithTimeout = (promise, timeout = 60000) => {  // 60秒に延長（API処理に時間がかかるため）
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
      };
      
      // 並列でデータ読み込み（タイムアウト付き）
      const [gtfsData, tourismData, accommodationData, mobilityData, eventData, transportData] = await Promise.all([
        selectedPrefecture === '広島県' ? loadWithTimeout(loadHiroshimaGTFSData()).catch(() => null) : Promise.resolve(null),
        selectedPrefecture === '山口県' ? loadWithTimeout(loadYamaguchiTourismData()).catch(() => null) : Promise.resolve(null),
        loadWithTimeout(loadRealAccommodationData(selectedPrefecture)).catch(() => null),
        // 最初は市内のみ読み込み（広島県の場合）
        loadWithTimeout(
          loadRealMobilityData(selectedPrefecture, selectedPrefecture === '広島県'), 
          30000
        ).then(data => {
          console.log('loadRealMobilityData result (city only):', data);
          // 段階的読み込み：市内データを先に設定
          if (data && selectedPrefecture === '広島県') {
            setRealMobilityData(data);
            // 全県データを背景で読み込み
            loadRealMobilityData(selectedPrefecture, false).then(fullData => {
              console.log('Full prefecture data loaded:', fullData);
              if (fullData) {
                setRealMobilityData(fullData);
              }
            }).catch(err => console.error('Failed to load full data:', err));
          }
          return data;
        }).catch((error) => {
          console.error('Failed to load mobility data:', error);
          return null;
        }),
        loadWithTimeout(loadRealEventData(selectedPrefecture)).catch(() => null),
        loadWithTimeout(loadTransportData()).catch(() => null)
      ]);
      
      console.log('Loaded mobility data:', mobilityData);
      console.log('Is mobility data null?', mobilityData === null);
      console.log('Is mobility data undefined?', mobilityData === undefined);
      console.log('Loaded transport data:', transportData);
      console.log('All loaded data:', { gtfsData, tourismData, accommodationData, mobilityData, eventData, transportData });

      // Set state data immediately (don't wait for map)
      if (mobilityData) {
        console.log('Setting real mobility data');
        setRealMobilityData(mobilityData); // 実データを保存
      }
      if (transportData) {
        console.log('Setting transport data:', transportData);
        setTransportData(transportData); // Set transport data
      }
      
      // データをマップに適用 (only for direct map operations)
      if (map.current && mapLoaded) {
        // APIデータを取得できた場合のみ更新
        // Note: Transport layer is now handled by TransportLayer component, not updateTransportLayer
        // if (gtfsData && selectedPrefecture === '広島県') {
        //   updateTransportLayer(gtfsData);
        // }
        
        // 他のAPIデータも取得できた場合のみ更新
        if (accommodationData) {
          updateAccommodationLayer(accommodationData);
        }
        if (eventData) {
          updateEventLayer(eventData);
        }
      }
    } catch (error) {
      console.error('Failed to load real data:', error);
    }
  }, [selectedPrefecture, mapLoaded, prefectureData]);

  // マップ初期化
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const coords = prefectureCoordinates[selectedPrefecture];

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

      // 停留所マーカー（赤色に統一）
      map.current.addLayer({
        id: 'transport-stops',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF6B6B',  // 交通データは赤色に統一
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
          'fill-extrusion-color': '#4CAF50',  // 緑色に統一
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
          'text-color': '#4CAF50',  // 緑色に統一
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 13
      });
    }
  };

  // Mobility layer is now handled by CyberFlowLayer component

  const updateEventLayer = (eventData) => {
    const sourceId = 'events';
    
    // 各イベントに固定サイズを事前計算して追加
    const processedEventData = {
      ...eventData,
      features: eventData.features.map(feature => {
        const visitors = feature.properties.expected_visitors || 30000;
        let impactRadius, midRadius, innerRadius, markerRadius;
        
        if (visitors <= 10000) {
          impactRadius = 10;
          midRadius = 8;
          innerRadius = 6;
          markerRadius = 4;
        } else if (visitors <= 50000) {
          impactRadius = 30;
          midRadius = 24;
          innerRadius = 18;
          markerRadius = 12;
        } else if (visitors <= 100000) {
          impactRadius = 60;
          midRadius = 48;
          innerRadius = 36;
          markerRadius = 24;
        } else {
          impactRadius = 120;
          midRadius = 96;
          innerRadius = 72;
          markerRadius = 48;
        }
        
        return {
          ...feature,
          properties: {
            ...feature.properties,
            impact_radius: impactRadius,
            mid_radius: midRadius,
            inner_radius: innerRadius,
            marker_radius: markerRadius
          }
        };
      })
    };
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(processedEventData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: processedEventData
      });

      // イベント大グロー（最外周の光）
      map.current.addLayer({
        id: 'event-impact',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['get', 'impact_radius'],  // Pre-calculated fixed values
          'circle-color': '#FF6B6B',  // イベント情報の色に統一
          'circle-blur': 1.5,
          'circle-opacity': 0.08  // 固定の透明度
        }
      });

      // イベント中グロー
      map.current.addLayer({
        id: 'event-mid-glow',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['get', 'mid_radius'],  // Pre-calculated fixed values
          'circle-color': '#FF6B6B',
          'circle-blur': 1.2,
          'circle-opacity': 0.15  // 固定の透明度
        }
      });

      // イベント内グロー
      map.current.addLayer({
        id: 'event-inner-glow',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['get', 'inner_radius'],  // Pre-calculated fixed values
          'circle-color': '#FF6B6B',
          'circle-blur': 1,
          'circle-opacity': 0.25  // 固定の透明度
        }
      });

      // イベントマーカー（中心の光）
      map.current.addLayer({
        id: 'event-markers',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['get', 'marker_radius'],  // Pre-calculated fixed values
          'circle-color': '#FF6B6B',  // イベント情報の色に統一
          'circle-blur': 0.2,  // 中心はシャープに
          'circle-opacity': 0.05  // 中心部をさらに透明に（ほぼ透明）
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
    
    
    // Convert Point data to Polygon for 3D buildings that have height
    const createLandmarkPolygon = (center, radius = 0.0003) => {
      // Create a circular polygon (cylinder base)
      const coordinates = [[]];
      const steps = 16; // Number of points for the circle
      
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        coordinates[0].push([x, y]);
      }
      
      return coordinates;
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
          'circle-radius': 8,
          'circle-color': '#FFD700',  // 黄色に統一
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1,
          'circle-opacity': 0.9,
          'circle-blur': 0.8  // 光の表現を追加
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
          'fill-extrusion-opacity': 0.8  // 透明度を調整
        },
        minzoom: 12  // より広いズームレベルで表示
      });

      // ランドマークの光の表現（グローレイヤー）
      map.current.addLayer({
        id: 'landmarks-glow',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 30,  // 固定サイズ
          'circle-color': '#FFD700',
          'circle-opacity': 0.15,  // 固定透明度
          'circle-blur': 1.5  // 強いブラーで光の表現
        },
        minzoom: 12
      }, 'landmarks-3d');  // 3Dレイヤーの下に配置

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
    
    try {
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
    
    // PLATEAU 3D building data for Hiroshima - Office and Commercial buildings only
    // Hotels are moved to accommodation layer, cultural landmarks to landmarks layer
    const plateauPointData = {
      type: 'FeatureCollection',
      features: [
        // Office buildings and commercial (hotels moved to accommodation layer)
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4590, 34.3939] }, properties: { height: 95, floors: 24, name: '広島ビジネスタワー', type: 'office' }},
        { type: 'Feature', geometry: { type: 'Point', coordinates: [132.4610, 34.3935] }, properties: { height: 65, floors: 16, name: 'そごう広島店', type: 'commercial' }},
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

      // PLATEAU 3D建物（グレー色のオフィスビル）
      map.current.addLayer({
        id: 'plateau-3d',
        type: 'fill-extrusion',
        source: sourceId,
        paint: {
          'fill-extrusion-color': '#808080',  // グレー色（オフィスビル）
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            50  // Default height
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.6  // やや透明に
        }
      });

      // Remove existing click event listener before adding new one
      map.current.off('click', 'plateau-3d');
      
      // Add popup functionality for PLATEAU buildings
      map.current.on('click', 'plateau-3d', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        if (!feature.geometry || !feature.geometry.coordinates) return;
        
        const coordinates = feature.geometry.coordinates[0];
        const properties = feature.properties || {};
        
        // Calculate center of polygon
        let center;
        if (Array.isArray(coordinates) && coordinates.length > 0) {
          const bounds = coordinates.reduce((bounds, coord) => {
            return [
              [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
              [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
            ];
          }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
          
          center = [
            (bounds[0][0] + bounds[1][0]) / 2,
            (bounds[0][1] + bounds[1][1]) / 2
          ];
        } else {
          // Fallback to click location
          center = e.lngLat.toArray();
        }
        
        const popupContent = `
          <div style="
            min-width: 200px;
            padding: 12px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid #808080;
            border-radius: 8px;
            font-family: 'DIN Pro Medium', 'Arial Unicode MS Regular', sans-serif;
          ">
            <h3 style="margin: 0 0 8px 0; color: #808080; font-size: 16px;">${properties.name || '建物'}</h3>
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
      
      // Remove existing event listeners before adding new ones
      map.current.off('mouseenter', 'plateau-3d');
      map.current.off('mouseleave', 'plateau-3d');
      
      // Change cursor on hover
      map.current.on('mouseenter', 'plateau-3d', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'plateau-3d', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
    } catch (error) {
      console.error('Error updating PLATEAU layer:', error);
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
    
    
    // Remove existing layer
    if (map.current.getLayer('sns-heatmap')) {
      map.current.removeLayer('sns-heatmap');
    }
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(filteredData);
      
      // レイヤーが削除されている場合は再作成
      if (!map.current.getLayer('sns-heatmap')) {
        createHeatmapLayers();
      }
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: filteredData
      });
      createHeatmapLayers();
    }
    
    function createHeatmapLayers() {
      // ダミーデータ時と同じheatmapタイプを使用
      map.current.addLayer({
        id: 'sns-heatmap',
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': 0.5,
          'heatmap-intensity': {
            stops: [[11, 1], [15, 3]]
          },
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
          'heatmap-radius': {
            stops: [[11, 20], [15, 30]]
          },
          'heatmap-opacity': 0.9
        }
      });
      
    }
  };

  // Mobility animation is now handled by CyberFlowLayer component

  // レイヤー表示/非表示の更新
  const updateLayerVisibility = useCallback(() => {
    if (!map.current || !mapLoaded) {
      return;
    }
    

    const layerMapping = {
      landmarks: ['landmarks-points', 'landmarks-3d', 'landmarks-glow', 'landmarks-labels', 'transport-stops', 'transport-labels', 'plateau-3d'],
      accommodation: ['accommodation-3d', 'accommodation-labels'],
      mobility: ['cyber-particles-glow', 'cyber-particles-mid-glow', 'cyber-particles-inner-glow', 'cyber-particles', 'cyber-flow-lines-glow', 'cyber-flow-lines'],
      heatmap: ['sns-heatmap'],
      events: ['event-impact', 'event-mid-glow', 'event-inner-glow', 'event-markers', 'event-labels'],
      consumption: ['consumption-3d']
    };

    Object.entries(layerMapping).forEach(([key, layerIds]) => {
      const visibility = layers[key] ? 'visible' : 'none';
      layerIds.forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', visibility);
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
          {(() => {
            // 実データのみ表示（ダミーデータは表示しない）
            const shouldShowCyberFlow = mapLoaded && map.current && realMobilityData;
            const dataToUse = realMobilityData; // 実データのみ使用
            const dataKey = realMobilityData ? 'real' : 'no-data';
            
            
            if (shouldShowCyberFlow) {
              return (
                <CyberFlowLayer
                  map={map.current}
                  mobilityData={dataToUse}
                  visible={layers.mobility}
                />
              );
            }
            return null;
          })()}
          
          {/* TransportLayer for public transportation */}
          {(() => {
            console.log('TransportLayer render check:', {
              mapLoaded,
              hasMap: !!map.current,
              hasTransportData: !!transportData,
              transportDataType: transportData?.type,
              stopsCount: transportData?.stops?.length,
              routesCount: transportData?.routes?.length,
              layersTransport: layers.transport
            });
            
            if (mapLoaded && map.current && transportData) {
              return (
                <TransportLayer
                  map={map.current}
                  transportData={transportData}
                  visible={layers.transport}
                />
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
};

export default MapWithRealData;