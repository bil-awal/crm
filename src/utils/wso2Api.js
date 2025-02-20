import { ofetch } from 'ofetch'

const googleAuth = ref(`${import.meta.env.VITE_GOOGLE_AUTH}`)

export const $wso2Api = ofetch.create({
  baseURL: `${import.meta.env.VITE_IS}`,
  async onRequest({ options }) {
    options.headers = {
      ...options.headers,
      "Authorization": googleAuth.value,
      "Content-type": "application/json",
      "Accept": "application/json",
    }
  },
})
