<!-- DefaultLayoutWithVerticalNav.vue -->
<template>
  <VerticalNavLayout :nav-items="navItems">
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- Mobile Menu Toggle -->
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n2 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <NavSearchBar class="ms-lg-n2" />

        <VSpacer />
        
        <!-- User Info and Role Switcher -->
        <div class="d-flex align-center">
          <div 
            v-if="userData?.name" 
            class="text-right mr-5"
          >
            <h6 class="text-h6">
              {{ userData.name }}
            </h6>
            <VListItemSubtitle class="text-capitalize font-weight-medium text-disabled">
              {{ userData.roleName || 'No Role' }}
            </VListItemSubtitle>
          </div>
          
          <RoleSwitcher
            v-if="userData?.roles?.length"
            :user-roles="userData.roles"
            class="ms-5"
          />
          
          <UserProfile class="ms-3" />
        </div>
      </div>
    </template>

    <AppLoadingIndicator ref="refLoadingIndicator" />

    <RouterView v-slot="{ Component }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <template #footer>
      <Footer />
    </template>

    <TheCustomizer />
  </VerticalNavLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VerticalNavLayout } from '@layouts'
import { eventBus } from '@/utils/eventBus'
import Footer from '@/layouts/components/Footer.vue'
import NavSearchBar from '@/layouts/components/NavSearchBar.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import RoleSwitcher from '@/layouts/components/RoleSwitcher.vue'
import navItems from '@/navigation/vertical'
import { AuthService } from '@/services/authService'

// Router
const router = useRouter()

// State
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref(null)
const userData = ref(useCookie('userData').value || {})

// Event Handlers
const handleRoleChange = async ({ role, profile }) => {
  try {
    // Update user data with new role information
    const updatedUserData = {
      ...userData.value,
      roleId: role.id,
      roleName: role.name,
      ...profile, // Merge updated profile data
    }
    
    userData.value = updatedUserData
    useCookie('userData').value = updatedUserData

    // Reload the current route to refresh permissions
    await router.replace({ name: router.currentRoute.value.name })

  } catch (error) {
    console.error('Error handling role change:', error)
  }
}

const handleSessionExpired = () => {
  AuthService.clearAuthData()
  router.push('/login')
}

// Lifecycle Hooks
onMounted(() => {
  eventBus.value.on('roleChanged', handleRoleChange)
  eventBus.value.on('sessionExpired', handleSessionExpired)
})

onBeforeUnmount(() => {
  eventBus.value.off('roleChanged', handleRoleChange)
  eventBus.value.off('sessionExpired', handleSessionExpired)
})

// Loading indicator watcher
watch(
  [isFallbackStateActive, refLoadingIndicator],
  () => {
    if (isFallbackStateActive.value && refLoadingIndicator.value) {
      refLoadingIndicator.value.fallbackHandle()
    }
    if (!isFallbackStateActive.value && refLoadingIndicator.value) {
      refLoadingIndicator.value.resolveHandle()
    }
  },
  { immediate: true },
)
</script>
