export const $handleInvalidToken = async () => {
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
