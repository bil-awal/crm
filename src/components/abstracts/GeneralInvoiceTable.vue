<template>
  <VCard>
    <VCardTitle>{{ title }}</VCardTitle>

    <VDivider />

    <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :headers="headers"
      :items="tableData"
      :items-length="totalData"
      class="text-no-wrap rounded-0"
      @update:options="updateOptions"
    >
      <template #item.actions="{ item }">
        <VBtn
          rounded="pill"
          size="x-small"
          color="primary"
          class="me-2"
          @click="handleAction(item, 'confirm')"
        >
          Confirm
        </VBtn>
        <VBtn
          rounded="pill"
          size="x-small"
          color="primary"
          variant="outlined"
          @click="openReviseDialog(item)"
        >
          Revise
        </VBtn>
      </template>
    </VDataTableServer>

    <VDialog
      v-model="isReviseDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle>Revise Invoice</VCardTitle>
        <VCardText>
          <VTextField
            v-model="revisionNote"
            label="Revision Note"
            placeholder="Enter reason for revision"
            clearable
            required
          />
        </VCardText>
        <VCardActions>
          <VBtn
            color="primary"
            @click="reviseInvoice"
          >
            Submit
          </VBtn>
          <VBtn
            text
            @click="isReviseDialogOpen = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { confirmInvoiceAPI, reviseInvoiceAPI } from '@/services/invoiceService'

const props = defineProps({
  title: String,
  apiFunction: Function, // Passed dynamic API function from the parent component
  headers: Array, // Dynamic headers
})

const itemsPerPage = ref(10)
const page = ref(1)
const tableData = ref([])
const totalData = ref(0)
const isReviseDialogOpen = ref(false)
const revisionNote = ref('')
const selectedInvoiceId = ref(null)

// Load invoices on component mount
onMounted(async () => {
  await loadInvoices()
})

// Function to load invoices from the API
async function loadInvoices() {
  try {
    const queryParams = buildQueryParams({
      page: page.value,
      size: itemsPerPage.value,
    })

    const response = await props.apiFunction(queryParams)
    if (response && response.items && Array.isArray(response.items)) {
      tableData.value = response.items
      totalData.value = response.totalItems || 0
    } else {
      console.error('Unexpected response structure:', response)
      tableData.value = []
    }
  } catch (error) {
    console.error('Error loading invoices:', error)
    tableData.value = []
  }
}

// Build query parameters for API requests
function buildQueryParams(params = {}) {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

// Handle confirm and revise actions
async function handleAction(item, actionType) {
  try {
    if (actionType === 'confirm') {
      await confirmInvoiceAPI(item.id)
    } else if (actionType === 'revise') {
      openReviseDialog(item)
    }
    await loadInvoices() // Refresh after action
  } catch (error) {
    console.error(`Error handling ${actionType} action:`, error)
  }
}

// Open revise dialog
function openReviseDialog(item) {
  selectedInvoiceId.value = item.id
  revisionNote.value = ''
  isReviseDialogOpen.value = true
}

// Revise invoice
async function reviseInvoice() {
  try {
    await reviseInvoiceAPI(selectedInvoiceId.value, revisionNote.value)
    isReviseDialogOpen.value = false
    await loadInvoices()
  } catch (error) {
    console.error('Error revising invoice:', error)
  }
}

// Update pagination and sorting options
function updateOptions(options) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  loadInvoices()
}
</script>
