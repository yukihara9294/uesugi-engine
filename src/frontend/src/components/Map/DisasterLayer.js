import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const DisasterLayer = ({ map, visible, selectedPrefecture, onDataCountUpdate }) => {
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!map || !visible || !selectedPrefecture) {
      return;
    }

    // Layer IDs
    const disasterLayerId = 'disaster-facilities';
    const disasterSourceId = 'disaster-facilities-source';
    const disaster3DLayerId = 'disaster-facilities-3d';
    const disasterGlowLayerId = 'disaster-facilities-glow';
    const disasterLabelsLayerId = 'disaster-labels';

    // Disaster shelter type colors
    const shelterColors = {
      earthquake: '#FF5722',      // Deep orange for earthquake shelters
      flood: '#2196F3',          // Blue for flood shelters
      tsunami: '#00BCD4',        // Cyan for tsunami shelters
      designated: '#F44336',     // Red for designated emergency shelters
      general: '#FF9800'         // Orange for general shelters
    };

    // Cleanup function
    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (map.getLayer(disasterLabelsLayerId)) map.removeLayer(disasterLabelsLayerId);
      if (map.getLayer(disasterGlowLayerId)) map.removeLayer(disasterGlowLayerId);
      if (map.getLayer(disaster3DLayerId)) map.removeLayer(disaster3DLayerId);
      if (map.getLayer(disasterLayerId)) map.removeLayer(disasterLayerId);
      if (map.getSource(disasterSourceId)) map.removeSource(disasterSourceId);
    };

    cleanup();

    if (!visible) {
      return;
    }

    // Test data for Yamaguchi with very large orange markers
    const createTestDisasterData = () => {
      const yamaguchiCenter = [131.4714, 34.1858];
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.015, yamaguchiCenter[1] + 0.025] },
            properties: { name: 'テスト指定緊急避難場所1', capacity: 1000, address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.015, yamaguchiCenter[1] + 0.025] },
            properties: { name: 'テスト地震避難所1', capacity: 500, address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0], yamaguchiCenter[1]] },
            properties: { name: 'テスト洪水避難所1', capacity: 800, address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.02, yamaguchiCenter[1] - 0.025] },
            properties: { name: 'テスト津波避難所1', capacity: 600, address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.02, yamaguchiCenter[1] - 0.025] },
            properties: { name: 'テスト一般避難所1', capacity: 400, address: '山口県山口市' }
          }
        ]
      };
    };

    // Fetch disaster facilities data
    fetch(`/api/v1/facilities/disaster/${encodeURIComponent(selectedPrefecture)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Disaster facilities data:', data);
        
        if (!data.features || data.features.length === 0) {
          console.warn('No disaster facilities data available');
          return;
        }
        
        // Report data count
        if (onDataCountUpdate) {
          onDataCountUpdate(data.features.length);
        }

        // Enhance features with shelter type colors
        const enhancedFeatures = data.features.map(feature => {
          let shelterType = 'general';
          const name = feature.properties.name || '';
          
          if (name.includes('地震') || name.includes('震災')) {
            shelterType = 'earthquake';
          } else if (name.includes('洪水') || name.includes('水害')) {
            shelterType = 'flood';
          } else if (name.includes('津波')) {
            shelterType = 'tsunami';
          } else if (name.includes('指定緊急')) {
            shelterType = 'designated';
          }
          
          return {
            ...feature,
            properties: {
              ...feature.properties,
              shelter_type: shelterType,
              color: shelterColors[shelterType],
              icon: '⚠️'
            }
          };
        });

        // Add source
        map.addSource(disasterSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: enhancedFeatures
          }
        });

        // Add glow layer for emergency effect
        map.addLayer({
          id: disasterGlowLayerId,
          type: 'circle',
          source: disasterSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 12,
              15, 20,
              20, 30
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0,
            'circle-blur': 2
          }
        });

        // Add main disaster facilities layer
        map.addLayer({
          id: disasterLayerId,
          type: 'circle',
          source: disasterSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 5,
              15, 10,
              20, 15
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        });

        // Add 3D triangular markers for shelters at higher zoom levels
        map.addLayer({
          id: disaster3DLayerId,
          type: 'fill-extrusion',
          source: disasterSourceId,
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14, 0,
              15, 20,
              18, 40
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9
          },
          minzoom: 14
        });

        // Add labels layer for disaster facilities
        map.addLayer({
          id: disasterLabelsLayerId,
          type: 'symbol',
          source: disasterSourceId,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 10,
              15, 12,
              20, 16
            ],
            'text-anchor': 'top',
            'text-offset': [0, 1.5],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-max-width': 8,
            'text-allow-overlap': false,
            'text-ignore-placement': false
          },
          paint: {
            'text-color': ['get', 'color'],
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          },
          minzoom: 13
        });

        // Hover effects
        map.on('mouseenter', disasterLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features.length > 0) {
            const feature = e.features[0];
            
            // Show popup
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false
            });
            
            const shelterTypeLabel = {
              earthquake: '地震避難所',
              flood: '洪水避難所',
              tsunami: '津波避難所',
              designated: '指定緊急避難場所',
              general: '一般避難所'
            };
            
            popup.setLngLat(feature.geometry.coordinates)
              .setHTML(`
                <div style="padding: 10px; background-color: #FFF3E0;">
                  <h3 style="margin: 0 0 5px 0; font-size: 16px; color: ${feature.properties.color};">
                    ${feature.properties.icon} ${feature.properties.name}
                  </h3>
                  <p style="margin: 0 0 3px 0; font-size: 14px; font-weight: bold;">
                    <strong>種別:</strong> ${shelterTypeLabel[feature.properties.shelter_type]}
                  </p>
                  ${feature.properties.address ? `
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                      <strong>住所:</strong> ${feature.properties.address}
                    </p>
                  ` : ''}
                  ${feature.properties.capacity ? `
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                      <strong>収容人数:</strong> ${feature.properties.capacity}名
                    </p>
                  ` : ''}
                  <p style="margin: 0 0 3px 0; font-size: 12px; color: #4CAF50;">
                    <strong>バリアフリー:</strong> ○
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #2196F3;">
                    <strong>設備:</strong> 電源、水道、トイレ、備蓄品
                  </p>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseleave', disasterLayerId, () => {
          map.getCanvas().style.cursor = '';
          
          // Remove popup
          const popups = document.getElementsByClassName('mapboxgl-popup');
          if (popups.length) {
            popups[0].remove();
          }
        });

        // Animation for emergency warning effect
        const animate = () => {
          const time = Date.now() / 1000;
          
          // Glow animation for all shelters
          const glowOpacity = (Math.sin(time * 3) + 1) / 2 * 0.4 + 0.1;
          if (map.getLayer(disasterGlowLayerId)) {
            map.setPaintProperty(disasterGlowLayerId, 'circle-opacity', glowOpacity);
          }
          
          // Enhanced warning pulse for designated emergency shelters
          if (map.getLayer(disasterLayerId)) {
            map.setPaintProperty(disasterLayerId, 'circle-radius', [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, [
                'case',
                ['==', ['get', 'shelter_type'], 'designated'],
                5 + Math.sin(time * 4) * 2,
                5
              ],
              15, [
                'case',
                ['==', ['get', 'shelter_type'], 'designated'],
                10 + Math.sin(time * 4) * 3,
                10
              ],
              20, [
                'case',
                ['==', ['get', 'shelter_type'], 'designated'],
                15 + Math.sin(time * 4) * 4,
                15
              ]
            ]);
          }
          
          animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
      })
      .catch(error => {
        console.error('Error fetching disaster facilities:', error);
        
        // Use test data for Yamaguchi on API failure
        if (selectedPrefecture === '山口県') {
          console.log('Using test disaster facilities data due to API failure');
          const testData = createTestDisasterData();
          
          // Report test data count
          if (onDataCountUpdate) {
            onDataCountUpdate(testData.features.length);
          }
          
          // Enhance features with orange color for all test shelters
          const enhancedFeatures = testData.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              shelter_type: 'general',
              color: '#FF9800',  // Orange for all test disaster facilities
              icon: '⚠️'
            }
          }));

          // Add source with test data
          map.addSource(disasterSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: enhancedFeatures
            }
          });

          // Add glow layer with very large radius for test data
          map.addLayer({
            id: disasterGlowLayerId,
            type: 'circle',
            source: disasterSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 60,  // 5x larger
                15, 100,
                20, 150
              ],
              'circle-color': '#FF9800',
              'circle-opacity': 0,
              'circle-blur': 2
            }
          });

          // Add main layer with very large radius for test data
          map.addLayer({
            id: disasterLayerId,
            type: 'circle',
            source: disasterSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 30,  // 6x larger
                15, 60,
                20, 90
              ],
              'circle-color': '#FF9800',
              'circle-stroke-width': 5,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.95
            }
          });

          // Add labels
          map.addLayer({
            id: disasterLabelsLayerId,
            type: 'symbol',
            source: disasterSourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 18,
              'text-anchor': 'top',
              'text-offset': [0, 4],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
            },
            paint: {
              'text-color': '#FF9800',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2.5
            },
            minzoom: 10
          });

          // Animation for test data
          const animate = () => {
            const time = Date.now() / 1000;
            const glowOpacity = (Math.sin(time * 3) + 1) / 2 * 0.6 + 0.2;
            
            if (map.getLayer(disasterGlowLayerId)) {
              map.setPaintProperty(disasterGlowLayerId, 'circle-opacity', glowOpacity);
            }
            
            animationRef.current = requestAnimationFrame(animate);
          };
          
          animate();
        }
      });

    return () => {
      cleanup();
      map.off('mouseenter', disasterLayerId);
      map.off('mouseleave', disasterLayerId);
    };
  }, [map, visible, selectedPrefecture]);

  return null;
};

export default DisasterLayer;