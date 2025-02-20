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
    :loading="isLoading"
    chips
    closable-chips
  >
    <!-- Custom chip display -->
    <template #chip="{ props, item }">
      <VChip
        v-bind="props"
        :text="getRoleName(item.value)"
      />
    </template>

    <!-- Custom item display with checkbox -->
    <template #item="{ props, item }">
      <VListItem
        v-bind="props"
        :title="item?.raw?.name"
      >
        <template #prepend>
          <VCheckbox
            :model-value="isSelected(item?.raw?.abbr)"
            density="compact"
            color="primary"
            hide-details
            @click="props.onClick"
          />
        </template>
      </VListItem>
    </template>
  </VAutocomplete>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
    default: () => [],
  },
  userData: {
    type: Object,
    required: true,
    default: () => ({ roles: [] }),
  },
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])
const roleMap = ref({})
const reverseRoleMap = ref({})
const selected = ref([])
const search = ref('')
const isLoading = ref(false)
let debounceTimer = null

// Check if a role is selected
const isSelected = roleId => {
  return selected.value.includes(roleId)
}

// Get role name from ID
const getRoleName = roleId => {
  return roleMap.value[roleId] || roleId
}

// Extract role IDs from userData
const extractRoleIds = userData => {
  if (!userData?.roles) return []
  
  return userData.roles.map(role => role.id || role)
}

// Fetch roles from the API
const fetchRoles = async (query = '') => {
  try {
    isLoading.value = true
    let url = `/roles?size=100`
    if (query) {
      url += `&search=name,${query.split(',')[0]},contains`
    }

    const res = await $crmApi(url, { method: 'GET' })

    if (res.resultCode === 1) {
      const roles = res.data.map(item => ({ abbr: item.id, name: item.name }))

      items.value = roles

      // Create mappings
      roleMap.value = Object.fromEntries(roles.map(role => [role.abbr, role.name]))
      reverseRoleMap.value = Object.fromEntries(roles.map(role => [role.name, role.abbr]))

      // Initialize selected roles after fetching role data
      initializeSelectedRoles()
    }
  } catch (err) {
    console.error('Error fetching Roles:', err)
  } finally {
    isLoading.value = false
  }
}

// Initialize selected roles
const initializeSelectedRoles = () => {
  if (props.userData?.roles) {
    // Handle nested role structure from userData
    const userRoles = props.userData.roles.map(role => role.id || role)

    selected.value = userRoles
  }
}

// Handle role search with debounce
const handleSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchRoles(newQuery)
  }, 300)
}

// Watch for changes in search input
watch(search, newQuery => {
  handleSearch(newQuery)
})

// Watch for changes in selected roles and emit updates
watch(selected, newValue => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Watch for changes in userData to update selected roles
watch(() => props.userData, newUserData => {
  if (newUserData?.roles) {
    const roleIds = extractRoleIds(newUserData)
    if (roleIds.length && items.value.length) {
      selected.value = roleIds
    }
  }
}, { deep: true, immediate: true })

// Watch for changes in modelValue from parent
watch(() => props.modelValue, newValue => {
  if (JSON.stringify(newValue) !== JSON.stringify(selected.value)) {
    selected.value = newValue
  }
}, { deep: true })

// Fetch roles on component mount
onMounted(() => {
  fetchRoles()
})
</script>
