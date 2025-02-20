// services/roles.service.js
import { $crmApi } from '@/api/crmApi'

export const RolesService = {
  async switchRole(roleId) {
    try {
      const response = await $crmApi('/user/switch-role', {
        method: 'POST',
        body: { roleId },
      })

      if (!response?.jwt) {
        throw new Error('Invalid role switch response')
      }

      // Update stored JWT
      useCookie('crmAccessToken').value = response.jwt

      // Fetch updated profile and role data
      const profileResponse = await this.fetchUpdatedProfile()
      
      return {
        ...response,
        ...profileResponse,
      }
    } catch (error) {
      console.error('Role switch error:', error)
      throw new Error(error.data?.message || 'Failed to switch role')
    }
  },

  async fetchUpdatedProfile() {
    try {
      return await $crmApi('/user/profile', {
        method: 'GET',
      })
    } catch (error) {
      console.error('Profile update error:', error)
      throw new Error('Failed to fetch updated profile')
    }
  },

  // Get available roles for current user
  async getUserRoles() {
    try {
      const profile = await $crmApi('/user/profile', {
        method: 'GET',
      })

      
      return profile.roles || []
    } catch (error) {
      console.error('Fetch roles error:', error)
      throw new Error('Failed to fetch user roles')
    }
  },

  // Validate if user has specific role
  hasRole(roleId) {
    const userData = useCookie('userData').value
    
    return userData?.roles?.some(role => role.id === roleId) || false
  },

  // Get current active role
  getCurrentRole() {
    const userData = useCookie('userData').value
    
    return userData?.roleId || null
  },
}
