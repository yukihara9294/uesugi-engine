import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MedicalLayer = ({ map, visible, selectedPrefecture, onDataCountUpdate }) => {
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!map || !visible || !selectedPrefecture) {
      return;
    }

    // Layer IDs
    const medicalLayerId = 'medical-facilities';
    const medicalSourceId = 'medical-facilities-source';
    const medicalGlowLayerId = 'medical-facilities-glow';
    const medicalLabelsLayerId = 'medical-labels';

    // Cleanup function
    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (map.getLayer(medicalLabelsLayerId)) map.removeLayer(medicalLabelsLayerId);
      if (map.getLayer(medicalGlowLayerId)) map.removeLayer(medicalGlowLayerId);
      if (map.getLayer(medicalLayerId)) map.removeLayer(medicalLayerId);
      if (map.getSource(medicalSourceId)) map.removeSource(medicalSourceId);
    };

    cleanup();

    if (!visible) {
      return;
    }

    // Test data for Yamaguchi with very large red markers
    const createTestMedicalData = () => {
      const yamaguchiCenter = [131.4714, 34.1858];
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.02, yamaguchiCenter[1] + 0.02] },
            properties: { name: 'テスト医療施設1', type: '病院', address: '山口県山口市テスト1' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.02, yamaguchiCenter[1] + 0.02] },
            properties: { name: 'テスト医療施設2', type: 'クリニック', address: '山口県山口市テスト2' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0], yamaguchiCenter[1] - 0.02] },
            properties: { name: 'テスト医療施設3', type: 'AED', address: '山口県山口市テスト3' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.025, yamaguchiCenter[1] - 0.015] },
            properties: { name: 'テスト医療施設4', type: '病院', address: '山口県山口市テスト4' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.025, yamaguchiCenter[1] - 0.01] },
            properties: { name: 'テスト医療施設5', type: 'クリニック', address: '山口県山口市テスト5' }
          }
        ]
      };
    };

    // Fetch medical facilities data
    fetch(`/api/v1/facilities/medical/${encodeURIComponent(selectedPrefecture)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Medical facilities data:', data);
        
        if (!data.features || data.features.length === 0) {
          console.warn('No medical facilities data available');
          return;
        }
        
        // Report data count
        if (onDataCountUpdate) {
          onDataCountUpdate(data.features.length);
        }

        // Add source
        map.addSource(medicalSourceId, {
          type: 'geojson',
          data: data
        });

        // Add glow layer (outer)
        map.addLayer({
          id: medicalGlowLayerId,
          type: 'circle',
          source: medicalSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 8,
              15, 16,
              20, 24
            ],
            'circle-color': '#DC143C', // Crimson red for medical
            'circle-opacity': 0,
            'circle-blur': 1
          }
        });

        // Add main medical facilities layer
        map.addLayer({
          id: medicalLayerId,
          type: 'circle',
          source: medicalSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 4,
              15, 8,
              20, 12
            ],
            'circle-color': '#DC143C',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9
          }
        });

        // Add labels layer for medical facilities
        map.addLayer({
          id: medicalLabelsLayerId,
          type: 'symbol',
          source: medicalSourceId,
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
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'icon-text-fit': 'none',
            'text-max-width': 8,
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'icon-image': 'hospital-15', // Using built-in Mapbox icon
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.5,
              15, 0.8,
              20, 1.2
            ],
            'icon-allow-overlap': false
          },
          paint: {
            'text-color': '#DC143C',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5
          },
          minzoom: 13
        });

        // Hover effects
        map.on('mouseenter', medicalLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features.length > 0) {
            const feature = e.features[0];
            
            // Show popup
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false
            });
            
            popup.setLngLat(feature.geometry.coordinates)
              .setHTML(`
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #DC143C;">
                    🏥 ${feature.properties.name}
                  </h3>
                  <p style="margin: 0 0 3px 0; font-size: 14px;">
                    <strong>種別:</strong> ${feature.properties.type || 'AED設置場所'}
                  </p>
                  ${feature.properties.address ? `
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                      <strong>住所:</strong> ${feature.properties.address}
                    </p>
                  ` : ''}
                  <p style="margin: 0; font-size: 12px; color: #DC143C;">
                    <strong>24時間利用:</strong> ${feature.properties.type === 'AED' ? '要確認' : '○'}
                  </p>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseleave', medicalLayerId, () => {
          map.getCanvas().style.cursor = '';
          
          // Remove popup
          const popups = document.getElementsByClassName('mapboxgl-popup');
          if (popups.length) {
            popups[0].remove();
          }
        });

        // Animation for glow effect
        const animate = () => {
          const time = Date.now() / 1000;
          const glowOpacity = (Math.sin(time * 2) + 1) / 2 * 0.3 + 0.1;
          
          if (map.getLayer(medicalGlowLayerId)) {
            map.setPaintProperty(medicalGlowLayerId, 'circle-opacity', glowOpacity);
          }
          
          animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
      })
      .catch(error => {
        console.error('Error fetching medical facilities:', error);
        
        // Use test data for Yamaguchi on API failure
        if (selectedPrefecture === '山口県') {
          console.log('Using test medical facilities data due to API failure');
          const testData = createTestMedicalData();
          
          // Report test data count
          if (onDataCountUpdate) {
            onDataCountUpdate(testData.features.length);
          }
          
          // Add source with test data
          map.addSource(medicalSourceId, {
            type: 'geojson',
            data: testData
          });

          // Add glow layer with larger radius for test data
          map.addLayer({
            id: medicalGlowLayerId,
            type: 'circle',
            source: medicalSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 40,  // 5x larger
                15, 80,
                20, 120
              ],
              'circle-color': '#DC143C',
              'circle-opacity': 0,
              'circle-blur': 1
            }
          });

          // Add main layer with larger radius for test data
          map.addLayer({
            id: medicalLayerId,
            type: 'circle',
            source: medicalSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 20,  // 5x larger
                15, 40,
                20, 60
              ],
              'circle-color': '#DC143C',
              'circle-stroke-width': 4,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

          // Add labels
          map.addLayer({
            id: medicalLabelsLayerId,
            type: 'symbol',
            source: medicalSourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 16,
              'text-anchor': 'top',
              'text-offset': [0, 3],
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
            },
            paint: {
              'text-color': '#DC143C',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            },
            minzoom: 10
          });

          // Animation for test data
          const animate = () => {
            const time = Date.now() / 1000;
            const glowOpacity = (Math.sin(time * 2) + 1) / 2 * 0.5 + 0.2;
            
            if (map.getLayer(medicalGlowLayerId)) {
              map.setPaintProperty(medicalGlowLayerId, 'circle-opacity', glowOpacity);
            }
            
            animationRef.current = requestAnimationFrame(animate);
          };
          
          animate();
        }
      });

    return () => {
      cleanup();
      map.off('mouseenter', medicalLayerId);
      map.off('mouseleave', medicalLayerId);
    };
  }, [map, visible, selectedPrefecture]);

  return null;
};

export default MedicalLayer;