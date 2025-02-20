<!-- RoleSwitcher.vue -->
<template>
  <VMenu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
  >
    <!-- Role Switch Button -->
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        variant="outlined"
        size="small"
        prepend-icon="ri-switch-line"
        :loading="isLoading"
        :disabled="!availableRoles.length || isLoading"
      >
        {{ currentRole?.name || 'Switch Role' }}
      </VBtn>
    </template>

    <!-- Roles Menu -->
    <VCard min-width="300">
      <VCardTitle class="text-subtitle-1 font-weight-medium">
        Available Roles
      </VCardTitle>

      <VCardText>
        <div class="roles-list">
          <VList
            v-if="availableRoles.length"
            lines="one"
            density="comfortable"
          >
            <VListItem
              v-for="role in sortedRoles"
              :key="role.id"
              :value="role.id"
              :active="role.id === currentRoleId"
              @click="openConfirmDialog(role)"
            >
              <template #prepend>
                <VIcon
                  v-if="role.id === currentRoleId"
                  icon="ri-check-line"
                  color="primary"
                  size="small"
                />
                <VIcon
                  v-if="role.id === defaultRoleId"
                  icon="ri-star-fill"
                  color="warning"
                  size="small"
                  class="ml-2"
                />
              </template>

              <VListItemTitle>{{ role.name }}</VListItemTitle>
              <VListItemSubtitle>{{ role.id }}</VListItemSubtitle>
            </VListItem>
          </VList>
          <div
            v-else
            class="text-caption text-disabled pa-2 text-center"
          >
            No roles available
          </div>
        </div>
      </VCardText>
    </VCard>
  </VMenu>

  <!-- Role Switch Confirmation Dialog -->
  <VDialog
    v-model="confirmDialog.show"
    persistent
    max-width="400"
  >
    <VCard>
      <VCardTitle>Switch to {{ confirmDialog.selectedRole?.name }}</VCardTitle>

      <VCardText>
        <div class="d-flex align-center mt-2">
          <div class="text-subtitle-1">
            Are you sure you want to switch roles? This will refresh your session.
          </div>
        </div>
        <VDivider class="my-4" />
        <VCheckbox
          v-model="confirmDialog.setAsDefault"
          label="Set as default role"
          color="primary"
          hide-details
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey-darken-1"
          variant="text"
          @click="closeConfirmDialog"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="text"
          :loading="isLoading"
          @click="handleRoleSwitch"
        >
          Confirm
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Status Snackbar -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="3000"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { $crmApi } from '@/api/crmApi'
import { eventBus } from '@/utils/eventBus'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  userRoles: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const router = useRouter()

// State
const menu = ref(false)
const isLoading = ref(false)

const confirmDialog = ref({
  show: false,
  selectedRole: null,
  setAsDefault: false,
})

const snackbar = ref({
  show: false,
  color: 'primary',
  text: '',
})

// Computed
const userDataCookie = useCookie('userData')
const userData = computed(() => userDataCookie.value || {})
const currentRoleId = computed(() => userData.value?.roleId)
const defaultRoleId = computed(() => userData.value?.defaultRoleId)
const currentRole = computed(() => props.userRoles.find(role => role.id === currentRoleId.value))

const sortedRoles = computed(() => {
  return [...props.userRoles].sort((a, b) => {
    if (a.id === currentRoleId.value) return -1
    if (b.id === currentRoleId.value) return 1
    if (a.id === defaultRoleId.value) return -1
    if (b.id === defaultRoleId.value) return 1
    
    return a.name.localeCompare(b.name)
  })
})

const availableRoles = computed(() => props.userRoles || [])

// Methods
const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, color, text }
}

const openConfirmDialog = role => {
  if (role.id === currentRoleId.value) {
    menu.value = false
    
    return
  }

  confirmDialog.value = {
    show: true,
    selectedRole: role,
    setAsDefault: false,
  }
  menu.value = false
}

const closeConfirmDialog = () => {
  confirmDialog.value = {
    show: false,
    selectedRole: null,
    setAsDefault: false,
  }
}

const validateApiResponse = response => {
  if (!response?.data || !response.data.jwt || !response.data.roleId) {
    throw new Error('Invalid response from role switch API')
  }

  if (response.resultCode !== 1) {
    throw new Error(response.message || 'Role switch failed')
  }

  return {
    jwt: response.data.jwt,
    roleData: {
      id: response.data.roleId,
      name: response.data.roleName,
      tenant: response.data.tenant,
      tenantType: response.data.tenantType,
      featureRoles: response.data.featureRoles || [],
    },
  }
}

const updateUserSession = async (roleData, jwt) => {
  try {
    // Update user data
    const updatedUserData = {
      ...userData.value,
      roleId: roleData.id,
      roleName: roleData.name,
      tenant: roleData.tenant,
      tenantType: roleData.tenantType,
      roles: props.userRoles,
    }

    if (confirmDialog.value.setAsDefault) {
      updatedUserData.defaultRoleId = roleData.id
    }

    // Update cookies
    userDataCookie.value = updatedUserData
    useCookie('crmAccessToken').value = jwt

    // Update feature roles
    if (roleData.featureRoles?.length) {
      const userAbilityRules = roleData.featureRoles.map(featureId => ({
        action: 'manage',
        subject: featureId,
      }))

      useCookie('userAbilityRules').value = userAbilityRules
      localStorage.setItem('featureRoles', JSON.stringify(roleData.featureRoles))
    }

    // Emit role change event with proper structure
    eventBus.value.emit('roleChanged', {
      previousRole: {
        id: userData.value?.roleId,
        name: userData.value?.roleName,
      },
      newRole: {
        id: roleData.id,
        name: roleData.name,
      },
      isDefault: confirmDialog.value.setAsDefault,
    })

  } catch (error) {
    console.error('Session update error:', error)
    throw new Error('Failed to update user session')
  }
}

const handleRoleSwitch = async () => {
  const selectedRole = confirmDialog.value.selectedRole
  if (!selectedRole) return

  try {
    isLoading.value = true

    // Call role switch API
    const response = await $crmApi('/user/switch-role', {
      method: 'GET',
      params: {
        'to-role': selectedRole.id,
        ...(confirmDialog.value.setAsDefault && { 'set-as-default': true }),
      },
    })

    // Validate and extract data from response
    const { jwt, roleData } = validateApiResponse(response)

    // Update session with new role data
    await updateUserSession(roleData, jwt)

    showSnackbar(
      confirmDialog.value.setAsDefault
        ? `Successfully switched to ${selectedRole.name} and set as default`
        : `Successfully switched to ${selectedRole.name}`,
    )

    // Navigate to home page and reload
    await router.push('/')
    window.location.reload()

  } catch (error) {
    console.error('Role switch error:', error)
    showSnackbar(error.message || 'Failed to switch role', 'error')

    // Attempt to revert changes on error
    if (userData.value?.roleId) {
      try {
        await updateUserSession({
          id: userData.value.roleId,
          name: userData.value.roleName,
          tenant: userData.value.tenant,
          tenantType: userData.value.tenantType,
        }, useCookie('crmAccessToken').value)
      } catch (revertError) {
        console.error('Failed to revert role change:', revertError)
      }
    }
  } finally {
    isLoading.value = false
    closeConfirmDialog()
  }
}
</script>

<style lang="scss" scoped>
.roles-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
