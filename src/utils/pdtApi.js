import { ofetch } from 'ofetch'

export const $pdtApi = ofetch.create({
  baseURL: `${import.meta.env.VITE_API_PDT}`,
  async onRequest({ options }) {
    options.headers = {
      ...options.headers,
      Authorization: `${import.meta.env.VITE_TOKEN_PDT}`,
      'Content-Type': 'application/json',
    }
  },
})
