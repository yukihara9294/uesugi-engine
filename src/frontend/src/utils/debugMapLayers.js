/**
 * Debug utility to check map layer properties
 */

export const debugMapLayers = (map) => {
  if (!map) return;

  console.log('=== DEBUGGING MAP LAYERS ===');
  
  // Check SNS heatmap layer (now using circle layers)
  const heatmapLayer = map.getLayer('sns-heatmap');
  if (heatmapLayer) {
    console.log('SNS Heatmap Layer Found:');
    console.log('- Type:', heatmapLayer.type);
    if (heatmapLayer.type === 'circle') {
      console.log('- Circle radius:', map.getPaintProperty('sns-heatmap', 'circle-radius'));
      console.log('- Circle color:', map.getPaintProperty('sns-heatmap', 'circle-color'));
      console.log('- Circle opacity:', map.getPaintProperty('sns-heatmap', 'circle-opacity'));
    } else if (heatmapLayer.type === 'heatmap') {
      console.log('- Heatmap radius:', map.getPaintProperty('sns-heatmap', 'heatmap-radius'));
      console.log('- Heatmap intensity:', map.getPaintProperty('sns-heatmap', 'heatmap-intensity'));
    }
    console.log('- Full paint:', heatmapLayer.paint);
  } else {
    console.log('SNS Heatmap Layer NOT found');
  }

  // Check event layers
  const eventLayers = ['event-impact', 'event-mid-glow', 'event-inner-glow', 'event-markers'];
  eventLayers.forEach(layerId => {
    const layer = map.getLayer(layerId);
    if (layer) {
      console.log(`\n${layerId} Layer Found:`);
      console.log('- Type:', layer.type);
      console.log('- Circle radius:', map.getPaintProperty(layerId, 'circle-radius'));
      console.log('- Full paint:', layer.paint);
    } else {
      console.log(`${layerId} Layer NOT found`);
    }
  });

  // Check for any layers with zoom interpolation
  console.log('\n=== CHECKING ALL LAYERS FOR ZOOM INTERPOLATION ===');
  const style = map.getStyle();
  if (style && style.layers) {
    style.layers.forEach(layer => {
      if (layer.paint) {
        Object.entries(layer.paint).forEach(([property, value]) => {
          if (JSON.stringify(value).includes('zoom')) {
            console.log(`FOUND ZOOM INTERPOLATION in layer "${layer.id}", property "${property}":`, value);
          }
        });
      }
    });
  }

  console.log('=== END DEBUG ===\n');
};

// Function to monitor layer changes
export const monitorLayerChanges = (map, layerId, property) => {
  let lastValue = null;
  
  const checkProperty = () => {
    if (!map.getLayer(layerId)) return;
    
    try {
      const currentValue = map.getPaintProperty(layerId, property);
      const currentValueStr = JSON.stringify(currentValue);
      
      if (lastValue !== currentValueStr) {
        console.log(`[LAYER CHANGE] ${layerId}.${property} changed:`, currentValue);
        lastValue = currentValueStr;
      }
    } catch (e) {
      // Property doesn't exist for this layer type
      if (lastValue !== 'error') {
        console.log(`[LAYER CHANGE] ${layerId}.${property} - property not found (layer type may have changed)`);
        lastValue = 'error';
      }
    }
  };
  
  // Check every 500ms
  const interval = setInterval(checkProperty, 500);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

// Function to intercept and log layer additions
export const interceptLayerAdditions = (map) => {
  if (!map || !map.addLayer) return;
  
  const originalAddLayer = map.addLayer.bind(map);
  
  map.addLayer = function(layer, beforeId) {
    console.log(`[LAYER ADD] Adding layer "${layer.id}" of type "${layer.type}"`);
    
    // Check for zoom interpolations in paint properties
    if (layer.paint) {
      Object.entries(layer.paint).forEach(([property, value]) => {
        if (JSON.stringify(value).includes('zoom')) {
          console.warn(`[ZOOM WARNING] Layer "${layer.id}" has zoom interpolation in "${property}":`, value);
        }
      });
    }
    
    // Log specific properties for heatmap and circle layers
    if (layer.type === 'heatmap' && layer.id.includes('heatmap')) {
      console.log(`[HEATMAP] Radius:`, layer.paint?.['heatmap-radius']);
      console.log(`[HEATMAP] Intensity:`, layer.paint?.['heatmap-intensity']);
    }
    
    if (layer.type === 'circle' && layer.id.includes('event')) {
      console.log(`[EVENT] Circle radius:`, layer.paint?.['circle-radius']);
    }
    
    // Call original function
    return originalAddLayer(layer, beforeId);
  };
  
  console.log('Layer addition interceptor installed');
};