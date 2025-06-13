/**
 * サイバーチックな人流可視化レイヤー（最適化版）
 */

import React, { useEffect, useRef } from 'react';

const CyberFlowLayer = ({ map, mobilityData, visible }) => {
  const animationRef = useRef(null);
  const particlePositions = useRef({});

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
    const allParticles = [];
    
    // フロータイプごとの色設定
    const flowTypeColors = {
      'commute': '#00FFFF',     // シアン（通勤）
      'tourist': '#FF00FF',     // マゼンタ（観光）
      'tourism': '#FF00FF',     // マゼンタ（観光）
      'general': '#FFFF00',     // イエロー（一般）
      'default': '#00FF00'      // グリーン（その他）
    };
    
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
      const flowType = feature.properties.type || feature.properties.flow_type || 'general';
      
      // 正規化（0-1の範囲に）
      const normalized = (flowCount - minFlow) / (maxFlow - minFlow) || 0;
      
      // フロータイプに基づいて色を設定
      const color = flowTypeColors[flowType] || flowTypeColors['default'];
      
      // 弧の座標を生成
      const points = [];
      const steps = 50; // より滑らかな曲線のためステップ数を増やす
      
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
      }
      
      // パーティクルの初期位置を設定
      if (!particlePositions.current[featureIndex]) {
        particlePositions.current[featureIndex] = {
          position: 0,
          direction: 1,
          speed: 0.005 + Math.random() * 0.01, // 速度をランダム化
          path: points
        };
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
          color: color,
          type: flowType,
          lineWidth: 0.5 + normalized * 1.5  // 1/3に縮小（1.5-6 → 0.5-2）
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
      
      // グロー効果（線幅を1/3に）
      map.addLayer({
        id: flowGlowLayerId,
        type: 'line',
        source: flowSourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'lineWidth'], // 動的な線幅を使用
          'line-blur': 1,
          'line-opacity': 0.3
        }
      });
      
      // メインライン（線幅を1/3に）
      map.addLayer({
        id: flowLayerId,
        type: 'line',
        source: flowSourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['*', ['get', 'lineWidth'], 0.6], // メインラインは少し細く
          'line-opacity': 0.8
        }
      });
      
      // 初期パーティクルデータを生成
      const createParticles = () => {
        const particles = [];
        
        arcFeatures.forEach((arc, index) => {
          const particleInfo = particlePositions.current[index];
          if (!particleInfo) return;
          
          // 現在の位置に基づいてパーティクルの座標を取得
          const pointIndex = Math.floor(particleInfo.position * (particleInfo.path.length - 1));
          if (pointIndex >= 0 && pointIndex < particleInfo.path.length) {
            const coords = particleInfo.path[pointIndex];
            
            particles.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: coords
              },
              properties: {
                flowId: index,
                color: arc.properties.color,
                size: 3 + ((arc.properties.flow_count - minFlow) / (maxFlow - minFlow)) * 4,
                type: arc.properties.type
              }
            });
          }
        });
        
        return particles;
      };
      
      // パーティクルソース
      map.addSource(particleSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: createParticles()
        }
      });
      
      // パーティクルレイヤー
      map.addLayer({
        id: particleLayerId,
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': ['get', 'size'],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.5,
          'circle-opacity': 0.9
        }
      });
      
      // パーティクルをフローラインに沿って移動させるアニメーション
      const animate = () => {
        if (!map || !map.getLayer(particleLayerId)) {
          return;
        }
        
        // 各パーティクルの位置を更新
        Object.keys(particlePositions.current).forEach(key => {
          const particle = particlePositions.current[key];
          particle.position += particle.speed * particle.direction;
          
          // 端に到達したら方向を反転
          if (particle.position >= 1) {
            particle.position = 1;
            particle.direction = -1;
          } else if (particle.position <= 0) {
            particle.position = 0;
            particle.direction = 1;
          }
        });
        
        // パーティクルの位置を更新
        const newParticles = createParticles();
        
        try {
          const source = map.getSource(particleSourceId);
          if (source) {
            source.setData({
              type: 'FeatureCollection',
              features: newParticles
            });
          }
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