<!-- manage/users/create.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { $crmApi } from '@/api/crmApi'
import { $userStoreApi } from '@/utils/userStoreApi'

definePage({
  meta: {
    subject: 'USER_MANAGEMENT_CREATE',
  },
})


const router = useRouter()

// Constants
const ROLES = {
  CUSTOMER: 'customer',
  PDT: 'internalPdt',
  PLI: 'internalPli',
}

const ROLE_MAPPINGS = {
  [ROLES.CUSTOMER]: 'CUSTOMER',
  [ROLES.PDT]: 'PDT',
  [ROLES.PLI]: 'PLI',
}

const initialRoleState = {
  enabled: false,
  isDefault: false,
}

// Form data
const userData = ref({
  username: '',
  email: '',
  name: '',
  status: 'ACTIVE',
  roles: {
    [ROLES.CUSTOMER]: {
      ...initialRoleState,
      tenant: '',
      customerId: '',
    },
    [ROLES.PDT]: { ...initialRoleState },
    [ROLES.PLI]: { ...initialRoleState },
  },
})

// API States
const apiData = ref({
  statusOptions: [],
  tenants: [],
  customers: {
    PDT: [],
    PLI: [],
  },
  userSuggestions: [],
})

// Search states
const userSearch = ref('')
const searchTimeout = ref(null)
const isSearchingUser = ref(false)
const selectedUser = ref(null)

// Loading states
const isLoading = ref(false)
const isSubmitting = ref(false)

// Pagination states
const pagination = ref({
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
})

// UI states
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000,
})

// Form validation
const formErrors = computed(() => {
  const errors = []

  const validateRequiredFields = () => {
    if (!userData.value.username) errors.push('Username is required')
    if (!userData.value.email) errors.push('Email is required')
    if (!userData.value.name) errors.push('Name is required')
  }

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (userData.value.email && !emailRegex.test(userData.value.email)) {
      errors.push('Invalid email format')
    }
  }

  const validateRoles = () => {
    const roles = userData.value.roles
    const hasEnabledRole = Object.values(roles).some(role => role.enabled)

    if (!hasEnabledRole) {
      errors.push('At least one role must be enabled')
    }

    if (roles[ROLES.CUSTOMER].enabled && 
        (!roles[ROLES.CUSTOMER].tenant || !roles[ROLES.CUSTOMER].customerId)) {
      errors.push('Customer and Tenant must be filled if User Role Customer is checked')
    }

    const hasDefault = Object.values(roles).some(role => role.enabled && role.isDefault)
    if (hasEnabledRole && !hasDefault) {
      errors.push('Default role must be selected')
    }
  }

  // Run validations
  validateRequiredFields()
  validateEmail()
  validateRoles()

  return errors
})

// API Calls
const fetchUsers = async (search = '') => {
  try {
    isSearchingUser.value = true

    const response = await $userStoreApi('/users', {
      params: {
        page: pagination.value.page,
        size: pagination.value.size,
        search,
      },
    })

    apiData.value.userSuggestions = response.items || []
    pagination.value.totalItems = response.totalItems
    pagination.value.totalPages = response.totalPages
  } catch (error) {
    console.error('Error fetching users:', error)
    showSnackbar(error.message || 'Failed to fetch users', 'error')
  } finally {
    isSearchingUser.value = false
  }
}

const fetchInitialData = async () => {
  isLoading.value = true
  try {
    const [statusRes, tenantsRes, pdtCustomers, pliCustomers] = await Promise.all([
      $crmApi('/common/user-status'),
      $crmApi('/common/tenant'),
      $crmApi('/common/customer/PDT'),
      $crmApi('/common/customer/PLI'),
      fetchUsers(),
    ])

    apiData.value.statusOptions = statusRes || []
    apiData.value.tenants = tenantsRes || []
    apiData.value.customers = {
      PDT: pdtCustomers?.items || [],
      PLI: pliCustomers?.items || [],
    }
  } catch (error) {
    console.error('Error fetching initial data:', error)
    showSnackbar(error.message || 'Failed to load initial data', 'error')
  } finally {
    isLoading.value = false
  }
}

// Event Handlers
const handleUserSearch = search => {
  userSearch.value = search

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    fetchUsers(search)
  }, 300)
}

const handleUserSelect = user => {
  if (!user) {
    selectedUser.value = null
    userData.value.username = ''
    userData.value.email = ''
    userData.value.name = ''
    
    return
  }
  
  selectedUser.value = user
  userData.value.username = user.username
  userData.value.email = user.email
  userData.value.name = user.name
}

const handleRoleToggle = roleKey => {
  const role = userData.value.roles[roleKey]

  role.enabled = !role.enabled

  if (!role.enabled) {
    role.isDefault = false
    if (roleKey === ROLES.CUSTOMER) {
      resetCustomerRole()
    }
  }

  const enabledRoles = Object.values(userData.value.roles).filter(r => r.enabled)
  if (enabledRoles.length === 1) {
    enabledRoles[0].isDefault = true
  }
}

const handleSetDefault = roleKey => {
  Object.keys(userData.value.roles).forEach(key => {
    userData.value.roles[key].isDefault = key === roleKey
  })
}

const handleVendorChange = () => {
  userData.value.roles[ROLES.CUSTOMER].customerId = ''
}

const handleSave = async () => {
  if (formErrors.value.length > 0) {
    showSnackbar(formErrors.value[0], 'error')
    
    return
  }

  isSubmitting.value = true

  try {
    const defaultRoleKey = Object.entries(userData.value.roles)
      .find(([_, role]) => role.enabled && role.isDefault)?.[0]

    const payload = {
      username: userData.value.username,
      email: userData.value.email,
      name: userData.value.name,
      status: userData.value.status,
      pdtRole: userData.value.roles[ROLES.PDT].enabled,
      pliRole: userData.value.roles[ROLES.PLI].enabled,
      customerRole: userData.value.roles[ROLES.CUSTOMER].enabled,
      customerTenant: userData.value.roles[ROLES.CUSTOMER].enabled 
        ? userData.value.roles[ROLES.CUSTOMER].tenant 
        : null,
      customerId: userData.value.roles[ROLES.CUSTOMER].enabled 
        ? userData.value.roles[ROLES.CUSTOMER].customerId 
        : null,
      defaultRole: ROLE_MAPPINGS[defaultRoleKey] || null,
    }

    const response = await $crmApi('/admin/user', {
      method: 'POST',
      body: payload,
    })

    if (response.resultCode === 0) {
      showSnackbar(response.message || 'Validation error', 'error')
      
      return
    }

    showSnackbar('User created successfully')
    router.push({ name: 'manage-users' })
  } catch (error) {
    console.error('Error creating user:', error)
    showSnackbar(error.message || 'Failed to create user', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Utility Functions
const resetCustomerRole = () => {
  userData.value.roles[ROLES.CUSTOMER] = {
    ...initialRoleState,
    tenant: '',
    customerId: '',
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color,
    timeout: 3000,
  }
}

// Cleanup
onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

// Lifecycle
onMounted(fetchInitialData)
</script>

<template>
  <VCard>
    <VCardText>
      <VForm @submit.prevent="handleSave">
        <VRow>
          <!-- Loading Overlay -->
          <VOverlay :model-value="isLoading">
            <VProgressCircular
              indeterminate
              size="64"
            />
          </VOverlay>

          <!-- Form Errors -->
          <VCol
            v-if="formErrors.length > 0"
            cols="12"
          >
            <VAlert
              color="error"
              variant="tonal"
              class="mb-4"
            >
              <ul class="mb-0">
                <li
                  v-for="error in formErrors"
                  :key="error"
                >
                  {{ error }}
                </li>
              </ul>
            </VAlert>
          </VCol>

          <!-- User Selection -->
          <VCol cols="12">
            <VAutocomplete
              v-model="selectedUser"
              :loading="isSearchingUser"
              :items="apiData.userSuggestions"
              item-title="username"
              item-value="username"
              label="Select User"
              placeholder="Search or select user"
              persistent-placeholder
              clearable
              return-object
              :menu-props="{ maxHeight: '300px' }"
              :error-messages="!userData.username ? ['Please select a user'] : []"
              @update:search="handleUserSearch"
              @update:model-value="handleUserSelect"
            >
              <template #prepend-inner>
                <VIcon
                  icon="ri-search-line"
                  class="mr-2"
                />
              </template>
              
              <template #no-data>
                <VListItem>
                  <VListItemTitle>
                    {{ isSearchingUser ? 'Searching...' : 'No users found' }}
                  </VListItemTitle>
                </VListItem>
              </template>

              <template #item="{ props, item }">
                <VListItem v-bind="props">
                  <template #prepend>
                    <VIcon icon="ri-user-add-line" />
                  </template>
                  <VListItemSubtitle>{{ item.raw.name }}</VListItemSubtitle>
                </VListItem>
              </template>
            </VAutocomplete>
          </VCol>
          
          <!-- Username (Read-only) -->
          <VCol cols="12">
            <VTextField
              v-model="userData.username"
              label="Username"
              readonly
              :error-messages="!userData.username ? ['Username is required'] : []"
            >
              <template #prepend-inner>
                <VIcon
                  icon="ri-user-line"
                  class="mr-2"
                />
              </template>
            </VTextField>
          </VCol>

          <!-- Email -->
          <VCol cols="12">
            <VTextField
              v-model="userData.email"
              label="Email"
              readonly
              :error-messages="!userData.email ? ['Email is required'] : []"
            >
              <template #prepend-inner>
                <VIcon
                  icon="ri-mail-line"
                  class="mr-2"
                />
              </template>
            </VTextField>
          </VCol>
          
          <!-- Name -->
          <VCol cols="12">
            <VTextField
              v-model="userData.name"
              label="Name"
              readonly
              :error-messages="!userData.name ? ['Name is required'] : []"
            >
              <template #prepend-inner>
                <VIcon
                  icon="ri-font-size"
                  class="mr-2"
                />
              </template>
            </VTextField>
          </VCol>

          <!-- Status -->
          <VCol cols="12">
            <VSelect
              v-model="userData.status"
              :items="apiData.statusOptions"
              item-title="name"
              item-value="id"
              label="Status"
            >
              <template #prepend-inner>
                <VIcon
                  icon="ri-toggle-line"
                  class="mr-2"
                />
              </template>
            </VSelect>
          </VCol>

          <!-- Roles Table -->
          <VCol cols="12">
            <div class="text-subtitle-1 mb-2">
              User Roles
              <span 
                v-if="!Object.values(userData.roles).some(r => r.enabled && r.isDefault)"
                class="text-error text-caption ml-2"
              >
                Please select a default role
              </span>
            </div>
            <VTable>
              <thead>
                <tr>
                  <th class="text-left">
                    Enable
                  </th>
                  <th class="text-left">
                    Default
                  </th>
                  <th class="text-left">
                    Role
                  </th>
                  <th class="text-left">
                    Vendor
                  </th>
                  <th class="text-left">
                    Customer
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Customer Role -->
                <tr>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.customer.enabled"
                      density="compact"
                      hide-details
                      @change="handleRoleToggle('customer')"
                    />
                  </td>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.customer.isDefault"
                      :disabled="!userData.roles.customer.enabled"
                      density="compact"
                      hide-details
                      @change="handleSetDefault('customer')"
                    />
                  </td>
                  <td>Customer</td>
                  <td>
                    <VSelect
                      v-model="userData.roles.customer.tenant"
                      :items="apiData.tenants"
                      item-title="name"
                      item-value="id"
                      :disabled="!userData.roles.customer.enabled"
                      :error-messages="userData.roles.customer.enabled && !userData.roles.customer.tenant ? ['Vendor required'] : []"
                      density="compact"
                      hide-details
                      @update:model-value="handleVendorChange"
                    />
                  </td>
                  <td>
                    <VSelect
                      v-model="userData.roles.customer.customerId"
                      :items="apiData.customers[userData.roles.customer.tenant] || []"
                      item-title="name"
                      item-value="id"
                      :disabled="!userData.roles.customer.enabled || !userData.roles.customer.tenant"
                      :error-messages="userData.roles.customer.enabled && !userData.roles.customer.customerId ? ['Customer required'] : []"
                      density="compact"
                      hide-details
                    />
                  </td>
                </tr>

                <!-- Internal PDT Role -->
                <tr>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.internalPdt.enabled"
                      density="compact"
                      hide-details
                      @change="handleRoleToggle('internalPdt')"
                    />
                  </td>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.internalPdt.isDefault"
                      :disabled="!userData.roles.internalPdt.enabled"
                      density="compact"
                      hide-details
                      @change="handleSetDefault('internalPdt')"
                    />
                  </td>
                  <td>Internal PDT</td>
                  <td />
                  <td />
                </tr>

                <!-- Internal PLI Role -->
                <tr>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.internalPli.enabled"
                      density="compact"
                      hide-details
                      @change="handleRoleToggle('internalPli')"
                    />
                  </td>
                  <td>
                    <VCheckbox
                      :model-value="userData.roles.internalPli.isDefault"
                      :disabled="!userData.roles.internalPli.enabled"
                      density="compact"
                      hide-details
                      @change="handleSetDefault('internalPli')"
                    />
                  </td>
                  <td>Internal PLI</td>
                  <td />
                  <td />
                </tr>
              </tbody>
            </VTable>
          </VCol>

          <!-- Form Actions -->
          <VCol
            cols="12"
            class="d-flex justify-start gap-4"
          >
            <VBtn
              color="primary"
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting || formErrors.length > 0"
            >
              <VIcon 
                icon="mdi-check"
                class="mr-2"
              />
              {{ isSubmitting ? 'Creating User...' : 'Create User' }}
            </VBtn>
            <VBtn
              color="secondary"
              variant="outlined"
              :disabled="isSubmitting"
              @click="router.push({ name: 'manage-users' })"
            >
              <VIcon
                icon="mdi-close"
                class="mr-2"
              />
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>

      <!-- Snackbar -->
      <VSnackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        location="top"
      >
        {{ snackbar.text }}
        <template #actions>
          <VBtn
            color="white"
            variant="text"
            @click="snackbar.show = false"
          >
            Close
          </VBtn>
        </template>
      </VSnackbar>
    </VCardText>
  </VCard>
</template>

<style scoped>
.v-table {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.v-table th {
  font-weight: 600;
  background-color: rgb(var(--v-theme-surface));
  text-transform: none;
  letter-spacing: normal;
}

.v-table td {
  padding: 8px 16px;
  height: 48px;
}

.v-btn {
  text-transform: none;
}

.text-error {
  color: rgb(var(--v-theme-error));
}

.v-autocomplete :deep(.v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.v-autocomplete :deep(.v-list-item__subtitle) {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.v-list-item-title {
  font-size: 0.9375rem;
}

.v-list-item-subtitle {
  font-size: 0.875rem;
  opacity: 0.7;
}
</style>
