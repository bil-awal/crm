// api/crmApi.js
import { ofetch } from 'ofetch'
import { eventBus } from '@/utils/eventBus'

/**
 * CRM-related error messages
 */
const CRM_ERRORS = {
  AUTH_REQUIRED: 'Authentication required',
  NETWORK_ERROR: 'Network error occurred', 
  INVALID_TOKEN: 'Invalid or expired token',
  REQUEST_FAILED: 'Request failed',
}

/**
 * Token error response messages
 */
const TOKEN_ERROR_MESSAGES = [
  'Invalid or Expired Token',
  'Token Expired',
  'Invalid Token',
  'common.invalid_request',
]

/**
 * Clear auth data and trigger logout
 */
const handleAuthError = async () => {
  // Clear cookies
  const cookies = ['crmAccessToken', 'userData', 'userAbilityRules']

  cookies.forEach(cookie => useCookie(cookie).value = null)

  // Clear localStorage
  const storage = ['tenantType', 'featureRoles', 'userMaps']

  storage.forEach(item => localStorage.removeItem(item))

  await nextTick()
  eventBus.value.emit('handleLogout')
}

/**
 * CRM API instance for authenticated endpoints
 */
export const $crmApi = ofetch.create({
  baseURL: import.meta.env.VITE_API_CRM,

  async onRequest({ options }) {
    const jwt = useCookie('crmAccessToken').value

    if (!options.skipAuth && !jwt) {
      await handleAuthError()
      throw new Error(CRM_ERRORS.AUTH_REQUIRED)
    }

    options.headers = {
      Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
      'X-JWT': jwt,
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Accept-Language': 'en-GB,en;q=0.9',
      Connection: 'keep-alive',
      Origin: window.location.origin,
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    }
  },

  async onRequestError({ error }) {
    console.error('CRM API request error:', error)
    throw new Error(error?.message || CRM_ERRORS.NETWORK_ERROR)
  },

  async onResponseError({ response }) {
    console.error('CRM API response error:', response)

    const isTokenError = 
      response.status === 401 || 
      (response.data?.messageKey && TOKEN_ERROR_MESSAGES.includes(response.data.messageKey))

    if (isTokenError) {
      await handleAuthError()
      throw new Error(CRM_ERRORS.INVALID_TOKEN)
    }

    // Throw the actual error response data
    if (response._data) {
      throw response._data
    }

    throw new Error(CRM_ERRORS.REQUEST_FAILED)
  },

  async onResponse({ response }) {
    return response._data
  },
})

export default $crmApi
