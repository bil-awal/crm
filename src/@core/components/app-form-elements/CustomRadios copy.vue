<template>
  <VRadioGroup
    v-if="radioContent && radioContent.length > 0"
    :model-value="selectedRadio"
    @update:model-value="updateSelectedOption"
  >
    <VRow>
      <VCol
        v-for="item in radioContent"
        :key="item.value"
        v-bind="gridColumn"
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
                  {{ item.title }}
                </h6>
                <VSpacer />
                <span
                  v-if="item.subtitle"
                  class="text-primary text-sm"
                ><b>{{ item.subtitle }}</b></span>
              </div>
              <div class="d-flex align-center mb-2">
                <p
                  class="text-sm text-medium-emphasis mb-0"
                  v-html="item.desc"
                />
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
    v-if="radioContent.length === 0"
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
  gridColumn: {
    type: null,
    required: false,
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
