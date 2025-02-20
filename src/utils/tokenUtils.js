// utils/tokenUtils.js

/**
 * Token-related error messages
 */
const TOKEN_ERRORS = {
  TOKEN_REQUIRED: 'Token is required',
  INVALID_STRUCTURE: 'Invalid token structure',
  INVALID_FORMAT: 'Invalid token format',
  MISSING_SUB: 'Token missing sub claim',
}

/**
 * Parse payload from JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded token payload
 */
const parsePayload = token => {
  try {
    if (!token) {
      throw new Error(TOKEN_ERRORS.TOKEN_REQUIRED)
    }

    // Split the JWT and get the payload
    const [, payload] = token.split('.')
    if (!payload) {
      throw new Error(TOKEN_ERRORS.INVALID_STRUCTURE)
    }

    // Add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64

    // Decode the base64 payload
    return JSON.parse(atob(paddedBase64))
  } catch (error) {
    console.error('Failed to parse payload:', error)
    throw new Error(TOKEN_ERRORS.INVALID_FORMAT)
  }
}

/**
 * Extract subject (sub) from token
 * @param {string|Object} token - JWT token string or response object
 * @returns {string} Subject claim from token
 */
export const getSubFromToken = token => {
  try {
    // Handle if token is undefined or null
    if (!token) {
      throw new Error(TOKEN_ERRORS.TOKEN_REQUIRED)
    }

    // Original response contains access_token field
    const targetToken = typeof token === 'string' ? token : token.access_token

    // Get decoded payload
    const decodedPayload = parsePayload(targetToken)
    
    // Check for sub claim
    if (!decodedPayload.sub) {
      throw new Error(TOKEN_ERRORS.MISSING_SUB)
    }

    return decodedPayload.sub

  } catch (error) {
    console.error('Failed to extract sub from token:', error)
    throw new Error(TOKEN_ERRORS.INVALID_FORMAT)
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} Whether token is expired
 */
export const isTokenExpired = token => {
  try {
    const payload = parsePayload(token)
    const currentTime = Math.floor(Date.now() / 1000)
    
    return payload.exp ? payload.exp < currentTime : true
  } catch (error) {
    console.error('Failed to check token expiration:', error)
    
    return true
  }
}

export default {
  getSubFromToken,
  isTokenExpired,
}
