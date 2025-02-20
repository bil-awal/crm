<template>
  <div>
    <VDialog
      v-model="isDrawerOpen"
      persistent
      scrollable
      max-width="1200"
      style="zoom: 90%;"
      @update:model-value="handleDrawerModelValueUpdate"
    >
      <VCard>
        <VToolbar
          style="zoom: 90%;"
          color="primary"
        >
          <VBtn
            icon
            variant="plain"
            @click="isDrawerOpen = false"
          >
            <VIcon
              color="white"
              icon="ri-close-line"
              @click="closeDrawer"
            />
          </VBtn>

          <VToolbarTitle>Edit User - {{ localUserData.name }}</VToolbarTitle>

          <VSpacer />

          <VToolbarItems>
            <VBtn
              variant="text"
              @click="onSubmit"
            >
              SAVE
            </VBtn>
          </VToolbarItems>
        </VToolbar>
        <VCardText class="pt-5">
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="6">
                <VTextField
                  v-model="localUserData.name"
                  :rules="[requiredValidator]"
                  label="Full Name"
                  placeholder="John Doe"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="localUserData.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="name@pancaran-group.co.id"
                />
              </VCol>
            </VRow>
            <VRow
              v-for="(role, index) in localUserData.userMaps"
              :key="index"
            >
              <VDivider class="border-dashed" />
              <VCol cols="3">
                <AutocompleteCredential
                  v-model="role.credential.id"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="4">
                <AutocompleteClient v-model="role.client.id" />
              </VCol>
              <VCol cols="4">
                <AutocompleteCompany v-model="role.company.id" />
              </VCol>
              <VCol
                cols="1"
                class="d-flex justify-content-end align-items-end"
              >
                <VSwitch
                  v-model="role.isDefault"
                  title="Default Role"
                  @change="setDefaultRole(index)"
                />
                <IconBtn
                  color="error"
                  title="Remove Role"
                  @click="() => removeRole(index)"
                >
                  <VIcon icon="ri-close-line" />
                </IconBtn>
              </VCol>
            </VRow>
            <VRow>
              <VDivider class="border-dashed" />
              <VCol
                cols="1"
                offset="11"
              >
                <VBtn
                  size="small"
                  color="success"
                  prepend-icon="ri-add-line"
                  @click="addRole"
                >
                  Role
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { nextTick, ref, toRefs, watch } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  userData: {
    type: Object,
    default: () => ({
      name: '',
      email: '',
      avatar: '/images/avatars/avatar-1.png',
      userMaps: [
        {
          credential: { id: null },
          client: { id: null },
          company: { id: null },
          credentialRole: '',
          isDefault: false,
        },
      ],
    }),
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'userDataUpdated', 'showSnackbar'])

const { isDrawerOpen, userData } = toRefs(props)
const localUserData = ref({})
const isFormValid = ref(false)
const refForm = ref()

const initializeLocalUserData = data => {
  localUserData.value = JSON.parse(JSON.stringify(data))
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    initializeLocalUserData({
      name: '',
      email: '',
      avatar: '/images/avatars/avatar-1.png',
      userMaps: [
        {
          credential: { id: '' },
          client: { id: null },
          company: { id: null },
          credentialRole: '',
          isDefault: false,
        },
      ],
    })
    refForm.value?.resetValidation()
  })
}

const addRole = () => {
  localUserData.value.userMaps.push({
    credential: { id: null },
    client: { id: null },
    company: { id: null },
    credentialRole: '',
    isDefault: false,
  })
}

const removeRole = async index => {
  try {
    const roleToRemove = localUserData.value.userMaps[index]

    if (roleToRemove.id) {
      // Make an API call only if the role has an ID (exists in the backend)
      await $crmApi(`/user-maps/${roleToRemove.id}`, {
        method: 'DELETE',
      })
    }

    // Remove the role from the localUserData regardless of whether it exists in the backend
    localUserData.value.userMaps.splice(index, 1)

    emit('userDataUpdated', localUserData.value)
  } catch (error) {
    emit('showSnackbar', error.message || 'Failed to delete role')
  }
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      const isValidUserMaps = localUserData.value.userMaps.every(map => map.credential.id)
      if (!isValidUserMaps) {
        emit('showSnackbar', 'All roles must have a valid credential ID')
        
        return
      }
      emit('userDataUpdated', localUserData.value)
      closeDrawer()
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  if (!val) {
    closeDrawer()
  } else {
    initializeLocalUserData(userData.value)
    emit('update:isDrawerOpen', val)
  }
}

const requiredValidator = value => !!value || 'Required.'

const emailValidator = value => {
  const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  
  return pattern.test(value) || 'Invalid email.'
}

const setDefaultRole = index => {
  localUserData.value.userMaps.forEach((role, i) => {
    role.isDefault = i === index
  })
}

watch(userData, newUserData => {
  if (newUserData) {
    initializeLocalUserData(newUserData)
  }
}, { immediate: true })

watch(isDrawerOpen, newVal => {
  if (newVal) {
    initializeLocalUserData(userData.value)
  }
}, { immediate: true })
</script>
