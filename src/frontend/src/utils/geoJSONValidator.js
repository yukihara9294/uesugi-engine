// GeoJSON validation and sanitization utilities

/**
 * Validates if coordinates are in the correct format [longitude, latitude]
 * @param {Array} coordinates - Array of coordinates
 * @returns {boolean} - True if valid
 */
export function validateCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  
  const [lng, lat] = coordinates;
  
  // Check if coordinates are numbers
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }
  
  // Check if coordinates are within valid ranges
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return false;
  }
  
  // Check for NaN or Infinity
  if (!isFinite(lng) || !isFinite(lat)) {
    return false;
  }
  
  return true;
}

/**
 * Validates a GeoJSON Point geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {boolean} - True if valid
 */
export function validatePointGeometry(geometry) {
  if (!geometry || geometry.type !== 'Point') {
    return false;
  }
  
  return validateCoordinates(geometry.coordinates);
}

/**
 * Validates a GeoJSON LineString geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {boolean} - True if valid
 */
export function validateLineStringGeometry(geometry) {
  if (!geometry || geometry.type !== 'LineString') {
    return false;
  }
  
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    return false;
  }
  
  return geometry.coordinates.every(coord => validateCoordinates(coord));
}

/**
 * Validates a GeoJSON Feature
 * @param {Object} feature - GeoJSON feature object
 * @returns {boolean} - True if valid
 */
export function validateFeature(feature) {
  if (!feature || feature.type !== 'Feature') {
    return false;
  }
  
  if (!feature.geometry) {
    return false;
  }
  
  // Validate based on geometry type
  switch (feature.geometry.type) {
    case 'Point':
      return validatePointGeometry(feature.geometry);
    case 'LineString':
      return validateLineStringGeometry(feature.geometry);
    default:
      return false;
  }
}

/**
 * Sanitizes properties to ensure all referenced properties exist
 * @param {Object} properties - Feature properties
 * @param {Array<string>} requiredProps - List of required property names
 * @returns {Object} - Sanitized properties with defaults
 */
export function sanitizeProperties(properties = {}, requiredProps = []) {
  const sanitized = { ...properties };
  
  // Default values for common properties
  const defaults = {
    size: 1,
    radius: 10,
    height: 20,
    intensity: 0.5,
    amount: 0,
    occupancy_rate: 0,
    avg_price: 0,
    total_amount: 0,
    sentiment: 0.5,
    congestion: 0,
    distanceKm: 0,
    showGlowingArc: false,
    currentOpacity: 1,
    glowRadius: 15,
    glowColor: '#FFFFFF',
    glowOpacityOuter: 0.3,
    glowOpacityMiddle: 0.5,
    coreColor: '#FFFFFF',
    coreOpacity: 1,
    color: '#FFFFFF',
    opacity: 1,
    category: 'その他',
    type: 'default',
    name: ''
  };
  
  // Apply defaults for any missing required properties
  requiredProps.forEach(prop => {
    if (sanitized[prop] === undefined || sanitized[prop] === null) {
      sanitized[prop] = defaults[prop] !== undefined ? defaults[prop] : 0;
    }
  });
  
  // Ensure numeric properties are actually numbers
  const numericProps = [
    'size', 'radius', 'height', 'intensity', 'amount', 
    'occupancy_rate', 'avg_price', 'total_amount', 'sentiment',
    'congestion', 'distanceKm', 'currentOpacity', 'glowRadius',
    'glowOpacityOuter', 'glowOpacityMiddle', 'coreOpacity', 'opacity'
  ];
  
  numericProps.forEach(prop => {
    if (prop in sanitized) {
      const val = Number(sanitized[prop]);
      sanitized[prop] = isFinite(val) ? val : (defaults[prop] || 0);
    }
  });
  
  return sanitized;
}

/**
 * Validates and sanitizes a GeoJSON FeatureCollection
 * @param {Object} featureCollection - GeoJSON FeatureCollection
 * @param {Array<string>} requiredProps - List of required property names
 * @returns {Object} - Valid FeatureCollection with sanitized features
 */
export function sanitizeFeatureCollection(featureCollection, requiredProps = []) {
  if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
    return { type: 'FeatureCollection', features: [] };
  }
  
  if (!Array.isArray(featureCollection.features)) {
    return { type: 'FeatureCollection', features: [] };
  }
  
  const validFeatures = featureCollection.features
    .filter(feature => {
      try {
        return validateFeature(feature);
      } catch (e) {
        console.warn('Invalid feature:', e);
        return false;
      }
    })
    .map(feature => ({
      ...feature,
      properties: sanitizeProperties(feature.properties, requiredProps)
    }));
  
  return {
    type: 'FeatureCollection',
    features: validFeatures
  };
}

/**
 * Converts various data formats to valid GeoJSON
 * @param {any} data - Input data
 * @param {string} geometryType - 'Point' or 'LineString'
 * @param {Array<string>} requiredProps - List of required property names
 * @returns {Object} - Valid GeoJSON FeatureCollection
 */
export function toValidGeoJSON(data, geometryType = 'Point', requiredProps = []) {
  if (!data) {
    return { type: 'FeatureCollection', features: [] };
  }
  
  // If already a FeatureCollection, sanitize it
  if (data.type === 'FeatureCollection') {
    return sanitizeFeatureCollection(data, requiredProps);
  }
  
  // If it's an array, convert to FeatureCollection
  if (Array.isArray(data)) {
    const features = data
      .map((item) => {
        // Find coordinates in various possible locations
        let coordinates = null;
        const coordKeys = ['coordinates', 'coordinate', 'location', 'center', 'position'];
        
        for (const key of coordKeys) {
          if (item[key] && Array.isArray(item[key])) {
            coordinates = item[key];
            break;
          }
        }
        
        if (!coordinates) {
          return null;
        }
        
        // Validate coordinates based on geometry type
        if (geometryType === 'Point' && !validateCoordinates(coordinates)) {
          return null;
        }
        
        if (geometryType === 'LineString') {
          if (!Array.isArray(coordinates) || coordinates.length < 2) {
            return null;
          }
          if (!coordinates.every(coord => validateCoordinates(coord))) {
            return null;
          }
        }
        
        // Create properties without coordinate fields
        const properties = { ...item };
        coordKeys.forEach(key => delete properties[key]);
        
        return {
          type: 'Feature',
          geometry: {
            type: geometryType,
            coordinates: coordinates
          },
          properties: sanitizeProperties(properties, requiredProps)
        };
      })
      .filter(f => f !== null);
    
    return {
      type: 'FeatureCollection',
      features: features
    };
  }
  
  // If it's an object with particles/flows (mobility data)
  if (data.particles || data.flows) {
    return {
      particles: toValidGeoJSON(data.particles, 'Point', requiredProps),
      flows: toValidGeoJSON(data.flows, 'LineString', requiredProps)
    };
  }
  
  // Default: empty FeatureCollection
  return { type: 'FeatureCollection', features: [] };
}