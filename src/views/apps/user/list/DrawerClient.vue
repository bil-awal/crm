<script setup>
import { onMounted, ref, watch } from 'vue'
import DrawerModules from './DrawerModules.vue'

const props = defineProps({
  modelValue: Array,
})

const emit = defineEmits(['update:modelValue'])

const clients = ref([...props.modelValue])

const clientCompanyData = ref([]) // Will hold data from API
const searchQuery = ref('')

const fetchClientCompanyData = async (query = '') => {
  try {
    const response = await $crmApi('/companies?size=100', {
      method: 'GET',
      params: { search: query }, // Pass the search query as a parameter if needed
    })

    clientCompanyData.value = response.data.map(item => ({
      id: item.id,
      name: item.name,
    }))
    fetchItems() // To populate filteredItems initially
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const fetchItems = (query = '') => {
  filteredItems.value = clientCompanyData.value.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  )
}

const addClient = () => {
  clients.value.push({
    selectedId: '',
    selectedType: 'client', // Default to client, can be changed by radio button
    modules: [],
  })
}

const removeClient = index => {
  clients.value.splice(index, 1)
}

watch(searchQuery, newQuery => {
  fetchClientCompanyData(newQuery) // Re-fetch data based on the search query
})

watch(clients, newClients => {
  emit('update:modelValue', newClients)
}, { deep: true })

onMounted(() => {
  fetchClientCompanyData() // Initial fetch without any search query
})
</script>

<template>
  <div>
    <VRow
      v-for="(client, clientIndex) in clients"
      :key="clientIndex"
    >
      <VCol cols="6">
        <VAutocomplete
          v-model="client.selectedId"
          v-model:search="searchQuery"
          label="Select Client/Company"
          :items="filteredItems"
          item-title="name"
          item-value="id"
          placeholder="Select Assigned Client or Company"
          :rules="[requiredValidator]"
        />
      </VCol>

      <VCol
        cols="1"
        class="d-flex justify-content-end align-items-end"
      >
        <IconBtn
          color="error"
          title="Remove"
          @click="() => removeClient(clientIndex)"
        >
          <VIcon icon="ri-close-line" />
        </IconBtn>
      </VCol>

      <VCol cols="12">
        <DrawerModules v-model="client.modules" />
      </VCol>
    </VRow>

    <VRow>
      <VCol cols="2">
        <VBtn
          size="small"
          color="primary"
          prepend-icon="ri-add-fill"
          block
          @click="addClient"
        >
          Add Client/Company
        </VBtn>
      </VCol>
    </VRow>
  </div>
</template>
