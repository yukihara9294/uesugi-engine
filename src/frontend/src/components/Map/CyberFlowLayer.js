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
    console.log('=== CyberFlowLayer Debug ===');
    console.log('Step A: mobilityData received:', mobilityData);
    console.log('Step B: mobilityData type:', typeof mobilityData);
    console.log('Step C: mobilityData keys:', mobilityData ? Object.keys(mobilityData) : 'null');
    
    // 新しいデータ形式（flows/particles）と旧形式（features）の両方に対応
    let flowsData, particlesData;
    
    if (mobilityData && mobilityData.flows && mobilityData.particles) {
      // 新形式: flows と particles が分離されている
      flowsData = mobilityData.flows;
      particlesData = mobilityData.particles;
      console.log('Step D: Using NEW data format');
      console.log('Step E: Flows count:', flowsData?.features?.length);
      console.log('Step F: Particles count:', particlesData?.features?.length);
      console.log('Step G: First particle:', particlesData?.features?.[0]);
    } else if (mobilityData && mobilityData.features) {
      // 旧形式: featuresのみ
      flowsData = mobilityData;
      particlesData = null;
      console.log('Step D: Using LEGACY data format');
      console.log('Step E: Features count:', flowsData?.features?.length);
    } else {
      console.log('Step D: NO mobility data available');
      return;
    }
    
    if (!flowsData || !flowsData.features || flowsData.features.length === 0) {
      console.log('No flow features available');
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
        if (map.getLayer(particleLayerId + '-inner-glow')) map.removeLayer(particleLayerId + '-inner-glow');
        if (map.getLayer(particleLayerId + '-mid-glow')) map.removeLayer(particleLayerId + '-mid-glow');
        if (map.getLayer(particleLayerId + '-glow')) map.removeLayer(particleLayerId + '-glow');
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
    flowsData.features.forEach(feature => {
      const flowCount = feature.properties.flow_count || feature.properties.volume || feature.properties.intensity || 50;
      if (flowCount < minFlow) minFlow = flowCount;
      if (flowCount > maxFlow) maxFlow = flowCount;
    });
    
    console.log(`Mobility flow range: ${minFlow} - ${maxFlow}`);
    
    flowsData.features.forEach((feature, featureIndex) => {
      const origin = feature.geometry.coordinates[0];
      const destination = feature.geometry.coordinates[1];
      const flowCount = feature.properties.flow_count || feature.properties.volume || feature.properties.intensity || 50;
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
          speed: 0.003 + Math.random() * 0.005, // 速度を遅く（約半分）
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
          'line-blur': 1.5,
          'line-opacity': 0  // 初期値を0に（アニメーションで制御）
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
        // APIから提供されたパーティクルデータを使用
        console.log('Step H: Checking particle data...');
        console.log('Step I: particlesData exists?', !!particlesData);
        console.log('Step J: particlesData.features exists?', !!particlesData?.features);
        console.log('Step K: particlesData.features length:', particlesData?.features?.length);
        
        if (particlesData && particlesData.features && particlesData.features.length > 0) {
          console.log(`Step L: SUCCESS! Using ${particlesData.features.length} particles from API`);
          // デバッグ: 最初の数個のパーティクルを表示
          console.log('Step M: Sample particles:', particlesData.features.slice(0, 3));
          // APIのパーティクルデータをそのまま使用
          return particlesData.features.map(particle => {
            // パーティクルの現在位置を計算（アニメーション用）
            const flowIndex = particle.properties.flow_index || 0;
            const particleInfo = particlePositions.current[`particle_${particle.properties.flow_index}_${particle.properties.particle_index}`];
            
            if (!particleInfo) {
              // 初期化
              const speed = particle.properties.speed || (0.003 + Math.random() * 0.005);
              
              if (particle.properties.is_circular) {
                // 円運動パーティクル（渋滞ポイント周辺）
                particlePositions.current[`particle_${particle.properties.flow_index}_${particle.properties.particle_index}`] = {
                  angle: particle.properties.angle_offset || (Math.random() * Math.PI * 2),
                  angleSpeed: speed * 2,
                  center: [particle.properties.center_lon || particle.geometry.coordinates[0], 
                          particle.properties.center_lat || particle.geometry.coordinates[1]],
                  radius: particle.properties.orbit_radius || 0.001,
                  is_circular: true
                };
              } else if (particle.properties.origin_lon && particle.properties.destination_lon) {
                // フロー沿いのパーティクル
                particlePositions.current[`particle_${particle.properties.flow_index}_${particle.properties.particle_index}`] = {
                  position: Math.random(), // ランダムな開始位置
                  speed: speed,
                  origin: [particle.properties.origin_lon, particle.properties.origin_lat],
                  destination: [particle.properties.destination_lon, particle.properties.destination_lat],
                  control: [particle.properties.control_lon || (particle.properties.origin_lon + particle.properties.destination_lon) / 2,
                           particle.properties.control_lat || (particle.properties.origin_lat + particle.properties.destination_lat) / 2]
                };
              } else {
                // デフォルト（現在位置で静止）
                particlePositions.current[`particle_${particle.properties.flow_index}_${particle.properties.particle_index}`] = {
                  position: 0,
                  speed: 0,
                  origin: particle.geometry.coordinates,
                  destination: particle.geometry.coordinates,
                  control: particle.geometry.coordinates
                };
              }
            }
            
            const info = particlePositions.current[`particle_${particle.properties.flow_index}_${particle.properties.particle_index}`];
            
            let x, y;
            
            if (info.is_circular) {
              // 円運動の計算
              x = info.center[0] + Math.cos(info.angle) * info.radius;
              y = info.center[1] + Math.sin(info.angle) * info.radius;
            } else {
              // ベジエ曲線上の位置を計算
              const t = info.position || 0;
              const origin = info.origin;
              const destination = info.destination;
              const control = info.control;
              
              const x2 = Math.pow(1-t, 2) * origin[0] + 2 * (1-t) * t * control[0] + Math.pow(t, 2) * destination[0];
              const y2 = Math.pow(1-t, 2) * origin[1] + 2 * (1-t) * t * control[1] + Math.pow(t, 2) * destination[1];
              x = x2;
              y = y2;
            }
            
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [x, y]
              },
              properties: {
                ...particle.properties,
                size: particle.properties.size || 2
              }
            };
          });
        } else {
          // フォールバック: 各フローに1つのパーティクル（旧動作）
          console.log('Step L: FALLBACK - No particle data from API, creating 1 particle per flow');
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
                  size: 1.5 + ((arc.properties.flow_count - minFlow) / (maxFlow - minFlow)) * 2,  // サイズを1/2に
                  type: arc.properties.type
                }
              });
            }
          });
          
          return particles;
        }
      };
      
      // パーティクルソース
      map.addSource(particleSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: createParticles()
        }
      });
      
      // パーティクルグローレイヤー（大きい光の表現）
      map.addLayer({
        id: particleLayerId + '-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            '*',
            ['get', 'size'],
            5  // グローは5倍の大きさ
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 1.5,  // 強いブラー
          'circle-opacity': 0.1  // 外側を少し濃く
        }
      });
      
      // パーティクル中間グロー
      map.addLayer({
        id: particleLayerId + '-mid-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            '*',
            ['get', 'size'],
            3  // 中間グローは3倍
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 1,
          'circle-opacity': 0.2  // 中間グローを濃く
        }
      });
      
      // パーティクル内側グロー
      map.addLayer({
        id: particleLayerId + '-inner-glow',
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': [
            '*',
            ['get', 'size'],
            1.5  // 内側グローは1.5倍
          ],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.5,
          'circle-opacity': 0.3  // 内側グローを濃く
        }
      });
      
      // パーティクル本体（中心部）
      map.addLayer({
        id: particleLayerId,
        type: 'circle',
        source: particleSourceId,
        paint: {
          'circle-radius': ['/', ['get', 'size'], 2],  // サイズを1/2に
          'circle-color': ['get', 'color'],
          'circle-blur': 0.2,  // 中心は少しシャープに
          'circle-opacity': 0.8  // 中心部をもっと不透明に（はっきり見えるように）
        }
      });
      
      // フローラインのフェードイン・フェードアウト用の変数
      let flowOpacityPhase = 0;
      
      // パーティクルをフローラインに沿って移動させるアニメーション
      const animate = () => {
        if (!map || !map.getLayer(particleLayerId)) {
          return;
        }
        
        // フローラインのフェードイン・フェードアウト
        flowOpacityPhase += 0.02;
        const flowOpacity = Math.abs(Math.sin(flowOpacityPhase)) * 0.15; // 0-0.15の範囲でフェード
        const glowOpacity = Math.abs(Math.sin(flowOpacityPhase)) * 0.08; // 0-0.08の範囲でフェード
        
        try {
          if (map.getLayer(flowLayerId)) {
            map.setPaintProperty(flowLayerId, 'line-opacity', flowOpacity * 0.8);
          }
          if (map.getLayer(flowGlowLayerId)) {
            map.setPaintProperty(flowGlowLayerId, 'line-opacity', glowOpacity);
          }
        } catch (e) {
          // エラーを無視
        }
        
        // 各パーティクルの位置を更新
        Object.keys(particlePositions.current).forEach(key => {
          const particle = particlePositions.current[key];
          
          if (particle.is_circular) {
            // 円運動
            particle.angle += particle.angleSpeed;
            if (particle.angle >= Math.PI * 2) {
              particle.angle -= Math.PI * 2;
            }
          } else if (particle.direction !== undefined) {
            // 旧形式（往復アニメーション）
            particle.position += particle.speed * particle.direction;
            
            // 端に到達したら方向を反転
            if (particle.position >= 1) {
              particle.position = 1;
              particle.direction = -1;
            } else if (particle.position <= 0) {
              particle.position = 0;
              particle.direction = 1;
            }
          } else if (particle.position !== undefined) {
            // 新形式（一方向アニメーション）
            particle.position += particle.speed;
            if (particle.position >= 1) {
              particle.position = 0; // 最初に戻る
            }
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