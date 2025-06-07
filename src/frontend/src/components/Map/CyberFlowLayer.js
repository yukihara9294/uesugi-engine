/**
 * サイバーチックな人流可視化レイヤー（最適化版）
 */

import React, { useEffect, useRef } from 'react';

const CyberFlowLayer = ({ map, mobilityData, visible }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!map || !visible) return;

    // mobilityDataの検証
    if (!mobilityData || !mobilityData.features || mobilityData.features.length === 0) {
      console.log('No mobility data available or no features');
      return;
    }

    const flowSourceId = 'cyber-flow-lines-source';
    const flowLayerId = 'cyber-flow-lines';
    const flowGlowLayerId = 'cyber-flow-lines-glow';
    const particleSourceId = 'cyber-particles-source';
    const particleLayerId = 'cyber-particles';
    
    // 既存のレイヤーとソースを安全に削除
    const cleanupLayers = () => {
      try {
        if (map.getLayer(particleLayerId)) map.removeLayer(particleLayerId);
        if (map.getLayer(flowGlowLayerId)) map.removeLayer(flowGlowLayerId);
        if (map.getLayer(flowLayerId)) map.removeLayer(flowLayerId);
        if (map.getSource(particleSourceId)) map.removeSource(particleSourceId);
        if (map.getSource(flowSourceId)) map.removeSource(flowSourceId);
      } catch (e) {
        console.log('Cleanup error (ignored):', e);
      }
    };
    
    cleanupLayers();
    
    // 弧を描く軌跡データを生成
    const arcFeatures = [];
    const particleData = [];
    
    // 表示範囲内の最大・最小値を計算
    let minFlow = Infinity;
    let maxFlow = -Infinity;
    mobilityData.features.forEach(feature => {
      const flowCount = feature.properties.flow_count;
      if (flowCount < minFlow) minFlow = flowCount;
      if (flowCount > maxFlow) maxFlow = flowCount;
    });
    
    console.log(`Mobility flow range: ${minFlow} - ${maxFlow}`);
    
    mobilityData.features.forEach((feature, featureIndex) => {
      const origin = feature.geometry.coordinates[0];
      const destination = feature.geometry.coordinates[1];
      const flowCount = feature.properties.flow_count;
      
      // 正規化（0-1の範囲に）
      const normalized = (flowCount - minFlow) / (maxFlow - minFlow) || 0;
      
      // HSL色空間を使用してグラデーションを作成
      // 緑(120) -> シアン(180) -> 青(240) -> 紫(270) -> 赤紫(300) -> ピンク(330)
      const hue = 120 + normalized * 210; // 120度から330度まで
      const saturation = 100; // 彩度100%
      const lightness = 50 + normalized * 10; // 明度50-60%
      
      // HSLからRGBに変換
      const hslToRgb = (h, s, l) => {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        let r, g, b;
        
        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }
        
        return '#' + [r, g, b].map(x => {
          const hex = Math.round(x * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      };
      
      const color = hslToRgb(hue, saturation, lightness);
      
      // 弧の座標を生成
      const points = [];
      const steps = 30;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const midLng = (origin[0] + destination[0]) / 2;
        const midLat = (origin[1] + destination[1]) / 2;
        
        const distance = Math.sqrt(
          Math.pow(destination[0] - origin[0], 2) + 
          Math.pow(destination[1] - origin[1], 2)
        );
        const height = Math.min(distance * 0.3, 0.1);
        
        const cp1 = [origin[0], origin[1] + height * 0.3];
        const cp2 = [midLng, midLat + height];
        
        const lng = Math.pow(1-t, 3) * origin[0] + 
                   3 * Math.pow(1-t, 2) * t * cp1[0] + 
                   3 * (1-t) * Math.pow(t, 2) * cp2[0] + 
                   Math.pow(t, 3) * destination[0];
                   
        const lat = Math.pow(1-t, 3) * origin[1] + 
                   3 * Math.pow(1-t, 2) * t * cp1[1] + 
                   3 * (1-t) * Math.pow(t, 2) * cp2[1] + 
                   Math.pow(t, 3) * destination[1];
        
        points.push([lng, lat]);
        
        // パーティクル位置を追加（5ステップごと）
        if (i % 5 === 0 && i > 0 && i < steps) {
          particleData.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties: {
              flowId: featureIndex,
              step: i,
              color: color,
              size: 2 + normalized * 3  // 2-5の範囲でサイズを設定
            }
          });
        }
      }
      
      arcFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points
        },
        properties: {
          ...feature.properties,
          flow_count: flowCount,
          color: color
        }
      });
    });
    
    try {
      // 軌跡を追加
      map.addSource(flowSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: arcFeatures
        }
      });
      
      // グロー効果
      map.addLayer({
        id: flowGlowLayerId,
        type: 'line',
        source: flowSourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-blur': 2,
          'line-opacity': 0.3
        }
      });
      
      // メインライン
      map.addLayer({
        id: flowLayerId,
        type: 'line',
        source: flowSourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.6
        }
      });
      
      // パーティクルソース
      map.addSource(particleSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: particleData
        }
      });
      
      // パーティクルレイヤー
      map.addLayer({
        id: particleLayerId,
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'size'],
            2, 4,
            4, 8
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.5,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'step'],
            0, 0,
            5, 1,
            25, 1,
            30, 0
          ]
        }
      });
      
      // シンプルなアニメーション（パーティクルの点滅）
      let opacity = 0.8;
      let increasing = true;
      
      const animate = () => {
        if (!map || !map.getLayer(particleLayerId)) {
          return;
        }
        
        if (increasing) {
          opacity += 0.02;
          if (opacity >= 1) {
            opacity = 1;
            increasing = false;
          }
        } else {
          opacity -= 0.02;
          if (opacity <= 0.3) {
            opacity = 0.3;
            increasing = true;
          }
        }
        
        try {
          map.setPaintProperty(particleLayerId, 'circle-opacity', opacity);
        } catch (e) {
          // エラーを無視
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
    } catch (error) {
      console.error('Error adding flow layers:', error);
    }

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      cleanupLayers();
    };

  }, [map, mobilityData, visible]);

  return null;
};

export default CyberFlowLayer;