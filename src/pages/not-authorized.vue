<script setup>
import miscMaskDark from '@images/misc/misc-mask-dark.png'
import miscMaskLight from '@images/misc/misc-mask-light.png'
import tree1 from '@images/misc/tree1.png'
import tree3 from '@images/misc/tree3.png'
import pages401 from '@images/pages/401.png'
import { onMounted } from 'vue'

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)
const router = useRouter()

onMounted(() => {
  setTimeout(() => {
    router.replace('/logout')
  }, 5000)
})

definePage({
  alias: '/pages/misc/not-authorized',
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div
    class="misc-wrapper"
    style="zoom: 80%"
  >
    <ErrorHeader
      title="You are not authorized! 🔐"
      description="You don't have permission to access this page. Go Home!"
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
        to="/logout"
        class="mt-10"
        style="z-index: 1;"
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
