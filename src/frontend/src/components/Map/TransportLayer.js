import { useEffect } from 'react';

const TransportLayer = ({ map, transportData, visible }) => {
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

    // Transportation type colors
    const transportColors = {
      bus: '#FF6B6B',        // Red for bus
      rail: '#4ECDC4',       // Turquoise for rail
      tram: '#FFE66D',       // Yellow for tram
      ferry: '#3B82F6',      // Blue for ferry
      subway: '#A855F7'      // Purple for subway
    };

    // Transportation icons
    const transportIcons = {
      bus: '🚌',
      rail: '🚃',
      tram: '🚊',
      ferry: '⛴️',
      subway: '🚇'
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
    console.log('Route features:', routeFeatures.length);

    // Cleanup function
    const cleanup = () => {
      if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
      if (map.getLayer(stopsLayerId)) map.removeLayer(stopsLayerId);
      if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
      
      if (map.getSource(labelsSourceId)) map.removeSource(labelsSourceId);
      if (map.getSource(stopsSourceId)) map.removeSource(stopsSourceId);
      if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);
    };

    cleanup();

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
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });

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
            10, 2,
            15, 4,
            20, 6
          ],
          'line-opacity': 0.7
        }
      });
    }

    // Add stops layer
    map.addSource(stopsSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: stopFeatures
      }
    });

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
    map.addSource(labelsSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: stopFeatures.filter(f => f.properties.type === 'station') // Only show labels for stations
      }
    });

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
        const popup = new window.mapboxgl.Popup({
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

    return () => {
      cleanup();
      map.off('mouseenter', stopsLayerId);
      map.off('mouseleave', stopsLayerId);
    };
  }, [map, transportData, visible]);

  return null;
};

export default TransportLayer;