<!-- /manage/users/edit/id.vue -->
 <!-- /manage/users/edit/id.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { $crmApi } from '@/api/crmApi'

const route = useRoute()
const router = useRouter()

// Snackbar state
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')

definePage({
  meta: {
    subject: `USER_MANAGEMENT_EDIT`,
  },
})

// Initial role state
const initialRoleState = {
  enabled: false,
  isDefault: false,
  vendor: '',
  customerId: '',
}

// Form data
const userData = ref({
  id: '',
  username: '',
  name: '',
  email: '', // Added email field
  status: 'ACTIVE',
  roles: {
    customer: { ...initialRoleState },
    internalPdt: { ...initialRoleState },
    internalPli: { ...initialRoleState },
  },
})

// API data
const apiData = ref({
  statusOptions: [
    { id: 'ACTIVE', name: 'Active' },
    { id: 'INACTIVE', name: 'Inactive' },
  ],
  tenants: [],
  customers: {
    PDT: [],
    PLI: [],
  },
  customerMap: new Map(),
})

// Loading states
const isLoading = ref(false)
const isSubmitting = ref(false)

const showSnackbar = message => {
  snackbarMessage.value = message
  isSnackbarVisible.value = true
}

// Fetch customers based on tenant
const fetchCustomers = async tenant => {
  if (!tenant) return

  try {
    const response = await $crmApi(`/common/customer/${tenant}`)
    if (response?.items) {
      apiData.value.customers[tenant] = response.items
      response.items.forEach(customer => {
        apiData.value.customerMap.set(customer.id, customer)
      })
    }
  } catch (error) {
    console.error(`Error fetching ${tenant} customers:`, error)
    showSnackbar(`Failed to load ${tenant} customers`)
  }
}

// Handle vendor change
const handleVendorChange = async () => {
  const vendor = userData.value.roles.customer.vendor

  userData.value.roles.customer.customerId = ''
  
  if (vendor) {
    await fetchCustomers(vendor)
  }
}

// Map user data to form
const mapUserDataToForm = async apiUser => {
  if (!apiUser) return

  userData.value = {
    id: apiUser.id,
    username: apiUser.username,
    name: apiUser.name || '',
    email: apiUser.email || '', // Added email mapping
    status: apiUser.status,
    roles: {
      customer: {
        ...initialRoleState,
        enabled: apiUser.customerRole,
        isDefault: apiUser.defaultRole === 'CUSTOMER',
        vendor: apiUser.customerTenant || '',
        customerId: apiUser.customer?.id || '',
      },
      internalPdt: {
        ...initialRoleState,
        enabled: apiUser.pdtRole,
        isDefault: apiUser.defaultRole === 'PDT',
      },
      internalPli: {
        ...initialRoleState,
        enabled: apiUser.pliRole,
        isDefault: apiUser.defaultRole === 'PLI',
      },
    },
  }

  if (apiUser.customer) {
    apiData.value.customerMap.set(apiUser.customer.id, apiUser.customer)
  }

  if (apiUser.customerRole && apiUser.customerTenant) {
    await fetchCustomers(apiUser.customerTenant)
  }
}

// Handle role toggle
const handleRoleToggle = roleKey => {
  const role = userData.value.roles[roleKey]

  role.enabled = !role.enabled
  
  if (!role.enabled) {
    role.isDefault = false
    if (roleKey === 'customer') {
      role.vendor = ''
      role.customerId = ''
    }
  }
}

// Handle default role setting
const handleSetDefault = roleKey => {
  Object.keys(userData.value.roles).forEach(key => {
    userData.value.roles[key].isDefault = key === roleKey
  })
}

// Fetch initial data
const fetchInitialData = async () => {
  isLoading.value = true
  try {
    const [tenantsRes, userDataRes] = await Promise.all([
      $crmApi('/common/tenant'),
      $crmApi(`/admin/user/${route.params.id}`),
    ])

    apiData.value.tenants = tenantsRes || []
    
    if (userDataRes.resultCode === 1) {
      await mapUserDataToForm(userDataRes.data)
    }
  } catch (error) {
    showSnackbar('Failed to load initial data')
    console.error('Error fetching initial data:', error)
    router.push('/manage/users')
  } finally {
    isLoading.value = false
  }
}

// Validate email format
const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(email)
}

// Handle save
const handleSave = async () => {
  if (!userData.value.username) {
    showSnackbar('Username is required')
    
    return
  }

  if (userData.value.email && !isValidEmail(userData.value.email)) {
    showSnackbar('Please enter a valid email address')
    
    return
  }

  isSubmitting.value = true

  try {
    const userPayload = {
      id: userData.value.id,
      username: userData.value.username,
      name: userData.value.name,
      email: userData.value.email, // Added email to payload
      status: userData.value.status,
      pdtRole: userData.value.roles.internalPdt.enabled,
      pliRole: userData.value.roles.internalPli.enabled,
      customerRole: userData.value.roles.customer.enabled,
      customerTenant: userData.value.roles.customer.enabled ? 
        userData.value.roles.customer.vendor : null,
      customerId: userData.value.roles.customer.enabled ? 
        userData.value.roles.customer.customerId : null,
      defaultRole: Object.entries(userData.value.roles)
        .find(([_, role]) => role.isDefault)?.[0]
        ?.replace('internal', '')
        ?.toUpperCase() || null,
    }

    await $crmApi('/admin/user/' + route.params.id, {
      method: 'POST',
      body: userPayload,
    })

    showSnackbar('User updated successfully')
    router.push('/manage/users')
  } catch (error) {
    showSnackbar(error.message || 'Failed to update user')
    console.error('Error updating user:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <VCard>
    <VCardTitle>Edit User</VCardTitle>
    <VCardText>
      <VForm @submit.prevent="handleSave">
        <VRow>
          <!-- Loading overlay -->
          <VOverlay :model-value="isLoading">
            <VProgressCircular
              indeterminate
              size="64"
            />
          </VOverlay>

          <VCol cols="12">
            <VTextField
              v-model="userData.name"
              label="Name"
              required
            />
          </VCol>

          <!-- Basic Information -->
          <VCol cols="12">
            <VTextField
              v-model="userData.username"
              label="Username"
              readonly
              required
            />
          </VCol>

          <!-- Added Email Field -->
          <VCol cols="12">
            <VTextField
              v-model="userData.email"
              label="Email"
              type="email"
              placeholder="user@example.com"
            />
          </VCol>

          <VCol cols="12">
            <VSelect
              v-model="userData.status"
              :items="apiData.statusOptions"
              item-title="name"
              item-value="id"
              label="Status"
            />
          </VCol>

          <!-- Roles -->
          <VCol cols="12">
            <div class="text-h6 mb-4">
              User Roles
            </div>
            <VTable>
              <thead>
                <tr>
                  <th>Enable</th>
                  <th>Default</th>
                  <th>Role</th>
                  <th>Vendor</th>
                  <th>Customer</th>
                  <th>Permissions</th>
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
                      v-model="userData.roles.customer.vendor"
                      :items="apiData.tenants"
                      item-title="name"
                      item-value="id"
                      :disabled="!userData.roles.customer.enabled"
                      density="compact"
                      hide-details
                      @update:model-value="handleVendorChange"
                    />
                  </td>
                  <td>
                    <VSelect
                      v-model="userData.roles.customer.customerId"
                      :items="apiData.customers[userData.roles.customer.vendor] || []"
                      item-title="name"
                      item-value="id"
                      :disabled="!userData.roles.customer.enabled || !userData.roles.customer.vendor"
                      density="compact"
                      hide-details
                    />
                  </td>
                  <td>
                    <div v-if="userData.roles.customer.enabled">
                      <VBtn
                        size="small"
                        color="primary"
                        variant="outlined"
                        :to="`/manage/users/${userData.id}/feature/CUSTOMER`"
                        class="d-flex"
                      >
                        Feature
                      </VBtn>
                    </div>
                  </td>
                </tr>

                <!-- PDT Role -->
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
                  <td>
                    <div
                      v-if="userData.roles.internalPdt.enabled"
                      class="d-flex gap-2"
                    >
                      <VBtn
                        size="small"
                        color="primary"
                        variant="outlined"
                        :to="`/manage/users/${userData.id}/feature/PDT`"
                        class="flex-fill"
                      >
                        Feature
                      </VBtn>
                      <VBtn
                        size="small"
                        color="primary"
                        variant="outlined"
                        :to="`/manage/users/${userData.id}/data/PDT`"
                        class="flex-fill"
                      >
                        Data
                      </VBtn>
                    </div>
                  </td>
                </tr>

                <!-- PLI Role -->
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
                  <td>
                    <div
                      v-if="userData.roles.internalPli.enabled"
                      class="d-flex gap-2"
                    >
                      <VBtn
                        size="small"
                        color="primary"
                        variant="outlined"
                        :to="`/manage/users/${userData.id}/feature/PLI`"
                        class="flex-fill"
                      >
                        Feature
                      </VBtn>
                      <VBtn
                        size="small"
                        color="primary"
                        variant="outlined"
                        :to="`/manage/users/${userData.id}/data/PLI`"
                        class="flex-fill"
                      >
                        Data
                      </VBtn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCol>

          <!-- Form Actions -->
          <VCol
            cols="12"
            class="d-flex gap-4"
          >
            <VBtn
              color="primary"
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Updating User...' : 'Update User' }}
            </VBtn>
            <VBtn
              color="secondary"
              variant="outlined"
              :disabled="isSubmitting"
              @click="router.push('/manage/users')"
            >
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>

  <!-- Snackbar -->
  <VSnackbar
    v-model="isSnackbarVisible"
    location="top"
  >
    {{ snackbarMessage }}
    <template #actions>
      <VBtn
        color="white"
        variant="text"
        @click="isSnackbarVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<style scoped>
.v-table {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  width: 100%;
}

.v-table th {
  font-weight: 600;
  background-color: rgb(var(--v-theme-surface));
  text-transform: none;
  letter-spacing: normal;
  padding: 8px 16px;
  white-space: nowrap;
}

.v-table td {
  padding: 8px 16px;
  height: 40px;
  vertical-align: middle;
}

.v-btn {
  text-transform: none;
}

.v-checkbox.v-input--density-compact {
  margin-bottom: 0;
}

.v-card-title {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-table tbody tr:hover {
  background-color: rgba(var(--v-theme-surface), 0.04);
}

/* Add spacing between sections */
.v-col + .v-col {
  margin-top: 1rem;
}

/* Make cards more compact */
.v-card {
  --v-card-elevation: 0;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-card .v-card-title {
  font-size: 1rem;
  padding: 12px 16px;
}

.v-card .v-card-text {
  padding: 16px;
}
</style>
