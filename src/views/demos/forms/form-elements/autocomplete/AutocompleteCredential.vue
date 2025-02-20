<script setup>
import { onMounted, ref, watch } from 'vue' // Import the $crmApi instance

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])
const selected = ref(props.modelValue)
const search = ref('')
let debounceTimer = null

const fetchCredentials = async (query = '') => {
  try {
    let url = `${import.meta.env.VITE_API_CRM}/credentials`
    if (query) {
      url += `?search=position,${query},contains`
    }
    
    const res = await $crmApi(url, { method: 'GET' }) // Use $crmApi instead of fetch
    
    const data = await res
    if (data.resultCode === 1) {
      items.value = data.data.map(item => ({ abbr: item.id, name: item.position }))
    } else {
      console.error('Failed to fetch Credentials:', data.message)
    }
  } catch (err) {
    console.error('Error fetching Credentials:', err)
  }
}

const handleSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchCredentials(newQuery)
  }, 300) // Adjust the delay as needed
}

watch(search, newQuery => {
  handleSearch(newQuery)
})

watch(selected, newValue => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  fetchCredentials()
})
</script>

<template>
  <VAutocomplete
    v-model="selected"
    v-model:search="search"
    label="Role"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Select Assigned Role"
  />
</template>
