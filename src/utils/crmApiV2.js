import { ofetch } from 'ofetch'

const handleInvalidToken = async () => {
  useCookie('crmAccessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null
  ability.update([])
  localStorage.removeItem('userMaps')

  await nextTick(() => {
    eventBus.emit('handleLogout')
    router.push('/login')
  })
}

export const $crmApiV2 = ofetch.create({
  baseURL: `${import.meta.env.VITE_API_CRM}/v2`,
  async onRequest({ options }) {
    const accessToken = useCookie('crmAccessToken').value

    if (!accessToken) {
      await handleInvalidToken()
    }

    const xUserId = accessToken ? useCookie('userData').value.email : 'anonymouse'

    options.headers = {
      ...options.headers,
      Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'X-User-Id': xUserId,
      'X-Token': accessToken,
    }
  },
  async onResponseError({ response }) {
    if (response.status === 401 || (response.data && response.data.message === "Invalid or Expired Token")) {
      await handleInvalidToken()
    }
  },
})
