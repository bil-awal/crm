<script setup>
import miscMaskDark from '@images/misc/misc-mask-dark.png'
import miscMaskLight from '@images/misc/misc-mask-light.png'
import tree1 from '@images/misc/tree1.png'
import tree3 from '@images/misc/tree3.png'
import pages401 from '@images/pages/401.png'

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const ability = useAbility()

const userData = useCookie('userData')
const token = useCookie('crmAccessToken')

const logout = async () => {
  try {
    const apiLogout = await $crmApi('/auth/logout', {
      method: 'DELETE',
      body: {
        token: token.value,
      },
    })
  } catch (error) {
    console.log('ERROR:', error)
  }

  // Remove "accessToken" from cookie
  useCookie('crmAccessToken').value = null

  // Remove "userData" from cookie
  userData.value = null

  // ℹ️ We had to remove abilities in then block because if we don't nav menu items mutation is visible while redirecting user to login page

  // Remove "userAbilities" from cookie
  useCookie('userAbilityRules').value = null

  // Reset ability to initial ability
  ability.update([])

  localStorage.removeItem('userMaps')

  await nextTick(() => {
    eventBus.value.emit('handleLogout')
    router.push('/login')
  })
}
</script>

<template>
  <div
    class="misc-wrapper"
    style="zoom: 80%"
  >
    <ErrorHeader
      title="User not been authorized! 🔐"
      description="Please wait Admin to assign your Credential and Roles"
      class="mb-10"
    />

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="pages401"
        alt="Coming Soon"
        :max-width="785"
        :height="500"
        class="mx-auto"
      />
      <VBtn
        class="mt-10"
        style="z-index: 1;"
        @click="logout"
      >
        Back to Home
      </VBtn>

      <div class="d-md-flex gap-x-2 misc-footer-tree d-none">
        <img
          :src="tree3"
          alt="tree"
          height="120"
          width="68"
        >
        <img
          :src="tree3"
          alt="tree"
          height="70"
          width="40"
          class="align-self-end"
        >
      </div>

      <img
        height="210"
        :src="tree1"
        class="misc-footer-tree-1 d-none d-md-block"
      >
      <img
        cover
        :src="authThemeMask"
        height="172"
        class="misc-footer-img d-none d-md-block flip-in-rtl"
      >
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
