<script setup>
const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const isUserInfoEditDialogVisible = ref(false)
const isUpgradePlanDialogVisible = ref(false)

const resolveUserStatusVariant = stat => {
  if (stat === 'pending')
    return 'warning'
  if (stat === 'active')
    return 'success'
  if (stat === 'inactive')
    return 'secondary'
    
  return 'primary'
}

const resolveUserRoleVariant = role => {
  if (role === 'subscriber')
    return {
      color: 'primary',
      icon: 'ri-user-line',
    }
  if (role === 'author')
    return {
      color: 'warning',
      icon: 'ri-settings-2-line',
    }
  if (role === 'maintainer')
    return {
      color: 'success',
      icon: 'ri-database-2-line',
    }
  if (role === 'editor')
    return {
      color: 'info',
      icon: 'ri-pencil-line',
    }
  if (role === 'admin')
    return {
      color: 'error',
      icon: 'ri-server-line',
    }
    
  return {
    color: 'primary',
    icon: 'ri-user-line',
  }
}

const resolveisOnlineVariant = stat => {
  switch (stat) {
  case true:
    return { color: 'success', text: 'Online' }
  case false:
    return { color: 'secondary', text: 'Offline' }
  default:
    return { color: 'primary', text: stat }
  }
}

const resolveisActiveVariant = stat => {
  switch (stat) {
  case true:
    return { color: 'success', text: 'Active' }
  case false:
    return { color: 'secondary', text: 'In-Active' }
  default:
    return { color: 'primary', text: stat }
  }
}

const getConciseAccess = abilities => {
  const uniqueActions = [...new Set(abilities.map(ability => ability.action))]
  
  return uniqueActions.length > 1 ? `${uniqueActions.length} Actions` : uniqueActions[0]
}
</script>

<template>
  <VRow>
    <!-- SECTION User Details -->
    <VCol cols="12">
      <VCard v-if="props.userData">
        <VCardText class="text-center pt-12 pb-6">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded
            :size="120"
            :color="!props.userData.avatar ? 'primary' : undefined"
            :variant="!props.userData.avatar ? 'tonal' : undefined"
          >
            <VImg
              v-if="props.userData.avatar"
              :src="props.userData.avatar"
            />
            <span
              v-else
              class="text-5xl font-weight-medium"
            >
              {{ avatarText(props.userData.name) }}
            </span>
          </VAvatar>

          <!-- 👉 User name -->
          <h5 class="text-h5 mt-4">
            {{ props.userData.name }}
          </h5>

          <!-- 👉 Role chip -->
          <VChip
            :color="resolveUserRoleVariant(props.userData.role).color"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ props.userData.role }}
          </VChip>
        </VCardText>

        <!-- 👉 Details -->
        <VCardText class="pb-6">
          <h5 class="text-h5">
            Details
          </h5>

          <VDivider class="my-4" />

          <!-- 👉 User Details list -->
          <VList class="card-list">
            <VListItem>
              <VListItemTitle class="text-sm">
                <span class="font-weight-medium">Company: </span>
                <span class="text-body-1">
                  {{ props.userData.userMaps[0].company.name }}
                </span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="text-sm">
                <span class="font-weight-medium">
                  Email:
                </span>
                <span class="text-body-1">{{ props.userData.email }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="text-sm">
                <span class="font-weight-medium">
                  Status:
                </span>
                <VChip
                  :color="resolveisOnlineVariant(props.userData.isOnline)"
                  size="small"
                  class="text-capitalize"
                >
                  {{ resolveisOnlineVariant(props.userData.isOnline).text }}
                </VChip>
                <VChip
                  :color="resolveisActiveVariant(props.userData.isActive).color"
                  size="small"
                  class="text-capitalize"
                >
                  {{ resolveisActiveVariant(props.userData.isActive).text }}
                </VChip>
                <VChip
                  v-if="props.userData.isBlocked"
                  color="error"
                  size="small"
                  class="text-capitalize"
                >
                  Blocked
                </VChip>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="text-sm">
                <span class="font-weight-medium">Role: </span>
                <span class="text-capitalize text-body-1">{{ props.userData.userMaps[0].credential.role }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="text-sm">
                <span class="font-weight-medium">Access: </span>
                <VTooltip location="top">
                  <template #activator="{ prop }">
                    <VChip
                      v-bind="prop"
                      color="primary"
                      size="small"
                      class="text-capitalize"
                    >
                      {{ getConciseAccess(props.userData.userMaps[0].credential.abilities) }}
                    </VChip>
                  </template>
                  <div class="d-flex flex-column">
                    <span
                      v-for="(ability, index) in props.userData.userMaps[0].credential.abilities"
                      :key="index"
                    >
                      {{ ability.action }}: {{ ability.subject }}
                    </span>
                  </div>
                </VTooltip>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- 👉 Edit and Suspend button -->
        <VCardText class="d-flex justify-center">
          <VBtn
            variant="elevated"
            class="me-4"
            @click="isUserInfoEditDialogVisible = true"
          >
            Edit
          </VBtn>
          <VBtn
            variant="outlined"
            color="error"
          >
            Suspend
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
    <!-- !SECTION -->
  </VRow>

  <!-- 👉 Edit user info dialog -->
  <UserInfoEditDialog
    v-model:isDialogVisible="isUserInfoEditDialogVisible"
    :user-data="props.userData"
  />

  <!-- 👉 Upgrade plan dialog -->
  <UserUpgradePlanDialog v-model:isDialogVisible="isUpgradePlanDialogVisible" />
</template>

  <style lang="scss" scoped>
  .card-list {
    --v-card-list-gap: .5rem;
  }

  .current-plan {
    border: 2px solid rgb(var(--v-theme-primary));
  }

  .text-capitalize {
    text-transform: capitalize !important;
  }
  </style>
