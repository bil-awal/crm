<script setup>
import { computed, ref, watch } from 'vue'

// Define page meta
definePage({
  meta: {
    action: 'manage',
    subject: 'MasterAccess',
  },
})

// State management
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')
const searchQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref(null)
const orderBy = ref(null)
let debounceTimer = null

// Headers
const headers = [
  { title: '', key: 'options', sortable: false },
  { title: 'Page', key: 'subject' },
  { title: 'Action', key: 'action' },
  { title: 'Role', key: 'credential' },
  { title: 'Created', key: 'created' },
  { title: 'Updated', key: 'updated' },
]

// Data handling
const getData = ref({ credentialAbilities: [], totalData: 0 })

const fetchApi = async () => {
  const queryParams = {
    size: itemsPerPage.value,
    page: page.value,
    search: searchQuery.value ? `subject,${searchQuery.value},contains` : '',
  }

  try {
    const response = await $crmApi('/credential-abilities', {
      params: queryParams,
      method: 'GET',
    })

    const credentialAbilities = await Promise.all(response.data.map(async item => ({
      credential: item.credential,
      action: item.action,
      subject: item.subject,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })))

    getData.value = {
      credentialAbilities: credentialAbilities,
      totalData: response.page.totalData,
    }
  } catch (error) {
    showSnackbar(error)
  }
}

const credentialAbilities = computed(() => getData.value.credentialAbilities)
const totalData = computed(() => getData.value.totalData)

const showSnackbar = message => {
  isSnackbarVisible.value = true
  snackbarMessage.value = message
}

const formatDateString = dateString => {
  if(dateString) {
    // Create a Date object from the date string
    const date = new Date(dateString)

    // Function to pad single digit numbers with a leading zero
    const padZero = number => number.toString().padStart(2, '0')

    // Extract date components
    const day = padZero(date.getUTCDate())
    const month = padZero(date.getUTCMonth() + 1) // Months are zero-based
    const year = date.getUTCFullYear()
    const hours = padZero(date.getUTCHours())
    const minutes = padZero(date.getUTCMinutes())

    // Format the date and time
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } else {
    return '-'
  }
}

const updateOptions = options => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const handleSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchApi()
  }, 300)
}

watch(searchQuery, newQuery => {
  handleSearch(newQuery)
})

watchEffect(fetchApi)

onMounted(() => {
  fetchApi()
})
</script>

<template>
  <section>
    <VCard
      title="Master Access"
      subtitle="CAUTION: Programatical & Developer Guide!"
    >
      <VCardText class="d-flex justify-content-end">
        <VTextField
          v-model="searchQuery"
          label="Access Page"
          placeholder="Search Page"
          variant="plain"
          class="me-4"
        />
      </VCardText>
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="credentialAbilities"
        item-value="id"
        :items-length="totalData"
        :headers="headers"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        class="rounded-0"
        @update:options="updateOptions"
      >
        <template #item.name="{ item }">
          <span class="text-high-emphasis">{{ item.name }}</span>
        </template>
        <template #item.credential="{ item }">
          <div class="d-flex flex-column">
            <span class="text-h6 font-weight-medium user-list-name">{{ item.credential.position }}</span>
            <span class="text-sm text-medium-emphasis">{{ item.credential.role }}</span>
          </div>
        </template>
        <template #item.created="{ item }">
          <span class="text-high-emphasis">{{ `${item.createdBy || '-'} ${formatDateString(item.createdAt)}` }}</span>
        </template>
        <template #item.updated="{ item }">
          <span class="text-high-emphasis">{{ `${item.updatedBy || '-'} ${formatDateString(item.updatedAt)}` }}</span>
        </template>
        <template #item.options="{ item }">
          <IconBtn size="small">
            <VIcon
              color="error"
              icon="ri-delete-bin-7-line"
            />
          </IconBtn>
          <IconBtn>
            <VIcon
              color="primary"
              icon="ri-pencil-line"
            />
          </IconBtn>
        </template> 
      </VDataTableServer>
    </VCard>
    <VSnackbar
      v-model="isSnackbarVisible"
      color="primary"
      location="top"
    >
      {{ snackbarMessage }}
      <template #actions>
        <VBtn
          color="error"
          @click="isSnackbarVisible = false"
        >
          Close
        </VBtn>
      </template>
    </VSnackbar>
  </section>
</template>

<style lang="scss">
.app-user-search-filter {
  inline-size: 24.0625rem;
}

.text-capitalize {
  text-transform: capitalize;
}

.user-list-name:not(:hover) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}
</style>
