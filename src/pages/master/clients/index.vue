<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'

// Define page meta
definePage({
  meta: {
    subject: 'MasterClient',
  },
})

// State management
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')
const searchClientQuery = ref('')
const searchCompanyQuery = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref(null)
const orderBy = ref(null)
let debounceTimer = null

// Headers
const headers = [
  { title: '', key: 'options', sortable: false },
  { title: 'Client', key: 'name' },
  { title: 'Created', key: 'created' },
  { title: 'Updated', key: 'updated' },
]

// Data handling
const clientData = ref({ clients: [], totalData: 0 })

const fetchApi = async () => {
  const queryParams = {
    size: itemsPerPage.value,
    page: page.value,
    search: searchClientQuery.value ? `name,${searchClientQuery.value},contains` : '',
  }

  try {
    const response = await $crmApi('/clients', {
      params: queryParams,
      method: 'GET',
    })

    const clients = await Promise.all(response.data.map(async item => ({
      id: item.id,
      name: item.name,
      customer: await getCustomer(item.id),
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })))

    clientData.value = {
      clients: clients,
      totalData: response.page.totalData,
    }
  } catch (error) {
    showSnackbar(error.message)
  }
}

const getCustomer = async clientId => {
  const queryParams = {
    size: 5,
    search: `client.id,${clientId},equals${searchCompanyQuery.value ? `,company.name,${searchCompanyQuery.value},contains` : ''}`,
  }

  try {
    const response = await $crmApi('/client-companies', {
      params: queryParams,
      method: 'GET',
    })

    const companies = response.data.map(item => item.company.name)
    const totalCompanies = response.page.totalData
    let moreInfo = ''
    
    if (totalCompanies > 5) {
      const additionalCount = totalCompanies - 5

      moreInfo = ` +${additionalCount} more`
      companies.push('...')
    }

    return {
      companies: companies.join(', '),
      moreInfo: moreInfo,
    }

  } catch (error) { 
    showSnackbar(error.message)
    
    return ''
  }
}

const handleClientSearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchApi()
  }, 300)
}

watch(searchClientQuery, newQuery => {
  handleClientSearch(newQuery)
})

const handleCompanySearch = newQuery => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchApi()
  }, 300)
}

watch(searchCompanyQuery, newQuery => {
  handleCompanySearch(newQuery)
})

const clients = computed(() => clientData.value.clients)
const totalData = computed(() => clientData.value.totalData)

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
  fetchApi()
}

watchEffect(fetchApi)

onMounted(() => {
  fetchApi()
})
</script>


<template>
  <section>
    <VCard title="Master Clients">
      <VCardText class="d-flex justify-contend-end">
        <VTextField
          v-model="searchClientQuery"
          label="Client"
          placeholder="Search Client"
          variant="plain"
          class="me-4"
        />
      </VCardText>
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        item-value="id"
        :items="clients"
        :headers="headers"
        :items-length="totalData"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        class="rounded-0"
        @update:options="updateOptions"
      >
        <template #item.name="{ item }">
          <span class="text-high-emphasis">{{ item.name }}</span>
        </template>
        <template #item.customer="{ item }">
          <span>{{ item.customer.companies }}</span>
          <span
            v-if="item.customer.moreInfo"
            class="text-muted"
          >{{ item.customer.moreInfo }}</span>
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
