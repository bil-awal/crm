<script setup>
import { eventBus } from '@/utils/eventBus'

const props = defineProps({
  userData: {
    type: Object,
    required: false,
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'submit',
  'update:isDialogVisible',
])

const sendUserUpdateInfo = condition => {
  eventBus.value.emit('userUpdateInfo', condition)
}

const userData = ref(structuredClone(toRaw(props.userData)))

watch(props, () => {
  userData.value = structuredClone(toRaw(props.userData))
})

const onFormSubmit = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_CRM}/users/${userData.value.id}`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': 'web',
        'Content-Type': 'application/json',
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        name: userData.value.name,
        email: userData.value.email,
        avatar: userData.value.avatar,  // Assuming avatar is part of userData
      }),
    })

    const responseMap = await fetch(`${import.meta.env.VITE_API_CRM}/user-maps/${userData.value.userMaps[0].id}`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': 'web',
        'Content-Type': 'application/json',
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        userId: userData.value.id,
        companyId: userData.value.userMaps[0].company.id,
        credentialId: userData.value.userMaps[0].credential.id,
      }),
    })
    
    if (!response.ok || !responseMap.ok) {
      sendUserUpdateInfo(false)
      throw new Error('Network response was not ok ' + response.statusText)
    }

    emit('update:isDialogVisible', false)
    sendUserUpdateInfo(true)

  } catch (error) {
    sendUserUpdateInfo(false)
    console.error('Error updating user data:', error)
  }
}

const onFormReset = () => {
  userData.value = structuredClone(toRaw(props.userData))
  emit('update:isDialogVisible', false)
}

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900 "
    :model-value="props.isDialogVisible"
    @update:model-value="dialogVisibleUpdate"
  >
    <VCard class="pa-sm-11 pa-3">
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="onFormReset"
      />

      <VCardText class="pt-5">
        <div class="text-center pb-6">
          <h4 class="text-h4 mb-2">
            Edit User Information
          </h4>
          <div class="text-body-1">
            Updating user details will receive a privacy audit.
          </div>
        </div>

        <!-- 👉 Form -->
        <VForm
          class="mt-4"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="userData.name"
                label="Full Name"
                placeholder="John Doe"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="userData.email"
                label="Email"
                placeholder="john@pancaran-group.co.id"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <AutocompleteCompany v-model="userData.userMaps[0].company.id" />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <AutocompleteCredential v-model="userData.userMaps[0].credential.id" />
            </VCol>

            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
            >
              <VBtn type="submit">
                Submit
              </VBtn>

              <VBtn
                color="secondary"
                variant="outlined"
                @click="onFormReset"
              >
                Cancel
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
