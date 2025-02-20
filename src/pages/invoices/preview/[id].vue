<!-- views/apps/invoice/[id].vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoice } from '@/composables/useInvoice'
import { ErpFileService } from '@/services/erpFileService'
import { $crmApi } from '@/api/crmApi'
import Message from '@/components/Message.vue'

// Page metadata
definePage({
  meta: {
    subject: 'INVOICE_DETAIL_VIEW',
  },
})

// Router and route
const route = useRoute()
const router = useRouter()

// Component state
const isAddPaymentSidebarVisible = ref(false)
const isSendPaymentSidebarVisible = ref(false)
const downloadInProgress = ref(false)

// Dialog states
const isConfirmDialogOpen = ref(false)
const isReviseDialogOpen = ref(false)
const revisionNote = ref('')

// Get invoice functionality from composable
const {
  invoice,
  attachments,
  loading,
  error,
  fetchInvoice,
} = useInvoice(route.params.id)

// User Type Check
const userData = useCookie('userData').value
const isCustomerUser = computed(() => userData?.tenantType === 'CUSTOMER')

// File extension to icon mapping
const getFileIcon = fileName => {
  if (!fileName) return 'ri-file-unknown-line'
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const iconMap = {
    // Documents
    'pdf': 'ri-file-pdf-line',
    'doc': 'ri-file-word-line',
    'docx': 'ri-file-word-line',
    'xls': 'ri-file-excel-line',
    'xlsx': 'ri-file-excel-line',
    'ppt': 'ri-file-ppt-line',
    'pptx': 'ri-file-ppt-line',
    'txt': 'ri-file-text-line',
    'rtf': 'ri-file-text-line',
    
    // Images
    'jpg': 'ri-image-line',
    'jpeg': 'ri-image-line',
    'png': 'ri-image-line',
    'gif': 'ri-image-line',
    'svg': 'ri-image-line',
    'webp': 'ri-image-line',
    
    // Archives
    'zip': 'ri-file-zip-line',
    'rar': 'ri-file-zip-line',
    '7z': 'ri-file-zip-line',
    'tar': 'ri-file-zip-line',
    'gz': 'ri-file-zip-line',
    
    // Code
    'html': 'ri-html5-line',
    'css': 'ri-css3-line',
    'js': 'ri-javascript-line',
    'json': 'ri-code-line',
    'xml': 'ri-code-line',
    'py': 'ri-code-line',
    'java': 'ri-code-line',
    'cpp': 'ri-code-line',
    
    // Media
    'mp3': 'ri-music-line',
    'wav': 'ri-music-line',
    'mp4': 'ri-movie-line',
    'avi': 'ri-movie-line',
    'mkv': 'ri-movie-line',
    
    // Others
    'csv': 'ri-file-list-line',
    'md': 'ri-markdown-line',
  }
  
  return iconMap[extension] || 'ri-file-line'
}

// Computed properties
const pdfViewerUrl = computed(() => 
  invoice.value?.fileUrl ? `${invoice.value.fileUrl}/view` : null,
)

const pdfDownloadUrl = computed(() => 
  invoice.value?.fileUrl ? `${invoice.value.fileUrl}/download` : null,
)

const showPdfViewer = computed(() => 
  !loading.value && !error.value && invoice.value?.id && pdfViewerUrl.value,
)

const showErrorState = computed(() => 
  !loading.value && error.value,
)

const canPerformActions = computed(() => 
  !loading.value && !downloadInProgress.value && invoice.value?.id && isCustomerUser.value,
)

// Methods
const handleActionError = (error, action) => {
  console.error(`Failed to ${action}:`, error)

  // Add toast notification here
}

const downloadFile = async file => {
  if (!file?.downloadUrl || downloadInProgress.value) return

  downloadInProgress.value = true
  try {
    // Attachment menggunakan mode normal download
    await ErpFileService.downloadFile(file.downloadUrl, false)
  } catch (error) {
    handleActionError(error, 'download file')
    useToast().error({
      title: 'Download Failed',
      message: 'Unable to download the file. Please try again later.',
    })
  } finally {
    downloadInProgress.value = false
  }
}

const downloadInvoice = async () => {
  if (!pdfDownloadUrl.value || downloadInProgress.value) return

  downloadInProgress.value = true
  try {
    // Invoice menggunakan mode direct URL (open in new tab)
    await ErpFileService.downloadFile(pdfDownloadUrl.value, true)
  } catch (error) {
    console.error('Failed to open invoice:', error)
    useToast().error({
      title: 'Open Failed',
      message: 'Unable to open the invoice. Please try again later.',
    })
  } finally {
    downloadInProgress.value = false
  }
}

// Invoice action handlers
const openConfirmDialog = () => {
  if (!canPerformActions.value) return
  isConfirmDialogOpen.value = true
}

const openReviseDialog = () => {
  if (!canPerformActions.value) return
  revisionNote.value = ''
  isReviseDialogOpen.value = true
}

const confirmInvoiceDisagree = () => {
  isConfirmDialogOpen.value = false
}

const confirmInvoice = async () => {
  try {
    await $crmApi(
      `/invoices/${invoice.value.id}/accept-action`,
      {
        method: 'POST',
        body: JSON.stringify({ note: null }),
      },
    )

  } catch (error) {
    handleActionError(error, 'confirm invoice')
  } finally {
    isConfirmDialogOpen.value = false
  }
}

const reviseInvoice = async () => {
  if (!revisionNote.value.trim()) {
    // Add validation error notification here
    return
  }

  try {
    await $crmApi(
      `/invoices/${invoice.value.id}/revise-action`,
      {
        method: 'POST',
        body: JSON.stringify({ note: revisionNote.value.trim() }),
      },
    )

  } catch (error) {
    handleActionError(error, 'revise invoice')
  } finally {
    isReviseDialogOpen.value = false
  }
}

onMounted(async () => {
  await fetchInvoice()
})

const isInvoiceLoaded = computed(() => !loading.value && !error.value && invoice.value)
</script>

<template>
  <section>
    <VRow>
      <VCol
        cols="12"
        md="9"
      >
        <VCard
          v-if="loading"
          class="invoice-preview-wrapper pa-12 d-flex justify-center align-center"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
        </VCard>
        <VCard
          v-else-if="showErrorState"
          class="invoice-preview-wrapper pa-12"
        >
          <VAlert
            type="error"
            title="Error Loading Invoice"
            :text="error"
            variant="tonal"
          >
            <template #append>
              <VBtn
                color="error"
                variant="text"
                @click="fetchInvoice"
              >
                Retry
              </VBtn>
            </template>
          </VAlert>
        </VCard>
        <VCard
          v-else-if="showPdfViewer"
          class="invoice-preview-wrapper pa-12"
        >
          <div class="pdf-viewer-wrapper">
            <iframe
              :src="pdfViewerUrl"
              width="100%"
              height="1280px"
              frameborder="0"
              title="Invoice PDF"
            />
          </div>
        </VCard>
        <VCard
          v-else-if="invoice?.id"
          class="invoice-preview-wrapper pa-12"
        >
          <VAlert
            type="info"
            text="No PDF Available for this invoice"
            variant="tonal"
          />
        </VCard>
      </VCol>
      <VCol
        cols="12"
        md="3"
        class="d-print-none"
      >
        <VCard class="mb-3">
          <VCardText>
            <VBtn
              block
              variant="outlined"
              color="secondary"
              class="mb-3"
              :disabled="!pdfDownloadUrl || downloadInProgress"
              :loading="downloadInProgress"
              @click="downloadInvoice"
            >
              {{ downloadInProgress ? 'Downloading...' : 'Download Invoice' }}
            </VBtn>
            <div
              v-if="isCustomerUser"
              class="d-flex gap-3"
            >
              <VBtn
                variant="outlined"
                color="secondary"
                class="flex-grow-1"
                :disabled="!canPerformActions"
                @click="openReviseDialog"
              >
                Revise
              </VBtn>
              <VBtn
                color="primary"
                class="flex-grow-1"
                :disabled="!canPerformActions"
                @click="openConfirmDialog"
              >
                Confirm
              </VBtn>
            </div>

            <!-- Attachments List -->
            <div
              v-if="attachments.length"
              class="mt-4"
            >
              <h3 class="text-h6 mb-2">
                Attachments ({{ attachments.length }})
              </h3>
              <VList>
                <VListItem
                  v-for="file in attachments"
                  :key="file.fileId"
                  :disabled="downloadInProgress"
                  ripple
                  @click="downloadFile(file)"
                >
                  <template #prepend>
                    <VIcon
                      :icon="downloadInProgress ? 'ri-loop-left-line' : getFileIcon(file.fileName)"
                      size="20"
                      class="me-2"
                      :color="downloadInProgress ? 'grey' : 'primary'"
                    />
                  </template>

                  <VListItemTitle>
                    {{ file.fileName }}
                  </VListItemTitle>
                  <VListItemSubtitle>
                    {{ file.mimeType }}
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </div>
          </VCardText>
        </VCard>
        
        <Message
          :invoice-id="route.params.id"
          :allow-send="true"
          :read-only="false"
          :max-message-length="500"
        />
      </VCol>
    </VRow>

    <!-- Confirm Dialog -->
    <VDialog
      v-if="isCustomerUser"
      v-model="isConfirmDialogOpen"
      persistent
      class="v-dialog-sm"
    >
      <VCard :title="`Confirm Invoice - ${invoice?.invoiceNo || 'Unknown'}`">
        <DialogCloseBtn
          variant="text"
          size="default"
          @click="isConfirmDialogOpen = false"
        />
        
        <VCardText>
          Are you sure you want to confirm this invoice?
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="error"
            @click="confirmInvoiceDisagree"
          >
            Disagree
          </VBtn>
          <VBtn
            color="success"
            @click="confirmInvoice"
          >
            Agree
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Revise Dialog -->
    <VDialog
      v-if="isCustomerUser"
      v-model="isReviseDialogOpen"
      max-width="500"
    >
      <VCard :title="`Revise Invoice - ${invoice?.invoiceNo || 'Unknown'}`">
        <VCardText>
          <VTextarea
            v-model="revisionNote"
            label="Revision Note"
            placeholder="Enter reason for revision"
            clearable
            required
            :rules="[v => !!v || 'Revision note is required']"
          />
        </VCardText>
        <VCardActions class="d-flex flex-row-reverse">
          <VBtn
            color="success"
            :disabled="!revisionNote.trim()"
            @click="reviseInvoice"
          >
            Submit
          </VBtn>
          <VBtn
            color="error"
            @click="isReviseDialogOpen = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
.invoice-preview-table {
  --v-table-header-color: var(--v-theme-surface);
}

.pdf-viewer-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

@media print {
  .invoice-header-preview,
  .invoice-preview-wrapper {
    padding: 0 !important;
  }

  .product-buy-now,
  .v-navigation-drawer,
  .layout-footer {
    display: none;
  }

  .v-card {
    box-shadow: none !important;
  }

  .print-row {
    flex-direction: row !important;
  }
}
</style>
