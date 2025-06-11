import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapEnhanced.css';

// Mapbox token validation and setup
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is not set. Please check your .env.local file.');
}
mapboxgl.accessToken = MAPBOX_TOKEN;

// エラー境界コンポーネント
export class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>マップの読み込みに問題が発生しました</h3>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>ページを再読み込み</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// メインマップコンポーネント
const MapEnhancedStable = ({ 
  layers, 
  categoryFilter, 
  selectedPrefecture = '広島県',
  dataCache,
  leftSidebarOpen,
  rightSidebarOpen,
  loading
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const layersInitialized = useRef(false);
  const currentPrefecture = useRef(selectedPrefecture);

  // マップ初期化の安全な実行
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Mapboxトークンの最終確認
      if (!mapboxgl.accessToken) {
        throw new Error('Mapbox access token is missing');
      }

      // 都道府県ごとの初期座標
      const prefectureCoordinates = {
        '広島県': { center: [132.4597, 34.3966], zoom: 11 },
        '山口県': { center: [131.4705, 34.1858], zoom: 10 },
        '福岡県': { center: [130.4017, 33.6064], zoom: 11 },
        '大阪府': { center: [135.5202, 34.6863], zoom: 11 },
        '東京都': { center: [139.6917, 35.6895], zoom: 11 }
      };

      const coords = prefectureCoordinates[selectedPrefecture] || prefectureCoordinates['広島県'];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: coords.center,
        zoom: coords.zoom,
        pitch: 45,
        bearing: 0,
        antialias: true,
        failIfMajorPerformanceCaveat: false
      });

      // マップイベントの設定
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError(e.error?.message || 'Map loading error');
      });

      // ナビゲーションコントロール
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(error.message);
    }
  }, [selectedPrefecture]);

  // レイヤーの初期化（エラーハンドリング強化版）
  const initializeAllLayers = useCallback(() => {
    if (!map.current || !mapLoaded || layersInitialized.current) return;

    try {
      layersInitialized.current = true;
      console.log('Initializing all layers...');

      // データの存在確認
      const prefData = dataCache?.current?.prefectureData?.[currentPrefecture.current];
      if (!prefData) {
        console.warn(`No data available for ${currentPrefecture.current}`);
        return;
      }

      // 各レイヤーの初期化（個別のtry-catchで保護）
      const layerInitializers = [
        { name: 'landmarks', fn: () => initializeLandmarkLayers(prefData) },
        { name: 'hotels', fn: () => initializeHotelLayers(prefData) },
        { name: 'mobility', fn: () => initializeMobilityLayers(prefData) },
        { name: 'consumption', fn: () => initializeConsumptionLayers(prefData) },
        { name: 'heatmap', fn: () => initializeHeatmapLayers(prefData) },
        { name: 'events', fn: () => initializeEventLayers(prefData) },
        { name: 'weather', fn: () => initializeWeatherLayers(prefData) }
      ];

      layerInitializers.forEach(({ name, fn }) => {
        try {
          fn();
          console.log(`✓ ${name} layer initialized`);
        } catch (error) {
          console.error(`✗ Failed to initialize ${name} layer:`, error);
        }
      });

      // 初期表示設定
      updateLayerVisibility();
      
    } catch (error) {
      console.error('Failed to initialize layers:', error);
      layersInitialized.current = false;
    }
  }, [mapLoaded, dataCache]);

  // レイヤー表示/非表示の更新
  const updateLayerVisibility = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    const layerRegistry = {
      landmarks: ['landmarks-3d', 'landmarks-labels'],
      hotels: ['hotels-3d', 'hotels-labels'],
      mobility: ['mobility-particles', 'mobility-flows'],
      consumption: ['consumption-3d'],
      heatmap: ['sns-heatmap', 'sns-grid'],
      events: ['events', 'events-labels', 'events-range'],
      weather: ['weather-overlay']
    };

    Object.entries(layerRegistry).forEach(([key, layerIds]) => {
      const visibility = layers[key] ? 'visible' : 'none';
      layerIds.forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    });
  }, [layers, mapLoaded]);

  // 各レイヤーの初期化関数（エラーハンドリング付き）
  const initializeLandmarkLayers = (prefData) => {
    if (!prefData.landmarks?.features?.length) {
      throw new Error('No landmark data available');
    }

    // ソースの追加（既存チェック付き）
    if (!map.current.getSource('landmarks')) {
      map.current.addSource('landmarks', {
        type: 'geojson',
        data: prefData.landmarks
      });
    }

    // 3Dランドマーク
    if (!map.current.getLayer('landmarks-3d')) {
      map.current.addLayer({
        id: 'landmarks-3d',
        type: 'fill-extrusion',
        source: 'landmarks',
        paint: {
          'fill-extrusion-color': '#FFD700',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });
    }

    // ラベル
    if (!map.current.getLayer('landmarks-labels')) {
      map.current.addLayer({
        id: 'landmarks-labels',
        type: 'symbol',
        source: 'landmarks',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'bottom'
        },
        paint: {
          'text-color': '#FFD700',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }
  };

  const initializeHotelLayers = (prefData) => {
    if (!prefData.hotels?.features?.length) {
      throw new Error('No hotel data available');
    }

    if (!map.current.getSource('hotels')) {
      map.current.addSource('hotels', {
        type: 'geojson',
        data: prefData.hotels
      });
    }

    if (!map.current.getLayer('hotels-3d')) {
      map.current.addLayer({
        id: 'hotels-3d',
        type: 'fill-extrusion',
        source: 'hotels',
        paint: {
          'fill-extrusion-color': '#4A90E2',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        }
      });
    }

    if (!map.current.getLayer('hotels-labels')) {
      map.current.addLayer({
        id: 'hotels-labels',
        type: 'symbol',
        source: 'hotels',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'bottom'
        },
        paint: {
          'text-color': '#4A90E2',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        minzoom: 12
      });
    }
  };

  const initializeMobilityLayers = (prefData) => {
    if (!prefData.mobility?.particles?.features?.length) {
      throw new Error('No mobility data available');
    }

    // パーティクル
    if (!map.current.getSource('mobility-particles')) {
      map.current.addSource('mobility-particles', {
        type: 'geojson',
        data: prefData.mobility.particles
      });
    }

    if (!map.current.getLayer('mobility-particles')) {
      map.current.addLayer({
        id: 'mobility-particles',
        type: 'circle',
        source: 'mobility-particles',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 2,
            14, 6
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-blur': 0.5
        }
      });
    }

    // フロー
    if (prefData.mobility.flows?.features?.length) {
      if (!map.current.getSource('mobility-flows')) {
        map.current.addSource('mobility-flows', {
          type: 'geojson',
          data: prefData.mobility.flows
        });
      }

      if (!map.current.getLayer('mobility-flows')) {
        map.current.addLayer({
          id: 'mobility-flows',
          type: 'line',
          source: 'mobility-flows',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 3,
            'line-opacity': 0.6
          }
        });
      }
    }
  };

  const initializeConsumptionLayers = (prefData) => {
    if (!prefData.consumption?.features?.length) {
      throw new Error('No consumption data available');
    }

    if (!map.current.getSource('consumption')) {
      map.current.addSource('consumption', {
        type: 'geojson',
        data: prefData.consumption
      });
    }

    if (!map.current.getLayer('consumption-3d')) {
      map.current.addLayer({
        id: 'consumption-3d',
        type: 'fill-extrusion',
        source: 'consumption',
        paint: {
          'fill-extrusion-color': '#27AE60',
          'fill-extrusion-height': ['get', 'value'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.6
        }
      });
    }
  };

  const initializeHeatmapLayers = (prefData) => {
    if (!prefData.heatmap?.features?.length) {
      throw new Error('No heatmap data available');
    }

    // カテゴリフィルタリング
    const filteredData = categoryFilter ? {
      ...prefData.heatmap,
      features: prefData.heatmap.features.filter(f => 
        f.properties.category === categoryFilter
      )
    } : prefData.heatmap;

    if (!map.current.getSource('sns-heatmap')) {
      map.current.addSource('sns-heatmap', {
        type: 'geojson',
        data: filteredData
      });
    } else {
      map.current.getSource('sns-heatmap').setData(filteredData);
    }

    if (!map.current.getLayer('sns-heatmap')) {
      map.current.addLayer({
        id: 'sns-heatmap',
        type: 'heatmap',
        source: 'sns-heatmap',
        paint: {
          'heatmap-weight': ['get', 'intensity'],
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

  const initializeEventLayers = (prefData) => {
    if (!prefData.events?.features?.length) {
      throw new Error('No event data available');
    }

    if (!map.current.getSource('events')) {
      map.current.addSource('events', {
        type: 'geojson',
        data: prefData.events
      });
    }

    // イベントマーカー
    if (!map.current.getLayer('events')) {
      map.current.addLayer({
        id: 'events',
        type: 'symbol',
        source: 'events',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 1.5,
          'icon-allow-overlap': true
        }
      });
    }

    // イベントラベル
    if (!map.current.getLayer('events-labels')) {
      map.current.addLayer({
        id: 'events-labels',
        type: 'symbol',
        source: 'events',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'bottom'
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }

    // 影響範囲
    if (!map.current.getLayer('events-range')) {
      map.current.addLayer({
        id: 'events-range',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-radius': 50,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.1
        }
      });
    }
  };

  const initializeWeatherLayers = (prefData) => {
    if (!prefData.weather) {
      console.log('Weather data not available');
      return;
    }
    // 天気オーバーレイの実装（必要に応じて）
  };

  // マップのリサイズ処理
  const handleResize = useCallback(() => {
    if (map.current && mapLoaded) {
      setTimeout(() => {
        map.current.resize();
      }, 350); // サイドバーアニメーション後
    }
  }, [mapLoaded]);

  // 初期化エフェクト
  useEffect(() => {
    if (!loading) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      layersInitialized.current = false;
      setMapLoaded(false);
    };
  }, [loading, initializeMap]);

  // レイヤー初期化エフェクト
  useEffect(() => {
    if (mapLoaded && dataCache?.current?.prefectureData) {
      // マップスタイルの完全読み込みを待つ
      const waitForStyle = () => {
        if (map.current.isStyleLoaded()) {
          initializeAllLayers();
        } else {
          setTimeout(waitForStyle, 100);
        }
      };
      waitForStyle();
    }
  }, [mapLoaded, dataCache, initializeAllLayers]);

  // レイヤー表示更新エフェクト
  useEffect(() => {
    updateLayerVisibility();
  }, [layers, updateLayerVisibility]);

  // カテゴリフィルター更新エフェクト
  useEffect(() => {
    if (mapLoaded && map.current.getSource('sns-heatmap') && dataCache?.current?.prefectureData) {
      const prefData = dataCache.current.prefectureData[currentPrefecture.current];
      if (prefData?.heatmap) {
        const filteredData = categoryFilter ? {
          ...prefData.heatmap,
          features: prefData.heatmap.features.filter(f => 
            f.properties.category === categoryFilter
          )
        } : prefData.heatmap;
        
        map.current.getSource('sns-heatmap').setData(filteredData);
      }
    }
  }, [categoryFilter, mapLoaded, dataCache]);

  // サイドバー開閉時のリサイズ
  useEffect(() => {
    handleResize();
  }, [leftSidebarOpen, rightSidebarOpen, handleResize]);

  // 都道府県切り替え時の処理
  useEffect(() => {
    if (mapLoaded && selectedPrefecture !== currentPrefecture.current) {
      currentPrefecture.current = selectedPrefecture;
      
      // 座標移動
      const prefectureCoordinates = {
        '広島県': { center: [132.4597, 34.3966], zoom: 11 },
        '山口県': { center: [131.4705, 34.1858], zoom: 10 },
        '福岡県': { center: [130.4017, 33.6064], zoom: 11 },
        '大阪府': { center: [135.5202, 34.6863], zoom: 11 },
        '東京都': { center: [139.6917, 35.6895], zoom: 11 }
      };

      const coords = prefectureCoordinates[selectedPrefecture];
      if (coords) {
        map.current.flyTo({
          center: coords.center,
          zoom: coords.zoom,
          duration: 2000
        });
      }

      // レイヤーを再初期化
      layersInitialized.current = false;
      setTimeout(() => {
        initializeAllLayers();
      }, 2100);
    }
  }, [selectedPrefecture, mapLoaded, initializeAllLayers]);

  return (
    <div className="map-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {mapError && (
        <div className="map-error-message" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <h4>マップエラー</h4>
          <p>{mapError}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      )}
      <div 
        ref={mapContainer} 
        id="map-container-stable"
        className="map-container" 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default MapEnhancedStable;