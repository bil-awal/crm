<!-- DrawerModulesEdit.vue -->
<script setup>
import { ref, watch } from 'vue'
import DrawerSubmodulesEdit from './DrawerSubmodulesEdit.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],  // Default to an empty array if modelValue is undefined
  },
})

const emit = defineEmits(['update:modelValue'])

const availableModules = [
  {
    name: 'Dashboard',
    submodules: [
      'Invoice',
      'Ecommerce',
      'Analytic',
    ],
  },
  {
    name: 'Invoice',
    submodules: [
      'Admin - Need Confirmation',
      'Admin - Outstanding Payment',
      'Admin - Paid Off',
      'Admin - Preview',
      'Customer - Need Confirmation',
      'Customer - Outstanding Payment',
      'Customer - Paid Off',
      'Customer - Preview',
    ],
  },
  {
    name: 'Manage',
    submodules: ['User', 'Role'],
  },
  {
    name: 'Master',
    submodules: [
      'Client',
      'Company',
    ],
  },
]

const modules = ref([...props.modelValue])

const addModule = () => {
  modules.value.push({
    name: '',
    submodules: [],
  })
}

// API and local deletion for modules
const deleteModule = async (moduleId, index) => {
  if (moduleId) {
    try {
      await $crmApi(`/modules/${moduleId}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete module via API:', error)
    }
  }
  modules.value.splice(index, 1) // Remove locally
}

watch(modules, newModules => {
  emit('update:modelValue', newModules)
}, { deep: true })

const requiredValidator = value => !!value || 'Required.'
</script>

<template>
  <div>
    <VRow
      v-for="(module, moduleIndex) in modules"
      :key="moduleIndex"
    >
      <VCol cols="6">
        <VAutocomplete
          v-model="module.name"
          :items="availableModules.map(mod => mod.name)"
          label="Module Name"
          placeholder="Select Module"
          :rules="[requiredValidator]"
          append-inner-icon="ri-close-line"
          @update:model-value="value => {
            const selectedModule = availableModules.find(mod => mod.name === value);
            module.submodules = selectedModule 
              ? selectedModule.submodules.map(sub => ({
                name: sub,
                permissions: [], // Initialize permissions array
              }))
              : []; // Ensure submodules is an empty array if no submodules are available
          }"
          @click:append-inner="() => deleteModule(module.id, moduleIndex)"
        >
          />
        </vautocomplete>
      </VCol>
      <VCol cols="6">
        <DrawerSubmodulesEdit 
          v-model="module.submodules" 
          :available-submodules="availableModules.find(mod => mod.name === module.name)?.submodules || []"
        />
      </VCol>
      <VDivider class="border-dashed" />
    </VRow>
    <VRow>
      <VCol cols="2">
        <VBtn
          size="small"
          color="primary"
          prepend-icon="ri-add-fill"
          block
          @click="addModule"
        >
          Add Module
        </VBtn>
      </VCol>
    </VRow>
  </div>
</template>
