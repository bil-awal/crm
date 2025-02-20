<script setup>
const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  data: {
    type: Object,
    required: true,
    default: () => ({
      credentialId: '',
      companyId: '',
    }),
  },
})

const emit = defineEmits(['removeRole'])

const credentialId = ref(props.data.credentialId)
const companyId = ref(props.data.companyId)

const removeRole = () => {
  emit('removeRole', props.id)
}

// Example options for credentials and companies
const credentialOptions = ref([
  { value: 'cred1', text: 'Credential 1' },
  { value: 'cred2', text: 'Credential 2' },
])

const companyOptions = ref([
  { value: 'comp1', text: 'Company 1' },
  { value: 'comp2', text: 'Company 2' },
])
</script>

<template>
  <div class="add-products-header mb-2 d-none d-md-flex mb-4">
    <VRow class="me-10">
      <VCol cols="6">
        <h6 class="text-h6">
          Role
        </h6>
      </VCol>
      <VCol cols="6">
        <h6 class="text-h6 ps-2">
          Company
        </h6>
      </VCol>
    </VRow>
  </div>

  <VCard
    flat
    border
    class="d-flex flex-sm-row flex-column-reverse"
  >
    <!-- 👉 Left Form -->
    <div class="pa-5 flex-grow-1">
      <VRow>
        <VCol cols="6">
          <VSelect
            v-model="credentialId"
            :items="credentialOptions"
            :rules="[requiredValidator]"
            label="Credential"
          />
        </VCol>
        <VCol cols="6">
          <VSelect
            v-model="companyId"
            :items="companyOptions"
            :rules="[requiredValidator]"
            label="Company"
          />
        </VCol>
      </VRow>
    </div>

    <!-- 👉 Item Actions -->
    <div
      class="d-flex flex-column align-end item-actions"
      :class="$vuetify.display.smAndUp ? 'border-s' : 'border-b' "
    >
      <IconBtn @click="removeRole">
        <VIcon
          :size="20"
          icon="ri-close-line"
        />
      </IconBtn>
    </div>
  </VCard>
</template>
