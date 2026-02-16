/**
 * Safely parse a JSON string or return a fallback.
 * If the input is already an object, return it as-is.
 */
export function safeParseJSON(value, fallback = {}) {
  if (value == null || value === '')
    return fallback;
  
  if (typeof value === 'object')
    return value;
  
  try {
    return JSON.parse(value);
  }
  catch {
    return fallback;
  }
}

/**
 * Check if a string is valid JSON (or empty).
 */
export function isValidJSON(value) {
  if (value == null || value === '')
    return true;
  
  try {
    JSON.parse(value);
    return true;
  }
  catch {
    return false;
  }
}
