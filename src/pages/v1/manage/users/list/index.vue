<script setup>
import AddNewUserDrawer from '@/views/apps/user/list/AddUserDrawer.vue'
import EditUserDrawer from '@/views/apps/user/list/EditUserDrawer.vue'
import { computed, ref, watchEffect } from 'vue'

// Define page meta
definePage({
  meta: {
    action: 'manage',
    subject: 'ManageUserList',
  },
})

// State management
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')
const searchQuery = ref('')
const selectedRole = ref(null)
const selectedPlan = ref(null)
const selectedStatus = ref(null)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref(null)
const orderBy = ref(null)

const isEditUserDrawerVisible = ref(false)
const isAddNewUserDrawerVisible = ref(false)
const selectedUser = ref(null)

// Headers
const headers = [
  { title: 'Action', key: 'actions', sortable: false },
  { title: 'User', key: 'user' },
  { title: 'Position', key: 'positions' },
  { title: 'Client', key: 'clients' },
  { title: 'Company', key: 'companies' },
  { title: 'Status', key: 'status' },
]

// Data handling
const usersData = ref({ users: [], totalUsers: 0 })

const fetchUsers = async () => {
  const queryParams = {
    status: selectedStatus.value,
    plan: selectedPlan.value,
    role: selectedRole.value,
    size: itemsPerPage.value,
    page: page.value,
    sortBy: sortBy.value,
    orderBy: orderBy.value,
    search: searchQuery.value ? `name,${searchQuery.value},contains` : '',
  }

  try {
    const response = await $crmApi('/users', {
      params: queryParams,
      method: 'GET',
    })

    if (response.resultCode === 1) {
      usersData.value = {
        users: response.data,
        totalUsers: response.page.totalData,
      }
    } else {
      throw new Error(response.message || 'Failed to fetch users')
    }
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.message === "Invalid or Expired Token")) {
      await $handleInvalidToken()
    } else {
      showSnackbar(error.message || 'Failed to fetch users')
    }
  }
}



watchEffect(fetchUsers)

const users = computed(() => usersData.value.users)
const totalUsers = computed(() => usersData.value.totalUsers)

const showSnackbar = message => {
  isSnackbarVisible.value = true
  snackbarMessage.value = message
}

const resolveUserRoleVariant = role => {
  const roleMapping = {
    billing: { color: 'success', icon: 'ri-user-line' },
    author: { color: 'error', icon: 'ri-computer-line' },
    maintainer: { color: 'info', icon: 'ri-pie-chart-line' },
    editor: { color: 'warning', icon: 'ri-edit-box-line' },
    admin: { color: 'error', icon: 'ri-briefcase-line' },
    super: { color: 'warning', icon: 'ri-vip-crown-line' },
  }

  if (typeof role === 'string' && role) {
    return roleMapping[role.toLowerCase()] || roleMapping.billing
  }

  return roleMapping.billing
}

const resolveVariant = (status, variants) => {
  return variants[status] || { color: 'primary', text: status }
}

const resolveisOnlineVariant = status => resolveVariant(status, {
  true: { color: 'success', text: 'Online' },
  false: { color: 'secondary', text: 'Offline' },
})

const resolveisActiveVariant = status => resolveVariant(status, {
  true: { color: 'success', text: 'Active' },
  false: { color: 'secondary', text: 'In-Active' },
})

const addNewUser = async userData => {
  const isValidUserMaps = userData.userMaps.every(map => map.credentialId)

  if (!isValidUserMaps) {
    showSnackbar('All roles must have a valid credential ID')
    
    return
  }

  try {
    const newUser = await $crmApi('/users', {
      method: 'POST',
      body: userData,
    })

    if (newUser.resultCode === 1) {
      const newMap = await $crmApi('/user-maps/bulk', {
        method: 'POST',
        body: userData.userMaps.map(map => ({
          userId: newUser.data.id,
          clientId: map.clientId,
          companyId: map.companyId,
          credentialId: map.credentialId,
          isDefault: map.isDefault,
        })),
      })

      if (newMap.resultCode === 1) {
        showSnackbar(newUser.message)
        fetchUsers()
      } else {
        showSnackbar(newMap.message || 'Failed to add user maps')
      }
    } else {
      showSnackbar(newUser.message || 'Failed to add new user')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to add new user')
  }
}

const openEditUserDrawer = user => {
  const adjustedUser = JSON.parse(JSON.stringify(user))

  adjustedUser.userMaps.forEach(map => {
    if (map.client === null) {
      map.client = { id: null }
    }
    if (map.company === null) {
      map.company = { id: null }
    }
    if (map.credential === null) {
      map.credential = { id: null }
    }
  })

  selectedUser.value = adjustedUser
  isEditUserDrawerVisible.value = true
}

const updateUser = async userData => {
  const isValidUserMaps = userData.userMaps.every(map => map.credential.id)

  if (!isValidUserMaps) {
    showSnackbar('All roles must have a valid credential ID')
    
    return
  }

  try {
    const updatedUser = await $crmApi(`/users/${userData.id}`, {
      method: 'PATCH',
      body: userData,
    })

    if (updatedUser.resultCode === 1) {
      const updatedMaps = await Promise.all(
        userData.userMaps.map(async (map, index) => {
          const mapId = map.id || userData.userMaps[index].id
          if (!mapId) {
            return $crmApi(`/user-maps`, {
              method: 'POST',
              body: {
                userId: userData.id,
                clientId: map.client.id,
                companyId: map.company.id,
                credentialId: map.credential.id,
                isDefault: map.isDefault,
              },
            })
          }
          
          return $crmApi(`/user-maps/${map.id}`, {
            method: 'PATCH',
            body: {
              userId: userData.id,
              clientId: map.client.id,
              companyId: map.company.id,
              credentialId: map.credential.id,
              isDefault: map.isDefault,
            },
          })
        }),
      )

      const allMapsSuccessful = updatedMaps.every(map => map.resultCode === 1)

      if (allMapsSuccessful) {
        showSnackbar(updatedUser.message)
        fetchUsers()
      } else {
        showSnackbar('Failed to update one or more user maps')
      }
    } else {
      showSnackbar(updatedUser.message || 'Failed to update user')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to update user')
  }
}

const revokePassword = async id => {
  try {
    const response = await $crmApi('/auth/revoke-password', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })

    showSnackbar(response.message || 'Password revoked successfully')
  } catch (error) {
    showSnackbar(error.message || 'Failed to revoke password')
  }
}

const deleteUser = async id => {
  try {
    const dropUser = await $crmApi(`/users/${id}`, {
      method: 'DELETE',
    })

    showSnackbar(dropUser.message || 'User deleted successfully')
    fetchUsers()
  } catch (error) {
    showSnackbar(error.message || 'Failed to delete user')
  }
}

const updateOptions = options => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}
</script>

<template>
  <section>
    <VCard title="Manage Users">
      <VCardText class="d-flex flex-wrap gap-1">
        <VSpacer />
        <div class="app-user-search-filter d-flex align-center">
          <VTextField
            v-model="searchQuery"
            placeholder="Search User"
            density="compact"
            class="me-4"
            style="zoom: 90%"
          />
          <IconBtn @click="isAddNewUserDrawerVisible = true">
            <VIcon icon="ri-user-add-line" />
            <VTooltip
              activator="parent"
              location="top"
            >
              Add New User
            </VTooltip>
          </IconBtn>
        </div>
      </VCardText>
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="users"
        item-value="id"
        :items-length="totalUsers"
        :headers="headers"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        class="text-no-wrap rounded-0 text-body-2"
        @update:options="updateOptions"
      >
        <template #item.user="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="34"
              :variant="!item.avatar ? 'tonal' : undefined"
              :color="!item.avatar ? resolveUserRoleVariant(item.role).color : undefined"
              class="me-3"
            >
              <VImg
                v-if="item.avatar"
                :src="item.avatar"
              />
              <span v-else>{{ item.name.slice(0, 2) }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <div class="text-sm font-weight-medium">
                {{ item.name }}
              </div>
              <span class="text-sm text-medium-emphasis">{{ item.email }}</span>
            </div>
          </div>
        </template>
        <template #item.positions="{ item }">
          <div>
            <div
              v-for="(map, index) in item.userMaps"
              :key="index"
              class="d-flex gap-4"
            >
              {{ map.credential.position || 'UNKNOWN' }}
            </div>
          </div>
        </template>
        <template #item.clients="{ item }">
          <div>
            <div
              v-for="(map, index) in item.userMaps"
              :key="index"
              class="d-flex gap-4"
            >
              {{ map.client ? map.client.name : 'ALL CLIENT' }}
            </div>
          </div>
        </template>
        <template #item.companies="{ item }">
          <div>
            <div
              v-for="(map, index) in item.userMaps"
              :key="index"
              class="d-flex gap-4"
            >
              {{ map.company ? map.company.name : 'ALL COMPANY' }}
            </div>
          </div>
        </template>
        <template #item.status="{ item }">
          <VChip
            :color="resolveisOnlineVariant(item.isOnline).color"
            size="small"
            class="text-capitalize"
          >
            {{ resolveisOnlineVariant(item.isOnline).text }}
          </VChip>
          <VChip
            :color="resolveisActiveVariant(item.isActive).color"
            size="small"
            class="text-capitalize"
          >
            {{ resolveisActiveVariant(item.isActive).text }}
          </VChip>
          <VChip
            v-if="item.isBlocked"
            color="error"
            size="small"
            class="text-capitalize"
          >
            Blocked
          </VChip>
        </template>
        <template #item.actions="{ item }">
          <IconBtn @click="() => openEditUserDrawer(item)">
            <VIcon icon="ri-edit-line" />
            <VTooltip
              activator="parent"
              location="start"
            >
              Edit User - {{ item.name }}
            </VTooltip>
          </IconBtn>
          <IconBtn @click="revokePassword(item.id)">
            <VIcon icon="ri-key-line" />
            <VTooltip
              activator="parent"
              location="start"
            >
              Revoke Password User - {{ item.name }}
            </VTooltip>
          </IconBtn>
          <IconBtn @click="deleteUser(item.id)">
            <VIcon
              color="error"
              icon="ri-delete-bin-5-fill"
            />
            <VTooltip
              activator="parent"
              location="start"
            >
              Delete User - {{ item.name }}
            </VTooltip>
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>
    <AddNewUserDrawer
      v-model:isDrawerOpen="isAddNewUserDrawerVisible"
      :showSnackbar="showSnackbar"
      @user-data="addNewUser"
    />

    <EditUserDrawer
      v-model:isDrawerOpen="isEditUserDrawerVisible"
      :user-data="selectedUser || {}"
      @userDataUpdated="updateUser"
    />

    <VSnackbar
      v-model="isSnackbarVisible"
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
  inline-size: 25rem;
}

.text-capitalize {
  text-transform: capitalize;
}

.user-list-name:not(:hover) {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}
</style>
