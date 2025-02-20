<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: Array, // Change to Array to support multiple selections
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])

const fetchCompanies = async (query = '') => {
  try {
    let url = `/roles?size=100`
    if (query) {
      url += `&search=name,${query.split(',')[0]},contains`
    }

    const res = await $crmApi(url, { method: 'GET' }) // Use $crmApi instead of fetch

    if (res.resultCode === 1) {
      items.value = res.data.map(item => ({ abbr: item.id, name: item.name }))
    } else {
      console.error('Failed to fetch Roles:', res.message)
    }
  } catch (err) {
    console.error('Error fetching Roles:', err)
  }
}

const selected = ref(props.modelValue || []) // Initialize as an array
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
    label="Roles"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Select Roles"
    multiple 
  />
</template>
