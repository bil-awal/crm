<script setup>
import { eventBus } from '@/utils/eventBus'
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import UserTabConnections from '@/views/apps/user/view/UserTabConnections.vue'
import UserTabNotifications from '@/views/apps/user/view/UserTabNotifications.vue'
import UserTabOverview from '@/views/apps/user/view/UserTabOverview.vue'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userTab = ref(0)
const userData = ref(null)

definePage({
  meta: {
    action: 'manage',
    subject: 'ManageUserPreview',
  },
})

const tabs = [
  {
    icon: 'ri-group-line',
    title: 'Overview',
  },
  {
    icon: 'ri-lock-2-line',
    title: 'Security',
  },
  {
    icon: 'ri-notification-4-line',
    title: 'Notifications',
  },
  {
    icon: 'ri-link-m',
    title: 'Connections',
  },
]

const fetchUserData = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_CRM}/users/${route.params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    if (data.resultCode === 1) {
      userData.value = data.data
    } else {
      userData.value = null
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    userData.value = null
  }
}

onMounted(fetchUserData)

onMounted(() => {
  eventBus.value.on('userUpdateInfo', fetchUserData)
})

onBeforeUnmount(() => {
  eventBus.value.off('userUpdateInfo', fetchUserData)
})
</script>

<template>
  <VRow v-if="userData">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <UserBioPanel :user-data="userData" />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            start
            :icon="tab.icon"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <VWindowItem>
          <UserTabOverview />
        </VWindowItem>

        <VWindowItem>
          <UserTabSecurity />
        </VWindowItem>

        <VWindowItem>
          <UserTabNotifications />
        </VWindowItem>

        <VWindowItem>
          <UserTabConnections />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
  <VCard v-else>
    <VCardTitle class="text-center">
      No User Found
    </VCardTitle>
  </VCard>
</template>

<style scoped>
.text-center {
  text-align: center;
}
</style>
