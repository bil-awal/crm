<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const userData = useCookie('userData').value

// Ensure userData and userData.maps are properly initialized as arrays
const userAccess = Array.isArray(userData?.maps) ? userData.maps : []

const userCompanies = userAccess
  .filter(item => item?.credential?.role === 'billing')
  .map(item => item.company.name.split(',')[0]) // Take only the part before the comma

const filterQuery = ref('')
const queryParts = []

for (let i = 0; i < userCompanies.length; i++) {
  queryParts.push(`name,${userCompanies[i]},contains`)
}

filterQuery.value = queryParts.join(',')

const items = ref([])

const fetchCompanies = async (query = '') => {
  try {
    const queryParams = {
      filter: filterQuery.value,
      search: `name,${query},contains`,
    }

    const res = await $crmApi(`${import.meta.env.VITE_API_CRM}/companies`, {
      method: 'GET',
      params: queryParams,
    })

    const data = await res
    if (data.resultCode === 1) {
      items.value = data.data.map(item => ({ abbr: item.id, name: item.name }))
    } else {
      console.error('Failed to fetch Companies:', data.message)
    }
  } catch (err) {
    console.error('Error fetching Companies:', err)
  }
}

const selected = ref(props.modelValue)
const search = ref('')
let debounceTimer = null

const handleSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchCompanies(newQuery)
  }, 300) // Adjust the delay as needed
}

watch(search, newQuery => {
  handleSearch(newQuery)
})

watch(selected, newValue => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  fetchCompanies()
})
</script>

<template>
  <VAutocomplete
    v-model="selected"
    v-model:search="search"
    label="Company"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Search / Select Invoice Company"
  />
</template>
