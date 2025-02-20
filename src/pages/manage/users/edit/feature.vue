<!-- [id]-feature-[roleType].vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { $crmApi } from '@/api/crmApi'

definePage({
  meta: {
    subject: `USER_MANAGEMENT_EDIT`,
  },
})


const route = useRoute()
const router = useRouter()

const roleType = route.params.roleType
const userId = route.params.id

// Snackbar state
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')

// Feature Permissions State
const featurePermissions = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)

const showSnackbar = message => {
  snackbarMessage.value = message
  isSnackbarVisible.value = true
}

// Toggle feature permission
const toggleFeature = (domainId, featureId) => {
  const domainIndex = featurePermissions.value.findIndex(d => d.id === domainId)
  if (domainIndex === -1) return

  const featureIndex = featurePermissions.value[domainIndex].availableFeatures
    .findIndex(f => f.id === featureId)

  if (featureIndex === -1) return

  const updatedDomains = [...featurePermissions.value]
  const updatedFeatures = [...updatedDomains[domainIndex].availableFeatures]
  
  updatedFeatures[featureIndex] = {
    ...updatedFeatures[featureIndex],
    enabled: !updatedFeatures[featureIndex].enabled,
  }

  updatedDomains[domainIndex] = {
    ...updatedDomains[domainIndex],
    availableFeatures: updatedFeatures,
  }

  featurePermissions.value = updatedDomains
}

// Fetch feature permissions
const fetchFeaturePermissions = async () => {
  isLoading.value = true
  try {
    const response = await $crmApi(`/admin/user/${userId}/permission/features/${roleType}`)
    if (response) {
      featurePermissions.value = response.map(domain => ({
        ...domain,
        availableFeatures: domain.availableFeatures.map(feature => ({
          ...feature,
          enabled: !!feature.enabled,
        })),
      }))
    }
  } catch (error) {
    console.error(`Error fetching ${roleType} feature permissions:`, error)
    showSnackbar(`Failed to load ${roleType} permissions`)
  } finally {
    isLoading.value = false
  }
}

// Handle save
const handleSave = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      features: featurePermissions.value
        .flatMap(domain => 
          domain.availableFeatures
            .filter(feature => feature.enabled)
            .map(feature => feature.id),
        ),
    }

    await $crmApi(`/admin/user/${userId}/permission/features/${roleType}`, {
      method: 'POST',
      body: payload,
    })

    showSnackbar('Permissions updated successfully')
    router.push(`/manage/users/${userId}`)
  } catch (error) {
    showSnackbar('Failed to update permissions')
    console.error('Error updating permissions:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchFeaturePermissions()
})
</script>

<template>
  <VCard>
    <VCardTitle>{{ roleType }} Feature Permissions</VCardTitle>
    <VCardText>
      <VRow>
        <!-- Loading overlay -->
        <VOverlay :model-value="isLoading">
          <VProgressCircular
            indeterminate
            size="64"
          />
        </VOverlay>

        <!-- Feature Permissions -->
        <VCol cols="12">
          <div 
            v-for="domain in featurePermissions"
            :key="domain.id"
            class="mb-6"
          >
            <VCard class="mb-4">
              <VCardTitle class="text-subtitle-1 py-2">
                {{ domain.name }} ({{ domain.code }})
              </VCardTitle>
              <VCardText>
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th class="text-left">
                        Feature
                      </th>
                      <th class="text-left">
                        Code
                      </th>
                      <th class="text-center">
                        Enabled
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="feature in domain.availableFeatures"
                      :key="feature.id"
                    >
                      <td>{{ feature.name }}</td>
                      <td class="text-caption">
                        {{ feature.code }}
                      </td>
                      <td class="text-center">
                        <VCheckbox
                          :model-value="feature.enabled"
                          density="compact"
                          hide-details
                          @update:model-value="toggleFeature(domain.id, feature.id)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCardText>
            </VCard>
          </div>
        </VCol>

        <!-- Form Actions -->
        <VCol
          cols="12"
          class="d-flex gap-4"
        >
          <VBtn
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSave"
          >
            {{ isSubmitting ? 'Updating Permissions...' : 'Update Permissions' }}
          </VBtn>
          <VBtn
            color="secondary"
            variant="outlined"
            :disabled="isSubmitting"
            @click="router.push(`/manage/users/${userId}`)"
          >
            Cancel
          </VBtn>
        </VCol>
      </VRow>
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

.v-card {
  --v-card-elevation: 0;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-card .v-card-title {
  font-size: 1rem;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-card .v-card-text {
  padding: 16px;
}

.text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>

