// src/composables/useAuth.js
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

export function useAuth() {
  const isAuthenticated = computed(() => {
    const token = useCookie('crmAccessToken')
    
    return !!token.value
  })

  const userData = computed(() => {
    const userDataCookie = useCookie('userData')
    
    return userDataCookie.value
  })

  const userAbilityRules = computed(() => {
    const rulesCookie = useCookie('userAbilityRules')
    
    return rulesCookie.value || []
  })

  const clearAuthData = () => {
    const cookies = ['crmAccessToken', 'userData', 'userAbilityRules']

    cookies.forEach(cookieName => {
      const cookie = useCookie(cookieName)

      cookie.value = null
    })
    
    localStorage.removeItem('tenantType')
    localStorage.removeItem('featureRoles')
  }

  const checkAuth = async () => {
    if (!isAuthenticated.value) {
      throw new Error('Not authenticated')
    }

    try {
      await authService.validateToken()
      
      return true
    } catch (error) {
      clearAuthData()
      throw new Error('Session expired')
    }
  }

  return {
    isAuthenticated,
    userData,
    userAbilityRules,
    clearAuthData,
    checkAuth,
  }
}
