import { ofetch } from 'ofetch'
import { eventBus } from '@/utils/eventBus'

const AUTH_ERRORS = {
  INVALID_TOKEN: 'Invalid or Expired Token',
  TOKEN_EXPIRED: 'Token Expired',
  INVALID: 'Invalid Token',
}

const handleAuthError = async () => {
  const cookies = ['crmAccessToken', 'userData', 'userAbilityRules']
  const storage = ['tenantType', 'featureRoles', 'userMaps']

  cookies.forEach(cookie => useCookie(cookie).value = null)
  storage.forEach(item => localStorage.removeItem(item))

  await nextTick(() => eventBus.value.emit('handleLogout'))
}

const parseErrorMessage = response => {
  try {
    // Handle API error format
    if (response._data) {
      if (response._data.message) {
        return response._data.message
      }
      
      // Handle specific conflict error format
      if (response._data.messageKey === 'common.field_value.exists') {
        return response._data.message || 'Username already exists'
      }
    }

    // Fallback error message based on status
    const statusMessages = {
      400: 'Invalid request data',
      401: 'Unauthorized access',
      403: 'Access forbidden',
      404: 'Resource not found',
      409: 'Username already exists',
      500: 'Internal server error',
    }

    return statusMessages[response.status] || 'An unexpected error occurred'
  } catch (error) {
    console.error('Error parsing error message:', error)
    
    return 'An unexpected error occurred'
  }
}

export const $userStoreApi = ofetch.create({
  baseURL: import.meta.env.VITE_API_USER_STORE,

  async onRequest({ options, request }) {
    const jwt = useCookie('crmAccessToken').value

    if (!options.skipAuth && !jwt) {
      await handleAuthError()
      
      return
    }

    options.headers = {
      ...options.headers,
      Authorization: import.meta.env.VITE_AUTH_TOKEN,
      'Content-Type': 'application/json',
      'X-JWT': jwt,
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    }
  },

  async onRequestError({ error }) {
    console.error('Request error:', error)
    throw new Error(error.message || 'Failed to send request')
  },

  async onResponseError({ response }) {
    if (response.status === 401 || 
        (response._data?.message && Object.values(AUTH_ERRORS).includes(response._data.message))) {
      await handleAuthError()
    }

    const errorMessage = parseErrorMessage(response)
    throw new Error(errorMessage)
  },

  async onResponse({ response }) {
    // We don't throw error here anymore since non-2xx responses are handled by onResponseError
    return response._data
  },
})
