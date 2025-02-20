// services/user.service.js
import { $crmApi } from '@/api/crmApi'

export const UserService = {
  /**
   * Fetch user details by ID
   * @param {string} userId - The ID of the user to fetch
   */
  async fetchUser(userId) {
    try {
      const response = await $crmApi(`/admin/user/${userId}`)
      if (response.resultCode !== 1 || !response.data) {
        throw new Error(response.message || 'Failed to fetch user')
      }
      
      return response.data
    } catch (error) {
      console.error('User fetch error:', error)
      throw new Error(error.data?.message || 'Failed to fetch user')
    }
  },

  /**
   * Fetch all available tenants
   */
  async fetchTenants() {
    try {
      const response = await $crmApi('/common/tenant')

      // Since the response is directly an array of tenants
      if (!Array.isArray(response)) {
        throw new Error('Invalid tenant response format')
      }
      
      return response
    } catch (error) {
      console.error('Tenants fetch error:', error)
      throw new Error(error.message || 'Failed to fetch tenants')
    }
  },

  /**
   * Fetch feature permissions for a specific role type
   * @param {string} userId - The ID of the user
   * @param {string} roleType - The type of role (PDT, PLI, CUSTOMER)
   */
  async fetchFeaturePermissions(userId, roleType) {
    try {
      const response = await $crmApi(`/admin/user/${userId}/permission/features/${roleType}`)
      
      if (!response || !Array.isArray(response)) {
        console.warn(`Invalid feature permissions response for ${roleType}:`, response)
        
        return []
      }

      return response.map(domain => ({
        id: domain.id || '',
        name: domain.name || '',
        availableFeatures: (domain.availableFeatures || []).map(feature => ({
          id: feature.id || '',
          name: feature.name || '',
          enabled: Boolean(feature.enabled),
          description: feature.description || '',
        })),
      }))
    } catch (error) {
      console.error(`Feature permissions fetch error for ${roleType}:`, error)
      throw new Error(`Failed to fetch ${roleType} feature permissions`)
    }
  },

  /**
   * Fetch data permissions for a specific role type
   * @param {string} userId - The ID of the user
   * @param {string} roleType - The type of role (PDT, PLI, CUSTOMER)
   */
  async fetchDataPermissions(userId, roleType) {
    try {
      const response = await $crmApi(`/admin/user/${userId}/permission/data/${roleType}`)
      
      if (response.resultCode === 1 && response.data) {
        return {
          customers: response.data.customers || [],
          selectedCustomers: response.data.selectedCustomers || [],
        }
      }

      if (Array.isArray(response)) {
        return {
          customers: response,
          selectedCustomers: [],
        }
      }

      return { customers: [], selectedCustomers: [] }
    } catch (error) {
      console.error(`Data permissions fetch error for ${roleType}:`, error)
      throw new Error(`Failed to fetch ${roleType} data permissions`)
    }
  },

  /**
   * Update user information
   * @param {string} userId - The ID of the user to update
   * @param {Object} userData - The user data to update
   */
  async updateUser(userId, userData) {
    try {
      const response = await $crmApi.patch(`/admin/user/${userId}`, userData)
      if (response.resultCode !== 1) {
        throw new Error(response.message || 'Failed to update user')
      }
      
      return response.data
    } catch (error) {
      console.error('User update error:', error)
      throw new Error(error.data?.message || 'Failed to update user')
    }
  },

  /**
   * Update permissions for a specific role type
   * @param {string} userId - The ID of the user
   * @param {string} roleType - The type of role (PDT, PLI, CUSTOMER)
   * @param {Object} permissions - The permissions to update
   */
  async updatePermissions(userId, roleType, permissions) {
    try {
      const response = await $crmApi.patch(
        `/admin/user/${userId}/permission/${roleType}`,
        permissions,
      )
      
      if (response.resultCode !== 1) {
        throw new Error(response.message || `Failed to update ${roleType} permissions`)
      }
      
      return response.data
    } catch (error) {
      console.error(`Permissions update error for ${roleType}:`, error)
      throw new Error(`Failed to update ${roleType} permissions`)
    }
  },
}
