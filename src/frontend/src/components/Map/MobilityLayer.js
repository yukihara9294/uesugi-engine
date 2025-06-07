/**
 * 人流可視化レイヤーコンポーネント
 */

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const MobilityLayer = ({ map, mobilityData, visible }) => {
  const sourceIdRef = useRef('mobility-source');
  const flowLayerIdRef = useRef('mobility-flow-layer');
  const heatmapLayerIdRef = useRef('mobility-heatmap-layer');

  useEffect(() => {
    if (!map || !mobilityData) return;

    const sourceId = sourceIdRef.current;
    const flowLayerId = flowLayerIdRef.current;
    const heatmapLayerId = heatmapLayerIdRef.current;
    const heatmapSourceId = `${sourceId}-heatmap`;

    // 既存のレイヤーとソースをクリーンアップ
    const cleanup = () => {
      const arrowLayerId = `${flowLayerId}-arrows`;
      if (map.getLayer(arrowLayerId)) map.removeLayer(arrowLayerId);
      if (map.getLayer(flowLayerId)) map.removeLayer(flowLayerId);
      if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      if (map.getSource(heatmapSourceId)) map.removeSource(heatmapSourceId);
    };

    cleanup();

    if (!visible || !mobilityData.features?.length) return;

    try {
      // 人流データソースを追加
      map.addSource(sourceId, {
        type: 'geojson',
        data: mobilityData
      });

    // 人流の線を描画（アニメーション効果付き）
    map.addLayer({
      id: flowLayerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'flow_count'],
          0, '#3498db',      // 青（少ない）
          100, '#f39c12',    // オレンジ（中程度）
          500, '#e74c3c'     // 赤（多い）
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['get', 'flow_count'],
          0, 1,
          100, 3,
          500, 6
        ],
        'line-opacity': 0.7
      }
    });

      // 人流密度ヒートマップ
      if (mobilityData.heatmapData) {
        map.addSource(heatmapSourceId, {
          type: 'geojson',
          data: mobilityData.heatmapData
        });

        map.addLayer({
          id: heatmapLayerId,
          type: 'heatmap',
          source: heatmapSourceId,
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'density'],
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
          ],
          'heatmap-opacity': 0.6
        }
      });
    }

      // 矢印を追加してフローの方向を表示
      const arrowLayerId = `${flowLayerId}-arrows`;
      map.addLayer({
        id: arrowLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 100,
          'icon-image': '→',
          'text-field': '→',
          'text-size': 16,
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

    } catch (error) {
      console.error('Error in MobilityLayer:', error);
    }

    return cleanup;
  }, [map, mobilityData, visible]);

  // ポップアップ表示
  useEffect(() => {
    if (!map || !visible) return;

    const handleClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [flowLayerIdRef.current]
      });

      if (features.length > 0) {
        const feature = features[0];
        const props = feature.properties;
        
        // Popupが利用可能かチェック
        if (!window.mapboxgl || !window.mapboxgl.Popup) {
          console.warn('MobilityLayer: Mapbox GL Popup not available');
          return;
        }
        
        new window.mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 10px;">
              <h4 style="margin: 0 0 10px 0;">人流情報</h4>
              <p><strong>移動人数:</strong> ${props.flow_count}人</p>
              <p><strong>タイプ:</strong> ${props.flow_type}</p>
              <p><strong>交通手段:</strong> ${props.transport_mode}</p>
              <p><strong>区間:</strong> ${props.origin_area} → ${props.destination_area}</p>
              <p><strong>観光客率:</strong> ${Math.round(props.tourist_ratio * 100)}%</p>
            </div>
          `)
          .addTo(map);
      }
    };

    map.on('click', flowLayerIdRef.current, handleClick);
    map.on('mouseenter', flowLayerIdRef.current, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', flowLayerIdRef.current, () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      map.off('click', flowLayerIdRef.current, handleClick);
      map.off('mouseenter', flowLayerIdRef.current);
      map.off('mouseleave', flowLayerIdRef.current);
    };
  }, [map, visible]);

  return null;
};

export default MobilityLayer;