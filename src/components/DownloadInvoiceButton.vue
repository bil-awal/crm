<!-- src\components\DownloadInvoiceButton.vue -->
<script setup>
import { ref } from 'vue'
import { ErpFileService } from '@/services/erpFileService'

const props = defineProps({
  invoiceId: {
    type: [String, Number],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'outlined',
  },
  size: {
    type: String,
    default: 'x-small',
  },
  color: {
    type: String,
    default: 'primary',
  },
  class: {
    type: String,
    default: '',
  },
})

const downloadInProgress = ref(false)

const downloadInvoice = async () => {
  if (downloadInProgress.value) return

  downloadInProgress.value = true
  try {
    const downloadUrl = `${props.fileUrl}/download`

    await ErpFileService.downloadFile(downloadUrl, true)
  } catch (error) {
    console.error('Failed to download invoice:', error)
    useToast().error({
      title: 'Download Failed',
      message: 'Unable to download the invoice. Please try again later.',
    })
  } finally {
    downloadInProgress.value = false
  }
}
</script>

<template>
  <VBtn
    :variant="variant"
    :size="size"
    :color="color"
    :class="class"
    :loading="downloadInProgress"
    :disabled="downloadInProgress"
    @click.stop="downloadInvoice"
  >
    <VIcon
      icon="ri-download-2-line"
      size="16"
      class="me-1"
    />
    {{ downloadInProgress ? 'Downloading...' : '' }}
  </VBtn>
</template>
