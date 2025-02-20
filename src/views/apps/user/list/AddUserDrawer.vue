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

          <VToolbarTitle>Add New User</VToolbarTitle>

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
                  v-model="name"
                  :rules="[requiredValidator]"
                  label="Full Name"
                  placeholder="John Doe"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="name@pancaran-group.co.id"
                />
              </VCol>
            </VRow>
            <VRow
              v-for="(role, index) in userMaps"
              :key="index"
            >
              <VDivider class="border-dashed" />
              <VCol cols="3">
                <AutocompleteCredential 
                  v-model="role.credentialId"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="4">
                <AutocompleteClient v-model="role.clientId" />
              </VCol>
              <VCol cols="4">
                <AutocompleteCompany v-model="role.companyId" />
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
                  prepend-icon="ri-add-fill"
                  block
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
import { nextTick, ref, toRefs } from 'vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
  'showSnackbar',
])

const { isDrawerOpen } = toRefs(props)
const isFormValid = ref(false)
const refForm = ref()

const name = ref('')
const email = ref('')
const avatar = ref('/images/avatars/avatar-1.png')

const userMaps = ref([
  {
    credentialId: '',
    clientId: '',
    companyId: '',
    credentialRole: '',
    isDefault: false,
  },
])

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    name.value = ''
    email.value = ''
    avatar.value = '/images/avatars/avatar-1.png'
    userMaps.value = [{
      credentialId: '',
      clientId: '',
      companyId: '',
      credentialRole: '',
      isDefault: false,
    }]
    refForm.value?.resetValidation()
  })
}

const addRole = () => {
  userMaps.value.push({
    credentialId: '',
    clientId: '',
    companyId: '',
    credentialRole: '',
    isDefault: false,
  })
}

const removeRole = index => {
  userMaps.value.splice(index, 1)
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('userData', {
        name: name.value,
        email: email.value,
        avatar: avatar.value,
        userMaps: userMaps.value,
      })
      closeDrawer()
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

const requiredValidator = value => !!value || 'Required.'

const emailValidator = value => {
  const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  
  return pattern.test(value) || 'Invalid email.'
}

const setDefaultRole = index => {
  userMaps.value.forEach((role, i) => {
    role.isDefault = i === index
  })
}
</script>
