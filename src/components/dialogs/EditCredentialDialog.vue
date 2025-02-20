<script setup>
import { ref, computed, watch, defineProps, defineEmits, onMounted } from 'vue'
import { VForm } from 'vuetify/components/VForm'

const props = defineProps({
  rolePermissions: {
    type: Object,
    required: false,
    default: () => ({
      name: '',
      permissions: [],
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
  'update:rolePermissions',
])

const permissions = ref([])

const isSelectAll = ref(false)
const role = ref('')
const refPermissionForm = ref()

const fetchPermissions = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_CRM}/credential-abilities`, {
      headers: {
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
      },
    })

    const data = await response.json()
    if (data.resultCode === 1 && data.data) {
      permissions.value = data.data.map(item => ({
        name: item.subject,
        read: item.action === 'manage',
        write: item.action === 'manage',
        create: item.action === 'manage',
      }))
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
  }
}

const checkedCount = computed(() => {
  let counter = 0
  permissions.value.forEach(permission => {
    Object.entries(permission).forEach(([key, value]) => {
      if (key !== 'name' && value) counter++
    })
  })
  
  return counter
})

const isIndeterminate = computed(() => checkedCount.value > 0 && checkedCount.value < permissions.value.length * 3)

watch(isSelectAll, val => {
  permissions.value = permissions.value.map(permission => ({
    ...permission,
    read: val,
    write: val,
    create: val,
  }))
})

watch(isIndeterminate, () => {
  if (!isIndeterminate.value) isSelectAll.value = false
})

watch(permissions, () => {
  if (checkedCount.value === permissions.value.length * 3) isSelectAll.value = true
}, { deep: true })

watch(props, () => {
  if (props.rolePermissions && props.rolePermissions.permissions.length) {
    role.value = props.rolePermissions.name
    permissions.value = permissions.value.map(permission => {
      const rolePermission = props.rolePermissions?.permissions.find(item => item.name === permission.name)
      if (rolePermission) {
        return {
          ...permission,
          ...rolePermission,
        }
      }
      
      return permission
    })
  }
})

onMounted(() => {
  fetchPermissions()
})

const onSubmit = async () => {
  const rolePermissions = {
    name: role.value,
    permissions: permissions.value,
  }

  // PATCH /credentials API
  try {
    await fetch(`${import.meta.env.VITE_API_CRM}/credentials/${props.rolePermissions.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: role.value,
        position: role.value, // Assuming position is same as role name
      }),
    })
  } catch (err) {
    console.error('Error updating role:', err)
  }

  // PATCH /credential-abilities API
  try {
    await Promise.all(permissions.value.map(permission => {
      return fetch(`${import.meta.env.VITE_API_CRM}/credential-abilities`, {
        method: 'PATCH',
        headers: {
          'Authorization': `${import.meta.env.VITE_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: props.rolePermissions.id,
          action: permission.read || permission.write || permission.create ? 'manage' : 'none',
          subject: permission.name,
        }),
      })
    }))
  } catch (err) {
    console.error('Error updating permissions:', err)
  }

  emit('update:rolePermissions', rolePermissions)
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  refPermissionForm.value?.reset()
}

const onReset = () => {
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  refPermissionForm.value?.reset()
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="onReset"
  >
    <VCard class="pa-sm-8 pa-5">
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="onReset"
      />

      <VCardText class="mt-5">
        <div class="text-center mb-6">
          <h4 class="text-h4 mb-2">
            {{ props.rolePermissions.name ? 'Edit' : 'Add' }} Role
          </h4>
        </div>

        <VForm ref="refPermissionForm">
          <VTextField
            v-model="role"
            label="Role Name"
            placeholder="Enter Role Name"
          />

          <h5 class="text-h5 my-6">
            Role Permissions
          </h5>

          <VTable class="permission-table text-no-wrap">
            <tr>
              <td class="text-h6">
                Administrator Access
              </td>
              <td colspan="3">
                <div class="d-flex justify-end">
                  <VCheckbox
                    v-model="isSelectAll"
                    v-model:indeterminate="isIndeterminate"
                    label="Select All"
                  />
                </div>
              </td>
            </tr>

            <template
              v-for="permission in permissions"
              :key="permission.name"
            >
              <tr>
                <td class="text-h6">
                  {{ permission.name }}
                </td>
                <td style="inline-size: 5.75rem;">
                  <div class="d-flex justify-end">
                    <VCheckbox
                      v-model="permission.read"
                      label="Read"
                    />
                  </div>
                </td>
                <td style="inline-size: 5.75rem;">
                  <div class="d-flex justify-end">
                    <VCheckbox
                      v-model="permission.write"
                      label="Write"
                    />
                  </div>
                </td>
                <td style="inline-size: 5.75rem;">
                  <div class="d-flex justify-end">
                    <VCheckbox
                      v-model="permission.create"
                      label="Create"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </VTable>

          <div class="d-flex align-center justify-center gap-3 mt-6">
            <VBtn @click="onSubmit">
              Submit
            </VBtn>

            <VBtn
              color="secondary"
              variant="outlined"
              @click="onReset"
            >
              Cancel
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.permission-table {
  td {
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-block: 0.5rem;

    .v-checkbox {
      min-inline-size: 4.75rem;
    }

    &:not(:first-child) {
      padding-inline: 0.5rem;
    }

    .v-label {
      white-space: nowrap;
    }
  }
}
</style>
