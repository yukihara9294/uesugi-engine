import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const TransportLayer = ({ map, transportData, visible }) => {
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
      bus: '#3B82F6',        // Blue for bus
      rail: '#DC2626',       // Red for JR trains
      tram: '#F59E0B',       // Orange for tram
      ferry: '#06B6D4',      // Cyan for ferry
      subway: '#10B981',     // Green for subway/Astram Line
      train: '#DC2626'       // Red for train (same as rail)
    };

    // Transportation icons
    const transportIcons = {
      bus: '🚌',
      rail: '🚃',
      tram: '🚊',
      ferry: '⛴️',
      subway: '🚇',
      train: '🚃'  // Same as rail
    };

    // Convert GTFS data to GeoJSON features
    console.log('Transport data structure:', transportData);
    const stopFeatures = transportData.stops?.map(stop => ({
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
    })) || [];
    console.log('Stop features:', stopFeatures.length);
    
    // Log route types to debug
    const routeTypes = {};
    stopFeatures.forEach(stop => {
      const type = stop.properties.transport_type;
      routeTypes[type] = (routeTypes[type] || 0) + 1;
    });
    console.log('Stop types breakdown:', routeTypes);

    // Convert routes to LineString features
    const routeFeatures = transportData.routes?.map(route => ({
      type: 'Feature',
      properties: {
        id: route.route_id,
        name: route.route_short_name || route.route_long_name,
        type: route.route_type,
        color: route.route_color ? `#${route.route_color}` : (transportColors[route.route_type] || transportColors.bus)
      },
      geometry: {
        type: 'LineString',
        coordinates: route.shapes || [] // Assuming shapes data is preprocessed
      }
    })).filter(route => route.geometry.coordinates.length > 0) || [];
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
              ['==', ['get', 'type'], 'bus'], 0.5,  // Bus lines are thinner
              ['==', ['get', 'type'], '3'], 0.5,    // Bus type 3
              2  // Train lines normal width
            ],
            15, ['case',
              ['==', ['get', 'type'], 'bus'], 1,
              ['==', ['get', 'type'], '3'], 1,
              4
            ],
            20, ['case',
              ['==', ['get', 'type'], 'bus'], 1.5,
              ['==', ['get', 'type'], '3'], 1.5,
              6
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
              ['==', ['get', 'type'], 'bus'], 1.5,
              ['==', ['get', 'type'], '3'], 1.5,
              6
            ],
            15, ['case',
              ['==', ['get', 'type'], 'bus'], 3,
              ['==', ['get', 'type'], '3'], 3,
              12
            ],
            20, ['case',
              ['==', ['get', 'type'], 'bus'], 4.5,
              ['==', ['get', 'type'], '3'], 4.5,
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

    // Add stop circles
    map.addLayer({
      id: stopsLayerId,
      type: 'circle',
      source: stopsSourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 3,
          15, 6,
          20, 10
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
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
        
        popup.setLngLat(feature.geometry.coordinates)
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px;">
                ${feature.properties.icon} ${feature.properties.name}
              </h3>
              <p style="margin: 0; font-size: 14px;">
                ${feature.properties.type === 'station' ? '駅' : 'バス停'}
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