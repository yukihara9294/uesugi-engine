/**
 * 人流可視化レイヤーコンポーネント
 * 青い半透明の発光パーティクルがデータポイント間を弧を描いて移動
 */

import React, { useEffect, useRef, useState } from 'react';

const MobilityLayer = ({ map, visible }) => {
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    if (!map) return;

    // データポイントを収集（ランドマーク、消費データ、宿泊施設、イベント、ソーシャルデータ）
    const collectDataPoints = () => {
      const points = [];
      
      // ランドマークからデータポイントを収集
      const landmarkSource = map.getSource('landmarks-source');
      if (landmarkSource && landmarkSource._data?.features) {
        landmarkSource._data.features.forEach(feature => {
          points.push({
            id: feature.properties.id,
            type: 'landmark',
            name: feature.properties.name,
            coordinates: feature.geometry.coordinates,
            color: '#FFD700'
          });
        });
      }

      // 消費データからデータポイントを収集
      const consumptionSource = map.getSource('consumption-source');
      if (consumptionSource && consumptionSource._data?.features) {
        consumptionSource._data.features.forEach(feature => {
          points.push({
            id: feature.properties.store_id,
            type: 'consumption',
            name: feature.properties.store_name,
            coordinates: feature.geometry.coordinates,
            color: feature.properties.color
          });
        });
      }

      // 宿泊施設からデータポイントを収集
      const accommodationSource = map.getSource('rich-accommodation-source');
      if (accommodationSource && accommodationSource._data?.features) {
        accommodationSource._data.features.forEach(feature => {
          points.push({
            id: feature.properties.id,
            type: 'accommodation',
            name: feature.properties.name,
            coordinates: feature.geometry.coordinates,
            color: '#4CAF50'
          });
        });
      }

      // イベントからデータポイントを収集
      const eventSource = map.getSource('events-source');
      if (eventSource && eventSource._data?.features) {
        eventSource._data.features.forEach(feature => {
          points.push({
            id: feature.properties.id,
            type: 'event',
            name: feature.properties.name,
            coordinates: feature.geometry.coordinates,
            color: '#FF6B6B'
          });
        });
      }

      setDataPoints(points);
    };

    // マップの読み込み完了後にデータポイントを収集
    if (map.loaded()) {
      collectDataPoints();
    } else {
      map.on('load', collectDataPoints);
    }

    // データソースの変更を監視
    const sourceDataHandler = () => {
      collectDataPoints();
    };
    map.on('sourcedata', sourceDataHandler);

    return () => {
      map.off('sourcedata', sourceDataHandler);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !visible || dataPoints.length < 2) return;

    // Canvas要素を作成
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '500';
    
    const mapContainer = map.getContainer();
    mapContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Canvas サイズを設定
    const resizeCanvas = () => {
      canvas.width = mapContainer.offsetWidth;
      canvas.height = mapContainer.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // パーティクルクラス
    class Particle {
      constructor(start, end, startPoint, endPoint) {
        this.start = start;
        this.end = end;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.progress = 0;
        this.speed = 0.5 + Math.random() * 0.5; // 速度のランダム化
        this.baseSize = 3 + Math.random() * 4;
        this.size = this.baseSize;
        this.opacity = 0.3 + Math.random() * 0.3;
        this.trail = []; // 軌跡を保存
        this.maxTrailLength = 10;
        
        // 弧の高さを計算（距離に基づく）
        const distance = Math.sqrt(
          Math.pow(end[0] - start[0], 2) + 
          Math.pow(end[1] - start[1], 2)
        );
        this.arcHeight = distance * 0.3 + 20; // 距離に応じた弧の高さ
      }

      update() {
        this.progress += this.speed * 0.01;
        
        if (this.progress >= 1) {
          // 終点に到達したら始点と終点を入れ替え
          [this.start, this.end] = [this.end, this.start];
          [this.startPoint, this.endPoint] = [this.endPoint, this.startPoint];
          this.progress = 0;
          this.trail = [];
        }

        // 現在位置を計算（ベジェ曲線）
        const t = this.progress;
        const controlX = (this.start[0] + this.end[0]) / 2;
        const controlY = (this.start[1] + this.end[1]) / 2 - this.arcHeight;
        
        const x = Math.pow(1 - t, 2) * this.start[0] + 
                 2 * (1 - t) * t * controlX + 
                 Math.pow(t, 2) * this.end[0];
        const y = Math.pow(1 - t, 2) * this.start[1] + 
                 2 * (1 - t) * t * controlY + 
                 Math.pow(t, 2) * this.end[1];

        // 軌跡に現在位置を追加
        this.trail.push({ x, y, opacity: this.opacity });
        if (this.trail.length > this.maxTrailLength) {
          this.trail.shift();
        }

        return { x, y };
      }

      draw(ctx) {
        // 軌跡を描画
        this.trail.forEach((point, index) => {
          const trailOpacity = (index / this.trail.length) * point.opacity * 0.3;
          const trailSize = this.size * (index / this.trail.length);
          
          // グロー効果
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
          
          ctx.fillStyle = `rgba(59, 130, 246, ${trailOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });

        // メインパーティクル
        const pos = this.update();
        
        // 外側のグロー
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(59, 130, 246, 1)';
        ctx.fillStyle = `rgba(96, 165, 250, ${this.opacity * 0.2})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 内側の明るい部分
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(147, 197, 253, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心の白い部分
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // パーティクルを生成
    const createParticles = () => {
      particlesRef.current = [];
      
      // ランダムに接続を作成（最大25個のパーティクル）
      const numParticles = Math.min(25, dataPoints.length);
      
      for (let i = 0; i < numParticles; i++) {
        const startIdx = Math.floor(Math.random() * dataPoints.length);
        let endIdx = Math.floor(Math.random() * dataPoints.length);
        
        // 同じポイントは避ける
        while (endIdx === startIdx && dataPoints.length > 1) {
          endIdx = Math.floor(Math.random() * dataPoints.length);
        }
        
        const startPoint = dataPoints[startIdx];
        const endPoint = dataPoints[endIdx];
        
        // 座標を画面座標に変換
        const startCoord = map.project(startPoint.coordinates);
        const endCoord = map.project(endPoint.coordinates);
        
        particlesRef.current.push(new Particle(
          [startCoord.x, startCoord.y],
          [endCoord.x, endCoord.y],
          startPoint,
          endPoint
        ));
      }
    };

    createParticles();

    // アニメーションループ
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 接続線を描画（薄い青色）
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.lineWidth = 1;
      particlesRef.current.forEach(particle => {
        ctx.beginPath();
        ctx.moveTo(particle.start[0], particle.start[1]);
        
        // ベジェ曲線で接続
        const controlX = (particle.start[0] + particle.end[0]) / 2;
        const controlY = (particle.start[1] + particle.end[1]) / 2 - particle.arcHeight;
        ctx.quadraticCurveTo(controlX, controlY, particle.end[0], particle.end[1]);
        ctx.stroke();
      });
      
      // パーティクルを描画
      particlesRef.current.forEach(particle => {
        particle.draw(ctx);
      });
      
      animationRef.current = requestAnimationFrame(animateThrottled);
    };

    // FPS制限の設定
    let lastFrameTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animateThrottled = (currentTime) => {
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animateThrottled);
        return;
      }
      lastFrameTime = currentTime;
      animate();
    };

    animationRef.current = requestAnimationFrame(animateThrottled);

    // マップの移動・ズーム時にパーティクルの位置を更新
    const updateParticlePositions = () => {
      const zoom = map.getZoom();
      const zoomScale = Math.max(0.3, Math.min(2, zoom / 12)); // Scale based on zoom level
      
      particlesRef.current.forEach(particle => {
        const startCoord = map.project(particle.startPoint.coordinates);
        const endCoord = map.project(particle.endPoint.coordinates);
        particle.start = [startCoord.x, startCoord.y];
        particle.end = [endCoord.x, endCoord.y];
        
        // ズームレベルに基づいてパーティクルサイズを調整
        particle.size = particle.baseSize * zoomScale;
        
        // 弧の高さも再計算
        const distance = Math.sqrt(
          Math.pow(particle.end[0] - particle.start[0], 2) + 
          Math.pow(particle.end[1] - particle.start[1], 2)
        );
        particle.arcHeight = distance * 0.3 + 20;
      });
    };

    map.on('move', updateParticlePositions);
    map.on('zoom', updateParticlePositions);

    // クリーンアップ
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      window.removeEventListener('resize', resizeCanvas);
      map.off('move', updateParticlePositions);
      map.off('zoom', updateParticlePositions);
    };
  }, [map, visible, dataPoints]);

  // データポイントのマーカーを表示
  useEffect(() => {
    if (!map || !visible || dataPoints.length === 0) return;

    // 始点・終点マーカー用のソース
    const markersSource = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: dataPoints.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point.coordinates
          },
          properties: {
            ...point
          }
        }))
      }
    };

    // 既存のマーカーレイヤーを削除
    if (map.getLayer('mobility-markers')) map.removeLayer('mobility-markers');
    if (map.getLayer('mobility-markers-glow')) map.removeLayer('mobility-markers-glow');
    if (map.getSource('mobility-markers-source')) map.removeSource('mobility-markers-source');

    // マーカーソースを追加
    map.addSource('mobility-markers-source', markersSource);

    // グロー効果レイヤー
    map.addLayer({
      id: 'mobility-markers-glow',
      type: 'circle',
      source: 'mobility-markers-source',
      paint: {
        'circle-radius': 15,
        'circle-color': '#3B82F6',
        'circle-blur': 1,
        'circle-opacity': 0.3
      }
    });

    // マーカーレイヤー
    map.addLayer({
      id: 'mobility-markers',
      type: 'circle',
      source: 'mobility-markers-source',
      paint: {
        'circle-radius': 6,
        'circle-color': '#60A5FA',
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2,
        'circle-opacity': 0.8
      }
    });

    return () => {
      if (map.getLayer('mobility-markers')) map.removeLayer('mobility-markers');
      if (map.getLayer('mobility-markers-glow')) map.removeLayer('mobility-markers-glow');
      if (map.getSource('mobility-markers-source')) map.removeSource('mobility-markers-source');
    };
  }, [map, visible, dataPoints]);

  return null;
};

export default MobilityLayer;