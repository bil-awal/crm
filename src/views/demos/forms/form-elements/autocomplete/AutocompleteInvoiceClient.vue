<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const userData = useCookie('userData').value

// Add a check to ensure userData and userData.maps exist and are arrays
const userAccess = Array.isArray(userData?.maps) ? userData.maps : []

const userClients = userAccess
  .filter(item => item?.credential?.role === 'admin')
  .map(item => item.company.name)

const filterQuery = ref('')
const queryParts = []

for (let i = 0; i < userClients.length; i++) {
  queryParts.push(`name,${userClients[i]},contains`)
}

filterQuery.value = queryParts.join(',')

const items = ref([])
const selected = ref(props.modelValue)
const search = ref('')
let debounceTimer = null

const fetchClients = async (query = '') => {
  try {
    const queryParams = {
      filter: filterQuery.value,
      search: `name,${query},contains`,
    }

    const res = await $crmApi(`${import.meta.env.VITE_API_CRM}/clients`, {
      method: 'GET',
      params: queryParams,
    })

    const data = await res
    if (data.resultCode === 1) {
      items.value = data.data.map(item => ({ abbr: item.id, name: item.name }))
    } else {
      console.error('Failed to fetch Clients:', data.message)
    }
  } catch (err) {
    console.error('Error fetching Clients:', err)
  }
}

const handleSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchClients(newQuery)
  }, 300) // Adjust the delay as needed
}

watch(search, newQuery => {
  handleSearch(newQuery)
})

watch(selected, newValue => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  fetchClients()
})
</script>

<template>
  <VAutocomplete
    v-model="selected"
    v-model:search="search"
    label="Client"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Select Client"
  />
</template>
