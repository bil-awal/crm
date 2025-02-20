<template>
  <VRadioGroup
    v-if="groupedRadioContent && Object.keys(groupedRadioContent).length > 0"
    :model-value="selectedRadio"
    @update:model-value="updateSelectedOption"
  >
    <VRow>
      <VCol
        v-for="(item, role) in groupedRadioContent"
        :key="role"
        sm="6"
        cols="12"
      >
        <VLabel
          class="custom-input custom-radio rounded cursor-pointer"
          :class="selectedRadio === item.value ? 'active' : ''"
        >
          <div>
            <VRadio :value="item.value" />
          </div>
          <slot :item="item">
            <div class="flex-grow-1">
              <div class="d-flex align-center mb-2">
                <h6 class="cr-title text-base">
                  {{ role }}
                </h6>
                <VSpacer />
                <span
                  v-if="item.subtitle"
                  class="text-primary text-sm"
                ><b>{{ item.subtitle }}</b></span>
              </div>
              <div class="d-flex align-center mb-2">
                <div>
                  <p class="text-sm text-medium-emphasis mb-2">
                    <b>Clients:</b>
                  </p>
                  <ul class="text-sm text-medium-emphasis mb-3">
                    <li
                      v-for="client in item.clients"
                      :key="client"
                    >
                      {{ client }}
                    </li>
                  </ul>
                  <p class="text-sm text-medium-emphasis mb-2">
                    <b>Companies:</b>
                  </p>
                  <ul class="text-sm text-medium-emphasis">
                    <li
                      v-for="company in item.companies"
                      :key="company"
                    >
                      {{ company }}
                    </li>
                  </ul>
                </div>
                <VSpacer />
                <VBtn
                  v-if="!item.default"
                  size="x-small"
                  color="secondary"
                  rounded="lg"
                  @click="setDefault(item.value)"
                >
                  SET DEFAULT
                </VBtn>
              </div>
            </div>
          </slot>
        </VLabel>
      </VCol>
    </VRow>
  </VRadioGroup>

  <div
    v-if="Object.keys(groupedRadioContent).length === 0"
    class="text-center"
  >
    No data available
  </div>
</template>

<script setup>
const props = defineProps({
  selectedRadio: {
    type: String,
    required: true,
  },
  radioContent: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:selectedRadio'])

const updateSelectedOption = value => {
  if (value !== null) emit('update:selectedRadio', value)
}

const setDefault = async value => {
  try {
    const response = await $crmApi('/auth/change-default-map', {
      method: 'POST',
      body: JSON.stringify({
        authMapId: value,
      }),
    })

    if (response.resultCode === 1) {
      eventBus.value.emit('customRadiosUpdated', value)
    } else {
      console.error('Failed to set default:', response.message)
    }
  } catch (error) {
    console.error('API error:', error)
  }
}

// Grouping the radio content by role
const groupedRadioContent = computed(() => {
  const grouped = {}

  props.radioContent.forEach(map => {
    const role = map.title

    if (!grouped[role]) {
      grouped[role] = {
        value: map.value,
        subtitle: map.subtitle,
        clients: new Set(),
        companies: new Set(),
        default: map.default,
      }
    }

    grouped[role].clients.add(map.desc.match(/Client: <b>(.*?)<\/b>/)[1])
    grouped[role].companies.add(map.desc.match(/Company: <b>(.*?)<\/b>/)[1])
  })

  // Convert Sets to Arrays
  for (const key in grouped) {
    grouped[key].clients = Array.from(grouped[key].clients)
    grouped[key].companies = Array.from(grouped[key].companies)
  }

  return grouped
})
</script>

<style lang="scss" scoped>
.custom-radio {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;

  .v-radio {
    margin-block-start: -0.45rem;
  }

  .cr-title {
    font-weight: 500;
  }
}
</style>
