<script setup>
import tree1 from '@images/misc/tree1.png'
import authV2ForgotPasswordIllustrationBorderedDark from '@images/pages/auth-v2-forgot-password-illustration-dark-border.png'
import authV2ForgotPasswordIllustrationDark from '@images/pages/auth-v2-forgot-password-illustration-dark.png'
import authV2ForgotPasswordIllustrationBorderedLight from '@images/pages/auth-v2-forgot-password-illustration-light-border.png'
import authV2ForgotPasswordIllustrationLight from '@images/pages/auth-v2-forgot-password-illustration-light.png'
import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import axios from 'axios'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const authThemeImg = useGenerateImageVariant(authV2ForgotPasswordIllustrationLight, authV2ForgotPasswordIllustrationDark, authV2ForgotPasswordIllustrationBorderedLight, authV2ForgotPasswordIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const password = ref('')
const password2 = ref('')
const isPasswordVisible = ref(false)
const isPassword2Visible = ref(false)
const route = useRoute()
const id = route.params.id
const formRef = ref(null)
const isSuccessInfoVisible = ref(false)
const isFailedInfoVisible = ref(false)
const isFailedMatchVisible = ref(false)

const errors = ref({
  password: undefined,
  password2: undefined,
})

const resetPassword = async () => {
  if (password.value !== password2.value) {
    isFailedMatchVisible.value = true
    
    return
  }

  try {
    const body = {
      userId: id,
      provider: 'local',
      password: password.value,
    }

    const result = await axios.post(`${import.meta.env.VITE_API_CRM}/user-secrets`, body, {
      headers: {
        'X-User-Id': 'web',
        'Content-Type': 'application/json',
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
      },
    })

    if (result.data.resultCode === 1) {
      isSuccessInfoVisible.value = true
    } else {
      isFailedInfoVisible.value = true
    }

  } catch (error) {
    isFailedInfoVisible.value = true
  }
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow
    class="auth-wrapper"
    no-gutters
  >
    <VCol
      md="8"
      class="d-none d-md-flex position-relative"
    >
      <div class="d-flex align-center justify-end w-100 h-100 pa-10 pe-0">
        <VImg
          width="853"
          height="684"
          :src="authThemeImg"
          class="auth-illustration"
        />
      </div>
      <img
        class="auth-footer-mask"
        height="360"
        :src="authThemeMask"
      >
      <img
        :src="tree1"
        alt="tree image"
        height="140"
        class="auth-footer-tree"
      >
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Set Password 🔒
          </h4>
        </VCardText>
        <VCardText>
          <VForm
            ref="formRef"
            @submit.prevent="resetPassword"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="password"
                  label="Password"
                  placeholder="Password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :error-messages="errors.password"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  :rules="[v => !!v || 'Password is required']"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="password2"
                  label="Re-Type Password"
                  placeholder="Re-Type Password"
                  :type="isPassword2Visible ? 'text' : 'password'"
                  :error-messages="errors.password2"
                  :append-inner-icon="isPassword2Visible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  :rules="[v => !!v || 'Password confirmation is required']"
                  @click:append-inner="isPassword2Visible = !isPassword2Visible"
                />
              </VCol>
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                >
                  Submit
                </VBtn>
              </VCol>
              <VCol cols="12">
                <RouterLink
                  class="d-flex align-center justify-center"
                  :to="{ name: 'login' }"
                >
                  <VIcon
                    icon="ri-arrow-left-s-line"
                    class="flip-in-rtl"
                  />
                  <span>Back to login</span>
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VSnackbar
    v-model="isFailedMatchVisible"
    color="primary"
    location="top"
  >
    Password & Re-Type Password didn't Match!
    <template #actions>
      <VBtn
        color="error"
        @click="isFailedMatchVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
  <VSnackbar
    v-model="isFailedInfoVisible"
    color="primary"
    location="top"
  >
    Failed to Set Password May has been Set!
    <template #actions>
      <VBtn
        color="error"
        @click="isFailedInfoVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
  <VDialog
    v-model="isSuccessInfoVisible"
    persistent
    class="v-dialog-sm"
  >
    <template #activator="{ props }">
      <VBtn v-bind="props">
        Open Dialog
      </VBtn>
    </template>
    <VCard title="Password Reset Successful">
      <VCardText>
        Your password has been successfully reset. You can now log in with your new password.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <RouterLink
          :to="{ name: 'login' }"
          class="text-h6 font-weight-medium text-success"
        >
          OK
        </RouterLink>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
