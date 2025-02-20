<!-- Manage / Users / Index.vue -->
 
<script setup>
import { $crmApi } from '@/api/crmApi'
import AddNewUserDrawer from '@/views/apps/user/list/AddUserDrawer.vue'
import EditUserDrawer from '@/views/apps/user/list/EditUserDrawer.vue'
import debounce from 'lodash/debounce'
import { computed, ref, watch, onMounted } from 'vue'

definePage({
  meta: {
    subject: `USER_MANAGEMENT_LIST`,
  },
})

const state = ref({
  isLoading: false,
  isSnackbarVisible: false,
  snackbarMessage: '',
  searchQuery: '',
  itemsPerPage: 10,
  page: 1,
  sortBy: [],
  tableData: {
    numberOfItems: 0,
    page: 0,
    totalPages: 0,
    totalItems: 0,
    items: [],
    hasNext: false,
    hasPrev: false,
  },
})

const isEditUserDrawerVisible = ref(false)
const isAddNewUserDrawerVisible = ref(false)
const selectedUser = ref(null)

// Updated headers to match API response
const headers = [
  { 
    title: 'User Info',
    key: 'userInfo',
    sortable: true,
    align: 'start',
  },
  {
    title: 'Roles',
    key: 'roles',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Status',
    key: 'status',
    sortable: true,
    align: 'center',
  },
  {
    title: 'Last Login',
    key: 'lastLogin',
    sortable: true,
    align: 'start',
  },
  {
    title: 'Created',
    key: 'created',
    sortable: true,
    align: 'start',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const resolveStatusVariant = status => {
  return status === 'ACTIVE'
    ? { color: 'success', text: 'Active' }
    : { color: 'error', text: 'Inactive' }
}

const resolveLoginStatus = loggedIn => {
  return loggedIn
    ? { color: 'success', text: 'Online' }
    : { color: 'secondary', text: 'Offline' }
}

// Transform API data for display
const transformedItems = computed(() => {
  return state.value.tableData.items.map(item => ({
    id: item.id,
    userInfo: {
      username: item.username,
      name: item.name,
      loggedIn: item.loggedIn,
    },
    roles: {
      pdt: item.pdtRole,
      pli: item.pliRole,
      customer: item.customerRole,
      default: item.defaultRole,
    },
    status: item.status,
    lastLogin: item.lastLogin,
    created: item.created,
    customer: item.customer,
  }))
})

const fetchUsers = async () => {
  if (state.value.isLoading) return
  
  try {
    state.value.isLoading = true
    
    const params = {
      page: state.value.page - 1, // Convert to 0-based for API
      size: state.value.itemsPerPage,
      search: state.value.searchQuery,
      sort: state.value.sortBy.map(sort => `${sort.key},${sort.order}`).join(','),
    }

    const response = await $crmApi('/admin/user', {
      method: 'GET',
      params,
    })

    state.value = {
      ...state.value,
      tableData: response,
      isLoading: false,
    }
  } catch (error) {
    state.value.isLoading = false
    showSnackbar(error.message || 'Failed to fetch users')
  }
}

const debouncedFetchUsers = debounce(() => {
  if (!state.value.isLoading) {
    fetchUsers()
  }
}, 500)

watch(() => state.value.searchQuery, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    state.value.page = 1
    debouncedFetchUsers()
  }
}, { flush: 'post' })

const totalItems = computed(() => state.value.tableData.totalItems)

const showSnackbar = message => {
  state.value.snackbarMessage = message
  state.value.isSnackbarVisible = true
  
  setTimeout(() => {
    state.value.isSnackbarVisible = false
  }, 3000)
}

const formatDateTime = dateString => {
  if (!dateString) return '-'
  
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// User management functions remain the same
const addNewUser = async userData => {
  try {
    await $crmApi('/admin/user', {
      method: 'POST',
      body: userData,
    })

    showSnackbar('User added successfully')
    isAddNewUserDrawerVisible.value = false
    await fetchUsers()
  } catch (error) {
    showSnackbar(error.message || 'Failed to add user')
  }
}

const updateUser = async userData => {
  try {
    await $crmApi(`/admin/user/${userData.id}`, {
      method: 'POST',
      body: userData,
    })

    showSnackbar('User updated successfully')
    isEditUserDrawerVisible.value = false
    await fetchUsers()
  } catch (error) {
    showSnackbar(error.message || 'Failed to update user')
  }
}

const deleteUser = async userId => {
  try {
    await $crmApi(`/admin/user/${userId}`, {
      method: 'DELETE',
    })

    showSnackbar('User deleted successfully')
    await fetchUsers()
  } catch (error) {
    showSnackbar(error.message || 'Failed to delete user')
  }
}

const updateOptions = debounce(options => {
  if (state.value.isLoading) return
  
  state.value = {
    ...state.value,
    page: options.page,
    itemsPerPage: options.itemsPerPage,
    sortBy: options.sortBy,
  }
  
  fetchUsers()
}, 300)

onMounted(async () => {
  try {
    await fetchUsers()
  } catch (error) {
    showSnackbar('Failed to load initial data')
  }
})
</script>

<template>
  <section>
    <VCard title="Manage Users">
      <VOverlay
        v-model="state.isLoading"
        class="align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="64"
        />
      </VOverlay>

      <VCardText class="d-flex flex-wrap gap-4">
        <div class="app-user-search-filter d-flex align-center flex-grow-1">
          <VTextField
            v-model="state.searchQuery"
            placeholder="Search by name or username"
            density="compact"
            prepend-inner-icon="ri-search-line"
            single-line
            hide-details
            class="flex-grow-1"
          />
          <RouterLink
            v-slot="{ navigate }"
            :to="{ name: 'manage-users-store-create' }"
            custom
          >
            <IconBtn
              :disabled="state.isLoading"
              @click="navigate"
            >
              <VIcon icon="ri-folder-user-fill" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Add New User External
              </VTooltip>
            </IconBtn>
          </RouterLink>
          <RouterLink
            v-slot="{ navigate }"
            :to="{ name: 'manage-users-create' }"
            custom
          >
            <IconBtn
              :disabled="state.isLoading"
              @click="navigate"
            >
              <VIcon icon="ri-user-add-line" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Add New User Deals
              </VTooltip>
            </IconBtn>
          </RouterLink>
        </div>
      </VCardText>

      <VDataTableServer
        v-model:items-per-page="state.itemsPerPage"
        v-model:page="state.page"
        :items="transformedItems"
        :headers="headers"
        :items-length="totalItems"
        :items-per-page-options="[10, 25, 50]"
        :loading="state.isLoading"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <!-- User Info Column -->
        <template #item.userInfo="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="32"
              color="primary"
              variant="tonal"
              class="me-3"
            >
              {{ item.userInfo.name.charAt(0).toUpperCase() }}
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium">{{ item.userInfo.name }}</span>
              <small class="text-disabled">{{ item.userInfo.username }}</small>
            </div>
          </div>
        </template>

        <template #item.roles="{ item }">
          <div class="d-flex flex-column gap-1 mt-3 mb-3">
            <VChip
              v-if="item.roles.pdt"
              size="small"
              color="primary"
              variant="flat"
            >
              PDT
            </VChip>
            <VChip
              v-if="item.roles.pli"
              size="small"
              color="success"
              variant="flat"
            >
              PLI
            </VChip>
            <VChip
              v-if="item.roles.customer"
              size="small"
              color="warning"
              variant="flat"
            >
              Customer
            </VChip>
          </div>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusVariant(item.status).color"
            size="small"
          >
            {{ resolveStatusVariant(item.status).text }}
          </VChip>
          <VChip
            :color="resolveLoginStatus(item.userInfo.loggedIn).color"
            size="small"
            class="ms-1"
          >
            {{ resolveLoginStatus(item.userInfo.loggedIn).text }}
          </VChip>
        </template>

        <!-- Date Columns -->
        <template #item.lastLogin="{ item }">
          {{ formatDateTime(item.lastLogin) }}
        </template>

        <template #item.created="{ item }">
          {{ formatDateTime(item.created) }}
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <RouterLink
              v-slot="{ navigate }"
              :to="{ name: 'UserEdit', params: { id: item.id } }"
              custom
            >
              <IconBtn
                :disabled="state.isLoading"
                @click="navigate"
              >
                <VIcon icon="ri-edit-line" />
                <VTooltip
                  activator="parent"
                  location="top"
                >
                  Edit User
                </VTooltip>
              </IconBtn>
            </RouterLink>

            <IconBtn
              :disabled="state.isLoading"
              color="error"
              @click="deleteUser(item.id)"
            >
              <VIcon icon="ri-delete-bin-line" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Delete User
              </VTooltip>
            </IconBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <AddNewUserDrawer
      v-model:isDrawerOpen="isAddNewUserDrawerVisible"
      :disabled="state.isLoading"
      @user-added="addNewUser"
    />

    <EditUserDrawer
      v-model:isDrawerOpen="isEditUserDrawerVisible"
      :user-data="selectedUser"
      :disabled="state.isLoading"
      @user-updated="updateUser"
    />

    <VSnackbar
      v-model="state.isSnackbarVisible"
      location="top"
    >
      {{ state.snackbarMessage }}
      <template #actions>
        <VBtn
          color="error"
          variant="text"
          @click="state.isSnackbarVisible = false"
        >
          Close
        </VBtn>
      </template>
    </VSnackbar>
  </section>
</template>

<style lang="scss" scoped>
.app-user-search-filter {
  gap: 1rem;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>
