// api/tokenApi.js
import { ofetch } from 'ofetch'

/**
 * Auth-related error messages
 */
const AUTH_ERRORS = {
  INVALID_RESPONSE: 'Invalid username or password',
  NETWORK_ERROR: 'Network error occurred',
  TOKEN_REFRESH_FAILED: 'Token refresh failed',
  INVALID_CREDENTIALS: 'Invalid username or password',
}

/**
 * Token API instance for auth endpoints
 */
export const $tokenApi = ofetch.create({
  baseURL: `${import.meta.env.VITE_API_TOKEN}`,
  
  async onRequest({ options }) {
    options.headers = {
      Authorization: `${import.meta.env.VITE_API_TOKEN_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  },

  async onRequestError({ error }) {
    throw new Error(error?.message || AUTH_ERRORS.NETWORK_ERROR)
  },

  async onResponseError({ response }) {
    const errorMessage = response.data?.error_description || 
                        response.data?.error || 
                        AUTH_ERRORS.NETWORK_ERROR

    throw new Error(errorMessage)
  },

  async onResponse({ response }) {
    if (!response._data?.access_token) {
      throw new Error(AUTH_ERRORS.INVALID_RESPONSE)
    }
    
    return response._data
  },
})

/**
 * Login with username and password
 * @param {Object} credentials Login credentials
 * @param {string} credentials.username Username
 * @param {string} credentials.password Password
 * @returns {Promise<Object>} Login response with tokens
 */
export const login = async ({ username, password }) => {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    return await $tokenApi('/', {
      method: 'POST',
      params: {
        grant_type: 'password',
        username,
        password,
        scope: 'openid',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    throw new Error(error?.message || AUTH_ERRORS.INVALID_CREDENTIALS)
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken Refresh token
 * @returns {Promise<Object>} Token refresh response
 */
export const refreshToken = async refreshToken => {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token is required')
    }

    return await $tokenApi('/', {
      method: 'POST',
      params: {
        grant_type: 'refresh_token',  
        refresh_token: refreshToken,
        scope: 'openid',
      },
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    throw new Error(error?.message || AUTH_ERRORS.TOKEN_REFRESH_FAILED)
  }
}

export default {
  login,
  refreshToken,
  $tokenApi,
}
