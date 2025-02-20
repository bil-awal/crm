<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'submit',
])

const emailFrom = ref('client.staff@email.com')
const emailTo = ref('billing.admin@email.com')
const invoiceSubject = ref('Revision of Fleet Order Invoice - 1120900')

const paymentMessage = ref(`Dear PDT,

Below are the details of the revisions:

1. Invoice Number: [Original Invoice Number]
2. Date of Original Invoice: [Original Invoice Date]
3. Description of Goods/Services: [Description of Fleet Vehicles]
4. Quantity: [Original Quantity]
5. Unit Price: [Original Unit Price]
6. Revised Quantity: [Corrected Quantity]
7. Revised Unit Price: [Corrected Unit Price]
8. Subtotal: [Original Subtotal]
9. Revised Subtotal: [Corrected Subtotal]
10. Reason for Revision: [Brief explanation of why the revision was necessary, e.g., correction of pricing error, additional units added, etc.]

Please note that the total amount has been adjusted accordingly to reflect the changes mentioned above. The revised total amount payable is now [Revised Total Amount].

We apologize for any inconvenience this revision may cause and appreciate your understanding and cooperation in ensuring accurate billing for our transactions. If you have any questions or need further clarification regarding this revision, please don't hesitate to reach out to us.

Thank you for your attention to this matter.

Warm regards,`)

const onSubmit = () => {
  emit('update:isDrawerOpen', false)
  emit('submit', {
    emailFrom: emailFrom.value,
    emailTo: emailTo.value,
    invoiceSubject: invoiceSubject.value,
    paymentMessage: paymentMessage.value,
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    location="end"
    :width="400"
    :model-value="props.isDrawerOpen"
    class="scrollable-content"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Header -->
    <AppDrawerHeaderSection
      title="Invoice Revision Request"
      @cancel="$emit('update:isDrawerOpen', false)"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="emailFrom"
                  label="From"
                  placeholder="sender@email.com"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="emailTo"
                  label="To"
                  placeholder="receiver@email.com"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="invoiceSubject"
                  label="Subject"
                  placeholder="Title"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="paymentMessage"
                  rows="10"
                  label="Message"
                  placeholder="Message"
                />
              </VCol>

              <VCol cols="12">
                <div class="mb-6">
                  <VChip
                    label
                    color="primary"
                    size="small"
                  >
                    <VIcon
                      start
                      icon="ri-links-line"
                    />
                    Invoice Attached
                  </VChip>
                </div>
                <VBtn
                  type="submit"
                  class="me-3"
                >
                  Send
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="$emit('update:isDrawerOpen', false)"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
