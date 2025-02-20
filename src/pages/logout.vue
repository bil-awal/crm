<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { $crmApi } from '@/api/crmApi'
import { eventBus } from '@/utils/eventBus'

// Composables
const router = useRouter()
const ability = useAbility()

// Environment configuration
const isDevelopment = import.meta.env.VITE_APP_ENV === 'development'

// Loading state
const isLoading = ref(false)

// Page meta
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

// Helper function to clear all auth data
const clearAuthData = () => {
  // Clear cookies
  const cookies = ['userAbilityRules', 'userData', 'crmAccessToken']

  cookies.forEach(cookie => useCookie(cookie).value = null)
  
  // Clear localStorage
  const storageItems = ['tenantType', 'featureRoles']

  storageItems.forEach(item => localStorage.removeItem(item))

  // Reset ability
  ability.update([])
}

// Main logout function
const handleLogout = async () => {
  try {
    isLoading.value = true

    const token = useCookie('crmAccessToken').value

    if (!isDevelopment && token) {
      try {
        await $crmApi('/auth/logout', {
          method: 'DELETE',
          body: { token },
        })
      } catch (error) {
        console.warn('Logout API call failed:', error)

        // Continue with local logout even if API call fails
      }
    }

    // Clear all auth data regardless of API call success
    clearAuthData()

    // Notify components about logout
    await nextTick(() => {
      eventBus.value.emit('handleLogout')
      router.push('/login')
    })

  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await handleLogout()
})

// Handle page refresh or direct access
onBeforeUnmount(() => {
  clearAuthData()
})
</script>

<template>
  <div
    class="d-flex align-center justify-center"
    style="min-height: 100vh;"
  >
    <VCard
      class="pa-5 text-center"
      max-width="400"
    >
      <VCardText>
        <div class="text-h6 mb-2">
          Logging out...
        </div>
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.v-card {
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.1);
}
</style>
