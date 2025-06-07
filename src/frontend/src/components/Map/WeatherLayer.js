/**
 * 気象データレイヤーコンポーネント
 * 天気情報をリッチなビジュアルで表示
 */

import React, { useEffect } from 'react';

const WeatherLayer = ({ map, data, visible }) => {
  useEffect(() => {
    if (!map || !data) return;

    console.log('WeatherLayer: Received data:', data);
    
    // APIレスポンスの構造に対応
    const weatherArray = data.current_weather || (Array.isArray(data) ? data : []);
    if (!Array.isArray(weatherArray)) {
      console.error('WeatherLayer: Invalid data format, expected array but got:', typeof weatherArray);
      console.error('WeatherLayer: Data structure:', data);
      return;
    }

    console.log('WeatherLayer: Initializing with', weatherArray.length, 'weather points');

    try {
      // 既存レイヤーのクリーンアップ
      const layers = ['weather-circles', 'weather-temperature', 'weather-icons', 'weather-glow'];
      layers.forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('weather-source')) {
        map.removeSource('weather-source');
      }

      // 天気アイコンのマッピング
      const weatherIcons = {
        '晴れ': '☀️',
        '晴': '☀️',
        '曇り': '☁️',
        '曇': '☁️',
        '雨': '🌧️',
        '小雨': '🌦️',
        '雪': '❄️',
        '霧': '🌫️'
      };

      // GeoJSONデータの作成
      const features = weatherArray.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.longitude, item.latitude]
        },
        properties: {
          temperature: item.temperature,
          humidity: item.humidity,
          condition: item.weather_condition,
          landmark: item.landmark_name,
          wind_speed: item.wind_speed,
          precipitation: item.precipitation,
          icon: weatherIcons[item.weather_condition] || '🌤️',
          temp_color: item.temperature > 30 ? '#FF5722' : 
                      item.temperature > 25 ? '#FF9800' : 
                      item.temperature > 20 ? '#FFC107' : 
                      item.temperature > 15 ? '#8BC34A' : '#03A9F4'
        }
      }));

      // ソースを追加
      map.addSource('weather-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // グロー効果レイヤー（より大きく）
      map.addLayer({
        id: 'weather-glow',
        type: 'circle',
        source: 'weather-source',
        paint: {
          'circle-radius': 80, // 2倍のサイズ
          'circle-color': ['get', 'temp_color'],
          'circle-blur': 2,
          'circle-opacity': 0.5
        }
      });

      // メインの円形レイヤー（より大きく）
      map.addLayer({
        id: 'weather-circles',
        type: 'circle',
        source: 'weather-source',
        paint: {
          'circle-radius': 50, // 2倍のサイズ
          'circle-color': ['get', 'temp_color'],
          'circle-stroke-width': 5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1
        }
      });

      // 温度表示レイヤー
      map.addLayer({
        id: 'weather-temperature',
        type: 'symbol',
        source: 'weather-source',
        layout: {
          'text-field': [
            'format',
            ['concat', ['to-string', ['round', ['get', 'temperature']]], '°C'],
            { 'font-scale': 1.5, 'text-font': ['literal', ['Open Sans Bold', 'Arial Unicode MS Bold']] }
          ],
          'text-size': 24, // より大きなフォント
          'text-anchor': 'center',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.7)',
          'text-halo-width': 2
        }
      });

      // 天気アイコンと地名レイヤー
      map.addLayer({
        id: 'weather-icons',
        type: 'symbol',
        source: 'weather-source',
        layout: {
          'text-field': [
            'format',
            ['get', 'icon'],
            { 'font-scale': 3 }, // より大きなアイコン
            '\n',
            ['get', 'landmark'],
            { 'font-scale': 0.9, 'text-font': ['literal', ['Open Sans Regular', 'Arial Unicode MS Regular']] }
          ],
          'text-size': 14,
          'text-anchor': 'top',
          'text-offset': [0, 2.5],
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 2
        }
      });

      // ホバー時のポップアップ
      if (!window.mapboxgl || !window.mapboxgl.Popup) {
        console.warn('WeatherLayer: Mapbox GL Popup not available');
        return;
      }
      
      const popup = new window.mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 30
      });

      map.on('mouseenter', 'weather-circles', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        
        // 温度ゲージの作成
        const tempGauge = `
          <div style="position: relative; width: 200px; height: 10px; background: linear-gradient(to right, #03A9F4, #8BC34A, #FFC107, #FF9800, #FF5722); border-radius: 5px;">
            <div style="position: absolute; left: ${Math.min(Math.max((props.temperature / 40) * 100, 0), 100)}%; top: -5px; 
                        width: 20px; height: 20px; background: white; border: 2px solid #333; border-radius: 50%; 
                        transform: translateX(-50%);"></div>
          </div>
        `;
        
        const html = `
          <div style="padding: 15px; min-width: 280px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; display: flex; align-items: center;">
              <span style="font-size: 30px; margin-right: 10px;">${props.icon}</span>
              ${props.landmark}
            </h3>
            <div style="background: ${props.temp_color}; color: white; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 10px;">
              <div style="font-size: 32px; font-weight: bold;">${props.temperature}°C</div>
              <div style="font-size: 14px;">${props.condition}</div>
            </div>
            <div style="margin: 10px 0;">
              <div style="color: #666; font-size: 12px; margin-bottom: 5px;">温度レンジ (0-40°C)</div>
              ${tempGauge}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 15px;">
              <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #1976d2; font-size: 20px;">💧</div>
                <div style="color: #666; font-size: 11px;">湿度</div>
                <div style="color: #333; font-weight: bold;">${props.humidity}%</div>
              </div>
              <div style="background: #f3e5f5; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #7b1fa2; font-size: 20px;">💨</div>
                <div style="color: #666; font-size: 11px;">風速</div>
                <div style="color: #333; font-weight: bold;">${props.wind_speed}m/s</div>
              </div>
              <div style="background: #e8f5e9; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #388e3c; font-size: 20px;">☔</div>
                <div style="color: #666; font-size: 11px;">降水量</div>
                <div style="color: #333; font-weight: bold;">${props.precipitation}mm</div>
              </div>
            </div>
          </div>
        `;
        
        popup.setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseleave', 'weather-circles', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // レイヤーの表示/非表示
      const layerIds = ['weather-glow', 'weather-circles', 'weather-temperature', 'weather-icons'];
      layerIds.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      });

      console.log('WeatherLayer: Successfully initialized');

    } catch (error) {
      console.error('WeatherLayer: Error:', error);
    }

  }, [map, data, visible]);

  return null;
};

export default WeatherLayer;