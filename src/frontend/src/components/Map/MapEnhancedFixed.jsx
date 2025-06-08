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
  const mobilityAnimationData = useRef(null);
  
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

  // Stop any running animations
  const stopAnimations = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
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
          // Height represents spending amount - tourist areas are 20x taller
          height: Math.sqrt(c.amount) / 50, // Adjusted for larger amounts
          color: colors.consumption,
          isTouristArea: c.isTouristArea
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

  // 人流データレイヤーの初期化 - Optimized for Zoom 14
  const initializeMobilityLayers = () => {
    const mobilityData = dataCache.current.prefectureData.mobility;
    const routes = mobilityData.routes;
    const landmarks = dataCache.current.prefectureData.landmarks;
    const events = dataCache.current.prefectureData.events;
    const accommodations = dataCache.current.prefectureData.accommodation;
    const heatmapData = dataCache.current.prefectureData.heatmap;

    // Cyberpunk color scheme - blue particles
    const getCyberColor = (congestion, opacity = 1) => {
      if (congestion >= 0.8) return `rgba(255, 0, 128, ${opacity})`; // Hot pink for high congestion
      if (congestion >= 0.5) return `rgba(0, 150, 255, ${opacity})`; // Medium blue for medium
      return `rgba(0, 100, 255, ${opacity})`; // Deep blue for low
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

    map.current.addSource('mobility-hubs-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: hubFeatures }
    });

    // Outer glow for hubs - color coded by type
    map.current.addLayer({
      id: 'mobility-hubs-glow',
      type: 'circle',
      source: 'mobility-hubs-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': ['get', 'glowRadius'],
        'circle-color': [
          'match',
          ['get', 'type'],
          'transport', 'rgba(0, 255, 255, 0.3)',
          'landmark', 'rgba(255, 215, 0, 0.3)',
          'event', 'rgba(0, 255, 100, 0.3)',
          'accommodation', 'rgba(76, 175, 80, 0.3)',
          'sns_hotspot', 'rgba(255, 100, 0, 0.3)',
          'rgba(100, 100, 255, 0.3)'
        ],
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
    map.current.addLayer({
      id: 'mobility-hubs-core',
      type: 'circle',
      source: 'mobility-hubs-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': [
          'match',
          ['get', 'type'],
          'transport', 'rgba(255, 255, 255, 0.9)',
          'landmark', 'rgba(255, 215, 0, 0.9)',
          'event', 'rgba(0, 255, 100, 0.9)',
          'accommodation', 'rgba(76, 175, 80, 0.9)',
          'sns_hotspot', 'rgba(255, 100, 0, 0.9)',
          'rgba(150, 150, 255, 0.9)'
        ],
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

    // Generate diverse arcs between all data points
    const arcFeatures = [];
    const connectionTypes = [
      // Tourism routes: transport -> landmarks
      { from: 'transport', to: 'landmark', probability: 0.8, type: 'tourism' },
      // Event attendance: transport/accommodation -> events
      { from: 'transport', to: 'event', probability: 0.7, type: 'event' },
      { from: 'accommodation', to: 'event', probability: 0.6, type: 'event' },
      // Shopping routes: accommodation -> SNS hotspots
      { from: 'accommodation', to: 'sns_hotspot', probability: 0.5, type: 'shopping' },
      // Business travel: transport -> accommodation
      { from: 'transport', to: 'accommodation', probability: 0.6, type: 'business' },
      // Tourist movement: landmarks -> SNS hotspots
      { from: 'landmark', to: 'sns_hotspot', probability: 0.7, type: 'tourism' },
      // Inter-transport connections
      { from: 'transport', to: 'transport', probability: 0.9, type: 'business' },
      // Event to landmark visits
      { from: 'event', to: 'landmark', probability: 0.5, type: 'tourism' }
    ];

    // Create connections based on types - reduce to 80% for performance
    const connectionLimit = Math.floor(allDataPoints.length * allDataPoints.length * 0.8 / 2);
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
        
        if (connType && Math.random() < connType.probability * 0.8) { // Reduce probability by 20%
          const importance = (start.importance + end.importance) / 2;
          const distance = Math.sqrt(
            Math.pow(end.coordinates[0] - start.coordinates[0], 2) + 
            Math.pow(end.coordinates[1] - start.coordinates[1], 2)
          );
          
          // Skip very long connections for cleaner visualization
          if (distance > 0.5) continue;
          
          // Vary arc height based on distance and type
          const arcHeight = 0.08 + Math.min(distance * 0.3, 0.15);
          const arcPoints = createArc(start.coordinates, end.coordinates, arcHeight);
          
          // Calculate congestion based on type and time of day simulation
          let congestion = 0.3;
          if (connType.type === 'tourism') congestion = 0.5 + Math.random() * 0.3;
          if (connType.type === 'business') congestion = 0.4 + Math.random() * 0.4;
          if (connType.type === 'event') congestion = 0.6 + Math.random() * 0.3;
          
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
              congestion: congestion,
              movementType: connType.type,
              flowDirection: Math.random() > 0.5 ? 'forward' : 'reverse',
              showGlowingArc: Math.random() < 0.15 // 15% chance for glowing arc
            }
          });
          connectionCount++;
        }
      }
    }

    map.current.addSource('mobility-arcs-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: arcFeatures }
    });

    // Very faint arc lines (minimal visibility)
    map.current.addLayer({
      id: 'mobility-arcs-faint',
      type: 'line',
      source: 'mobility-arcs-source',
      layout: { visibility: 'none' },
      filter: ['==', ['get', 'showGlowingArc'], false],
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'congestion'],
          0, 'rgba(100, 200, 255, 0.1)',
          0.5, 'rgba(0, 255, 255, 0.1)',
          1, 'rgba(255, 0, 128, 0.1)'
        ],
        'line-width': 1,
        'line-opacity': 0.2,
        'line-blur': 0.5
      }
    });
    registerLayer('mobility-arcs-faint', 'mobility');
    
    // Glowing arc lines (occasional, more visible)
    map.current.addLayer({
      id: 'mobility-arcs-glowing',
      type: 'line',
      source: 'mobility-arcs-source',
      layout: { visibility: 'none' },
      filter: ['==', ['get', 'showGlowingArc'], true],
      paint: {
        'line-color': [
          'match',
          ['get', 'movementType'],
          'tourism', 'rgba(255, 200, 0, 0.8)',
          'business', 'rgba(0, 150, 255, 0.8)',
          'shopping', 'rgba(255, 0, 200, 0.8)',
          'event', 'rgba(0, 255, 100, 0.8)',
          'rgba(100, 100, 255, 0.8)'
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 3,
          14, 2,
          16, 1.5
        ],
        'line-opacity': 0.6,
        'line-blur': 1
      }
    });
    registerLayer('mobility-arcs-glowing', 'mobility');

    // Particle flow sources
    map.current.addSource('mobility-particles-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Particle outer glow layer - zoom-based sizing
    map.current.addLayer({
      id: 'mobility-particles-glow-outer',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['*', ['get', 'size'], 15],  // Large when far
          12, ['*', ['get', 'size'], 10],
          14, ['*', ['get', 'size'], 8],   // Small when close
          16, ['*', ['get', 'size'], 6]
        ],
        'circle-color': ['get', 'glowColor'],
        'circle-opacity': ['get', 'glowOpacityOuter'],
        'circle-blur': 1
      }
    });
    registerLayer('mobility-particles-glow-outer', 'mobility');

    // Particle middle glow layer - zoom-based sizing
    map.current.addLayer({
      id: 'mobility-particles-glow-middle',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['*', ['get', 'size'], 10],  // Large when far
          12, ['*', ['get', 'size'], 7],
          14, ['*', ['get', 'size'], 5],   // Small when close
          16, ['*', ['get', 'size'], 4]
        ],
        'circle-color': ['get', 'glowColor'],
        'circle-opacity': ['get', 'glowOpacityMiddle'],
        'circle-blur': 0.8
      }
    });
    registerLayer('mobility-particles-glow-middle', 'mobility');

    // Particle core (bright center) - zoom-based sizing
    map.current.addLayer({
      id: 'mobility-particles-core',
      type: 'circle',
      source: 'mobility-particles-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, ['*', ['get', 'size'], 5],   // Large when far
          12, ['*', ['get', 'size'], 3],
          14, ['*', ['get', 'size'], 2],   // Small when close
          16, ['*', ['get', 'size'], 1.5]
        ],
        'circle-color': ['get', 'coreColor'],
        'circle-opacity': ['get', 'coreOpacity'],
        'circle-blur': 0.2
      }
    });
    registerLayer('mobility-particles-core', 'mobility');

    // Data stream trails
    map.current.addSource('mobility-trails-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.current.addLayer({
      id: 'mobility-trails',
      type: 'line',
      source: 'mobility-trails-source',
      layout: { visibility: 'none' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,  // Reduced from 3 for zoom 14
        'line-opacity': ['get', 'opacity'],
        'line-blur': 1      // Reduced blur for sharper trails
      }
    });
    registerLayer('mobility-trails', 'mobility');

    // Pulsing effect for hubs
    map.current.addSource('mobility-pulse-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.current.addLayer({
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
    map.current.addLayer({
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
    
    map.current.addSource('mobility-grid-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: gridFeatures }
    });
    
    map.current.addLayer({
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
      getMovementTypeColor
    };
  };

  // Cyberpunk mobility animation with flowing particles and pulsing hubs - optimized for zoom 14
  const startCyberpunkMobilityAnimation = (arcFeatures, allDataPoints, getCyberColor, getMovementTypeColor) => {
    // Stop any existing animation
    stopAnimations();
    
    let animationTime = 0;
    const particleTrails = new Map(); // Store trail history for each particle
    
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
      
      // Animated particles flowing along arcs
      const particles = [];
      const trails = [];
      
      arcFeatures.forEach((arc, arcIndex) => {
        const coordinates = arc.geometry.coordinates;
        const particleCount = Math.ceil(arc.properties.importance * 8) + 3; // Fewer particles for cleaner view
        const flowSpeed = (1 - arc.properties.congestion) * 0.008 + 0.002; // Much slower for zoom 14
        
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
            
            // Color based on movement type
            const movementType = arc.properties.movementType;
            let glowColor, coreColor;
            
            // Use movement type colors
            const baseColor = getMovementTypeColor(movementType, 1);
            glowColor = getMovementTypeColor(movementType, 0.6);
            
            // Brighter core colors
            switch(movementType) {
              case 'tourism':
                coreColor = 'rgba(255, 230, 100, 1)'; // Bright gold
                break;
              case 'business':
                coreColor = 'rgba(100, 200, 255, 1)'; // Bright blue
                break;
              case 'shopping':
                coreColor = 'rgba(255, 150, 255, 1)'; // Bright pink
                break;
              case 'event':
                coreColor = 'rgba(100, 255, 150, 1)'; // Bright green
                break;
              default:
                coreColor = 'rgba(200, 200, 255, 1)'; // Bright white-blue
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
            
            // Create glowing trail - shorter for zoom 14
            if (trail.length > 1) {
              trails.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: trail.slice(-3) // Shorter trail for cleaner view
                },
                properties: {
                  color: glowColor,
                  opacity: 0.4 * opacityPulse  // More transparent trails
                }
              });
            }
          }
        }
      });
      
      // Pulsing hub effects - smaller for zoom 14
      const pulses = [];
      allDataPoints.forEach((hub, hubIndex) => {
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

    // 影響範囲の表示 - Circle size represents event's economic and crowd impact
    // Festivals have 1.5x radius, Sports 1.0x, Concerts/Exhibitions 0.7x
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

    // イベントアイコン
    map.current.addLayer({
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
    map.current.addLayer({
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