<!-- pages/login.vue -->
<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex">
      <VNodeRenderer
        style="zoom: 150%"
        :nodes="themeConfig.app.icon"
      />
      <VNodeRenderer
        style="zoom: 150%"
        :nodes="themeConfig.app.logo"
      />
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper"
  >
    <!-- Left side - Illustration -->
    <VCol
      cols="12"
      md="8"
      class="d-none d-md-flex position-relative"
    >
      <div class="d-flex align-center justify-center w-100 h-100 pa-10 pe-0">
        <VImg
          max-width="500"
          :src="homeBanner"
          class="auth-illustration"
        />
      </div>

      <img
        class="auth-footer-mask"
        height="360"
        :src="authThemeMask"
      >
    </VCol>

    <!-- Right side - Login Form -->
    <VCol
      cols="12"
      md="4"
      style="z-index: 100; background-color: rgb(var(--v-theme-surface))"
      flat
      class="d-flex align-items-start flex-column"
    >
      <!-- Header -->
      <div class="pa-5">
        <h4 class="text-h4">
          Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span> 👋🏻
        </h4>
        <p class="text-medium-emphasis">
          Please sign-in to your account!
        </p>
      </div>

      <!-- Login Form -->
      <div class="pa-5 w-100">
        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <!-- Username Field -->
            <VCol cols="12">
              <VTextField
                v-model="formData.username"
                label="Username"
                placeholder="Enter your username"
                autofocus
                :rules="[requiredValidator]"
                :error-messages="errors.username"
                :disabled="isLoading"
                @update:model-value="clearErrors"
                @keyup.enter="handleSubmit"
              />
            </VCol>

            <!-- Password Field -->
            <VCol cols="12">
              <VTextField
                v-model="formData.password"
                label="Password"
                placeholder="············"
                :type="isPasswordVisible ? 'text' : 'password'"
                :error-messages="errors.password"
                :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="[requiredValidator]"
                :disabled="isLoading"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
                @update:model-value="clearErrors"
                @keyup.enter="handleSubmit"
              />
            </VCol>

            <!-- Submit Button -->
            <VCol cols="12">
              <VBtn
                block
                color="primary"
                size="large"
                type="submit"
                :loading="isLoading"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Signing in...' : 'Sign in' }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </div>

      <!-- Footer -->
      <div class="mt-auto pa-5 w-100">
        <div class="d-flex flex-column align-center justify-center text-medium-emphasis">
          <img
            height="40"
            :src="pancaranLogo"
          >
          <span>&copy; {{ new Date().getFullYear() }} DEALS. All Rights Reserved.</span>
          <span>CRM by <b>Pancaran Group</b></span>
        </div>
      </div>
    </VCol>
  </VRow>

  <!-- Error Snackbar -->
  <VSnackbar
    v-model="isErrorMessageVisible"
    color="error"
    location="top"
    :timeout="3000"
  >
    {{ errorMessage }}
    <template #actions>
      <VBtn
        color="white"
        variant="text"
        @click="isErrorMessageVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { themeConfig } from '@themeConfig'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { AuthService } from '@/services/authService'
import { eventBus } from '@/utils/eventBus'

import homeBanner from '@images/banner/home-banner.png'
import pancaranLogo from '@images/logos/pancaran-logo.png'
import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// Page metadata
definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

// Constants
const INVOICE_LIST_PERMISSION = 'INVOICE_LIST'
const DEFAULT_INVOICE_ROUTE = 'invoices-need-confirmations-new'

// Composables
const route = useRoute()
const router = useRouter()
const ability = useAbility()

// Refs
const formRef = ref(null)
const isPasswordVisible = ref(false)
const isErrorMessageVisible = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

// Form state
const formData = reactive({
  username: '',
  password: '',
})

const errors = reactive({
  username: undefined,
  password: undefined,
})

// Validators
const requiredValidator = v => !!v || 'This field is required'

// Methods
const clearErrors = () => {
  errors.username = undefined
  errors.password = undefined
  errorMessage.value = ''
  isErrorMessageVisible.value = false
}

const handleError = error => {
  console.error('Login error:', error)
  errorMessage.value = error.message || 'Login failed. Please try again.'
  isErrorMessageVisible.value = true
}

const handleSubmit = async () => {
  try {
    const { valid } = await formRef.value?.validate() || { valid: false }
    if (!valid) return

    isLoading.value = true
    clearErrors()

    const { userData, abilityRules, featureRoles } = await AuthService.handleLogin(formData)
    
    // Update ability
    ability.update(abilityRules)
    
    // Emit event for role update
    eventBus.value.emit('updateUserRoles', featureRoles)

    // Handle redirect based on permissions
    const redirectPath = featureRoles.includes(INVOICE_LIST_PERMISSION)
      ? { name: DEFAULT_INVOICE_ROUTE }
      : { path: route.query.to || '/' }

    await router.replace(redirectPath)
  } catch (error) {
    handleError(error)
    ability.update([])
  } finally {
    isLoading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  AuthService.clearAuthData()
  ability.update([])
  
  eventBus.value.on('handleLogout', async () => {
    await AuthService.clearAuthData()
    ability.update([])
    await router.push('/login')
  })
})

onBeforeUnmount(() => {
  eventBus.value.off('handleLogout')
})
</script>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";

.auth-wrapper {
  min-height: 100vh;

  .auth-illustration {
    max-height: 75vh;
    object-fit: contain;
  }
}
</style>
