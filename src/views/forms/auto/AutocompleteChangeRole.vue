<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])
const items = ref([])
const selected = ref(props.modelValue)
const search = ref('')
let debounceTimer = null

const fetchClients = async (query = '') => {
  try {

    const res = await $crmApi(`${import.meta.env.VITE_API_CRM}/clients`, {
      method: 'GET',
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
    label="Change Role"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Select Role"
  />
</template>
