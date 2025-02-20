<script setup>
import { $crmApi } from '@/api/crmApi'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])
const clientItems = ref([])

const fetchClients = async() => {
  try {
    const getClients = await $crmApi(`${import.meta.env.VITE_API_CRM}/clients`, {
      method: 'GET',
    })

    if (getClients.resultCode == 1) {
      clientItems.value = getClients.data.map(item => item.url)
      console.log('clientItems', clientItems.value)

      fetchCompanies()
    }

  } catch (error) {
    console.error('Error fetching clients:', error)
  }
}

const fetchCompanies = async (query = '') => {
  try {
    let url = `${import.meta.env.VITE_API_CRM}/companies`
    
    url += `?filter=`
    for (let i = 0; i < clientItems.value.length; i++) {
      url += `url,${clientItems.value[i]},equals`
      if (i < clientItems.value.length - 1) {
        url += `,`
      }
    }

    if (query) {
      url += `&search=name,${query},contains`
    }

    const res = await $crmApi(url, {
      method: 'GET',
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
  fetchClients()
})
</script>

<template>
  <VAutocomplete
    v-model="selected"
    v-model:search="search"
    label="Admin Company"
    :items="items"
    item-title="name"
    item-value="abbr"
    placeholder="Ensure to Check Master Client First"
  />
</template>
