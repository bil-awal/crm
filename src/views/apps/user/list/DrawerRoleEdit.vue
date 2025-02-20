<!-- DrawerRoleEdit.vue -->
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
      <VCard v-if="role">
        <VToolbar
          style="zoom: 90%"
          color="primary"
        >
          <VBtn
            icon
            variant="plain"
            @click="closeDrawer"
          >
            <VIcon
              color="white"
              icon="ri-close-line"
            />
          </VBtn>

          <VToolbarTitle>Edit Role - {{ role.name }}</VToolbarTitle>

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
              <VCol cols="12">
                <VTextField
                  v-model="role.name"
                  label="Role Name"
                  :rules="[requiredValidator]"
                  outlined
                />
              </VCol>
              <VCol cols="12">
                <DrawerModulesEdit v-model="role.modules" />
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
import DrawerModulesEdit from './DrawerModulesEdit.vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  roleData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'updateRole',
  'showSnackbar',
])

const { isDrawerOpen, roleData } = toRefs(props)
const isFormValid = ref(false)
const refForm = ref()

const role = ref({ ...roleData.value }) // Initialize with a copy of roleData

// Watch for changes in roleData prop and update local state
watch(roleData, newVal => {
  if (newVal) {
    role.value = { ...newVal }
    initializePermissions(role.value.modules)
  }
}, { immediate: true })

// Initialize permissions if not already set
const initializePermissions = modules => {
  modules.forEach(module => {
    module.submodules.forEach(submodule => {
      if (!submodule.permissions || submodule.permissions.length === 0) {
        submodule.permissions = [
          { 
            name: 'default', 
            canCreate: false, 
            canRead: true, 
            canUpdate: false, 
            canDelete: false,
            canUpload: false,
            canDownload: false,
          },
        ]
      }
    })
  })
}

// Close drawer and reset the form
const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    resetForm()
  })
}

// Reset form to initial state
const resetForm = () => {
  role.value = { ...roleData.value }
  refForm.value?.resetValidation()
}

// Handle form submission
const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('updateRole', role.value)
      closeDrawer()
    }
  })
}

// Emit when drawer model value changes
const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

// Required field validator
const requiredValidator = value => !!value || 'Required.'
</script>
