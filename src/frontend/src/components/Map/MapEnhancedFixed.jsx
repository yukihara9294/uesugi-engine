/**
 * Uesugi Engine - マップコンポーネント（拡張版）
 * 3D表示と高度なデータ可視化を実装
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, CircularProgress, Typography } from '@mui/material';
import { 
  generateAllPrefectureData,
  getPrefectureBounds,
  generateInterPrefectureMobilityRoutes
} from '../../utils/multiPrefectureDataGenerator';
import { 
  safeGet, 
  safeMultiply, 
  safeDivide, 
  safeInterpolate, 
  safeMatch,
  safeFilter,
  safeCompoundFilter
} from '../../utils/mapboxExpressionHelpers';

// Mapbox access token from environment variable
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoieXVraWhhcmE5Mjk0IiwiYSI6ImNtYmh1MG1kbTAxOHYyanBseWMyYzU0bzgifQ.qXWlSlsfZfHWKWJ1JPdvOg';
console.log('Mapbox token loaded:', MAPBOX_TOKEN ? 'Token present' : 'No token');
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapEnhancedFixed = forwardRef(({ 
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
}, ref) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const animationFrame = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [layersInitialized, setLayersInitialized] = useState(false);
  const layersInitializedRef = useRef(false);
  const layerRegistry = useRef({});
  const mobilityAnimationData = useRef(null);
  
  // Detect current prefecture from viewport or map center
  const detectCurrentPrefecture = (customCenter = null) => {
    let lng, lat;
    
    if (customCenter) {
      lng = customCenter.lng || customCenter[0];
      lat = customCenter.lat || customCenter[1];
    } else if (map.current) {
      const center = map.current.getCenter();
      lng = center.lng;
      lat = center.lat;
    } else {
      lng = viewport.longitude;
      lat = viewport.latitude;
    }
    
    // Tokyo area
    if (lng >= 139.5 && lng <= 140.0 && lat >= 35.5 && lat <= 35.9) {
      return '東京都';
    }
    // Osaka area
    else if (lng >= 135.3 && lng <= 135.7 && lat >= 34.5 && lat <= 34.9) {
      return '大阪府';
    }
    // Fukuoka area
    else if (lng >= 130.2 && lng <= 130.6 && lat >= 33.4 && lat <= 33.7) {
      return '福岡県';
    }
    // Hiroshima area (default)
    else {
      return '広島県';
    }
  };
  
  // Get viewport bounds for data filtering
  const getViewportBounds = () => {
    if (!map.current) return null;
    
    const bounds = map.current.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  };
  
  // Check if a point is within viewport bounds (with buffer)
  const isPointInViewport = (coordinates, bounds, buffer = 0.1) => {
    if (!bounds) return true; // If no bounds, show all
    
    return coordinates[0] >= bounds.west - buffer &&
           coordinates[0] <= bounds.east + buffer &&
           coordinates[1] >= bounds.south - buffer &&
           coordinates[1] <= bounds.north + buffer;
  };
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    flyToCenter: (center, zoom) => {
      console.log('flyToCenter called with:', { center, zoom, mapLoaded, hasMap: !!map.current });
      
      if (!map.current) {
        console.warn('Map instance not available');
        return;
      }
      
      if (!mapLoaded) {
        console.warn('Map not loaded yet, queuing flyTo request');
        // Queue the request to be executed once map is loaded
        const checkMapLoaded = setInterval(() => {
          if (map.current && mapLoaded) {
            clearInterval(checkMapLoaded);
            performFlyTo();
          }
        }, 100);
        
        // Clear interval after 5 seconds to prevent memory leak
        setTimeout(() => clearInterval(checkMapLoaded), 5000);
        return;
      }
      
      const performFlyTo = () => {
        try {
          // Get current position
          const currentCenter = map.current.getCenter();
          const currentZoom = map.current.getZoom();
          
          console.log('Performing flyTo from:', { 
            from: [currentCenter.lng, currentCenter.lat, currentZoom], 
            to: [center[0], center[1], zoom] 
          });
          
          // Calculate distance for duration
          const distance = Math.sqrt(
            Math.pow(center[0] - currentCenter.lng, 2) + 
            Math.pow(center[1] - currentCenter.lat, 2)
          );
          
          // Adjust duration based on distance (min 1.5s, max 3s)
          const duration = Math.min(3000, Math.max(1500, distance * 10000));
          
          map.current.flyTo({
            center: center,
            zoom: zoom,
            bearing: 0, // Reset to north
            pitch: 45, // Keep 3D view
            duration: duration,
            essential: true,
            curve: 1.42, // Smooth curve
            speed: 1.2,
            easing: (t) => t // Linear easing for consistent speed
          });
          
          console.log('FlyTo animation started');
        } catch (error) {
          console.error('Error in flyToCenter:', error);
        }
      };
      
      performFlyTo();
    }
  }), [mapLoaded]);
  
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
  
  // Get current prefecture
  const currentPrefecture = detectCurrentPrefecture();
  
  // Generate prefecture data based on current location
  if (!dataCache.current.prefectureData || dataCache.current.currentPrefecture !== currentPrefecture) {
    console.log('Generating prefecture data for:', currentPrefecture);
    try {
      dataCache.current.prefectureData = generateAllPrefectureData(currentPrefecture);
      dataCache.current.currentPrefecture = currentPrefecture;
      console.log('Prefecture data generated successfully:', {
        prefecture: currentPrefecture,
        hasHeatmap: !!dataCache.current.prefectureData?.heatmap,
        heatmapCount: dataCache.current.prefectureData?.heatmap?.length || 0,
        hasLandmarks: !!dataCache.current.prefectureData?.landmarks,
        landmarksCount: dataCache.current.prefectureData?.landmarks?.length || 0,
        hasBounds: !!dataCache.current.prefectureData?.bounds,
        hasMobility: !!dataCache.current.prefectureData?.mobility,
        mobilityRoutesCount: dataCache.current.prefectureData?.mobility?.routes?.length || 0
      });
    } catch (error) {
      console.error('Error generating prefecture data:', error);
      // Fallback to Hiroshima if there's an error
      dataCache.current.prefectureData = generateAllPrefectureData('広島県');
      dataCache.current.currentPrefecture = '広島県';
    }
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
  
  // Comprehensive cleanup function to remove all layers and sources
  const cleanupAllLayers = () => {
    console.log('Cleaning up all layers and sources...');
    
    // Stop animations first
    stopAnimations();
    
    // Remove all registered layers
    Object.keys(layerRegistry.current).forEach(layerId => {
      if (map.current && map.current.getLayer(layerId)) {
        try {
          map.current.removeLayer(layerId);
          console.log(`Removed layer: ${layerId}`);
        } catch (e) {
          console.warn(`Failed to remove layer ${layerId}:`, e);
        }
      }
    });
    
    // List of all possible sources
    const allSources = [
      'heatmap-source',
      'landmarks-source',
      'landmarks-buildings-source',
      'accommodation-source',
      'consumption-source',
      'mobility-hubs-source',
      'mobility-arcs-source',
      'mobility-particles-source',
      'mobility-trails-source',
      'mobility-pulse-source',
      'mobility-grid-source',
      'events-source',
      'events-impact-source'
    ];
    
    // Remove all sources
    allSources.forEach(sourceId => {
      if (map.current && map.current.getSource(sourceId)) {
        try {
          map.current.removeSource(sourceId);
          console.log(`Removed source: ${sourceId}`);
        } catch (e) {
          console.warn(`Failed to remove source ${sourceId}:`, e);
        }
      }
    });
    
    // Clear registries and reset state
    layerRegistry.current = {};
    mobilityAnimationData.current = null;
    layersInitializedRef.current = false;
    setLayersInitialized(false);
    
    console.log('Cleanup completed');
  };

  // Stop any running animations
  const stopAnimations = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };
  
  // Safely add a layer, checking if it already exists
  const safeAddLayer = (layerConfig) => {
    if (!map.current.getLayer(layerConfig.id)) {
      try {
        map.current.addLayer(layerConfig);
        console.log(`Added layer: ${layerConfig.id}`);
      } catch (e) {
        console.error(`Failed to add layer ${layerConfig.id}:`, e);
      }
    } else {
      console.log(`Layer ${layerConfig.id} already exists, skipping`);
    }
  };

  const toggleLayerVisibility = (layerId, visible) => {
    console.log(`toggleLayerVisibility called for ${layerId}, visible: ${visible}`);
    if (map.current && map.current.getLayer(layerId)) {
      console.log(`Setting ${layerId} visibility to ${visible ? 'visible' : 'none'}`);
      map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      
      // Ensure particle layers are on top when made visible
      if (visible && layerId.includes('particles')) {
        try {
          map.current.moveLayer(layerId);
        } catch (e) {
          // Layer order might be fine already
        }
      }
    } else {
      console.warn(`Layer ${layerId} not found on map`);
    }
  };

  const isLayerVisible = (layerType) => {
    return selectedLayers.includes(layerType);
  };

  // SNS感情分析レイヤーの初期化
  const initializeHeatmapLayers = () => {
    // Ensure prefecture data exists
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.heatmap) {
      console.error('Prefecture data or heatmap data is missing');
      return;
    }
    
    // Use prefecture data
    const heatmapPoints = dataCache.current.prefectureData.heatmap;
    const viewportBounds = getViewportBounds();
    
    // Filter points based on viewport
    const filteredPoints = viewportBounds ? 
      heatmapPoints.filter(p => isPointInViewport(p.coordinates, viewportBounds)) :
      heatmapPoints;
    
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

    // Check if source already exists
    if (!map.current.getSource('heatmap-source')) {
      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
      });
    } else {
      console.log('heatmap-source already exists, updating data');
      map.current.getSource('heatmap-source').setData({ type: 'FeatureCollection', features });
    }

    // サイバーヒートマップ
    if (!map.current.getLayer('cyber-heatmap')) {
      map.current.addLayer({
        id: 'cyber-heatmap',
        type: 'heatmap',
        source: 'heatmap-source',
        layout: {
          visibility: 'none'
        },
      paint: {
        'heatmap-weight': safeGet('intensity', 0.5),
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
    }
    registerLayer('cyber-heatmap', 'heatmap');

    // パーティクルエフェクト
    safeAddLayer({
      id: 'cyber-particles',
      type: 'circle',
      source: 'heatmap-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'circle-radius': 2,
        'circle-color': safeMatch(
          ['get', 'category'],
          ['観光', '#00FFFF',
          'グルメ', '#FF00FF',
          'ショッピング', '#FFFF00',
          'イベント', '#00FF00',
          '交通', '#FF0080'],
          '#FFFFFF'
        ),
        'circle-opacity': 0.8,
        'circle-blur': 0.5
      }
    });
    registerLayer('cyber-particles', 'heatmap');
  };

  // ランドマークレイヤーの初期化
  const initializeLandmarkLayers = () => {
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.landmarks) {
      console.error('Prefecture data or landmarks data is missing');
      return;
    }
    
    const landmarks = dataCache.current.prefectureData.landmarks;

    // ポイントソース
    const landmarksData = {
      type: 'FeatureCollection',
      features: landmarks.map(l => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: l.coordinates },
        properties: { name: l.name, height: l.height }
      }))
    };
    
    if (!map.current.getSource('landmarks-source')) {
      map.current.addSource('landmarks-source', {
        type: 'geojson',
        data: landmarksData
      });
    } else {
      console.log('landmarks-source already exists, updating data');
      map.current.getSource('landmarks-source').setData(landmarksData);
    }

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

    const buildingsData = { type: 'FeatureCollection', features: buildingFeatures };
    
    if (!map.current.getSource('landmarks-buildings-source')) {
      map.current.addSource('landmarks-buildings-source', {
        type: 'geojson',
        data: buildingsData
      });
    } else {
      console.log('landmarks-buildings-source already exists, updating data');
      map.current.getSource('landmarks-buildings-source').setData(buildingsData);
    }

    // 3D建物レイヤー
    safeAddLayer({
      id: 'landmarks-3d',
      type: 'fill-extrusion',
      source: 'landmarks-buildings-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': safeGet('color', '#FFFFFF'),
        'fill-extrusion-height': safeGet('height', 20),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9
      }
    });
    registerLayer('landmarks-3d', 'landmarks');

    // ラベルレイヤー
    safeAddLayer({
      id: 'landmarks-labels',
      type: 'symbol',
      source: 'landmarks-source',
      layout: {
        visibility: 'none',
        'text-field': safeGet('name', ''),
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
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.accommodation) {
      console.error('Prefecture data or accommodation data is missing');
      return;
    }
    
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

    const accommodationData = { type: 'FeatureCollection', features: accommodationFeatures };
    
    if (!map.current.getSource('accommodation-source')) {
      map.current.addSource('accommodation-source', {
        type: 'geojson',
        data: accommodationData
      });
    } else {
      console.log('accommodation-source already exists, updating data');
      map.current.getSource('accommodation-source').setData(accommodationData);
    }

    // 3D棒グラフ
    safeAddLayer({
      id: 'accommodation-3d',
      type: 'fill-extrusion',
      source: 'accommodation-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': colors.accommodation,
        'fill-extrusion-height': safeGet('height', 20),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
    registerLayer('accommodation-3d', 'accommodation');
  };

  // 消費データレイヤーの初期化
  const initializeConsumptionLayers = () => {
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.consumption) {
      console.error('Prefecture data or consumption data is missing');
      return;
    }
    
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
          // Height represents spending amount - tourist areas are 20x taller
          height: Math.sqrt(c.amount) / 50, // Adjusted for larger amounts
          color: colors.consumption,
          isTouristArea: c.isTouristArea
        }
      };
    });

    const consumptionDataFeatures = { type: 'FeatureCollection', features: consumptionFeatures };
    
    if (!map.current.getSource('consumption-source')) {
      map.current.addSource('consumption-source', {
        type: 'geojson',
        data: consumptionDataFeatures
      });
    } else {
      console.log('consumption-source already exists, updating data');
      map.current.getSource('consumption-source').setData(consumptionDataFeatures);
    }

    // 3D棒グラフ（縦方向）
    safeAddLayer({
      id: 'consumption-3d',
      type: 'fill-extrusion',
      source: 'consumption-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': colors.consumption,
        'fill-extrusion-height': safeGet('height', 20),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
    registerLayer('consumption-3d', 'consumption');
  };

  // 人流データレイヤーの初期化 - Optimized for Zoom 14
  const initializeMobilityLayers = () => {
    console.log('Initializing mobility layers for prefecture:', currentPrefecture);
    if (!dataCache.current.prefectureData || 
        !dataCache.current.prefectureData.mobility ||
        !dataCache.current.prefectureData.landmarks ||
        !dataCache.current.prefectureData.events ||
        !dataCache.current.prefectureData.accommodation ||
        !dataCache.current.prefectureData.heatmap) {
      console.error('Prefecture data or required sub-data is missing');
      return;
    }
    
    const mobilityData = dataCache.current.prefectureData.mobility;
    const routes = mobilityData.routes;
    console.log('Mobility data:', { 
      hasRoutes: !!routes, 
      routesCount: routes?.length || 0,
      firstRoute: routes?.[0] 
    });
    const landmarks = dataCache.current.prefectureData.landmarks;
    const events = dataCache.current.prefectureData.events;
    const accommodations = dataCache.current.prefectureData.accommodation;
    const heatmapData = dataCache.current.prefectureData.heatmap;
    
    // Add inter-prefecture routes (Shinkansen, highways, etc.)
    const interPrefectureRoutes = generateInterPrefectureMobilityRoutes();

    // Flow density color scheme - traffic light colors
    const getCyberColor = (congestion, opacity = 1) => {
      if (congestion >= 0.8) return `rgba(255, 50, 50, ${opacity})`; // Red for high traffic
      if (congestion >= 0.6) return `rgba(255, 150, 0, ${opacity})`; // Orange for medium-high
      if (congestion >= 0.4) return `rgba(255, 255, 0, ${opacity})`; // Yellow for medium
      if (congestion >= 0.2) return `rgba(100, 255, 100, ${opacity})`; // Light green for low-medium
      return `rgba(0, 200, 255, ${opacity})`; // Light blue for low traffic
    };

    // Get movement type color
    const getMovementTypeColor = (type, opacity = 1) => {
      switch(type) {
        case 'tourism': return `rgba(255, 200, 0, ${opacity})`; // Gold for tourism
        case 'business': return `rgba(0, 150, 255, ${opacity})`; // Blue for business
        case 'shopping': return `rgba(255, 0, 200, ${opacity})`; // Pink for shopping
        case 'event': return `rgba(0, 255, 100, ${opacity})`; // Green for events
        case 'sns_hotspot': return `rgba(255, 100, 0, ${opacity})`; // Orange for SNS activity
        default: return `rgba(100, 100, 255, ${opacity})`; // Default blue
      }
    };

    // Major transportation hubs with glowing orbs
    const majorHubs = [
      { name: '広島駅', coordinates: [132.4755, 34.3978], importance: 1.0, type: 'transport' },
      { name: '広島空港', coordinates: [132.9194, 34.4364], importance: 0.9, type: 'transport' },
      { name: '福山駅', coordinates: [133.3627, 34.4858], importance: 0.8, type: 'transport' },
      { name: '尾道駅', coordinates: [133.1950, 34.4090], importance: 0.7, type: 'transport' },
      { name: '三原駅', coordinates: [133.0833, 34.4000], importance: 0.7, type: 'transport' },
      { name: '呉駅', coordinates: [132.5656, 34.2492], importance: 0.6, type: 'transport' }
    ];

    // Collect all data points for comprehensive connections
    const allDataPoints = [
      // Transportation hubs
      ...majorHubs,
      // Major landmarks (tourist destinations)
      ...landmarks.filter(l => l.height > 50).map(l => ({
        name: l.name,
        coordinates: l.coordinates,
        importance: 0.7,
        type: 'landmark'
      })),
      // Popular events
      ...events.filter(e => e.impact_radius > 30).map(e => ({
        name: e.name,
        coordinates: e.coordinates,
        importance: 0.6,
        type: 'event'
      })),
      // Major accommodations
      ...accommodations.filter(a => a.occupancy > 0.7).map(a => ({
        name: a.name,
        coordinates: a.coordinates,
        importance: 0.5,
        type: 'accommodation'
      })),
      // SNS hotspots
      ...heatmapData.filter(h => h.intensity > 0.7).slice(0, 10).map((h, i) => ({
        name: `SNSホットスポット${i + 1}`,
        coordinates: h.coordinates,
        importance: 0.4,
        type: 'sns_hotspot'
      }))
    ];

    // Create glowing hub orbs - smaller for zoom 14
    const hubFeatures = allDataPoints.map(hub => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: hub.coordinates },
      properties: {
        name: hub.name,
        importance: hub.importance,
        type: hub.type,
        radius: 8 + hub.importance * 12, // Smaller radius for zoom 14
        glowRadius: 15 + hub.importance * 25 // Smaller glow for zoom 14
      }
    }));

    const hubsData = { type: 'FeatureCollection', features: hubFeatures };
    
    if (!map.current.getSource('mobility-hubs-source')) {
      map.current.addSource('mobility-hubs-source', {
        type: 'geojson',
        data: hubsData
      });
    } else {
      console.log('mobility-hubs-source already exists, updating data');
      map.current.getSource('mobility-hubs-source').setData(hubsData);
    }

    // Outer glow for hubs - color coded by type
    safeAddLayer({
      id: 'mobility-hubs-glow',
      type: 'circle',
      source: 'mobility-hubs-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': safeGet('glowRadius', 15),
        'circle-color': safeMatch(
          ['get', 'type'],
          ['transport', 'rgba(0, 255, 255, 0.3)',
          'landmark', 'rgba(255, 215, 0, 0.3)',
          'event', 'rgba(0, 255, 100, 0.3)',
          'accommodation', 'rgba(76, 175, 80, 0.3)',
          'sns_hotspot', 'rgba(255, 100, 0, 0.3)'],
          'rgba(100, 100, 255, 0.3)'
        ),
        'circle-blur': 1,
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0.1,
          14, 0.3,
          15, 0.4
        ]
      }
    });
    registerLayer('mobility-hubs-glow', 'mobility');

    // Inner core for hubs - brighter colors by type
    safeAddLayer({
      id: 'mobility-hubs-core',
      type: 'circle',
      source: 'mobility-hubs-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': safeGet('radius', 10),
        'circle-color': safeMatch(
          ['get', 'type'],
          ['transport', 'rgba(255, 255, 255, 0.9)',
          'landmark', 'rgba(255, 215, 0, 0.9)',
          'event', 'rgba(0, 255, 100, 0.9)',
          'accommodation', 'rgba(76, 175, 80, 0.9)',
          'sns_hotspot', 'rgba(255, 100, 0, 0.9)'],
          'rgba(150, 150, 255, 0.9)'
        ),
        'circle-blur': 0.3,
        'circle-opacity': 0.8
      }
    });
    registerLayer('mobility-hubs-core', 'mobility');

    // Create 3D arcs between major points
    const createArc = (start, end, height = 0.1) => {
      const midpoint = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2
      ];
      
      const distance = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + 
        Math.pow(end[1] - start[1], 2)
      );
      
      // Generate arc points
      const arcPoints = [];
      const segments = 50;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = start[0] * (1 - t) * (1 - t) + 2 * midpoint[0] * (1 - t) * t + end[0] * t * t;
        const y = start[1] * (1 - t) * (1 - t) + 2 * midpoint[1] * (1 - t) * t + end[1] * t * t;
        
        // Add height variation for 3D effect (peak at midpoint)
        const arcHeight = Math.sin(t * Math.PI) * height * distance;
        
        arcPoints.push([x, y + arcHeight * 0.5]); // Offset Y for visual 3D effect
      }
      
      return arcPoints;
    };

    // Generate diverse arcs between all data points with varying densities
    const arcFeatures = [];
    
    // First, add the actual transportation routes from the mobility data
    if (routes && routes.length > 0) {
      console.log(`Adding ${routes.length} actual transportation routes for ${currentPrefecture}`);
      routes.forEach((route, index) => {
        // Create arc for each route segment
        const arcHeight = route.type === 'highway' ? 0.05 : route.type === 'subway' ? 0.02 : 0.08;
        const arcPoints = route.points.length === 2 
          ? createArc(route.points[0], route.points[1], arcHeight)
          : route.points; // Use the actual points if more than 2
        
        // Determine movement type based on route type
        let movementType = 'business';
        if (route.type === 'train' || route.type === 'subway') {
          movementType = 'business';
        } else if (route.type === 'highway') {
          movementType = 'tourism';
        }
        
        arcFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: arcPoints
          },
          properties: {
            startHub: route.name.split(':')[0] || route.name,
            endHub: route.name.split(':')[1] || route.name,
            startType: 'transport',
            endType: 'transport',
            importance: 0.8,
            congestion: route.congestion || 0.5,
            movementType: movementType,
            particleCount: Math.round(8 + route.congestion * 7),
            speed: route.flow_speed ? route.flow_speed / 50 : 0.7,
            flowDirection: 'forward',
            showGlowingArc: route.congestion > 0.7,
            distanceKm: 30, // Approximate
            distanceGroup: 1,
            isActualRoute: true,
            routeType: route.type,
            routeCategory: route.category || route.type
          }
        });
      });
    }
    const connectionTypes = [
      // Tourism routes: transport -> landmarks (high volume, medium speed)
      { from: 'transport', to: 'landmark', probability: 0.8, type: 'tourism', 
        congestionBase: 0.5, baseParticleCount: 6, speed: 0.7 },
      // Event attendance: transport/accommodation -> events (very high volume during events)
      { from: 'transport', to: 'event', probability: 0.7, type: 'event', 
        congestionBase: 0.7, baseParticleCount: 10, speed: 0.6 },
      { from: 'accommodation', to: 'event', probability: 0.6, type: 'event', 
        congestionBase: 0.6, baseParticleCount: 7, speed: 0.6 },
      // Shopping routes: accommodation -> SNS hotspots (medium volume, slow)
      { from: 'accommodation', to: 'sns_hotspot', probability: 0.5, type: 'shopping', 
        congestionBase: 0.4, baseParticleCount: 4, speed: 0.5 },
      // Business travel: transport -> accommodation (high volume during rush hours)
      { from: 'transport', to: 'accommodation', probability: 0.6, type: 'business', 
        congestionBase: 0.6, baseParticleCount: 8, speed: 0.8 },
      // Tourist movement: landmarks -> SNS hotspots (medium volume, very slow)
      { from: 'landmark', to: 'sns_hotspot', probability: 0.7, type: 'tourism', 
        congestionBase: 0.4, baseParticleCount: 5, speed: 0.4 },
      // Inter-transport connections (very high volume, fast)
      { from: 'transport', to: 'transport', probability: 0.9, type: 'business', 
        congestionBase: 0.8, baseParticleCount: 15, speed: 1.0 },
      // Event to landmark visits (low volume, slow)
      { from: 'event', to: 'landmark', probability: 0.5, type: 'tourism', 
        congestionBase: 0.3, baseParticleCount: 3, speed: 0.5 }
    ];

    // Create connections based on types - reduce to 60% for performance due to increased particles
    const connectionLimit = Math.floor(allDataPoints.length * allDataPoints.length * 0.6 / 2);
    let connectionCount = 0;
    
    for (let i = 0; i < allDataPoints.length && connectionCount < connectionLimit; i++) {
      for (let j = i + 1; j < allDataPoints.length && connectionCount < connectionLimit; j++) {
        const start = allDataPoints[i];
        const end = allDataPoints[j];
        
        // Find matching connection type
        const connType = connectionTypes.find(ct => 
          (ct.from === start.type && ct.to === end.type) ||
          (ct.from === end.type && ct.to === start.type)
        );
        
        if (connType && Math.random() < connType.probability * 0.6) { // Reduce probability by 40% for performance
          const importance = (start.importance + end.importance) / 2;
          const distance = Math.sqrt(
            Math.pow(end.coordinates[0] - start.coordinates[0], 2) + 
            Math.pow(end.coordinates[1] - start.coordinates[1], 2)
          );
          
          // Skip very long connections for cleaner visualization
          if (distance > 0.5) continue;
          
          // Calculate actual distance in km (rough approximation)
          const distanceKm = distance * 111; // 1 degree ≈ 111km
          
          // Skip lines shorter than 10km
          if (distanceKm < 10) continue;
          
          // Determine distance group for synchronized timing
          let distanceGroup;
          if (distanceKm < 20) {
            distanceGroup = 0; // 10-20km
          } else if (distanceKm < 40) {
            distanceGroup = 1; // 20-40km
          } else if (distanceKm < 60) {
            distanceGroup = 2; // 40-60km
          } else if (distanceKm < 100) {
            distanceGroup = 3; // 60-100km
          } else if (distanceKm < 200) {
            distanceGroup = 4; // 100-200km
          } else if (distanceKm < 500) {
            distanceGroup = 5; // 200-500km
          } else {
            continue; // Skip lines longer than 500km
          }
          
          // Vary arc height based on distance and type
          const arcHeight = 0.08 + Math.min(distance * 0.3, 0.15);
          const arcPoints = createArc(start.coordinates, end.coordinates, arcHeight);
          
          // Calculate congestion based on connection type with some variation
          const congestion = connType.congestionBase + (Math.random() - 0.5) * 0.2;
          const finalCongestion = Math.max(0, Math.min(1, congestion)); // Clamp between 0 and 1
          
          // Calculate particle count based on congestion level
          // Red (0.8-1.0) = 3x particles, scale down proportionally
          let particleMultiplier = 1;
          if (finalCongestion >= 0.8) {
            particleMultiplier = 3; // Red = 3x
          } else if (finalCongestion >= 0.6) {
            particleMultiplier = 2.2; // Orange = 2.2x
          } else if (finalCongestion >= 0.4) {
            particleMultiplier = 1.5; // Yellow = 1.5x
          } else if (finalCongestion >= 0.2) {
            particleMultiplier = 1; // Green = 1x
          } else {
            particleMultiplier = 0.7; // Blue = 0.7x
          }
          
          const finalParticleCount = Math.round(connType.baseParticleCount * particleMultiplier);
          
          // Only show glowing arcs for certain distance groups
          const showGlowingArc = Math.random() < 0.15; // 15% chance base
          
          arcFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: arcPoints
            },
            properties: {
              startHub: start.name,
              endHub: end.name,
              startType: start.type,
              endType: end.type,
              importance: importance,
              congestion: finalCongestion,
              movementType: connType.type,
              particleCount: finalParticleCount,
              speed: connType.speed,
              flowDirection: Math.random() > 0.5 ? 'forward' : 'reverse',
              showGlowingArc: showGlowingArc,
              distanceKm: distanceKm,
              distanceGroup: distanceGroup
            }
          });
          connectionCount++;
        }
      }
    }
    
    // Add inter-prefecture routes to arc features
    interPrefectureRoutes.forEach((route, index) => {
      const arcHeight = route.type === 'air' ? 0.3 : 0.15; // Higher arcs for air routes
      const arcPoints = createArc(route.points[0], route.points[1], arcHeight);
      
      // Calculate distance and group
      const distance = Math.sqrt(
        Math.pow(route.points[1][0] - route.points[0][0], 2) + 
        Math.pow(route.points[1][1] - route.points[0][1], 2)
      );
      const distanceKm = distance * 111;
      
      let distanceGroup;
      if (distanceKm < 100) {
        distanceGroup = 3;
      } else if (distanceKm < 200) {
        distanceGroup = 4;
      } else if (distanceKm < 500) {
        distanceGroup = 5;
      } else {
        distanceGroup = 6; // Very long distance
      }
      
      // Normalize flow count to congestion level
      const maxFlow = 150000; // Maximum expected flow
      const congestion = Math.min(route.flow_count / maxFlow, 1);
      
      // Calculate particle count based on route type
      let baseParticleCount = 10;
      if (route.type === 'shinkansen') {
        baseParticleCount = 20; // More particles for Shinkansen
      } else if (route.type === 'air') {
        baseParticleCount = 15; // Medium for air routes
      } else {
        baseParticleCount = 12; // Highway routes
      }
      
      const particleMultiplier = congestion * 2 + 0.5;
      const finalParticleCount = Math.round(baseParticleCount * particleMultiplier);
      
      arcFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: arcPoints
        },
        properties: {
          startHub: route.name.split(':')[1].trim().split(' - ')[0],
          endHub: route.name.split(':')[1].trim().split(' - ')[1],
          startType: 'transport',
          endType: 'transport',
          importance: 1.0, // Inter-prefecture routes are very important
          congestion: congestion,
          movementType: route.type,
          particleCount: finalParticleCount,
          speed: route.speed / 800, // Normalize speed (800 km/h max)
          flowDirection: 'forward',
          showGlowingArc: route.type === 'shinkansen' || route.type === 'air', // Always show for major routes
          distanceKm: distanceKm,
          distanceGroup: distanceGroup,
          routeCategory: route.category,
          isInterPrefecture: true
        }
      });
    });

    const arcsData = { type: 'FeatureCollection', features: arcFeatures };
    
    if (!map.current.getSource('mobility-arcs-source')) {
      map.current.addSource('mobility-arcs-source', {
        type: 'geojson',
        data: arcsData
      });
    } else {
      console.log('mobility-arcs-source already exists, updating data');
      map.current.getSource('mobility-arcs-source').setData(arcsData);
    }

    // Very faint arc lines (minimal visibility)
    safeAddLayer({
      id: 'mobility-arcs-faint',
      type: 'line',
      source: 'mobility-arcs-source',
      layout: { visibility: 'none' },
      filter: safeCompoundFilter([
        ['==', ['get', 'showGlowingArc'], false],
        ['>=', ['get', 'distanceKm'], 10]  // Only show lines 10km or longer
      ]),
      paint: {
        'line-color': safeInterpolate(
          ['linear'],
          ['get', 'congestion'],
          [0, 'rgba(100, 200, 255, 0.1)',
          0.5, 'rgba(0, 255, 255, 0.1)',
          1, 'rgba(255, 0, 128, 0.1)']
        ),
        'line-width': 1,
        'line-opacity': 0.2,
        'line-blur': 0.5
      }
    });
    registerLayer('mobility-arcs-faint', 'mobility');
    
    // Glowing arc lines (occasional, more visible) - colored by congestion
    safeAddLayer({
      id: 'mobility-arcs-glowing',
      type: 'line',
      source: 'mobility-arcs-source',
      layout: { visibility: 'none' },
      filter: safeCompoundFilter([
        ['==', ['get', 'showGlowingArc'], true],
        ['>=', ['get', 'distanceKm'], 10]  // Only show lines 10km or longer
      ]),
      paint: {
        'line-color': safeInterpolate(
          ['linear'],
          ['get', 'congestion'],
          [0, 'rgba(0, 200, 255, 0.8)',      // Light blue for low traffic
          0.2, 'rgba(100, 255, 100, 0.8)',  // Light green for low-medium
          0.4, 'rgba(255, 255, 0, 0.8)',    // Yellow for medium
          0.6, 'rgba(255, 150, 0, 0.8)',    // Orange for medium-high
          0.8, 'rgba(255, 50, 50, 0.8)']     // Red for high traffic
        ),
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 3,
          14, 2,
          16, 1.5
        ],
        'line-opacity': safeGet('currentOpacity', 0),
        'line-blur': 1
      }
    });
    registerLayer('mobility-arcs-glowing', 'mobility');

    // Particle flow sources
    if (!map.current.getSource('mobility-particles-source')) {
      map.current.addSource('mobility-particles-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    // Particle outer glow layer - zoom-based sizing
    safeAddLayer({
      id: 'mobility-particles-glow-outer',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, safeMultiply(['get', 'size'], 7.5, 7.5),  // Half size when far
          12, safeMultiply(['get', 'size'], 10, 10),
          14, safeMultiply(['get', 'size'], 8, 8),   // Small when close
          16, safeMultiply(['get', 'size'], 6, 6)
        ],
        'circle-color': safeGet('glowColor', '#FFFFFF'),
        'circle-opacity': safeGet('glowOpacityOuter', 0.3),
        'circle-blur': 1
      }
    });
    registerLayer('mobility-particles-glow-outer', 'mobility');

    // Particle middle glow layer - zoom-based sizing
    safeAddLayer({
      id: 'mobility-particles-glow-middle',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, safeMultiply(['get', 'size'], 5, 5),  // Half size when far
          12, safeMultiply(['get', 'size'], 7, 7),
          14, safeMultiply(['get', 'size'], 5, 5),   // Small when close
          16, safeMultiply(['get', 'size'], 4, 4)
        ],
        'circle-color': safeGet('glowColor', '#FFFFFF'),
        'circle-opacity': safeGet('glowOpacityMiddle', 0.5),
        'circle-blur': 0.8
      }
    });
    registerLayer('mobility-particles-glow-middle', 'mobility');

    // Particle core (bright center) - zoom-based sizing
    safeAddLayer({
      id: 'mobility-particles-core',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, safeMultiply(['get', 'size'], 2.5, 2.5),   // Half size when far
          12, safeMultiply(['get', 'size'], 3, 3),
          14, safeMultiply(['get', 'size'], 2, 2),   // Small when close
          16, safeMultiply(['get', 'size'], 1.5, 1.5)
        ],
        'circle-color': safeGet('coreColor', '#FFFFFF'),
        'circle-opacity': safeGet('coreOpacity', 1),
        'circle-blur': 0.2
      }
    });
    registerLayer('mobility-particles-core', 'mobility');

    // Data stream trails
    if (!map.current.getSource('mobility-trails-source')) {
      map.current.addSource('mobility-trails-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    safeAddLayer({
      id: 'mobility-trails',
      type: 'line',
      source: 'mobility-trails-source',
      layout: { visibility: 'none' },
      paint: {
        'line-color': safeGet('color', '#FFFFFF'),
        'line-width': 1.5,  // Reduced from 3 for zoom 14
        'line-opacity': safeGet('opacity', 1),
        'line-blur': 1      // Reduced blur for sharper trails
      }
    });
    registerLayer('mobility-trails', 'mobility');

    // Pulsing effect for hubs
    if (!map.current.getSource('mobility-pulse-source')) {
      map.current.addSource('mobility-pulse-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    safeAddLayer({
      id: 'mobility-pulse',
      type: 'circle',
      source: 'mobility-pulse-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': 'rgba(0, 255, 255, 0.5)',
        'circle-opacity': ['get', 'opacity'],
        'circle-blur': 0.5
      }
    });
    registerLayer('mobility-pulse', 'mobility');

    // Hub labels
    safeAddLayer({
      id: 'mobility-hub-labels',
      type: 'symbol',
      source: 'mobility-hubs-source',
      layout: {
        visibility: 'none',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, -3],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': 'rgba(0, 255, 255, 0.9)',
        'text-halo-color': 'rgba(0, 0, 0, 0.8)',
        'text-halo-width': 2
      }
    });
    registerLayer('mobility-hub-labels', 'mobility');

    // Add holographic grid effect
    const gridFeatures = [];
    const gridSize = 0.05; // Grid spacing
    const bounds = dataCache.current.prefectureData.bounds;
    
    if (!bounds) {
      console.error('Prefecture bounds data is missing');
      return;
    }
    
    // Create vertical grid lines
    for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
      gridFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[lng, bounds.south], [lng, bounds.north]]
        },
        properties: {
          type: 'vertical'
        }
      });
    }
    
    // Create horizontal grid lines
    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      gridFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[bounds.west, lat], [bounds.east, lat]]
        },
        properties: {
          type: 'horizontal'
        }
      });
    }
    
    const gridData = { type: 'FeatureCollection', features: gridFeatures };
    
    if (!map.current.getSource('mobility-grid-source')) {
      map.current.addSource('mobility-grid-source', {
        type: 'geojson',
        data: gridData
      });
    } else {
      console.log('mobility-grid-source already exists, updating data');
      map.current.getSource('mobility-grid-source').setData(gridData);
    }
    
    safeAddLayer({
      id: 'mobility-grid',
      type: 'line',
      source: 'mobility-grid-source',
      layout: { visibility: 'none' },
      paint: {
        'line-color': 'rgba(0, 255, 255, 0.05)',
        'line-width': 0.3,
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0,
          12, 0.1,
          15, 0.05
        ]
      }
    }, 'mobility-arcs-faint'); // Add below arcs
    registerLayer('mobility-grid', 'mobility');

    // Store animation data for later use
    mobilityAnimationData.current = {
      arcFeatures,
      allDataPoints,
      getCyberColor,
      getMovementTypeColor,
      startTime: Date.now()
    };
  };

  // Cyberpunk mobility animation with flowing particles and pulsing hubs - optimized for zoom 14
  const startCyberpunkMobilityAnimation = (arcFeatures, allDataPoints, getCyberColor, getMovementTypeColor) => {
    // Stop any existing animation
    stopAnimations();
    
    let animationTime = 0;
    const particleTrails = new Map(); // Store trail history for each particle
    const startTime = Date.now();
    
    const animate = () => {
      if (!map.current) {
        return;
      }
      
      // Check if mobility layer is visible
      if (!isLayerVisible('mobility')) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }

      animationTime = (animationTime + 0.002) % 1;  // Slower animation for zoom 14
      
      // Use filtered data if available, otherwise use original
      const currentArcs = mobilityAnimationData.current.filteredArcs || arcFeatures;
      const currentHubs = mobilityAnimationData.current.filteredHubs || allDataPoints;
      
      // Update glowing arc opacity based on time - SYNCHRONIZED BY DISTANCE GROUPS
      const currentTime = Date.now();
      
      // Track which arcs are currently showing to ensure they complete their cycle
      if (!mobilityAnimationData.current.activeArcs) {
        mobilityAnimationData.current.activeArcs = new Map();
      }
      const activeArcs = mobilityAnimationData.current.activeArcs;
      
      // Update glowing arcs with smooth, simple animation
      if (map.current.getSource('mobility-arcs-source')) {
        // Simple smooth wave animation based on distance groups
        const cycleTime = 10000; // 10 second full cycle
        const elapsedTime = currentTime - startTime;
        
        // Update features with smooth opacity animation
        const updatedFeatures = currentArcs.map((arc, index) => {
          if (arc.properties.showGlowingArc) {
            const distanceGroup = arc.properties.distanceGroup || 0;
            
            // Create a smooth wave that travels through distance groups
            // Each group has a phase offset to create a flowing effect
            const phaseOffset = (distanceGroup * Math.PI * 2) / 7; // 7 distance groups
            const timePhase = (elapsedTime / cycleTime) * Math.PI * 2;
            
            // Use sine wave for smooth fade in/out
            const wave = Math.sin(timePhase + phaseOffset);
            
            // Convert sine wave (-1 to 1) to opacity (0 to 0.8)
            // Using cosine transformation for smoother appearance
            const opacity = Math.max(0, (wave + 1) * 0.4); // 0 to 0.8 range
            
            // Add a subtle pulsing effect for inter-prefecture routes
            let finalOpacity = opacity;
            if (arc.properties.isInterPrefecture) {
              const pulse = Math.sin(elapsedTime / 2000) * 0.1 + 0.1;
              finalOpacity = Math.min(0.9, opacity + pulse);
            }
            
            return {
              ...arc,
              properties: {
                ...arc.properties,
                currentOpacity: finalOpacity
              }
            };
          }
          return arc;
        });
        
        map.current.getSource('mobility-arcs-source').setData({
          type: 'FeatureCollection',
          features: updatedFeatures
        });
      }
      
      // Animated particles flowing along arcs
      const particles = [];
      const trails = [];
      
      currentArcs.forEach((arc, arcIndex) => {
        const coordinates = arc.geometry.coordinates;
        const particleCount = arc.properties.particleCount || 5; // Use defined particle count
        const baseSpeed = arc.properties.speed || 0.5; // Use defined speed
        
        // Speed increases with congestion (red = fast, blue = slow)
        const congestionSpeedMultiplier = 0.5 + arc.properties.congestion * 1.5; // 0.5x to 2x
        const flowSpeed = baseSpeed * congestionSpeedMultiplier * 0.005; // Scale down for animation
        
        for (let i = 0; i < particleCount; i++) {
          const offset = i / particleCount;
          let progress = (animationTime * flowSpeed * 30 + offset) % 1;  // Slower overall speed
          
          // Reverse direction for some arcs
          if (arc.properties.flowDirection === 'reverse') {
            progress = 1 - progress;
          }
          
          const pointIndex = Math.floor(progress * (coordinates.length - 1));
          const segmentProgress = (progress * (coordinates.length - 1)) % 1;
          
          if (pointIndex < coordinates.length - 1) {
            const start = coordinates[pointIndex];
            const end = coordinates[pointIndex + 1];
            const lng = start[0] + (end[0] - start[0]) * segmentProgress;
            const lat = start[1] + (end[1] - start[1]) * segmentProgress;
            
            const particleId = `${arcIndex}-${i}`;
            const particleCoord = [lng, lat];
            
            // Add to trail history
            if (!particleTrails.has(particleId)) {
              particleTrails.set(particleId, []);
            }
            const trail = particleTrails.get(particleId);
            trail.push(particleCoord);
            if (trail.length > 10) trail.shift(); // Keep last 10 positions
            
            // Calculate particle properties with enhanced visibility
            const pulsePhase = Math.sin(animationTime * Math.PI * 2 + offset * Math.PI * 2);
            const sizeMultiplier = 0.8 + pulsePhase * 0.2;
            const opacityPulse = 0.7 + pulsePhase * 0.3;
            
            // Color based on congestion level
            const congestion = arc.properties.congestion;
            let glowColor = getCyberColor(congestion, 0.6);
            let coreColor;
            
            // Brighter core colors based on traffic density
            if (congestion >= 0.8) {
              coreColor = 'rgba(255, 100, 100, 1)'; // Bright red
            } else if (congestion >= 0.6) {
              coreColor = 'rgba(255, 200, 50, 1)'; // Bright orange
            } else if (congestion >= 0.4) {
              coreColor = 'rgba(255, 255, 100, 1)'; // Bright yellow
            } else if (congestion >= 0.2) {
              coreColor = 'rgba(150, 255, 150, 1)'; // Bright green
            } else {
              coreColor = 'rgba(100, 200, 255, 1)'; // Bright blue
            }
            
            // Create particle with multiple glow layers
            particles.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: particleCoord
              },
              properties: {
                size: sizeMultiplier,
                glowColor: glowColor,
                coreColor: coreColor,
                glowOpacityOuter: 0.2 * opacityPulse,
                glowOpacityMiddle: 0.4 * opacityPulse,
                coreOpacity: 0.9 * opacityPulse
              }
            });
            
            // Create glowing trail - shorter for high traffic areas to optimize
            if (trail.length > 1 && Math.random() < (1 - congestion * 0.5)) { // Less trails for high traffic
              const trailLength = congestion > 0.6 ? 2 : 3; // Shorter trails for busy areas
              trails.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: trail.slice(-trailLength)
                },
                properties: {
                  color: getCyberColor(congestion, 1),
                  opacity: 0.4 * opacityPulse  // More transparent trails
                }
              });
            }
          }
        }
      });
      
      // Pulsing hub effects - smaller for zoom 14
      const pulses = [];
      currentHubs.forEach((hub, hubIndex) => {
        const pulsePhase = (animationTime + hubIndex * 0.1) % 1;
        
        // Create expanding pulse rings - only 2 rings for cleaner view
        for (let ring = 0; ring < 2; ring++) {
          const ringPhase = (pulsePhase + ring * 0.5) % 1;
          const ringOpacity = 1 - ringPhase;
          
          pulses.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: hub.coordinates
            },
            properties: {
              radius: 5 + ringPhase * 20 * hub.importance,  // Smaller pulses
              opacity: ringOpacity * 0.2  // More transparent
            }
          });
        }
      });
      
      // Update sources
      if (map.current.getSource('mobility-particles-source')) {
        map.current.getSource('mobility-particles-source').setData({
          type: 'FeatureCollection',
          features: particles
        });
      }
      
      if (map.current.getSource('mobility-trails-source')) {
        map.current.getSource('mobility-trails-source').setData({
          type: 'FeatureCollection',
          features: trails
        });
      }
      
      if (map.current.getSource('mobility-pulse-source')) {
        map.current.getSource('mobility-pulse-source').setData({
          type: 'FeatureCollection',
          features: pulses
        });
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // イベントレイヤーの初期化
  const initializeEventLayers = () => {
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.events) {
      console.error('Prefecture data or events data is missing');
      return;
    }
    
    const events = dataCache.current.prefectureData.events;

    // イベントポイント
    const eventsData = {
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
    };
    
    if (!map.current.getSource('events-source')) {
      map.current.addSource('events-source', {
        type: 'geojson',
        data: eventsData
      });
    } else {
      console.log('events-source already exists, updating data');
      map.current.getSource('events-source').setData(eventsData);
    }

    // イベント影響範囲
    const impactFeatures = events.map(e => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: e.coordinates },
      properties: { radius: e.impact_radius }
    }));

    const impactData = { type: 'FeatureCollection', features: impactFeatures };
    
    if (!map.current.getSource('events-impact-source')) {
      map.current.addSource('events-impact-source', {
        type: 'geojson',
        data: impactData
      });
    } else {
      console.log('events-impact-source already exists, updating data');
      map.current.getSource('events-impact-source').setData(impactData);
    }

    // 影響範囲の表示 - Circle size represents event's economic and crowd impact
    // Festivals have 1.5x radius, Sports 1.0x, Concerts/Exhibitions 0.7x
    safeAddLayer({
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

    // イベントアイコン
    safeAddLayer({
      id: 'events-icons',
      type: 'symbol',
      source: 'events-source',
      layout: {
        visibility: 'none',
        'text-field': ['get', 'icon'],
        'text-size': 24,
        'text-allow-overlap': true,
        'icon-allow-overlap': true
      }
    });
    registerLayer('events-icons', 'events');
    
    // イベント名ラベル
    safeAddLayer({
      id: 'events-labels',
      type: 'symbol',
      source: 'events-source',
      layout: {
        visibility: 'none',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 2],
        'text-anchor': 'top',
        'text-allow-overlap': false
      },
      paint: {
        'text-color': colors.events,
        'text-halo-color': '#000000',
        'text-halo-width': 2
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
    
    // Clean up any existing layers and sources first
    cleanupAllLayers();
    
    // Ensure prefecture data exists
    if (!dataCache.current.prefectureData) {
      console.error('Prefecture data is not available for initialization');
      const currentPrefecture = detectCurrentPrefecture();
      console.log('Generating missing prefecture data for:', currentPrefecture);
      dataCache.current.prefectureData = generateAllPrefectureData(currentPrefecture);
      dataCache.current.currentPrefecture = currentPrefecture;
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
    
    // Mark layers as initialized after all layers are added
    layersInitializedRef.current = true;
    setLayersInitialized(true);
    
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
          trackResize: true
          // maxBounds removed to allow free movement across all of Japan
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
            if (!map.current.getLayer('3d-buildings')) {
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
            }
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
          }
        });

        map.current.on('error', (e) => {
          // 既知のエラーは無視
          if (e.error && e.error.message && e.error.message.includes('sub')) {
            return;
          }
          console.warn('Map error:', e);
        });

        // Add moveend event listener to update layers when viewport changes
        map.current.on('moveend', () => {
          if (!layersInitializedRef.current) return;
          
          console.log('Map moveend event - updating viewport filtered data');
          
          // Update viewport
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          onViewportChange?.({
            longitude: center.lng,
            latitude: center.lat,
            zoom: zoom
          });
          
          // Detect if we've moved to a different prefecture
          const newPrefecture = detectCurrentPrefecture();
          if (newPrefecture !== dataCache.current.currentPrefecture) {
            console.log('Prefecture changed from', dataCache.current.currentPrefecture, 'to', newPrefecture);
            
            // Generate new prefecture data
            dataCache.current.prefectureData = generateAllPrefectureData(newPrefecture);
            dataCache.current.currentPrefecture = newPrefecture;
            
            // Reinitialize all layers with new data
            if (layersInitializedRef.current) {
              console.log('Reinitializing layers for new prefecture');
              
              // Use the cleanup function and reinitialize
              initializeAllLayers();
            }
          } else {
            // Just update viewport filtering for existing data
            updateViewportFilteredData();
          }
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
      stopAnimations(); // Use the helper function
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
        setLayersInitialized(false);
        layersInitializedRef.current = false;
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
    
    // Start or stop mobility animation based on visibility
    if (selectedLayers.includes('mobility')) {
      // Start mobility animation if not already running
      if (!animationFrame.current && mobilityAnimationData.current) {
        console.log('Starting mobility animation');
        const { arcFeatures, allDataPoints, getCyberColor, getMovementTypeColor } = mobilityAnimationData.current;
        startCyberpunkMobilityAnimation(arcFeatures, allDataPoints, getCyberColor, getMovementTypeColor);
      }
    } else {
      // Stop animation if mobility layer is hidden
      if (animationFrame.current) {
        console.log('Stopping mobility animation');
        stopAnimations();
      }
    }
  }, [selectedLayers, selectedCategories, mapLoaded, layersInitialized]);

  // レイヤーデータの更新（必要に応じて）
  const updateLayerData = () => {
    // SNSデータのカテゴリフィルタリング更新
    if (selectedLayers.includes('heatmap')) {
      updateHeatmapData();
    }
    
    // Update all visible layers with viewport filtering
    updateViewportFilteredData();
  };
  
  // Update data based on current viewport
  const updateViewportFilteredData = () => {
    if (!map.current || !mapLoaded) return;
    
    const viewportBounds = getViewportBounds();
    if (!viewportBounds) return;
    
    // Update each layer type with viewport-filtered data
    if (selectedLayers.includes('landmarks')) {
      updateLandmarksInViewport(viewportBounds);
    }
    if (selectedLayers.includes('accommodation')) {
      updateAccommodationInViewport(viewportBounds);
    }
    if (selectedLayers.includes('consumption')) {
      updateConsumptionInViewport(viewportBounds);
    }
    if (selectedLayers.includes('events')) {
      updateEventsInViewport(viewportBounds);
    }
    if (selectedLayers.includes('mobility')) {
      updateMobilityInViewport(viewportBounds);
    }
  };
  
  // Update landmarks within viewport
  const updateLandmarksInViewport = (bounds) => {
    if (!map.current.getSource('landmarks-source')) return;
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.landmarks) return;
    
    const landmarks = dataCache.current.prefectureData.landmarks;
    const filteredLandmarks = landmarks.filter(l => 
      isPointInViewport(l.coordinates, bounds)
    );
    
    // Update point source
    map.current.getSource('landmarks-source').setData({
      type: 'FeatureCollection',
      features: filteredLandmarks.map(l => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: l.coordinates },
        properties: { name: l.name, height: l.height }
      }))
    });
    
    // Update 3D buildings source
    const buildingFeatures = filteredLandmarks.map(l => {
      const size = 0.0006;
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
    
    if (map.current.getSource('landmarks-buildings-source')) {
      map.current.getSource('landmarks-buildings-source').setData({
        type: 'FeatureCollection',
        features: buildingFeatures
      });
    }
  };
  
  // Update accommodation within viewport
  const updateAccommodationInViewport = (bounds) => {
    if (!map.current.getSource('accommodation-source')) return;
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.accommodation) return;
    
    const accommodations = dataCache.current.prefectureData.accommodation;
    const filtered = accommodations.filter(a => 
      isPointInViewport(a.coordinates, bounds)
    );
    
    const accommodationFeatures = filtered.map(a => {
      const size = 0.0002;
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
          height: 10 + a.occupancy * 50,
          base_height: 0,
          occupancy: a.occupancy,
          color: colors.accommodation
        }
      };
    });
    
    map.current.getSource('accommodation-source').setData({
      type: 'FeatureCollection',
      features: accommodationFeatures
    });
  };
  
  // Update consumption within viewport
  const updateConsumptionInViewport = (bounds) => {
    if (!map.current.getSource('consumption-source')) return;
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.consumption) return;
    
    const consumptionData = dataCache.current.prefectureData.consumption;
    const filtered = consumptionData.filter(c => 
      isPointInViewport(c.coordinates, bounds)
    );
    
    const consumptionFeatures = filtered.map(c => {
      const size = 0.0003;
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
          height: Math.sqrt(c.amount) / 50,
          color: colors.consumption,
          isTouristArea: c.isTouristArea
        }
      };
    });
    
    map.current.getSource('consumption-source').setData({
      type: 'FeatureCollection',
      features: consumptionFeatures
    });
  };
  
  // Update events within viewport
  const updateEventsInViewport = (bounds) => {
    if (!map.current.getSource('events-source')) return;
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.events) return;
    
    const events = dataCache.current.prefectureData.events;
    const filtered = events.filter(e => 
      isPointInViewport(e.coordinates, bounds)
    );
    
    map.current.getSource('events-source').setData({
      type: 'FeatureCollection',
      features: filtered.map(e => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: e.coordinates },
        properties: { 
          name: e.name,
          category: e.category,
          icon: e.icon
        }
      }))
    });
    
    // Update impact source
    if (map.current.getSource('events-impact-source')) {
      const impactFeatures = filtered.map(e => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: e.coordinates },
        properties: { radius: e.impact_radius }
      }));
      
      map.current.getSource('events-impact-source').setData({
        type: 'FeatureCollection',
        features: impactFeatures
      });
    }
  };
  
  // Update mobility within viewport
  const updateMobilityInViewport = (bounds) => {
    if (!mobilityAnimationData.current) return;
    
    const { arcFeatures, allDataPoints } = mobilityAnimationData.current;
    
    // Filter arcs where at least one endpoint is in viewport
    const filteredArcs = arcFeatures.filter(arc => {
      const coords = arc.geometry.coordinates;
      const startInView = isPointInViewport(coords[0], bounds, 0.2);
      const endInView = isPointInViewport(coords[coords.length - 1], bounds, 0.2);
      return startInView || endInView;
    });
    
    // Filter hubs in viewport
    const filteredHubs = allDataPoints.filter(hub => 
      isPointInViewport(hub.coordinates, bounds)
    );
    
    // Update sources if they exist
    if (map.current.getSource('mobility-arcs-source')) {
      map.current.getSource('mobility-arcs-source').setData({
        type: 'FeatureCollection',
        features: filteredArcs
      });
    }
    
    if (map.current.getSource('mobility-hubs-source')) {
      const hubFeatures = filteredHubs.map(hub => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: hub.coordinates },
        properties: {
          name: hub.name,
          importance: hub.importance,
          type: hub.type,
          radius: 8 + hub.importance * 12,
          glowRadius: 15 + hub.importance * 25
        }
      }));
      
      map.current.getSource('mobility-hubs-source').setData({
        type: 'FeatureCollection',
        features: hubFeatures
      });
    }
    
    // Update animation data with filtered features
    mobilityAnimationData.current.filteredArcs = filteredArcs;
    mobilityAnimationData.current.filteredHubs = filteredHubs;
  };

  // SNSデータの更新
  const updateHeatmapData = () => {
    if (!map.current || !map.current.getSource('heatmap-source')) return;

    // Make sure we have cached data
    if (!dataCache.current.prefectureData || !dataCache.current.prefectureData.heatmap) {
      console.warn('No cached heatmap data available');
      return;
    }

    // Use cached data and filter by selected categories
    const heatmapData = dataCache.current.prefectureData.heatmap;
    const filteredPoints = selectedCategories.length > 0 
      ? heatmapData.filter(point => selectedCategories.includes(point.category))
      : []; // If no categories selected, show no points
    
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

    let moveTimeout;
    
    const handleMove = () => {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      onViewportChange({
        latitude: center.lat,
        longitude: center.lng,
        zoom: zoom,
      });
    };
    
    const handleMoveEnd = () => {
      // Clear any existing timeout
      clearTimeout(moveTimeout);
      
      // Debounce the viewport update
      moveTimeout = setTimeout(() => {
        console.log('Map movement ended, updating viewport-filtered data');
        updateViewportFilteredData();
      }, 300); // Wait 300ms after movement stops
    };

    map.current.on('move', handleMove);
    map.current.on('moveend', handleMoveEnd);
    
    // Initial viewport update
    updateViewportFilteredData();
    
    return () => {
      if (map.current) {
        map.current.off('move', handleMove);
        map.current.off('moveend', handleMoveEnd);
      }
      clearTimeout(moveTimeout);
    };
  }, [mapLoaded, onViewportChange, selectedLayers]);
  
  // Detect prefecture change and reinitialize layers
  useEffect(() => {
    if (!map.current || !mapLoaded || !layersInitializedRef.current) return;
    
    const newPrefecture = detectCurrentPrefecture();
    if (dataCache.current.currentPrefecture !== newPrefecture) {
      console.log('Prefecture changed to:', newPrefecture);
      
      // Generate new prefecture data
      dataCache.current.prefectureData = generateAllPrefectureData(newPrefecture);
      dataCache.current.currentPrefecture = newPrefecture;
      
      // Reinitialize with new data using the proper cleanup
      setTimeout(() => {
        if (map.current && map.current.isStyleLoaded()) {
          console.log('Reinitializing layers for new prefecture data');
          initializeAllLayers();
        }
      }, 100);
    }
  }, [viewport, mapLoaded]);

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
});

export default MapEnhancedFixed;