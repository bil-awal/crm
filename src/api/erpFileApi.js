// api/erpFileApi.js
import { ofetch } from 'ofetch'

const ERP_FILE_ERRORS = {
  NETWORK_ERROR: 'Network error occurred while accessing ERP file system',
  REQUEST_FAILED: 'ERP file request failed',
}

export const $erpFileApi = ofetch.create({
  baseURL: 'https://api.pancaran-group.co.id/erp-file-loader',

  async onRequest({ options }) {
    options.headers = {
      Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
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
    console.error('ERP File API request error:', error)
    throw new Error(error?.message || ERP_FILE_ERRORS.NETWORK_ERROR)
  },

  async onResponseError({ response }) {
    console.error('ERP File API response error:', response)
    throw new Error(response.data?.message || ERP_FILE_ERRORS.REQUEST_FAILED)
  },

  async onResponse({ response }) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response._data
  },
})
