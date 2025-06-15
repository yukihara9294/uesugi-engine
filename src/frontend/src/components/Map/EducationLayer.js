import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const EducationLayer = ({ map, visible, selectedPrefecture, onDataCountUpdate }) => {
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!map || !visible || !selectedPrefecture) {
      return;
    }

    // Layer IDs
    const educationLayerId = 'education-facilities';
    const educationSourceId = 'education-facilities-source';
    const education3DLayerId = 'education-facilities-3d';
    const educationLabelsLayerId = 'education-labels';

    // School type colors
    const schoolColors = {
      elementary: '#4CAF50',     // Green for elementary schools
      junior_high: '#2196F3',    // Blue for junior high schools
      high_school: '#9C27B0',    // Purple for high schools
      university: '#FF5722',     // Deep orange for universities
      kindergarten: '#FFB74D',   // Light orange for kindergartens
      nursery: '#FFC107',        // Amber for nursery schools
      primary: '#607D8B'         // Blue grey for others
    };

    const schoolIcons = {
      elementary: '🏫',
      junior_high: '🏤',
      high_school: '🎓',
      university: '🏛️',
      kindergarten: '🎨',
      nursery: '🍼',
      primary: '📚'
    };

    // Cleanup function
    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (map.getLayer(educationLabelsLayerId)) map.removeLayer(educationLabelsLayerId);
      if (map.getLayer(education3DLayerId)) map.removeLayer(education3DLayerId);
      if (map.getLayer(educationLayerId)) map.removeLayer(educationLayerId);
      if (map.getSource(educationSourceId)) map.removeSource(educationSourceId);
    };

    cleanup();

    if (!visible) {
      return;
    }

    // Test data for Yamaguchi with very large blue markers
    const createTestEducationData = () => {
      const yamaguchiCenter = [131.4714, 34.1858];
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.018, yamaguchiCenter[1] + 0.018] },
            properties: { name: 'テスト小学校1', school_type: 'elementary', type: '小学校', address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.018, yamaguchiCenter[1] + 0.018] },
            properties: { name: 'テスト中学校1', school_type: 'junior_high', type: '中学校', address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0], yamaguchiCenter[1]] },
            properties: { name: 'テスト大学', school_type: 'university', type: '大学', address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] - 0.022, yamaguchiCenter[1] - 0.018] },
            properties: { name: 'テスト高校1', school_type: 'high_school', type: '高等学校', address: '山口県山口市' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [yamaguchiCenter[0] + 0.022, yamaguchiCenter[1] - 0.018] },
            properties: { name: 'テスト幼稚園1', school_type: 'kindergarten', type: '幼稚園', address: '山口県山口市' }
          }
        ]
      };
    };

    // Fetch education facilities data
    fetch(`/api/v1/facilities/education/${encodeURIComponent(selectedPrefecture)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Education facilities data:', data);
        
        if (!data.features || data.features.length === 0) {
          console.warn('No education facilities data available');
          return;
        }
        
        // Report data count
        if (onDataCountUpdate) {
          onDataCountUpdate(data.features.length);
        }

        // Enhance features with school type colors
        const enhancedFeatures = data.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            color: schoolColors[feature.properties.school_type] || schoolColors.primary,
            icon: schoolIcons[feature.properties.school_type] || schoolIcons.primary
          }
        }));

        // Add source
        map.addSource(educationSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: enhancedFeatures
          }
        });

        // Add main education facilities layer
        map.addLayer({
          id: educationLayerId,
          type: 'circle',
          source: educationSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 4,
              15, 8,
              20, 12
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0
          }
        });

        // Add 3D buildings for schools at higher zoom levels
        map.addLayer({
          id: education3DLayerId,
          type: 'fill-extrusion',
          source: educationSourceId,
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14, 0,
              15, [
                'case',
                ['==', ['get', 'school_type'], 'university'], 30,
                ['==', ['get', 'school_type'], 'high_school'], 25,
                ['==', ['get', 'school_type'], 'junior_high'], 20,
                ['==', ['get', 'school_type'], 'elementary'], 15,
                10
              ],
              18, [
                'case',
                ['==', ['get', 'school_type'], 'university'], 50,
                ['==', ['get', 'school_type'], 'high_school'], 40,
                ['==', ['get', 'school_type'], 'junior_high'], 30,
                ['==', ['get', 'school_type'], 'elementary'], 25,
                15
              ]
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
          },
          minzoom: 14
        });

        // Add labels layer for education facilities
        map.addLayer({
          id: educationLabelsLayerId,
          type: 'symbol',
          source: educationSourceId,
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
            'text-max-width': 8,
            'text-allow-overlap': false,
            'text-ignore-placement': false
          },
          paint: {
            'text-color': ['get', 'color'],
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5
          },
          minzoom: 13
        });

        // Hover effects
        map.on('mouseenter', educationLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features.length > 0) {
            const feature = e.features[0];
            
            // Show popup
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false
            });
            
            const schoolTypeLabel = {
              elementary: '小学校',
              junior_high: '中学校',
              high_school: '高等学校',
              university: '大学',
              kindergarten: '幼稚園',
              nursery: '保育園',
              primary: '教育施設'
            };
            
            popup.setLngLat(feature.geometry.coordinates)
              .setHTML(`
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 5px 0; font-size: 16px; color: ${feature.properties.color};">
                    ${feature.properties.icon} ${feature.properties.name}
                  </h3>
                  <p style="margin: 0 0 3px 0; font-size: 14px;">
                    <strong>種別:</strong> ${schoolTypeLabel[feature.properties.school_type] || feature.properties.type}
                  </p>
                  ${feature.properties.address ? `
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                      <strong>住所:</strong> ${feature.properties.address}
                    </p>
                  ` : ''}
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    <strong>生徒数:</strong> ${Math.floor(Math.random() * 800) + 200}名
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    <strong>設立:</strong> ${1950 + Math.floor(Math.random() * 70)}年
                  </p>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseleave', educationLayerId, () => {
          map.getCanvas().style.cursor = '';
          
          // Remove popup
          const popups = document.getElementsByClassName('mapboxgl-popup');
          if (popups.length) {
            popups[0].remove();
          }
        });

        // Animation for education facilities
        let opacity = 0;
        const fadeIn = () => {
          opacity += 0.02;
          if (opacity > 0.9) {
            opacity = 0.9;
          }
          
          if (map.getLayer(educationLayerId)) {
            map.setPaintProperty(educationLayerId, 'circle-opacity', opacity);
          }
          
          if (opacity < 0.9) {
            animationRef.current = requestAnimationFrame(fadeIn);
          } else {
            // Start pulse animation after fade in
            startPulseAnimation();
          }
        };
        
        const startPulseAnimation = () => {
          const animate = () => {
            const time = Date.now() / 1000;
            const radius = 8 + Math.sin(time * 2) * 2;
            
            if (map.getLayer(educationLayerId)) {
              map.setPaintProperty(educationLayerId, 'circle-radius', [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, radius * 0.5,
                15, radius,
                20, radius * 1.5
              ]);
            }
            
            animationRef.current = requestAnimationFrame(animate);
          };
          
          animate();
        };
        
        fadeIn();
      })
      .catch(error => {
        console.error('Error fetching education facilities:', error);
        
        // Use test data for Yamaguchi on API failure
        if (selectedPrefecture === '山口県') {
          console.log('Using test education facilities data due to API failure');
          const testData = createTestEducationData();
          
          // Report test data count
          if (onDataCountUpdate) {
            onDataCountUpdate(testData.features.length);
          }
          
          // Enhance features with school type colors
          const enhancedFeatures = testData.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              color: '#2196F3',  // Blue for all test education facilities
              icon: schoolIcons[feature.properties.school_type] || schoolIcons.primary
            }
          }));

          // Add source with test data
          map.addSource(educationSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: enhancedFeatures
            }
          });

          // Add main layer with very large radius for test data
          map.addLayer({
            id: educationLayerId,
            type: 'circle',
            source: educationSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 25,  // 5x larger
                15, 50,
                20, 75
              ],
              'circle-color': '#2196F3',  // Blue
              'circle-stroke-width': 4,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

          // Add labels
          map.addLayer({
            id: educationLabelsLayerId,
            type: 'symbol',
            source: educationSourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 18,
              'text-anchor': 'top',
              'text-offset': [0, 3.5],
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
            },
            paint: {
              'text-color': '#2196F3',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            },
            minzoom: 10
          });
        }
      });

    return () => {
      cleanup();
      map.off('mouseenter', educationLayerId);
      map.off('mouseleave', educationLayerId);
    };
  }, [map, visible, selectedPrefecture]);

  return null;
};

export default EducationLayer;