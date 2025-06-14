/**
 * サイバーチックな人流可視化レイヤー（シンプル版）
 */

import React, { useEffect, useRef } from 'react';

const CyberFlowLayer = ({ map, mobilityData, visible }) => {
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const isInitialized = useRef(false);
  const currentDataRef = useRef(null);

  useEffect(() => {
    if (!map || !visible) return;

    console.log('CyberFlowLayer effect triggered:', {
      map: !!map,
      visible,
      mobilityData: !!mobilityData,
      flowCount: mobilityData?.flows?.features?.length || 0,
      particleCount: mobilityData?.particles?.features?.length || 0,
      isInitialized: isInitialized.current,
      currentData: !!currentDataRef.current
    });

    // Skip if already initialized with the same data
    if (isInitialized.current && currentDataRef.current === mobilityData && mobilityData) {
      console.log('CyberFlowLayer: Skipping update, same data');
      return;
    }
    
    // Reset if data changed
    if (currentDataRef.current !== mobilityData) {
      console.log('CyberFlowLayer: Data changed, resetting layers');
      isInitialized.current = false;
      currentDataRef.current = mobilityData;
    }

    // データ形式の確認
    let flowsData, particlesData;
    
    if (mobilityData && mobilityData.flows && mobilityData.particles) {
      flowsData = mobilityData.flows;
      particlesData = mobilityData.particles;
    } else if (mobilityData && mobilityData.features) {
      flowsData = mobilityData;
      particlesData = null;
    } else {
      return;
    }
    
    if (!flowsData || !flowsData.features || flowsData.features.length === 0) {
      return;
    }

    const flowSourceId = 'cyber-flow-lines-source';
    const flowLayerId = 'cyber-flow-lines';
    const flowGlowLayerId = 'cyber-flow-lines-glow';
    const particleSourceId = 'cyber-particles-source';
    const particleLayerId = 'cyber-particles';
    
    // 既存のレイヤーとソースを削除
    const cleanupLayers = () => {
      try {
        if (map.getLayer(particleLayerId)) map.removeLayer(particleLayerId);
        if (map.getLayer(particleLayerId + '-inner-glow')) map.removeLayer(particleLayerId + '-inner-glow');
        if (map.getLayer(particleLayerId + '-mid-glow')) map.removeLayer(particleLayerId + '-mid-glow');
        if (map.getLayer(particleLayerId + '-glow')) map.removeLayer(particleLayerId + '-glow');
        
        // 距離グループごとのレイヤーも削除
        ['short', 'medium', 'long'].forEach(groupName => {
          const layerId = `${flowLayerId}-${groupName}`;
          const glowLayerId = `${flowGlowLayerId}-${groupName}`;
          const sourceId = `${flowSourceId}-${groupName}`;
          
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        });
        
        // 旧バージョンのレイヤーも削除（互換性のため）
        if (map.getLayer(flowGlowLayerId)) map.removeLayer(flowGlowLayerId);
        if (map.getLayer(flowLayerId)) map.removeLayer(flowLayerId);
        if (map.getSource(particleSourceId)) map.removeSource(particleSourceId);
        if (map.getSource(flowSourceId)) map.removeSource(flowSourceId);
      } catch (e) {
        // エラーを無視
      }
    };
    
    // データが変更された場合は既存レイヤーをクリーンアップ
    if (!isInitialized.current || currentDataRef.current !== mobilityData) {
      console.log('CyberFlowLayer: Cleaning up existing layers');
      cleanupLayers();
    }
    
    // フロータイプごとの色設定
    const flowTypeColors = {
      'commute': '#00FFFF',     // シアン（通勤）
      'tourist': '#FF00FF',     // マゼンタ（観光）
      'tourism': '#FF00FF',     // マゼンタ（観光）
      'general': '#FFFF00',     // イエロー（一般）
      'shinkansen': '#00FFFF',  // シアン（新幹線）
      'highway': '#FF00FF',     // マゼンタ（高速道路）
      'inter-prefecture': '#FFFF00', // イエロー（県間）
      'default': '#00FF00'      // グリーン（その他）
    };
    
    // フローの最大・最小値を計算
    let minFlow = Infinity;
    let maxFlow = -Infinity;
    flowsData.features.forEach(feature => {
      const flowCount = feature.properties.flow_count || feature.properties.volume || feature.properties.intensity || 50;
      if (flowCount < minFlow) minFlow = flowCount;
      if (flowCount > maxFlow) maxFlow = flowCount;
    });
    
    // フローラインとパーティクルの準備
    const flowPaths = [];
    const arcFeatures = [];
    
    // 距離グループごとのフェード設定
    const distanceGroups = {
      short: { maxDistance: 0.05, features: [] },    // 5km未満
      medium: { maxDistance: 0.2, features: [] },    // 20km未満
      long: { maxDistance: Infinity, features: [] }  // 20km以上
    };
    
    // フローラインごとに処理
    flowsData.features.forEach((feature, index) => {
      const origin = feature.geometry.coordinates[0];
      const destination = feature.geometry.coordinates[1];
      const flowCount = feature.properties.flow_count || feature.properties.volume || feature.properties.intensity || 50;
      const flowType = feature.properties.type || feature.properties.flow_type || 'general';
      
      // 正規化
      const normalized = (flowCount - minFlow) / (maxFlow - minFlow) || 0;
      const color = flowTypeColors[flowType] || flowTypeColors['default'];
      
      // 距離計算
      const distance = Math.sqrt(
        Math.pow(destination[0] - origin[0], 2) + 
        Math.pow(destination[1] - origin[1], 2)
      );
      
      // 距離グループを決定
      let distanceGroup;
      if (distance < 0.05) {
        distanceGroup = 'short';
      } else if (distance < 0.2) {
        distanceGroup = 'medium';
      } else {
        distanceGroup = 'long';
      }
      
      // ベジエ曲線のパスを生成
      const points = [];
      const steps = 30;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const midLng = (origin[0] + destination[0]) / 2;
        const midLat = (origin[1] + destination[1]) / 2;
        
        const height = Math.min(distance * 0.2, 0.05);
        
        // 簡単な2次ベジエ曲線
        const lng = Math.pow(1-t, 2) * origin[0] + 
                   2 * (1-t) * t * (midLng + height) + 
                   Math.pow(t, 2) * destination[0];
                   
        const lat = Math.pow(1-t, 2) * origin[1] + 
                   2 * (1-t) * t * (midLat + height) + 
                   Math.pow(t, 2) * destination[1];
        
        points.push([lng, lat]);
      }
      
      flowPaths.push({
        index: index,
        points: points,
        flowCount: flowCount,
        normalized: normalized,
        color: color,
        flowType: flowType,
        distance: distance,
        distanceGroup: distanceGroup
      });
      
      const arcFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points
        },
        properties: {
          flow_count: flowCount,
          color: color,
          type: flowType,
          lineWidth: 0.5 + normalized * 1.5,
          distanceGroup: distanceGroup
        }
      };
      
      arcFeatures.push(arcFeature);
      distanceGroups[distanceGroup].features.push(arcFeature);
    });
    
    try {
      // 距離グループごとにソースとレイヤーを作成
      const distanceGroupLayers = {};
      
      Object.entries(distanceGroups).forEach(([groupName, groupData]) => {
        if (groupData.features.length === 0) return;
        
        const sourceId = `${flowSourceId}-${groupName}`;
        const layerId = `${flowLayerId}-${groupName}`;
        const glowLayerId = `${flowGlowLayerId}-${groupName}`;
        
        // ソースを追加
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: groupData.features
          }
        });
        
        // グロー効果
        map.addLayer({
          id: glowLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'lineWidth'],
            'line-blur': 1.5,
            'line-opacity': 0
          }
        });
        
        // メインライン
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['*', ['get', 'lineWidth'], 0.6],
            'line-opacity': 0
          }
        });
        
        distanceGroupLayers[groupName] = {
          layerId: layerId,
          glowLayerId: glowLayerId
        };
      });
      
      // パーティクルの初期化と生成
      const initializeParticles = () => {
        particlesRef.current = [];
        
        // APIからパーティクルデータがある場合は使用しない（flow_indexが不正なため）
        // 代わりに各フローに対してパーティクルを生成
        if (false && particlesData && particlesData.features && particlesData.features.length > 0) {
          // 使用しない
        } else {
          // 各フローにパーティクルを生成
          flowPaths.forEach((flowPath, index) => {
            if (!flowPath.points || flowPath.points.length < 2) {
              return;
            }
            
            // 通行量に基づいてパーティクル数を決定
            const baseParticles = Math.max(5, Math.min(20, Math.floor(flowPath.normalized * 20)));
            const numParticles = baseParticles;
            
            for (let i = 0; i < numParticles; i++) {
              const particleData = {
                id: particlesRef.current.length,
                flowIndex: index,
                position: (i / numParticles) + (Math.random() * 0.1),  // 少しランダムに分布
                speed: 0.002 + Math.random() * 0.003,  // 速度を遅く
                color: flowPath.color || '#00FFFF',
                size: 2 + flowPath.normalized * 2,  // サイズを2-4の範囲に
                flowPath: flowPath.points
              };
              
              particlesRef.current.push(particleData);
            }
          });
        }
      };
      
      // パーティクルGeoJSONを生成
      const createParticleGeoJSON = () => {
        const features = [];
        
        particlesRef.current.forEach(particle => {
          if (!particle.flowPath || particle.flowPath.length < 2) return;
          
          // パスに沿った位置を計算
          const t = particle.position;
          const pathIndex = Math.floor(t * (particle.flowPath.length - 1));
          const pathT = (t * (particle.flowPath.length - 1)) % 1;
          
          let x, y;
          if (pathIndex < particle.flowPath.length - 1) {
            const p1 = particle.flowPath[pathIndex];
            const p2 = particle.flowPath[pathIndex + 1];
            x = p1[0] + (p2[0] - p1[0]) * pathT;
            y = p1[1] + (p2[1] - p1[1]) * pathT;
          } else {
            const lastPoint = particle.flowPath[particle.flowPath.length - 1];
            x = lastPoint[0];
            y = lastPoint[1];
          }
          
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [x, y]
            },
            properties: {
              color: particle.color || '#00FFFF',  // デフォルトはシアン
              size: particle.size || 2
            }
          });
        });
        
        return {
          type: 'FeatureCollection',
          features: features
        };
      };
      
      // パーティクルを初期化
      initializeParticles();
      const initialParticleData = createParticleGeoJSON();
      
      map.addSource(particleSourceId, {
        type: 'geojson',
        data: initialParticleData
      });
      
      // フローラインのフェードイン・フェードアウト用の変数（グループごと）
      const flowOpacityPhases = {
        short: 0,
        medium: Math.PI / 3,    // 120度ずらす
        long: 2 * Math.PI / 3   // 240度ずらす
      };
      
      // パーティクルグローレイヤー（大きい光の表現）
      map.addLayer({
        id: particleLayerId + '-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, ['*', ['get', 'size'], 2],    // ズーム8: サイズ×2
            11, ['*', ['get', 'size'], 5],   // ズーム11: サイズ×5
            14, ['*', ['get', 'size'], 8]    // ズーム14: サイズ×8
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 1.5,  // 強いブラー
          'circle-opacity': 0.05  // 薄く
        }
      });
      
      // パーティクル中間グロー
      map.addLayer({
        id: particleLayerId + '-mid-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, ['*', ['get', 'size'], 1.5],  // ズーム8: サイズ×1.5
            11, ['*', ['get', 'size'], 3],   // ズーム11: サイズ×3
            14, ['*', ['get', 'size'], 5]    // ズーム14: サイズ×5
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 1,
          'circle-opacity': 0.1  // 薄く
        }
      });
      
      // パーティクル内側グロー
      map.addLayer({
        id: particleLayerId + '-inner-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, ['*', ['get', 'size'], 1],    // ズーム8: サイズ×1
            11, ['*', ['get', 'size'], 1.5], // ズーム11: サイズ×1.5
            14, ['*', ['get', 'size'], 2]    // ズーム14: サイズ×2
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.5,
          'circle-opacity': 0.15  // 薄く
        }
      });
      
      // パーティクル本体（中心部）
      map.addLayer({
        id: particleLayerId,
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, ['*', ['get', 'size'], 0.5],  // ズーム8: サイズ×0.5（小さく）
            11, ['get', 'size'],             // ズーム11: 元のサイズ
            14, ['*', ['get', 'size'], 1.5]  // ズーム14: サイズ×1.5
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.2,  // 中心は少しシャープに
          'circle-opacity': 0.6  // 中心部の透明度を少し上げる（濃すぎたため）
        }
      });
      
      // アニメーションループ
      const animate = () => {
        if (!map || typeof map.getLayer !== 'function' || !map.getLayer(particleLayerId)) {
          return;
        }
        
        // フローラインのフェードイン・フェードアウト（距離グループごと）
        Object.entries(distanceGroupLayers).forEach(([groupName, layers]) => {
          flowOpacityPhases[groupName] += 0.02;
          const flowOpacity = Math.abs(Math.sin(flowOpacityPhases[groupName])) * 0.3;
          const glowOpacity = Math.abs(Math.sin(flowOpacityPhases[groupName])) * 0.15;
          
          try {
            if (map.getLayer(layers.layerId)) {
              map.setPaintProperty(layers.layerId, 'line-opacity', flowOpacity);
            }
            if (map.getLayer(layers.glowLayerId)) {
              map.setPaintProperty(layers.glowLayerId, 'line-opacity', glowOpacity);
            }
          } catch (e) {
            // エラーを無視
          }
        });
        
        // パーティクルの位置を更新
        particlesRef.current.forEach(particle => {
          particle.position += particle.speed;
          if (particle.position >= 1) {
            particle.position = 0;
          }
        });
        
        // 新しい位置でGeoJSONを再生成
        const updatedParticleData = createParticleGeoJSON();
        
        try {
          const source = map.getSource(particleSourceId);
          if (source) {
            source.setData(updatedParticleData);
          }
        } catch (e) {
          // エラーを無視
        }
        
        // FPSを20に制限（50ms = 1000ms / 20fps）
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, 50);
      };
      
      // アニメーションを開始（既存のアニメーションは停止済み）
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      console.log('CyberFlowLayer: Starting animation with', particlesRef.current.length, 'particles');
      animate();
      isInitialized.current = true;
      
    } catch (error) {
      console.error('Error adding flow layers:', error);
    }

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      cleanupLayers();
      isInitialized.current = false;
      currentDataRef.current = null;
      particlesRef.current = [];
    };

  }, [map, visible, mobilityData]);

  return null;
};

export default CyberFlowLayer;