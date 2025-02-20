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
import { AuthService } from '@/services/authService'

// Props
const props = defineProps({
  userRoles: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const router = useRouter()
const ability = useAbility()

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
  if (!response?.jwt || !response.roleId) {
    throw new Error('Invalid response from role switch API')
  }

  return {
    jwt: response.jwt,
    roleData: {
      id: response.roleId,
      name: response.roleName,
      tenant: response.tenant,
      tenantType: response.tenantType,
      featureRoles: response.featureRoles || [],
    },
  }
}

const updateUserSession = async (profileData, roleResponse) => {
  try {
    // 1. Generate ability rules dan user data baru
    const userAbilityRules = roleResponse.featureRoles.map(featureId => ({
      action: 'manage',
      subject: featureId,
    }))
    
    const preparedUserData = {
      id: profileData.userId,
      username: profileData.username,
      name: profileData.name,
      email: profileData.email,
      tenant: roleResponse.tenant,
      tenantType: roleResponse.tenantType,
      roleId: roleResponse.roleId,
      roleName: roleResponse.roleName,
      roles: profileData.roles,
      status: profileData.status,
      lastLogin: profileData.lastLogin,
      defaultRole: confirmDialog.value.setAsDefault 
        ? roleResponse.roleId 
        : userData.value.defaultRole,
    }

    // 2. Update cookies dan localStorage
    const userDataCookie = useCookie('userData')
    const userAbilityRulesCookie = useCookie('userAbilityRules')
    const tokenCookie = useCookie('crmAccessToken')

    userDataCookie.value = preparedUserData
    userAbilityRulesCookie.value = userAbilityRules
    tokenCookie.value = roleResponse.jwt
    
    localStorage.setItem('tenantType', roleResponse.tenantType)
    localStorage.setItem('featureRoles', JSON.stringify(roleResponse.featureRoles))

    // 3. Update CASL ability
    ability.update(userAbilityRules)

    // 4. Emit event dengan struktur lengkap
    eventBus.value.emit('roleChanged', {
      previousRole: {
        id: userData.value?.roleId,
        name: userData.value?.roleName,
        tenant: userData.value?.tenant,
      },
      newRole: {
        id: roleResponse.roleId,
        name: roleResponse.roleName,
        tenant: roleResponse.tenant,
      },
      featureChanges: {
        added: roleResponse.featureRoles.filter(f => 
          !userData.value?.featureRoles?.includes(f),
        ),
        removed: (userData.value?.featureRoles || []).filter(f =>
          !roleResponse.featureRoles.includes(f),
        ),
      },
      isDefault: confirmDialog.value.setAsDefault,
    })

  } catch (error) {
    console.error('Session update error:', error)
    throw new Error('Failed to update user session: ' + error.message)
  }
}

const handleRoleSwitch = async () => {
  const selectedRole = confirmDialog.value.selectedRole
  if (!selectedRole) return

  try {
    isLoading.value = true

    // 1. Panggil API switch role
    const switch_role = await $crmApi('/user/switch-role', {
      method: 'GET',
      params: {
        'to-role': selectedRole.id,
        ...(confirmDialog.value.setAsDefault && { 'set-as-default': true }),
      },
    })

    console.log('switch_role', switch_role)

    // 2. Dapatkan username dari userData
    const username = userData.value.username
    if (!username) throw new Error('Username not found!')

    // 3. Dapatkan JWT baru dari endpoint default-role
    const roleResponse = await $crmApi(`/user/${username}/default-role`, {
      skipAuth: true,
      headers: {
        Authorization: `${import.meta.env.VITE_AUTH_TOKEN}`,
      },
    })

    // 4. Validasi response
    if (!roleResponse?.jwt) {
      throw new Error('Invalid response from default-role endpoint')
    }

    // 5. Dapatkan profil user dengan JWT baru
    const profileData = await AuthService.fetchUserProfile()

    // 6. Update session dengan data terbaru
    await updateUserSession(profileData, {
      ...roleResponse,
      roleId: selectedRole.id,
      roleName: selectedRole.name,
    })

    // 7. Tampilkan feedback dan reload
    showSnackbar(
      confirmDialog.value.setAsDefault
        ? `Role switched to ${selectedRole.name} (default)`
        : `Role switched to ${selectedRole.name}`,
    )

    // setTimeout(() => window.location.reload(), 1500)

  } catch (error) {
    console.error('Role switch error:', error)
    showSnackbar(error.message || 'Failed to switch role', 'error')
    
    // Rollback ke state sebelumnya
    try {
      const currentRole = props.userRoles.find(r => r.id === currentRoleId.value)

      await updateUserSession(userData.value, {
        jwt: useCookie('crmAccessToken').value,
        roleId: currentRoleId.value,
        roleName: currentRole?.name,
        tenant: userData.value.tenant,
        tenantType: userData.value.tenantType,
        featureRoles: JSON.parse(localStorage.getItem('featureRoles') || '[]'),
      })
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError)
      AuthService.logout()
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
