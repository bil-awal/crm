<script setup>
const credentials = ref([])
const isRoleDialogVisible = ref(false)
const roleDetail = ref()

const editPermission = value => {
  isRoleDialogVisible.value = true
  roleDetail.value = value
}

const fetchRoles = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_CRM}/credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()

    if (data.resultCode === 1) {
      credentials.value = data.data.map(item => ({
        role: item.position, 
        users: [], // Placeholder, as no user data in the API 
        details: {
          name: item.position,
          permissions: item.abilities.map(ability => ({
            name: ability.subject,
            read: ability.action === 'manage',
            write: ability.action === 'manage',
            create: ability.action === 'manage',
          })),
        },
      }))
    } else {
      console.error('Failed to fetch Roles:', data.message)
    }
  } catch (err) {
    console.error('Error fetching Roles:', err)
  }
}

onMounted(fetchRoles)
</script>

<template>
  <VRow>
    <VCol
      v-for="item in credentials"
      :key="item.role"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center">
          <span>Total {{ item.users.length }} users</span>
          <VSpacer />
        </VCardText>

        <VCardText>
          <h5 class="text-h5 mb-1">
            {{ item.role }}
          </h5>
          <div class="d-flex align-center">
            <VBtn
              variant="text"
              @click="editPermission(item.details)"
            >
              Edit Role
            </VBtn> 
            <VSpacer />
            <IconBtn
              color="secondary"
              class="mt-n2"
            >
              <VIcon icon="ri-file-copy-line" />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  
  <EditCredentialDialog
    v-model:is-dialog-visible="isRoleDialogVisible"
    v-model:role-permissions="roleDetail"
  />
</template>
