<!-- DrawerRole.vue -->
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
            @click="closeDrawer"
          >
            <VIcon
              color="white"
              icon="ri-close-line"
            />
          </VBtn>

          <VToolbarTitle>Add New Role</VToolbarTitle>

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
                <DrawerModules v-model="role.modules" />
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
import DrawerModules from './DrawerModules.vue'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'roleData',
  'showSnackbar',
])

const { isDrawerOpen } = toRefs(props)
const isFormValid = ref(false)
const refForm = ref()

// Single role object
const role = ref({
  name: '',
  modules: [],
})

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    resetForm()
  })
}

const resetForm = () => {
  role.value = {
    name: '',
    modules: [],
  }
  refForm.value?.resetValidation()
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('roleData', role.value)
      closeDrawer()
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

const requiredValidator = value => !!value || 'Required.'
</script>
