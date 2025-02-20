<!-- EditUserDrawerV2.vue -->
<template>
  <div>
    <VDialog
      v-model="isDrawerOpen"
      persistent
      scrollable
      max-width="1200"
      style="zoom: 90%"
      @update:model-value="handleDrawerModelValueUpdate"
    >
      <VCard>
        <VToolbar
          style="zoom: 90%"
          color="primary"
        >
          <VBtn
            icon
            variant="plain"
            @click="handleClose"
          >
            <VIcon
              color="white"
              icon="ri-close-line"
            />
          </VBtn>
          <VToolbarTitle>Edit User</VToolbarTitle>
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
                  v-model="formData.name"
                  :rules="[requiredValidator]"
                  label="Full Name"
                  placeholder="John Doe"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="formData.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="name@gmail.com"
                />
              </VCol>
              <VCol cols="12">
                <AutocompleteRoleEdit
                  v-model="formData.roles"
                  :user-data="userData"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import AutocompleteRoleEdit from '@/views/demos/forms/form-elements/autocomplete/AutocompleteRoleEdit.vue'
import { debounce } from 'lodash'
import { nextTick, ref, toRefs, watch, onMounted } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'userDataUpdated', 'showSnackbar'])

const { isDrawerOpen, userData } = toRefs(props)
const isFormValid = ref(false)
const refForm = ref()

// Create a reactive form data object
const formData = ref({
  name: '',
  email: '',
  avatar: '/images/avatars/avatar-1.png',
  roles: [],
})

const items = ref([])
const roleMap = ref({})
const rolesFetched = ref(false)

// Initialize form data when component is mounted
onMounted(() => {
  initializeFormData()
})

// Watch for changes in userData and update form
watch(() => props.userData, newUserData => {
  if (newUserData && Object.keys(newUserData).length > 0) {
    initializeFormData()
  }
}, { immediate: true, deep: true })

// Watch for dialog open/close
watch(() => props.isDrawerOpen, newValue => {
  if (newValue) {
    initializeFormData()
  }
})

// Initialize form data from userData
const initializeFormData = () => {
  if (props.userData && Object.keys(props.userData).length > 0) {
    formData.value = {
      name: props.userData.name || '',
      email: props.userData.email || '',
      avatar: props.userData.avatar || '/images/avatars/avatar-1.png',
      roles: props.userData.roles?.map(role => role.name) || [],
    }
  }
}

const fetchRoles = debounce(async (query = '') => {
  try {
    if (rolesFetched.value && !query) return

    let url = `/roles?size=100`
    if (query) {
      url += `&search=name,${query.split(',')[0]},contains`
    }

    const res = await $crmApi(url, { method: 'GET' })

    if (res.resultCode === 1) {
      const roles = res.data.map(item => ({ abbr: item.id, name: item.name }))

      items.value = roles
      roleMap.value = Object.fromEntries(roles.map(role => [role.name, role.abbr]))
      rolesFetched.value = true
    }
  } catch (err) {
    console.error('Error fetching Roles:', err)
  }
}, 300)

const mapRolesToIDs = async roleNames => {
  await fetchRoles()
  
  return roleNames.map(role => roleMap.value[role] || role)
}

const handleClose = () => {
  emit('update:isDrawerOpen', false)
}

const closeDrawer = () => {
  handleClose()
  nextTick(() => {
    refForm.value?.resetValidation()
  })
}

const onSubmit = async () => {
  const { valid } = await refForm.value?.validate()
  
  if (valid) {
    const mappedRoles = await mapRolesToIDs(formData.value.roles)

    const payload = {
      id: userData.value.id,
      name: formData.value.name,
      email: formData.value.email,
      avatar: formData.value.avatar,
      roles: mappedRoles,
    }

    try {
      const response = await $crmApi(`/users/${userData.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (response.resultCode === 1) {
        emit('userDataUpdated', payload)
        emit('showSnackbar', 'User updated successfully')
        closeDrawer()
      } else {
        emit('showSnackbar', response.message || 'Failed to update user')
      }
    } catch (error) {
      emit('showSnackbar', error.message || 'Error occurred while updating user')
    }
  }
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

const requiredValidator = value => !!value || 'Required.'

const emailValidator = value => {
  const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  
  return pattern.test(value) || 'Invalid email.'
}
</script>
