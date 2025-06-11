/**
 * Mapbox Expression Helpers
 * Safe wrappers for Mapbox expressions to prevent undefined property errors
 */

/**
 * Safe get expression that provides a default value if property is undefined
 * @param {string} property - Property name to get
 * @param {any} defaultValue - Default value if property is undefined
 * @returns {Array} - Mapbox expression array
 */
export function safeGet(property, defaultValue) {
  return ['coalesce', ['get', property], defaultValue];
}

/**
 * Safe multiplication that ensures both operands are numbers
 * @param {Array|number} value1 - First value or expression
 * @param {Array|number} value2 - Second value or expression
 * @param {number} defaultResult - Default result if operation fails
 * @returns {Array} - Mapbox expression array
 */
export function safeMultiply(value1, value2, defaultResult = 0) {
  // If both are numbers, just return the multiplication expression
  if (typeof value1 === 'number' && typeof value2 === 'number') {
    return ['*', value1, value2];
  }
  
  // If value1 is an expression, wrap it in coalesce
  const safeValue1 = Array.isArray(value1) ? 
    ['coalesce', value1, 0] : value1;
  
  // If value2 is an expression, wrap it in coalesce
  const safeValue2 = Array.isArray(value2) ? 
    ['coalesce', value2, 1] : value2;
  
  return ['coalesce', ['*', safeValue1, safeValue2], defaultResult];
}

/**
 * Safe division that prevents division by zero
 * @param {Array|number} numerator - Numerator value or expression
 * @param {Array|number} denominator - Denominator value or expression
 * @param {number} defaultResult - Default result if operation fails
 * @returns {Array} - Mapbox expression array
 */
export function safeDivide(numerator, denominator, defaultResult = 0) {
  // Ensure denominator is never zero
  const safeDenominator = Array.isArray(denominator) ?
    ['case', ['==', denominator, 0], 1, denominator] :
    denominator === 0 ? 1 : denominator;
  
  // Ensure numerator has a default
  const safeNumerator = Array.isArray(numerator) ?
    ['coalesce', numerator, 0] : numerator;
  
  return ['coalesce', ['/', safeNumerator, safeDenominator], defaultResult];
}

/**
 * Safe interpolation that ensures the input value exists
 * @param {Array} interpolation - Interpolation array
 * @param {Array|string} input - Input expression or value
 * @param {Array} stops - Interpolation stops
 * @returns {Array} - Mapbox expression array
 */
export function safeInterpolate(interpolation, input, stops) {
  const safeInput = Array.isArray(input) && input[0] === 'get' ?
    safeGet(input[1], 0) : input;
  
  return ['interpolate', interpolation, safeInput, ...stops];
}

/**
 * Safe match expression with default value
 * @param {Array|string} input - Input expression or value
 * @param {Array} cases - Match cases (value, result pairs)
 * @param {any} defaultValue - Default value if no match
 * @returns {Array} - Mapbox expression array
 */
export function safeMatch(input, cases, defaultValue) {
  const safeInput = Array.isArray(input) && input[0] === 'get' ?
    safeGet(input[1], '') : input;
  
  return ['match', safeInput, ...cases, defaultValue];
}

/**
 * Creates a safe filter expression that checks property existence
 * @param {string} operator - Comparison operator
 * @param {string} property - Property name
 * @param {any} value - Value to compare
 * @returns {Array} - Mapbox filter expression
 */
export function safeFilter(operator, property, value) {
  return ['all',
    ['has', property],
    [operator, ['get', property], value]
  ];
}

/**
 * Creates a compound filter with multiple conditions
 * @param {Array} conditions - Array of filter conditions
 * @returns {Array} - Mapbox filter expression
 */
export function safeCompoundFilter(conditions) {
  const safeConditions = conditions.map(condition => {
    if (condition[0] === '==' || condition[0] === '!=' || 
        condition[0] === '>' || condition[0] === '>=' || 
        condition[0] === '<' || condition[0] === '<=') {
      const property = condition[1][1]; // Assumes ['get', 'property']
      return ['all', ['has', property], condition];
    }
    return condition;
  });
  
  return ['all', ...safeConditions];
}