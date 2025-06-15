import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const TransportLayer = ({ map, transportData, visible, selectedPrefecture }) => {
  const animationRef = useRef(null);
  const opacityRef = useRef(0);
  
  useEffect(() => {
    console.log('TransportLayer effect:', { 
      map: !!map, 
      transportData: !!transportData, 
      visible,
      dataStops: transportData?.stops?.length || 0,
      dataRoutes: transportData?.routes?.length || 0
    });
    
    if (!map || !transportData || !visible) {
      console.log('TransportLayer: Skipping - missing requirements');
      return;
    }

    // Layer IDs
    const routeLayerId = 'transport-routes';
    const routeSourceId = 'transport-routes-source';
    
    const stopsLayerId = 'transport-stops';
    const stopsSourceId = 'transport-stops-source';
    
    const labelsLayerId = 'transport-labels';
    const labelsSourceId = 'transport-labels-source';

    // Transportation type colors (more distinct colors)
    const transportColors = {
      bus: '#4A90E2',        // Brighter blue for bus (more vibrant)
      rail: '#FF4500',       // Orange red for local trains
      shinkansen: '#FFD700', // Gold for Shinkansen
      tram: '#F59E0B',       // Orange for tram
      ferry: '#06B6D4',      // Cyan for ferry
      subway: '#10B981',     // Green for subway/Astram Line
      train: '#FF4500'       // Orange red for train (same as rail)
    };

    // Transportation icons
    const transportIcons = {
      bus: '🚌',
      rail: '🚃',
      shinkansen: '🚄',  // Bullet train emoji for Shinkansen
      tram: '🚊',
      ferry: '⛴️',
      subway: '🚇',
      train: '🚃'  // Same as rail
    };

    // Convert GTFS data to GeoJSON features
    console.log('Transport data structure:', transportData);
    
    // Handle both old format (stops array) and new format (features array)
    let stopFeatures = [];
    if (transportData.features) {
      // New format with features
      stopFeatures = transportData.features.map(feature => ({
        type: 'Feature',
        properties: {
          id: feature.properties.stop_id,
          name: feature.properties.stop_name,
          type: feature.properties.type || 'stop',
          transport_type: feature.properties.transport_type || 'bus',
          line: feature.properties.line || '',
          icon: transportIcons[feature.properties.transport_type] || transportIcons.bus,
          color: feature.properties.color || transportColors[feature.properties.transport_type] || transportColors.bus
        },
        geometry: feature.geometry
      }));
    } else if (transportData.stops) {
      // Old format with stops array
      stopFeatures = transportData.stops.map(stop => ({
        type: 'Feature',
        properties: {
          id: stop.stop_id,
          name: stop.stop_name,
          type: stop.location_type === 1 ? 'station' : 'stop',
          transport_type: stop.route_type || 'bus',
          icon: transportIcons[stop.route_type] || transportIcons.bus,
          color: transportColors[stop.route_type] || transportColors.bus
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
        }
      }));
    }
    console.log('Stop features:', stopFeatures.length);
    
    // Log route types to debug
    const routeTypes = {};
    stopFeatures.forEach(stop => {
      const type = stop.properties.transport_type;
      routeTypes[type] = (routeTypes[type] || 0) + 1;
    });
    console.log('Stop types breakdown:', routeTypes);

    // Convert routes to LineString features
    let routeFeatures = [];
    if (transportData.routes) {
      // New format with routes array
      routeFeatures = transportData.routes.map(route => ({
        type: 'Feature',
        properties: {
          id: route.properties?.route_id || route.route_id,
          name: route.properties?.route_name || route.route_short_name || route.route_long_name,
          type: route.properties?.transport_type || route.properties?.route_type || route.route_type || 'bus',
          transport_type: route.properties?.transport_type || 'bus',
          color: route.properties?.color || (route.route_color ? `#${route.route_color}` : transportColors[route.properties?.transport_type || 'bus'] || transportColors.bus)
        },
        geometry: route.geometry || {
          type: 'LineString',
          coordinates: route.shapes || []
        }
      })).filter(route => route.geometry.coordinates && route.geometry.coordinates.length > 0);
    } else if (transportData.routes) {
      // Old format
      routeFeatures = transportData.routes.map(route => ({
        type: 'Feature',
        properties: {
          id: route.route_id,
          name: route.route_short_name || route.route_long_name,
          type: route.route_type,
          color: route.route_color ? `#${route.route_color}` : (transportColors[route.route_type] || transportColors.bus)
        },
        geometry: {
          type: 'LineString',
          coordinates: route.shapes || []
        }
      })).filter(route => route.geometry.coordinates.length > 0);
    }
    console.log('Route features:', routeFeatures.length, 'from', transportData.routes?.length || 0, 'routes');
    
    // Log route types in routes
    const routeTypesInRoutes = {};
    transportData.routes?.forEach(route => {
      const type = route.route_type || 'unknown';
      routeTypesInRoutes[type] = (routeTypesInRoutes[type] || 0) + 1;
    });
    console.log('Route types in routes:', routeTypesInRoutes);
    
    // If no routes have shapes, skip route rendering
    if (routeFeatures.length === 0) {
      console.log('TransportLayer: No routes with valid shapes data');
    }

    // Cleanup function
    const cleanup = () => {
      if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
      if (map.getLayer(stopsLayerId + '-mid')) map.removeLayer(stopsLayerId + '-mid');
      if (map.getLayer(stopsLayerId + '-glow')) map.removeLayer(stopsLayerId + '-glow');
      if (map.getLayer(stopsLayerId)) map.removeLayer(stopsLayerId);
      if (map.getLayer(routeLayerId + '-glow')) map.removeLayer(routeLayerId + '-glow');
      if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
      
      if (map.getSource(labelsSourceId)) map.removeSource(labelsSourceId);
      if (map.getSource(stopsSourceId)) map.removeSource(stopsSourceId);
      if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);
    };

    cleanup();
    
    // Stop any existing animation before cleanup
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!visible) {
      console.log('TransportLayer: Not visible, skipping render');
      return;
    }
    
    // Check if we have valid data
    if (!stopFeatures.length && !routeFeatures.length) {
      console.warn('TransportLayer: No stops or routes to display');
      return;
    }

    // Add route lines layer
    if (routeFeatures.length > 0) {
      // Check if source already exists
      if (!map.getSource(routeSourceId)) {
        map.addSource(routeSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: routeFeatures
          }
        });
      }

      map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['case', 
              ['==', ['get', 'type'], 'shinkansen'], 4,  // Shinkansen lines are thickest
              ['==', ['get', 'type'], 'bus'], 2,         // Bus lines visible
              ['==', ['get', 'type'], '3'], 2,           // Bus type 3
              ['==', ['get', 'type'], 'rail'], 3,        // Local train lines medium
              3  // Default train lines
            ],
            15, ['case',
              ['==', ['get', 'type'], 'shinkansen'], 8,
              ['==', ['get', 'type'], 'bus'], 3,
              ['==', ['get', 'type'], '3'], 3,
              ['==', ['get', 'type'], 'rail'], 5,
              5
            ],
            20, ['case',
              ['==', ['get', 'type'], 'shinkansen'], 10,
              ['==', ['get', 'type'], 'bus'], 4,
              ['==', ['get', 'type'], '3'], 4,
              ['==', ['get', 'type'], 'rail'], 7,
              7
            ]
          ],
          'line-opacity': 0  // Start with 0 for animation
        }
      });
      
      // Add glow layer for routes
      map.addLayer({
        id: routeLayerId + '-glow',
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['case',
              ['==', ['get', 'type'], 'shinkansen'], 9,   // Shinkansen glow
              ['==', ['get', 'type'], 'bus'], 1.5,
              ['==', ['get', 'type'], '3'], 1.5,
              ['==', ['get', 'type'], 'local'], 6,
              6
            ],
            15, ['case',
              ['==', ['get', 'type'], 'shinkansen'], 18,
              ['==', ['get', 'type'], 'bus'], 3,
              ['==', ['get', 'type'], '3'], 3,
              ['==', ['get', 'type'], 'local'], 12,
              12
            ],
            20, ['case',
              ['==', ['get', 'type'], 'shinkansen'], 24,
              ['==', ['get', 'type'], 'bus'], 4.5,
              ['==', ['get', 'type'], '3'], 4.5,
              ['==', ['get', 'type'], 'local'], 18,
              18
            ]
          ],
          'line-blur': 2,
          'line-opacity': 0  // Start with 0 for animation
        }
      }, routeLayerId);
    }

    // Start fade animation
    const startAnimation = () => {
      let time = 0;
      
      const animate = () => {
        time += 0.02;
        const opacity = (Math.sin(time) + 1) / 2 * 0.7;  // Fade between 0 and 0.7
        const glowOpacity = (Math.sin(time) + 1) / 2 * 0.3;  // Fade between 0 and 0.3
        const busOpacity = (Math.sin(time) + 1) / 2 * 0.4;  // Bus lines are more transparent
        const busGlowOpacity = (Math.sin(time) + 1) / 2 * 0.15;  // Bus glow is more transparent
        
        if (map.getLayer(routeLayerId)) {
          // Set different opacity for bus and train
          map.setPaintProperty(routeLayerId, 'line-opacity', [
            'case',
            ['==', ['get', 'type'], 'bus'], busOpacity,
            ['==', ['get', 'type'], '3'], busOpacity,
            opacity
          ]);
        }
        if (map.getLayer(routeLayerId + '-glow')) {
          map.setPaintProperty(routeLayerId + '-glow', 'line-opacity', [
            'case',
            ['==', ['get', 'type'], 'bus'], busGlowOpacity,
            ['==', ['get', 'type'], '3'], busGlowOpacity,
            glowOpacity
          ]);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    };

    // Add stops layer
    if (!map.getSource(stopsSourceId)) {
      map.addSource(stopsSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stopFeatures
        }
      });
    }

    // Add stop circles - outer glow for orb effect
    map.addLayer({
      id: stopsLayerId + '-glow',
      type: 'circle',
      source: stopsSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 12,  // Increased from 8
          15, 20,  // Increased from 16
          20, 30   // Increased from 24
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'transport_type'], 'bus'],
          '#6BB6FF',  // Lighter blue for bus glow
          ['get', 'color']
        ],
        'circle-blur': 2.5,    // Further increased for softer orb
        'circle-opacity': 0.3  // Reduced for more subtle glow
      }
    });

    // Add middle glow layer
    map.addLayer({
      id: stopsLayerId + '-mid',
      type: 'circle',
      source: stopsSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,   // Increased from 5
          15, 14,  // Increased from 10
          20, 20   // Increased from 16
        ],
        'circle-color': ['get', 'color'],
        'circle-blur': 1.5,     // Increased for smoother blend
        'circle-opacity': 0.4   // Adjusted for better orb effect
      }
    });

    // Add main stop circles - inner core (orb style without stroke)
    map.addLayer({
      id: stopsLayerId,
      type: 'circle',
      source: stopsSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 4,   // Increased from 3
          15, 8,   // Increased from 6
          20, 12   // Increased from 10
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 0,  // Remove white stroke
        'circle-opacity': 0.5  // 50% transparency for orb effect
      }
    });

    // Add stop labels
    if (!map.getSource(labelsSourceId)) {
      map.addSource(labelsSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stopFeatures.filter(f => f.properties.type === 'station') // Only show labels for stations
        }
      });
    }

    map.addLayer({
      id: labelsLayerId,
      type: 'symbol',
      source: labelsSourceId,
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
        'text-offset': [0, 1],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'icon-text-fit': 'none',
        'text-max-width': 8,
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5
      }
    });

    // Hover effects
    let hoveredStopId = null;

    map.on('mouseenter', stopsLayerId, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        // Show popup
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });
        
        const typeLabel = {
          'station': '駅',
          'bus_stop': 'バス停',
          'stop': 'バス停'
        };
        
        const transportTypeLabel = {
          'bus': 'バス',
          'rail': 'JR在来線',
          'shinkansen': '新幹線',
          'train': 'JR'
        };
        
        popup.setLngLat(feature.geometry.coordinates)
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px;">
                ${feature.properties.icon} ${feature.properties.name}
              </h3>
              <p style="margin: 0; font-size: 14px;">
                <strong>種別:</strong> ${typeLabel[feature.properties.type] || '停留所'}
              </p>
              ${feature.properties.line ? `
                <p style="margin: 0; font-size: 12px; color: #666;">
                  <strong>路線:</strong> ${feature.properties.line}
                </p>
              ` : ''}
              <p style="margin: 0; font-size: 12px; color: ${feature.properties.color};">
                <strong>交通機関:</strong> ${transportTypeLabel[feature.properties.transport_type] || feature.properties.transport_type}
              </p>
            </div>
          `)
          .addTo(map);
        
        hoveredStopId = feature.properties.id;
      }
    });

    map.on('mouseleave', stopsLayerId, () => {
      map.getCanvas().style.cursor = '';
      
      // Remove popup
      const popups = document.getElementsByClassName('mapboxgl-popup');
      if (popups.length) {
        popups[0].remove();
      }
      
      hoveredStopId = null;
    });
    
    // Start the animation
    if (routeFeatures.length > 0) {
      startAnimation();
    }

    return () => {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      cleanup();
      map.off('mouseenter', stopsLayerId);
      map.off('mouseleave', stopsLayerId);
    };
  }, [map, transportData, visible]);

  return null;
};

export default TransportLayer;