import { ofetch } from 'ofetch'

export const $crmApiLogin = ofetch.create({
  baseURL: `${import.meta.env.VITE_API_CRM}`,
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
