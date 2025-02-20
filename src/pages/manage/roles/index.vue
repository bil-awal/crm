<!-- Manage / Roles / Index.vue -->
<script setup>
import DrawerRole from '@/views/apps/user/list/DrawerRole.vue'
import DrawerRoleEdit from '@/views/apps/user/list/DrawerRoleEdit.vue'
import debounce from 'lodash/debounce'
import { computed, ref, watch } from 'vue'
import { $crmApi } from '@/api/crmApi'

// Define page meta
definePage({
  meta: {
    subject: 'ManageRole',
  },
})

// State management
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')
const searchQueryName = ref('')
const searchQueryModule = ref('')
const searchQueryPermissions = ref('')
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref(null)
const orderBy = ref(null)

const isAddRoleDrawerVisible = ref(false)
const isEditRoleDrawerVisible = ref(false)
const selectedRole = ref(null)

const rolesData = ref({
  roles: [],
  totalRoles: 0,
})

// Headers
const headers = [
  { title: 'Action', key: 'actions', sortable: false },
  { title: 'Role', key: 'role' },
  { title: 'Module', key: 'module' },
  { title: 'Submodule', key: 'submodule' },
  { title: 'Permissions', key: 'permissions' },
  { title: 'Created At', key: 'createdAt' },
  { title: 'Updated At', key: 'updatedAt' },
]

const fetchRoles = async () => {
  try {
    const params = {
      page: page.value,
      size: itemsPerPage.value,
    }

    const searchParams = []
    if (searchQueryName.value) {
      searchParams.push(`name,${searchQueryName.value},contains`)
    }
    if (searchQueryModule.value) {
      searchParams.push(`module,${searchQueryModule.value},contains`)
    }
    if (searchQueryPermissions.value) {
      searchParams.push(`permissions,${searchQueryPermissions.value},contains`)
    }

    if (searchParams.length) {
      params.search = searchParams.join(',')
    }

    if (sortBy.value) {
      params.sortBy = sortBy.value
    }
    if (orderBy.value) {
      params.orderBy = orderBy.value
    }

    const response = await $crmApi('/roles', {
      method: 'GET',
      params,
    })

    if (response.resultCode === 1) {
      rolesData.value = {
        roles: response.data,
        totalRoles: response.page.totalData,
      }
    } else {
      showSnackbar(response.message || 'Failed to fetch roles')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to fetch roles')
  }
}

const addNewRole = async roleData => {
  try {
    const response = await $crmApi('/roles', {
      method: 'POST',
      body: roleData,
    })

    if (response.resultCode === 1) {
      showSnackbar('Role added successfully')
      fetchRoles() // Optionally refresh the roles list
    } else {
      showSnackbar(response.message || 'Failed to add role')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to add role')
  }
}

const updateRole = async roleData => {
  try {
    const response = await $crmApi(`/roles/${roleData.id}`, {
      method: 'PATCH',
      body: roleData,
    })

    if (response.resultCode === 1) {
      showSnackbar('Role updated successfully')
      fetchRoles() // Refresh the roles list
    } else {
      showSnackbar(response.message || 'Failed to update role')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to update role')
  }
}

const deleteRole = async roleId => {
  try {
    const response = await $crmApi(`/roles/${roleId}`, {
      method: 'DELETE',
    })

    if (response.resultCode === 1) {
      showSnackbar('Role deleted successfully')
      fetchRoles() // Refresh the roles list
    } else {
      showSnackbar(response.message || 'Failed to delete role')
    }
  } catch (error) {
    showSnackbar(error.message || 'Failed to delete role')
  }
}

// Debounced version of fetchRoles using lodash debounce
const debouncedFetchRoles = debounce(fetchRoles, 500)

watch([searchQueryName, searchQueryModule, searchQueryPermissions], () => {
  debouncedFetchRoles()
}, { immediate: true })

const roles = computed(() => rolesData.value.roles)
const totalRoles = computed(() => rolesData.value.totalRoles)

const showSnackbar = message => {
  isSnackbarVisible.value = true
  snackbarMessage.value = message
}

// Define openEditRoleDrawer function
const openEditRoleDrawer = role => {
  selectedRole.value = role
  isEditRoleDrawerVisible.value = true
}

// Handle table pagination, sorting, and filtering options
const updateOptions = options => {
  if (options.page !== page.value || options.sortBy[0]?.key !== sortBy.value || options.sortBy[0]?.order !== orderBy.value) {
    page.value = options.page
    sortBy.value = options.sortBy[0]?.key
    orderBy.value = options.sortBy[0]?.order
    fetchRoles()
  }
}
</script>


<template>
  <section>
    <VCard title="Manage Roles">
      <VCardText class="d-flex flex-wrap gap-1">
        <VSpacer />
        <div class="app-role-search-filter d-flex align-center">
          <!-- Search for Name -->
          <VTextField
            v-model="searchQueryName"
            placeholder="Search Role Name"
            density="compact"
            class="me-2"
            style="zoom: 90%"
          />
          <!--
            Search for Module 
            <VTextField
            v-model="searchQueryModule"
            placeholder="Search Module"
            density="compact"
            class="me-2"
            style="zoom: 90%"
            /> 
          -->
          <!--
            Search for Permissions 
            <VTextField
            v-model="searchQueryPermissions"
            placeholder="Search Permissions"
            density="compact"
            class="me-2"
            style="zoom: 90%"
            /> 
          -->
          <!-- Add Role Button -->
          <IconBtn @click="isAddRoleDrawerVisible = true">
            <VIcon icon="ri-add-fill" />
            <VTooltip
              activator="parent"
              location="top"
            >
              Add New Role
            </VTooltip>
          </IconBtn>
        </div>
      </VCardText>

      <!-- Table -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="roles"
        item-value="id"
        :items-length="totalRoles"
        :headers="headers"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        class="text-no-wrap rounded-0 text-body-2"
        @update:options="updateOptions"
      >
        <template #item.role="{ item }">
          <div>{{ item.name }}</div>
        </template>

        <template #item.module="{ item }">
          <div
            v-for="module in item.modules"
            :key="module.id"
          >
            {{ module.name }}
          </div>
        </template>

        <template #item.submodule="{ item }">
          <div
            v-for="module in item.modules"
            :key="module.id"
          >
            <div
              v-for="submodule in module.submodules"
              :key="submodule.id"
            >
              {{ `${module.name} / ${submodule.name}` }}
            </div>
          </div>
        </template>

        <template #item.permissions="{ item }">
          <div
            v-for="module in item.modules"
            :key="module.id"
          >
            <div
              v-for="submodule in module.submodules"
              :key="submodule.id"
            >
              <div
                v-if="submodule.permissions.length > 0"
                style="margin-inline-start: 40px;"
              >
                <span
                  v-for="permission in submodule.permissions"
                  :key="permission.id"
                >
                  {{ permission.canCreate ? `[CREATE - ${submodule.name}]` : '' }}
                  {{ permission.canRead ? `[READ - ${submodule.name}]` : '' }}
                  {{ permission.canUpdate ? `[UPDATE - ${submodule.name}]` : '' }}
                  {{ permission.canDelete ? `[DELETE - ${submodule.name}]` : '' }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <template #item.createdAt="{ item }">
          <div>{{ new Date(item.createdAt).toLocaleString() }}</div>
        </template>

        <template #item.updatedAt="{ item }">
          <div>{{ new Date(item.updatedAt).toLocaleString() }}</div>
        </template>

        <template #item.actions="{ item }">
          <IconBtn @click="() => openEditRoleDrawer(item)">
            <VIcon icon="ri-edit-line" />
            <VTooltip
              activator="parent"
              location="start"
            >
              Edit Role - {{ item.name }}
            </VTooltip>
          </IconBtn>
          <IconBtn @click="() => deleteRole(item.id)">
            <VIcon
              color="error"
              icon="ri-delete-bin-5-fill"
            />
            <VTooltip
              activator="parent"
              location="start"
            >
              Delete Role - {{ item.name }}
            </VTooltip>
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Add and Edit Drawers -->
    <DrawerRole
      v-model:isDrawerOpen="isAddRoleDrawerVisible"
      :showSnackbar="showSnackbar"
      @role-data="addNewRole"
    />
    <DrawerRoleEdit
      v-model:isDrawerOpen="isEditRoleDrawerVisible"
      :role-data="selectedRole"
      @update-role="updateRole"
      @showSnackbar="showSnackbar"
    />

    <!-- Snackbar -->
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
.app-role-search-filter {
  inline-size: 100%;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>
