<template>
  <VDialog
    v-model="isDialogVisible"
    persistent
    scrollable
    max-width="1200"
    style="zoom: 90%;"
  >
    <template #activator="{ props }">
      <IconBtn v-bind="props">
        <VIcon icon="ri-arrow-left-right-line" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          Switch Role
        </VTooltip>
      </IconBtn>
    </template>

    <VCard>
      <VToolbar
        style="zoom: 90%;"
        color="primary"
      >
        <VBtn
          icon
          variant="plain"
          @click="closeDialog"
        >
          <VIcon
            color="white"
            icon="ri-close-line"
          />
        </VBtn>

        <VToolbarTitle>Select Session</VToolbarTitle>

        <VSpacer />

        <VToolbarItems>
          <VBtn
            :disabled="noDataAvailable"
            variant="text"
            @click="saveChanges"
          >
            SAVE
          </VBtn>
        </VToolbarItems>
      </VToolbar>

      <VDivider />

      <VCardText class="mt-5">
        <VRow class="pt-2 pb-5">
          <VCol
            cols="12"
            md="4"
          >
            <VAutocomplete
              v-model="filterTitle"
              label="Filter by Role"
              clearable
              :items="filteredRoles"
              @input="applyFilters"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VAutocomplete
              v-model="filterClient"
              label="Filter by Client"
              clearable
              :items="filteredClients"
              @input="applyFilters"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VAutocomplete
              v-model="filterCompany"
              label="Filter by Company"
              clearable
              :items="filteredCompanies"
              @input="applyFilters"
            />
          </VCol>
        </VRow>

        <CustomRadios
          v-model:selected-radio="selectedRadio"
          :radio-content="filteredUserMapsRadioContent"
          :grid-column="{ sm: '6', cols: '12' }"
          :hide-checkbox="noDataAvailable"
        />
      </VCardText>
    </VCard>
  </VDialog>

  <VSnackbar
    v-model="isErrorMessageVisible"
    color="primary"
    location="top"
  >
    {{ errorMessage }}
    <template #actions>
      <VBtn
        color="error"
        @click="isErrorMessageVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<script setup>
import { eventBus } from '@/utils/eventBus'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const selectedRadio = ref('')
const isDialogVisible = ref(false)
const isErrorMessageVisible = ref(false)
const errorMessage = ref('')

const storedUserMaps = localStorage.getItem('userMaps')
const userMaps = ref(storedUserMaps ? JSON.parse(storedUserMaps) : [])

const activeMap = computed(() => {
  return userMaps.value
    ? userMaps.value.find(map => map.sessionActive) 
    : {}
})

const filterTitle = ref('')
const filterClient = ref('')
const filterCompany = ref('')

const filteredRoles = computed(() => {
  const roles = userMaps.value
    .filter(map => {
      return (
        (!filterClient.value || map.client?.name === filterClient.value) &&
        (!filterCompany.value || map.company?.name === filterCompany.value)
      )
    })
    .map(map => map.credential.position)

  
  return Array.from(new Set(roles))
})

const filteredClients = computed(() => {
  const clients = userMaps.value
    .filter(map => {
      return (
        (!filterTitle.value || map.credential.position === filterTitle.value) &&
        (!filterCompany.value || map.company?.name === filterCompany.value)
      )
    })
    .map(map => map.client?.name || 'All')

  
  return Array.from(new Set(clients))
})

const filteredCompanies = computed(() => {
  const companies = userMaps.value
    .filter(map => {
      return (
        (!filterTitle.value || map.credential.position === filterTitle.value) &&
        (!filterClient.value || map.client?.name === filterClient.value)
      )
    })
    .map(map => map.company?.name || 'All')

  
  return Array.from(new Set(companies))
})

const ability = useAbility()
const userDataCookie = useCookie('userData')
const accessTokenCookie = useCookie('crmAccessToken')
const userAbilityRulesCookie = useCookie('userAbilityRules')

const userMapsRadioContent = computed(() =>
  userMaps.value.map((map, index) => ({
    title: map.credential.position,
    desc: `Client: <b>${map.client ? map.client.name : 'All'}</b><br>Company: <b>${map.company ? map.company.name : 'All'}</b>`,
    value: map.id,
    subtitle: `${map.sessionActive ? 'ACTIVE' : ''}${map.isDefault ? (map.sessionActive ? ' / ' : '') + 'DEFAULT' : ''}`,
    checkbox: ref(false),
    default: map.isDefault,
    index,
  })),
)

const filteredUserMapsRadioContent = computed(() => {
  const filteredMaps = userMapsRadioContent.value.filter(map => {
    const matchesTitle = filterTitle.value ? map.title.toLowerCase().includes(filterTitle.value.toLowerCase()) : true
    const matchesClient = filterClient.value ? map.desc.toLowerCase().includes(`client: <b>${filterClient.value.toLowerCase()}`) : true
    const matchesCompany = filterCompany.value ? map.desc.toLowerCase().includes(`company: <b>${filterCompany.value.toLowerCase()}`) : true

    return matchesTitle && matchesClient && matchesCompany
  })


  // Remove duplicates based on the value field
  return filteredMaps.reduce((acc, current) => {
    const x = acc.find(item => item.value === current.value && item.desc === current.desc)
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])
})

const noDataAvailable = computed(() => {
  return filteredUserMapsRadioContent.value.length === 0
})

const applyFilters = () => {
  // No specific logic needed here as the computed properties handle the filtering
}

const resetAll = () => {
  accessTokenCookie.value = null
  userDataCookie.value = null
  userAbilityRulesCookie.value = null
  ability.update([])
  localStorage.setItem('userMaps', null)
}

const saveChanges = async () => {
  if (selectedRadio.value) {
    const body = {
      mapId: selectedRadio.value,
      token: accessTokenCookie.value,
    }

    try {
      const result = await $crmApi('/auth/session-change', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (result.resultCode === 1) {
        resetAll()
        updateUserState(result.data)
        eventBus.value.emit('updateUserRoles')
        eventBus.value.emit('sessionChanged', result.data)

        // Update the "ACTIVE" status for userMaps
        userMaps.value.forEach(map => {
          map.sessionActive = map.id === selectedRadio.value
        })

        await nextTick(() => {
          router.replace(route.query.to ? String(route.query.to) : '/')
        })
      } else {
        throw new Error('Unexpected result code')
      }
    } catch (error) {
      handleError(error)
    } finally {
      isDialogVisible.value = false
    }
  }
}

const updateUserState = data => {
  let userRole = ''
  let userPosition = ''

  const userAbilityRules = data.maps.reduce((acc, map) => {
    if (map.sessionActive) {
      userRole = map.credential.role
      userPosition = map.credential.position
      
      return map.credential.abilities
    }
    
    return acc
  }, [])

  const userData = {
    name: data.name,
    email: data.email,
    avatar: data.avatar,
    role: userRole,
    position: userPosition,
    maps: data.maps[0],
  }

  const accessToken = data.secrets[0].token

  userAbilityRulesCookie.value = userAbilityRules
  ability.update(userAbilityRules)

  userDataCookie.value = userData
  accessTokenCookie.value = accessToken
  localStorage.setItem('userMaps', JSON.stringify(data.maps))
}

const handleError = error => {
  errorMessage.value = error.message || 'An error occurred'
  isErrorMessageVisible.value = true
}

const closeDialog = () => {
  isDialogVisible.value = false
}

watch([filterTitle, filterClient, filterCompany], applyFilters)

const updateDefaultSession = value => {
  userMaps.value.forEach(map => {
    map.isDefault = map.id === value
  })
}

onMounted(() => {
  eventBus.value.on('customRadiosUpdated', async value => {
    selectedRadio.value = value
    await saveChanges()
    updateDefaultSession(value)
  })
})

onBeforeUnmount(() => {
  eventBus.value.off('customRadiosUpdated')
})
</script>
