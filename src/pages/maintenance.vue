<script setup>
import miscMaskDark from '@images/misc/misc-mask-dark.png'
import miscMaskLight from '@images/misc/misc-mask-light.png'
import tree1 from '@images/misc/tree1.png'
import tree3 from '@images/misc/tree3.png'
import pages401 from '@images/pages/401.png'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)
const targetDate = new Date(import.meta.env.VITE_MAINTENANCE_END).getTime()
const countdown = ref('')
const router = useRouter()

const updateCountdown = () => {
  const now = new Date().getTime()
  const distance = targetDate - now

  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    countdown.value = `${Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)))}d ` +
      `${Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))}h ` +
      `${Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))}m ` +
      `${Math.max(0, Math.floor((distance % (1000 * 60)) / 1000))}s`
  } else {
    countdown.value = 'The server is back online!'
    router.push('/')
  }
}

onMounted(() => {
  updateCountdown()
  setInterval(updateCountdown, 1000)
})

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="503"
      title="Server Under Maintenance"
      :description="`Comeback in ${countdown}`"
      class="mb-10"
    />

    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="pages401"
        alt="Coming Soon"
        :max-width="785"
        :height="500"
        class="mx-auto"
      />
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
