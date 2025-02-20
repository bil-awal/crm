import { ofetch } from 'ofetch'

export const $crmApiLoginV2 = ofetch.create({
  baseURL: `${import.meta.env.VITE_API_CRM}/v2`,
  async onRequest({ options }) {
    const xUserId = 'anonymouse'
    
    options.headers = {
      ...options.headers,
      Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'X-User-Id': xUserId,
    }
  },
})
