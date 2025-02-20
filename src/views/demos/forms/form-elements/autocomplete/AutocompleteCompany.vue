<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])

const fetchCompanies = async (query = '') => {
  try {
    let url = `/companies?size=100`
    if (query) {
      url += `&search=name,${query.split(',')[0]},contains`
    }

    const res = await $crmApi(url, { method: 'GET' }) // Use $crmApi instead of fetch

    if (res.resultCode === 1) {
      items.value = res.data.map(item => ({ abbr: item.id, name: item.name }))
    } else {
      console.error('Failed to fetch Companies:', res.message)
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
    placeholder="Select Assigned Company"
  />
</template>
