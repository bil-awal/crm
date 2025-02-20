<!-- Permission Manager Component -->
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { $crmApi } from '@/api/crmApi'

definePage({
  meta: {
    subject: 'USER_MANAGEMENT_EDIT',
  },
})

// Router setup
const route = useRoute()
const router = useRouter()
const { roleType, id: userId } = route.params

// State Management
const state = reactive({
  isLoading: false,
  isSubmitting: false,
  showConfirmDialog: false,
  notification: {
    show: false,
    message: '',
    color: 'success',
  },
  permissions: {
    selected: [],
    customerList: [],
  },
})

// Computed Properties
const customerOptions = computed(() => [
  { id: 'ALL', name: 'ALL' },
  ...state.permissions.customerList,
])

// Utility Functions
const showNotification = (message, type = 'success') => {
  state.notification = {
    show: true,
    message,
    color: type,
  }
}

// API Functions
const fetchCustomerList = async () => {
  state.isLoading = true
  try {
    const response = await $crmApi(`/common/customer/${roleType}`)

    state.permissions.customerList = response?.items?.map(customer => ({
      id: customer.id,
      name: customer.name,
    })) || []
  } catch (error) {
    console.error('Error fetching customer list:', error)
    showNotification('Failed to load customer list', 'error')
  } finally {
    state.isLoading = false
  }
}

const fetchExistingPermissions = async () => {
  state.isLoading = true
  try {
    const response = await $crmApi(`/admin/user/${userId}/permission/data/${roleType}`)

    state.permissions.selected = response.map(permission => ({
      organization: permission.orgId || 'ALL',
      customer: permission.customer?.id || 'ALL',
    })) || [{
      organization: 'ALL',
      customer: 'ALL',
    }]
  } catch (error) {
    console.error('Error fetching permissions:', error)
    showNotification('Failed to load existing permissions', 'error')

    // Set default permission if fetch fails
    state.permissions.selected = [{
      organization: 'ALL',
      customer: 'ALL',
    }]
  } finally {
    state.isLoading = false
  }
}

// Permission Management
const addPermissionRow = () => {
  state.permissions.selected.push({
    organization: 'ALL',
    customer: 'ALL',
  })
}

const removePermissionRow = index => {
  if (state.permissions.selected.length > 1) {
    state.permissions.selected.splice(index, 1)
  }
}

const validatePermissions = () => {
  const combinations = new Set()
  
  return state.permissions.selected.every(permission => {
    const key = `${permission.organization}-${permission.customer}`
    if (combinations.has(key)) return false
    combinations.add(key)
    
    return true
  })
}

const formatPayloadForSave = () => ({
  dataPermissions: state.permissions.selected.map(permission => ({
    orgId: permission.organization === 'ALL' ? null : permission.organization,
    customerId: permission.customer === 'ALL' ? null : permission.customer,
  })),
})

// Save Functions
const savePermissions = async (autofix = false) => {
  if (!validatePermissions() && !autofix) {
    showNotification('Duplicate permission combinations detected', 'error')
    
    return
  }

  state.isSubmitting = true
  try {
    const payload = formatPayloadForSave()

    await $crmApi(`/admin/user/${userId}/permission/data/${roleType}?autofix=${autofix}`, {
      method: 'POST',
      body: payload,
    })
    
    showNotification('Permissions updated successfully')
    router.push(`/manage/users/${userId}`)
  } catch (error) {
    console.error('Error saving permissions:', error)
    
    if (error.resultCode === -1) {
      state.showConfirmDialog = true
      showNotification(error.message, 'warning')
      
      return
    }
    
    showNotification(error.message || 'Failed to update permissions', 'error')
  } finally {
    state.isSubmitting = false
  }
}

// Action Handlers
const handleSave = () => savePermissions(false)
const handleAutoFix = () => savePermissions(true)
const handleCancel = () => router.push(`/manage/users/${userId}`)

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchCustomerList(),
    fetchExistingPermissions(),
  ])
})
</script>

<template>
  <VCard class="permission-card">
    <VCardTitle>{{ roleType }} Data Permissions</VCardTitle>
    
    <VCardText>
      <!-- Loading Overlay -->
      <VOverlay
        :model-value="state.isLoading"
        class="align-center justify-center"
        persistent
      >
        <VProgressCircular
          indeterminate
          size="64"
        />
      </VOverlay>

      <!-- Add Permission Button -->
      <div class="mb-4 d-flex justify-end">
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          size="small"
          :disabled="state.isLoading"
          @click="addPermissionRow"
        >
          Add Data Permission
        </VBtn>
      </div>

      <!-- Permissions Table -->
      <VTable>
        <thead>
          <tr>
            <th>Organizations</th>
            <th>Customer</th>
            <th class="text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(permission, index) in state.permissions.selected"
            :key="index"
          >
            <td style="width: 200px">
              <VSelect
                v-model="permission.organization"
                :items="['ALL']"
                density="compact"
                hide-details
                :disabled="state.isLoading"
              />
            </td>
            <td>
              <VSelect
                v-model="permission.customer"
                :items="customerOptions"
                item-title="name"
                item-value="id"
                density="compact"
                hide-details
                :disabled="state.isLoading"
              />
            </td>
            <td class="text-center">
              <VBtn
                icon
                color="error"
                variant="text"
                size="small"
                :disabled="state.permissions.selected.length === 1 || state.isLoading"
                @click="removePermissionRow(index)"
              >
                <VIcon icon="ri-delete-bin-line" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Action Buttons -->
      <div class="d-flex gap-4 mt-4">
        <VBtn
          color="primary"
          :loading="state.isSubmitting"
          :disabled="state.isSubmitting || state.isLoading"
          @click="handleSave"
        >
          {{ state.isSubmitting ? 'Saving...' : 'Save' }}
        </VBtn>
        
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="state.isSubmitting"
          @click="handleCancel"
        >
          Cancel
        </VBtn>
      </div>
    </VCardText>

    <!-- Confirmation Dialog -->
    <VDialog
      v-model="state.showConfirmDialog"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="text-h6">
          Duplicate Data Detected
        </VCardTitle>
        
        <VCardText>
          Would you like the system to automatically fix the duplicate data or would you prefer to fix it manually?
        </VCardText>
        
        <VCardActions>
          <VSpacer />
          
          <VBtn
            color="primary"
            variant="text"
            @click="handleAutoFix"
          >
            Auto Fix
          </VBtn>
          
          <VBtn
            color="error"
            variant="text"
            @click="state.showConfirmDialog = false"
          >
            Fix Manually
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>

  <!-- Notification Snackbar -->
  <VSnackbar
    v-model="state.notification.show"
    :color="state.notification.color"
    location="top"
    timeout="3000"
  >
    {{ state.notification.message }}
    <template #actions>
      <VBtn
        color="white"
        variant="text"
        @click="state.notification.show = false"
      >
        <VIcon icon="ri-close-line" />
      </VBtn>
    </template>
  </VSnackbar>
</template>

<style scoped>
.permission-card {
  --v-card-elevation: 0;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-card-title {
  font-size: 1.1rem;
  font-weight: 500;
  padding: 16px;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-table {
  width: 100%;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.v-table th {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
  white-space: nowrap;
  padding: 0 16px;
  height: 48px;
  background-color: rgb(var(--v-theme-surface));
}

.v-table td {
  padding: 8px 16px;
  height: 52px;
}

.v-btn {
  text-transform: none;
}

.v-overlay__content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
}
</style>
