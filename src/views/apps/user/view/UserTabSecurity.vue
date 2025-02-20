<script setup>
import chrome from '@images/logos/chrome.png'

const smsVerificationNumber = ref('')
const isTwoFactorDialogOpen = ref(false)
const isapiResponseInfoVisible = ref(false)
const apiResponseInfo = ref('')
const paramId = useRoute().params.id
const xUserId = useCookie('userData').value.email

const recentDeviceHeader = [
  {
    title: 'BROWSER',
    key: 'browser',
  },
  {
    title: 'DEVICE',
    key: 'device',
  },
  {
    title: 'LOCATION',
    key: 'location',
  },
  {
    title: 'RECENT ACTIVITY',
    key: 'activity',
  },
]

const recentDevices = [
  {
    browser: 'Chrome on Windows',
    logo: chrome,
    device: 'Dell XPS 15',
    location: 'Jakarta, Indonesia',
    activity: '10 May 2024 20:07',
  },
  {
    browser: 'Chrome on Android',
    logo: chrome,
    device: 'Google Pixel 3a',
    location: 'Jakarta, Indonesia',
    activity: '11 May 2024 10:16',
  },
  {
    browser: 'Chrome on macOS',
    logo: chrome,
    device: 'Apple iMac',
    location: 'Karawang, Indonesia',
    activity: '11 May 2024 12:10',
  },
  {
    browser: 'Chrome on iPhone',
    logo: chrome,
    device: 'Apple iPhone XR',
    location: 'Bekasi, Indonesia',
    activity: '12 May 2024 8:29',
  },
]

const onSubmit = async() => {
  try {
    const response = await $crmApi('/auth/revoke-password', {
      method: 'DELETE',
      body: JSON.stringify({
        id: paramId,
      }),
    })

    apiResponseInfo.value = response.message
    isapiResponseInfoVisible.value = true

  } catch (error) {
    apiResponseInfo.value = error
    isapiResponseInfoVisible.value = true
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Change password -->
      <VCard title="Change Password">
        <VCardText>
          <VAlert
            variant="tonal"
            color="warning"
            closable
            class="mb-6"
          >
            <VAlertTitle>Ensure that these requirements are met</VAlertTitle>
            <span>Minimum 8 characters long, uppercase & symbol</span>
          </VAlert>

          <VForm @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VBtn
                  color="error"
                  type="submit"
                  block
                >
                  Revoke Password
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Recent devices -->
      <VCard title="Recent devices">
        <VDataTable
          :items="recentDevices"
          :headers="recentDeviceHeader"
          hide-default-footer
          class="text-no-wrap rounded-0"
        >
          <template #item.browser="{ item }">
            <div class="d-flex align-center">
              <VAvatar
                :image="item.logo"
                :size="22"
                class="me-3"
              />
              <h6 class="text-h6 font-weight-medium">
                {{ item.browser }}
              </h6>
            </div>
          </template>
          <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Enable One Time Password Dialog -->
  <TwoFactorAuthDialog
    v-model:isDialogVisible="isTwoFactorDialogOpen"
    :sms-code="smsVerificationNumber"
  />

  <VSnackbar
    v-model="isapiResponseInfoVisible"
    location="center"
  >
    {{ apiResponseInfo }}
  </VSnackbar>
</template>
