<template>
  <VCard>
    <!-- Header -->
    <VCardTitle class="py-3 px-4">
      <span>Invoices / Need Confirmation (New Invoice)</span>
    </VCardTitle>

    <!-- Widgets Section -->
    <VRow
      class="pa-4"
      style="zoom: 80%"
    >
      <VCol
        cols="12"
        md="4"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>Invoice Amount</VCardTitle>
            <template #append>
              <VIcon
                size="28"
                icon="ri-file-list-3-line"
                color="primary"
              />
            </template>
          </VCardItem>

          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">
                  {{ widgetData.invoiceAmount?.totalInvoice || 0 }}
                </div>
                <div class="text-subtitle-2">
                  Invoices
                </div>
              </div>
              <div class="text-right">
                <div class="text-h6">
                  {{ formatCurrency(widgetData.invoiceAmount?.totalAmount || 0) }}
                </div>
                <div class="text-subtitle-2 text-primary">
                  {{ (widgetData.invoiceAmount?.percentage || 0).toFixed(1) }}%
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>On Schedule Invoices</VCardTitle>
            <template #append>
              <VIcon
                size="28"
                icon="ri-time-line"
                color="success"
              />
            </template>
          </VCardItem>

          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">
                  {{ widgetData.onSchedule?.totalInvoice || 0 }}
                </div>
                <div class="text-subtitle-2">
                  Invoices
                </div>
              </div>
              <div class="text-right">
                <div class="text-h6">
                  {{ formatCurrency(widgetData.onSchedule?.totalAmount || 0) }}
                </div>
                <div class="text-subtitle-2 text-success">
                  {{ (widgetData.onSchedule?.percentage || 0).toFixed(1) }}%
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>Overdue Invoices</VCardTitle>
            <template #append>
              <VIcon
                size="28"
                icon="ri-error-warning-line"
                color="error"
              />
            </template>
          </VCardItem>

          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">
                  {{ widgetData.overDue?.totalInvoice || 0 }}
                </div>
                <div class="text-subtitle-2">
                  Invoices
                </div>
              </div>
              <div class="text-right">
                <div class="text-h6">
                  {{ formatCurrency(widgetData.overDue?.totalAmount || 0) }}
                </div>
                <div class="text-subtitle-2 text-error">
                  {{ (widgetData.overDue?.percentage || 0).toFixed(1) }}%
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters Section -->
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="2"
        >
          <VTextField
            v-model="filters.fromDate"
            type="date"
            label="From Date"
            clearable
          />
        </VCol>

        <VCol
          cols="12"
          md="2"  
        >
          <VTextField
            v-model="filters.toDate"
            type="date"
            label="To Date"
            clearable
          />
        </VCol>

        <VCol
          v-if="!isCustomerUser"
          cols="12"
          md="2"
        >
          <VAutocomplete
            v-model="filters.selectedCustomer"
            v-model:search-input="customerSearch"
            :items="customerList"
            :loading="isLoadingCustomers"
            item-title="title"
            item-value="value"
            label="Customer"
            clearable
            :disabled="isCustomerUser"
            hide-details
            :menu-props="{ maxHeight: '300px' }"
            @update:search="handleCustomerSearch"
          >
            <template #no-data>
              <VListItem>
                <VListItemTitle>
                  No customers found
                </VListItemTitle>
              </VListItem>
            </template>
          </VAutocomplete>
        </VCol>

        <VCol
          cols="12"
          md="2"
        >
          <VSelect
            v-model="filters.paymentStatus"
            :items="paymentStatusOptions"
            label="Payment Status"
            clearable
          />
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="filters.search"
            label="Search"
            placeholder="Enter invoice number or receipt number"
            clearable
          />
        </VCol>
      </VRow>
    </VCardText>

    <!-- Action Buttons -->
    <div
      v-if="showActionButtons"
      class="px-4 py-2"
    >
      <div class="d-flex align-center gap-2">
        <VBtn
          v-if="canConfirmInvoices"
          color="success"
          size="default"
          @click="dialogState.confirm.open = true"
        >
          <VIcon start>
            ri-check-line
          </VIcon>
          Confirm {{ selectedItems.length }} invoice
        </VBtn>
     
        <VBtn
          v-if="canReviseInvoice"
          color="warning"
          size="default"
          @click="openReviseDialog"
        >
          <VIcon start>
            ri-edit-line
          </VIcon>
          Revise Invoice
        </VBtn>
      </div>
    </div>

    <VDivider />

    <!-- Data Table -->
    <VDataTableServer
      v-model:items-per-page="tableState.itemsPerPage"
      v-model:page="tableState.page"
      v-model:selected="selectedItems"
      :headers="tableHeaders"
      :items="tableState.data"
      :items-length="tableState.total"
      class="text-no-wrap rounded-0"
      @update:selected="handleSelectionUpdate"
      @update:options="updateTableOptions"
    >
      <!-- Selection Column -->
      <template 
        v-if="isCustomerUser" 
        #item.select="{ item }"
      >
        <VCheckbox
          v-model="selectedItems"
          :value="item"
          hide-details
          density="compact"
        />
      </template>

      <!-- Actions Column -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-2">
          <RouterLink :to="{ name: 'invoices-preview-id', params: { id: item.id } }">
            <VBtn
              icon
              size="x-small"
              color="primary"
              variant="text"
            >
              <VIcon>ri-eye-line</VIcon>
              <VTooltip activator="parent">
                View
              </VTooltip>
            </VBtn>
          </RouterLink>

          <VBtn
            icon
            size="x-small"
            color="primary"
            variant="text"
            @click="openMessageDialog(item.id)"
          >
            <VIcon>ri-message-2-line</VIcon>
            <div
              v-if="item.unreadMessages"
              class="message-badge"
            >
              {{ item.unreadMessages }}
            </div>
            <VTooltip activator="parent">
              Message
            </VTooltip>
          </VBtn>

          <DownloadInvoiceButton
            v-if="item.fileUrl"
            :invoice-id="item.id"
            :file-url="item.fileUrl"
            icon
            size="x-small"
            color="primary"
            variant="text"
          >
            <template #default>
              <VIcon>ri-download-line</VIcon>
            </template>
          </DownloadInvoiceButton>
       
          <VBtn
            v-else
            icon
            size="x-small"
            color="primary"
            variant="text"
            disabled
          >
            <VIcon>ri-download-line</VIcon>
          </VBtn>
        </div>
      </template>

      <!-- Number/Currency Columns -->
      <template #item.invoiceNo="{ item }">
        <div class="text-right">
          <RouterLink :to="{ name: 'invoices-preview-id', params: { id: item.id } }">
            {{ item.invoiceNo }}
          </RouterLink>
        </div>
      </template>

      <template #item.totalInvoice="{ item }">
        <div class="text-right">
          {{ item.totalInvoice }}
        </div>
      </template>

      <template #item.outstandingAmount="{ item }">
        <div class="text-right">
          {{ item.outstandingAmount }}
        </div>
      </template>

      <template #item.paidAmount="{ item }">
        <div class="text-right">
          {{ item.paidAmount }}
        </div>
      </template>

      <template #item.totalNetAmount="{ item }">
        <div class="text-right">
          {{ item.totalNetAmount }}
        </div>
      </template>

      <!-- Status Columns -->
      <template #item.paymentStatus="{ item }">
        <VChip
          size="x-small"
          :color="getPaymentStatusConfig(item.paymentStatus).color"
        >
          {{ getPaymentStatusConfig(item.paymentStatus).label }}
        </VChip>
      </template>

      <template #item.revision="{ item }">
        <VChip
          size="x-small"
          :color="item.revision ? 'success' : 'default'"
        >
          {{ item.revision ? 'Revised' : 'Not Revised' }}
        </VChip>
      </template>
    </VDataTableServer>

    <!-- Confirmation Dialog -->
    <VDialog
      v-model="dialogState.confirm.open"
      max-width="500"
    >
      <VCard title="Confirm Invoices">
        <VCardText>
          <VTextarea
            v-model="confirmationNote"
            label="Confirmation Note"
            placeholder="Enter reason for confirmation (min 10 characters)"
            :rules="[v => v.length >= 10 || 'Minimum 10 characters required']"
            clearable
            required
          />
        </VCardText>
        <VCardActions class="d-flex flex-row-reverse">
          <VBtn
            color="success"
            @click="confirmSelectedInvoices"
          >
            Confirm
          </VBtn>
          <VBtn
            color="error"
            @click="dialogState.confirm.open = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Revise Dialog -->
    <VDialog
      v-model="dialogState.revise.open"
      max-width="500"
    >
      <VCard :title="`Revise Invoice - ${selectedItems[0]?.invoiceNo || 'Unknown'}`">
        <VCardText>
          <VTextarea
            v-model="dialogState.revise.note"
            label="Revision Note"
            placeholder="Enter reason for revision (min 10 characters)"
            :rules="[v => v.length >= 10 || 'Minimum 10 characters required']"
            clearable
            required
          />  
        </VCardText>
        <VCardActions class="d-flex flex-row-reverse">
          <VBtn
            color="success"
            @click="reviseInvoice"
          >
            Submit
          </VBtn>
          <VBtn
            color="error"
            @click="dialogState.revise.open = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Message Dialog -->
    <VDialog
      v-model="dialogState.message.open"
      max-width="800"
    >
      <VCard>
        <Message 
          v-if="dialogState.message.open"
          :invoice-id="dialogState.message.invoiceId"
          allow-send="true"
          :read-only="false"
          :max-message-length="500"
          message-order="asc"
          :message-background="{ user: 'bg-blue-100', other: 'bg-gray-100' }"
        />
        <VCardActions>
          <VSpacer />
          <VBtn @click="dialogState.message.open = false">
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Notifications -->
    <VSnackbar
      v-model="notification.show"
      :color="notification.color"
      location="top center"
      variant="tonal"
    >
      {{ notification.message }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { debounce } from 'lodash'
import { format, isValid, parseISO } from 'date-fns'
import { eventBus } from '@/utils/eventBus'
import { $crmApi } from '@/api/crmApi'
import Message from '@/components/Message.vue'
import DownloadInvoiceButton from '@/components/DownloadInvoiceButton.vue'

definePage({ meta: { subject: `INVOICE_LIST` } })

// State
const notification = ref({ show: false, message: '', color: 'success' })
const isLoadingCustomers = ref(false)

const widgetData = ref({
  overDue: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
  onSchedule: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
  invoiceAmount: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
})

const tableState = ref({
  data: [],
  total: 0,
  itemsPerPage: 10,
  page: 1,
  sortBy: 'invoiceNo',
  orderBy: 'asc',
  hasNext: false,
  hasPrev: false,
})

const filters = ref({
  search: '',
  fromDate: '',
  toDate: '',
  paymentStatus: null,
  selectedCustomer: null,
})

const customerList = ref([])
const selectedItems = ref([])
const isInReviseMode = ref(false)

const dialogState = ref({
  revise: { open: false, note: '' },
  message: { open: false, invoiceId: null },
  confirm: { open: false },
})

const confirmationNote = ref('')

// User info
const userData = useCookie('userData').value
const isCustomerUser = computed(() => userData?.tenantType === 'CUSTOMER')

// Computed
const canReviseInvoice = computed(() => selectedItems.value.length === 1)
const canConfirmInvoices = computed(() => selectedItems.value.length > 0)
const showActionButtons = computed(() => selectedItems.value.length > 0)

const selectedFilters = computed(() => {
  const filtersArr = []

  if (filters.value.fromDate && filters.value.toDate) {
    filtersArr.push({
      field: 'invoiceDate',
      operator: 'btw',
      value: `${filters.value.fromDate}T00:00:00,${filters.value.toDate}T23:59:59`,
    })
  }

  if (filters.value.paymentStatus) {
    filtersArr.push({
      field: 'paymentStatus',
      operator: 'eq',  
      value: filters.value.paymentStatus,
    })
  }

  if (filters.value.selectedCustomer) {
    filtersArr.push({
      field: 'customerId',
      operator: 'eq',
      value: filters.value.selectedCustomer,
    })
  }

  return filtersArr
})

// API Methods
const fetchWidgetData = async () => {
  try {
    const response = await $crmApi('/dashboard/invoice-amount?menu=INVOICE_LIST')
    if (response.data) widgetData.value = response.data
  } catch (error) {
    console.error('Widget data error:', error)
  }
}

const fetchInvoices = debounce(async () => {
  try {
    const filtersQuery = selectedFilters.value
      .map(({ field, operator, value }) => `filter=${field},${operator},${value}`)
      .join('&')

    const params = {
      search: filters.value.search.trim(),
      size: tableState.value.itemsPerPage,
      page: tableState.value.page - 1,
    }

    const queryString = Object.entries(params)
      .filter(([_, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')

    const url = `/invoices/waiting-confirm?${queryString}${filtersQuery ? `&${filtersQuery}` : ''}&sort=${tableState.value.sortBy},${tableState.value.orderBy}`
   
    const response = await $crmApi(url)
   
    tableState.value.data = response.items.map(item => ({
      ...item,
      invoiceDate: formatDateTime(item.invoiceDate),
      dueDate: formatDateTime(item.dueDate),
      customerReceiveDate: formatDateTime(item.customerReceiveDate),
      statusTime: formatDateTime(item.statusTime),
      totalInvoice: formatCurrency(item.totalInvoice),
      outstandingAmount: formatCurrency(item.outstandingAmount),
      paidAmount: formatCurrency(item.paidAmount),
      totalNetAmount: formatCurrency(item.totalNetAmount),
    }))

    tableState.value.total = response.totalItems || 0
    tableState.value.hasNext = response.hasNext || false 
    tableState.value.hasPrev = response.hasPrev || false
  } catch (error) {
    console.error('Fetch invoices error:', error)
    tableState.value.data = []
  }
}, 300)

// Action Methods 
const handleSelectionUpdate = items => {
  selectedItems.value = items
  isInReviseMode.value = items.length === 1
}

const confirmSelectedInvoices = async () => {
  if (!canConfirmInvoices.value) return

  if (confirmationNote.value.trim().length < 10) {
    notification.value = {
      show: true,
      message: 'Please provide a confirmation note with at least 10 characters.',
      color: 'error',
    }
    
    return
  }

  try {
    await Promise.all(selectedItems.value.map(item => 
      $crmApi(`/invoices/${item.id}/accept-action`, {
        method: 'POST',
        body: JSON.stringify({ 
          invoiceIds: [item.id],
          note: confirmationNote.value,
        }),
      }),
    ))
   
    notification.value = {
      show: true,
      message: `Successfully confirmed ${selectedItems.value.length} invoice`,
      color: 'success',
    }
   
    selectedItems.value = []
    isInReviseMode.value = false
    confirmationNote.value = ''
    dialogState.value.confirm.open = false
    await fetchInvoices()
  } catch (error) {
    console.error('Confirm invoices error:', error)
    notification.value = {
      show: true,
      message: 'Failed to confirm selected invoices',
      color: 'error',
    }
  }
}

const openReviseDialog = () => {
  if (!canReviseInvoice.value) return
  dialogState.value.revise.note = ''
  dialogState.value.revise.open = true
}

const reviseInvoice = async () => {
  if (!canReviseInvoice.value) return

  if (dialogState.value.revise.note.trim().length < 10) {
    notification.value = {
      show: true,
      message: 'Please provide a revision note with at least 10 characters.',
      color: 'error',
    }
    
    return
  }

  try {
    await $crmApi(`/invoices/${selectedItems.value[0].id}/revise-action`, {
      method: 'POST',
      body: JSON.stringify({ note: dialogState.value.revise.note }),
    })
   
    notification.value = {
      show: true,
      message: 'Invoice revised successfully', 
      color: 'success',
    }
   
    selectedItems.value = []
    isInReviseMode.value = false
    dialogState.value.revise.open = false
    await fetchInvoices()
  } catch (error) {
    console.error('Revise invoice error:', error)
    notification.value = {
      show: true,
      message: 'Failed to revise invoice',
      color: 'error',
    }
  }
}

const openMessageDialog = invoiceId => {
  dialogState.value.message.invoiceId = invoiceId
  dialogState.value.message.open = true
}

const updateTableOptions = ({ sortBy: newSortBy }) => {
  if (Array.isArray(newSortBy) && newSortBy.length > 0) {
    if (tableState.value.sortBy === newSortBy[0].key) {
      tableState.value.orderBy = tableState.value.orderBy === 'asc' ? 'desc' : 'asc'
    } else {
      tableState.value.sortBy = newSortBy[0].key
      tableState.value.orderBy = 'asc' 
    }
  } else {
    tableState.value.sortBy = 'invoiceNo'
    tableState.value.orderBy = 'asc'
  }
  fetchInvoices()
}

// Helpers
const formatDateTime = dateString => {
  if (!dateString) return '-'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
 
  const formattedDate = format(date, 'dd MMM yyyy HH:mm')
  
  return formattedDate.endsWith('00:00') ? format(date, 'dd MMM yyyy') : formattedDate
}

const formatCurrency = value => {
  if (!value && value !== 0) return '-'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Constants
const paymentStatusConfigs = {
  NOT_PAID: { color: 'error', icon: 'ri-close-line', label: 'Not Paid' },
  PAID_HALF: { color: 'warning', icon: 'ri-time-line', label: 'Half Paid' },
  PAID_OFF: { color: 'success', icon: 'ri-check-line', label: 'Paid Full' },
}

const getPaymentStatusConfig = status => 
  paymentStatusConfigs[status] || { color: 'info', icon: 'ri-information-line', label: 'Unknown' }

const tableHeaders = [
  { title: '', key: 'select', sortable: false, width: '50px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' },
  ...(isCustomerUser.value ? [] : [{ title: 'Customer', key: 'customerName', sortable: true }]),
  { title: 'Payment Status', key: 'paymentStatus', sortable: true },
  { title: 'Invoice No', key: 'invoiceNo', sortable: true },
  { title: 'Invoice Receipt No', key: 'invoiceReceiptNo', sortable: true },
  { title: 'Invoice Date', key: 'invoiceDate', sortable: true },
  { title: 'Due Date', key: 'dueDate', sortable: true },
  { title: 'Currency', key: 'currency', sortable: true },
  { title: 'Total Invoice', key: 'totalInvoice', sortable: true },
  { title: 'Outstanding Amount', key: 'outstandingAmount', sortable: true },
  { title: 'Paid Amount', key: 'paidAmount', sortable: true },
  { title: 'Total Net Amount', key: 'totalNetAmount', sortable: true },
  { title: 'Report Type', key: 'reportType', sortable: true },
  { title: 'Revision', key: 'revision', sortable: true },
  { title: 'Customer Receive By', key: 'customerReceiveBy', sortable: true },
  { title: 'Customer Receive Date', key: 'customerReceiveDate', sortable: true },
  { title: 'Admin', key: 'admin', sortable: true },
  { title: 'Status Time', key: 'statusTime', sortable: true },
]

// Add to state section
const customerSearch = ref('')
const originalCustomerList = ref([]) // Store original list

// Update fetchCustomerList method to store original list
const fetchCustomerList = async () => {
  if (isCustomerUser.value) return
 
  isLoadingCustomers.value = true
  try {
    const tenant = userData.value?.data?.tenant || 'PDT'
    if (!tenant) throw new Error('Tenant not found')

    const response = await $crmApi(`/common/customer/${tenant}?size=20`)
    if (!response.items?.length) throw new Error('No customers found')

    const formattedList = response.items.map(customer => ({
      value: customer.id,
      title: customer.name,
    }))
    
    originalCustomerList.value = formattedList // Store original list
    customerList.value = formattedList
  } catch (error) {
    console.error('Customer list error:', error.message)
    originalCustomerList.value = []
    customerList.value = []
  } finally {
    isLoadingCustomers.value = false
  }
}

// Update handleCustomerSearch method
const handleCustomerSearch = async searchTerm => {
  // If search is empty, reset to original list
  if (!searchTerm || searchTerm.trim() === '') {
    customerList.value = [...originalCustomerList.value]
    isLoadingCustomers.value = false
    
    return
  }
  
  // Only search if term is 2 or more characters
  if (searchTerm.length < 2) return
  
  isLoadingCustomers.value = true
  try {
    const tenant = userData.value?.data?.tenant || 'PDT'
    if (!tenant) throw new Error('Tenant not found')

    const response = await $crmApi(`/common/customer/${tenant}?search=${encodeURIComponent(searchTerm)}`)
    if (!response.items?.length) {
      customerList.value = []
      
      return
    }
    
    customerList.value = response.items.map(customer => ({
      value: customer.id,
      title: customer.name,
    }))
  } catch (error) {
    console.error('Customer search error:', error.message)
    customerList.value = []
  } finally {
    isLoadingCustomers.value = false
  }
}

// Add watcher for selectedCustomer to handle clear
watch(() => filters.value.selectedCustomer, newValue => {
  if (newValue === null) {
    customerList.value = [...originalCustomerList.value]
    customerSearch.value = ''
  }
})

// Watchers
watch(
  [
    () => tableState.value.page,
    () => tableState.value.itemsPerPage,
    () => filters.value.paymentStatus,
    () => filters.value.fromDate,
    () => filters.value.toDate,
    () => filters.value.selectedCustomer,
  ],
  fetchInvoices,
)

watch(() => filters.value.search, (newValue, oldValue) => {
  if (newValue === '' && oldValue !== '') {
    // If search is cleared, fetch immediately
    fetchInvoices()
  } else {
    // Otherwise, use the debounced version
    debouncedFetchInvoices()
  }
})

// Create a debounced version of fetchInvoices
const debouncedFetchInvoices = debounce(fetchInvoices, 300)

// Payment status options
const paymentStatusOptions = [
  { title: 'All', value: null },
  { title: 'Not Paid', value: 'NOT_PAID' },
  { title: 'Half Paid', value: 'PAID_HALF' },
  { title: 'Paid Full', value: 'PAID_OFF' },
]

// Lifecycle
onMounted(() => {
  eventBus.value.on('filterChanged', () => {
    tableState.value.page = 1
    fetchInvoices()
  })
  fetchInvoices()
  fetchWidgetData()
  fetchCustomerList()
})

onBeforeUnmount(() => {
  eventBus.value.off('filterChanged')
})
</script>

<style scoped>
.v-data-table :deep(.text-right) {
  text-align: right;
}

.message-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}
</style>

