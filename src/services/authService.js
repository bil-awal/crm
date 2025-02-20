import { login } from "@/api/tokenApi"
import { $crmApi } from "@/api/crmApi"
import { eventBus } from "@/utils/eventBus"

export const AuthService = {
  clearAuthData() {
    const cookies = ["userAbilityRules", "userData", "crmAccessToken"]
    const storage = ["tenantType", "featureRoles", "userMaps"]

    cookies.forEach(cookie => (useCookie(cookie).value = null))
    storage.forEach(item => localStorage.removeItem(item))
  },

  async getDefaultRole(idToken) {
    try {
      // Decode id_token to get sub (username)
      const [, payload] = idToken.split(".")
      const decoded = JSON.parse(atob(payload))
      const username = decoded.sub

      if (!username) {
        throw new Error("Username not found in token")
      }

      // Fetch default role using username
      const roleResponse = await $crmApi(`/user/${username}/default-role`, {
        skipAuth: true, // Skip JWT check since we don't have it yet
        headers: {
          Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
        },
      })

      if (!roleResponse?.jwt) {
        throw new Error("No JWT in role response")
      }

      // Set JWT for subsequent requests
      const tokenCookie = useCookie("crmAccessToken")

      tokenCookie.value = roleResponse.jwt

      return roleResponse
    } catch (error) {
      console.error("Default role error:", error)
      throw new Error("Failed to fetch default role")
    }
  },

  async fetchUserProfile() {
    try {
      const profile = await $crmApi("/user/profile")
      if (!profile) throw new Error("Empty profile response")

      return profile
    } catch (error) {
      throw new Error(error?.message || "Failed to fetch user profile")
    }
  },

  getUserAbilityRules(roleData) {
    return roleData.featureRoles.map(featureId => ({
      action: "manage",
      subject: featureId,
    }))
  },

  prepareUserData(profileData, roleData) {
    return {
      id: profileData.userId,
      username: profileData.username,
      name: profileData.name,
      email: profileData.email,
      tenant: roleData.tenant,
      tenantType: roleData.tenantType,
      roleId: profileData.defaultRole,
      roleName: profileData.roles.find(r => r.id === profileData.defaultRole)?.name,
      roles: profileData.roles,
      status: profileData.status,
      lastLogin: profileData.lastLogin,
    }
  },

  async processUserData(loginResponse) {
    try {
      // First get default role and JWT using id_token
      const roleData = await this.getDefaultRole(loginResponse.id_token)

      // Now we have JWT set, we can fetch profile
      const profileData = await this.fetchUserProfile()

      // Generate ability rules and prepare user data
      const userAbilityRules = this.getUserAbilityRules(roleData)
      const userData = this.prepareUserData(profileData, roleData)

      // Save to cookies and localStorage
      const userAbilityRulesCookie = useCookie("userAbilityRules")
      const userDataCookie = useCookie("userData")

      userAbilityRulesCookie.value = userAbilityRules
      userDataCookie.value = userData
      localStorage.setItem("tenantType", roleData.tenantType)
      localStorage.setItem("featureRoles", JSON.stringify(roleData.featureRoles))

      return {
        userData,
        abilityRules: userAbilityRules,
        featureRoles: roleData.featureRoles,
      }
    } catch (error) {
      console.error("Process user data error:", error)
      this.clearAuthData()
      throw new Error("Failed to process user data")
    }
  },

  async handleLogin(credentials) {
    try {
      this.clearAuthData()

      const loginResponse = await login(credentials)

      return await this.processUserData(loginResponse)
    } catch (error) {
      console.error("Login error:", error)
      this.clearAuthData()
      throw error // Propagate the detailed error
    }
  },

  getStoredUserData() {
    const userDataCookie = useCookie("userData")
    const userAbilityRulesCookie = useCookie("userAbilityRules")
    const jwt = useCookie("crmAccessToken").value

    return {
      userData: userDataCookie.value,
      abilityRules: userAbilityRulesCookie.value,
      jwt,
      tenantType: localStorage.getItem("tenantType"),
      featureRoles: JSON.parse(localStorage.getItem("featureRoles") || "[]"),
    }
  },

  isAuthenticated() {
    const jwt = useCookie("crmAccessToken").value

    return !!jwt
  },

  async logout() {
    this.clearAuthData()
    eventBus.value.emit("handleLogout")
  },
}

export default AuthService

