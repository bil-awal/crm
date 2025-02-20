<!-- DrawerModules.vue -->
<script setup>
import { ref, watch } from 'vue'
import DrawerSubmodules from './DrawerSubmodules.vue'

const props = defineProps({
  modelValue: Array,
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

const removeModule = index => {
  modules.value.splice(index, 1)
}

watch(modules, newModules => {
  emit('update:modelValue', newModules)
}, { deep: true })
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
            module.submodules = selectedModule ? selectedModule.submodules.map(sub => ({
              name: sub,
              pdt_client_id: '',
              pdt_company_id: '',
              pli_client_id: '',
              pli_company_id: '',
              permissions: {
                read: false,
                create: false,
                edit: false,
                delete: false,
              },
            })) : [];
          }"
          @click:append-inner="() => removeModule(moduleIndex)"
        />
      </VCol>
      <VCol cols="6">
        <DrawerSubmodules 
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

