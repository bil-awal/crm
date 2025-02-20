<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

let isDialogVisible = ref(false)
const route = useRoute()
const invoiceId = ref(route.params.id)
const router = useRouter()

watchEffect(() => {
  if (route.query.accept === 'confirm') {
    isDialogVisible.value = true
  } else {
    isDialogVisible.value = false
  }
})

const handleDocumentAcceptance = async () => {
  try {
    const response = await acceptInvoice()
    if (response) {
      redirectToNextPage()
    }
  } catch (error) {
    console.error('Error handling document acceptance:', error)
  }
}

const acceptInvoice = async () => {
  // const response = await $api(`/api/invoices/accept/${invoiceId.value}`, {
  //   method: 'POST',
  //   body: {
  //     accept: true
  //   }
  // });
  // return response;
  return true
}

const redirectToNextPage = async () => {
  await nextTick(() => {
    router.replace(route.query.to ? String(route.query.to) : `/admin/invoices/success-confirm/${invoiceId.value}`)
  })
}
</script>


<template>
  <VDialog
    v-model="isDialogVisible"
    persistent
    class="v-dialog-sm"
  >
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn
        block
        color="success"
        v-bind="props"
      >
        <VIcon
          start
          icon="ri-check-line"
        />
        Accept
      </VBtn>
    </template>

    <!-- Dialog Content -->
    <VCard title="Document Acceptance">
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="isDialogVisible = false"
      />

      <VCardText>
        Dengan ini saya menyatakan penerimaan Invoice dengan nomor dokumen tersebut dari Pancaran Group pada tanggal tersebut.<br><br> 
        Saya memastikan kebenaran nominal pembayaran serta berkomitmen untuk membayarnya sesuai ketentuan yang ditetapkan.<br><br>
        Saya siap untuk mengkomunikasikan segala pertanyaan atau keberatan kepada perusahaan Pancaran Group.
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="error"
          @click="isDialogVisible = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="success"
          @click="handleDocumentAcceptance"
        >
          Confirm
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
