<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { debounce } from 'lodash'
import { format, isValid, parseISO } from 'date-fns'
import { eventBus } from '@/utils/eventBus'
import { $crmApi } from '@/api/crmApi'
import Message from '@/components/Message.vue'
import DownloadInvoiceButton from '@/components/DownloadInvoiceButton.vue'

definePage({
  meta: {
    subject: `INVOICE_PAYMENT_PAID_OFF_LIST`,
  },
})

// State
const notification = ref({
  show: false,
  message: '',
  color: 'success',
})

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
  sortBy: 'paymentDate',
  orderBy: 'desc',
  hasNext: false,
  hasPrev: false,
})

const filters = ref({
  search: '',
  invoicePeriodMonth: null,
  invoicePeriodYear: null,
  clientFilter: '',
  customerFilter: null,
  fromDate: '',
  toDate: '',
})

const customerList = ref([])
const selectedItems = ref([])

const dialogState = ref({
  revise: { open: false, note: '' },
  message: { open: false, invoiceId: null },
})

// User info
const userData = useCookie('userData').value
const isCustomerUser = computed(() => userData?.tenantType === 'CUSTOMER')

// Computed
const canReviseInvoice = computed(() => selectedItems.value.length === 1)
const showActionButtons = computed(() => selectedItems.value.length > 0)

const isSelectionDisabled = computed(() => item => {
  if (selectedItems.value.length === 0) return false
  if (selectedItems.value.length === 1) return selectedItems.value[0].id !== item.id
  
  return false
})

const selectedFilters = computed(() => {
  const filtersArr = []

  if (filters.value.fromDate && filters.value.toDate) {
    filtersArr.push({
      field: 'paymentDate',
      operator: 'btw',
      value: `${filters.value.fromDate}T00:00:00,${filters.value.toDate}T23:59:59`,
    })
  }

  if (filters.value.invoicePeriodMonth) {
    filtersArr.push({
      field: 'paymentDate',
      operator: 'month',
      value: filters.value.invoicePeriodMonth,
    })
  }

  if (filters.value.invoicePeriodYear) {
    filtersArr.push({
      field: 'paymentDate',
      operator: 'year',
      value: filters.value.invoicePeriodYear,
    })
  }

  if (filters.value.clientFilter) {
    filtersArr.push({
      field: 'company',
      operator: 'contains',
      value: filters.value.clientFilter,
    })
  }

  if (filters.value.customerFilter) {
    filtersArr.push({
      field: 'customerId',
      operator: 'eq',
      value: filters.value.customerFilter,
    })
  }

  return filtersArr
})

// API Methods
const fetchWidgetData = async () => {
  try {
    const response = await $crmApi('/dashboard/invoice-amount?menu=INVOICE_PAYMENT_PAID_OFF_LIST')
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

    const url = `/invoices/paid-off?${queryString}${filtersQuery ? `&${filtersQuery}` : ''}&sort=${tableState.value.sortBy},${tableState.value.orderBy}`
   
    const response = await $crmApi(url)
   
    tableState.value.data = response.items.map(item => ({
      ...item,
      paymentDate: formatDateTime(item.paymentDate),
      totalInvoice: formatCurrency(item.totalAmount),
      paidAmount: formatCurrency(item.paidAmount),
      outstandingAmount: formatCurrency(item.outstandingAmount),
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
  if (items.length > 1 && selectedItems.value.length === 1) {
    selectedItems.value = [selectedItems.value[0]]
    
    return
  }
  selectedItems.value = items
}

const openReviseDialog = () => {
  if (!canReviseInvoice.value) return
  dialogState.value.revise.note = ''
  dialogState.value.revise.open = true
}

const reviseInvoice = async () => {
  if (!canReviseInvoice.value) return

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

const exportSelectedInvoices = async () => {
  try {
    const ids = selectedItems.value.map(item => item.id)

    await $crmApi.post('/invoices/export', { ids })
    notification.value = {
      show: true,
      message: 'Export started successfully', 
      color: 'success',
    }
  } catch (error) {
    console.error('Export invoices error:', error)
    notification.value = {
      show: true,
      message: 'Export failed',
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
    tableState.value.sortBy = 'paymentDate'
    tableState.value.orderBy = 'desc'
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
const tableHeaders = [
  { title: '', key: 'select', sortable: false, width: '50px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' },
  { title: 'Client', key: 'company', sortable: true },
  { title: 'Customer', key: 'customerName', sortable: true },
  { title: 'Invoice Number', key: 'invoiceNo', sortable: true },
  { title: 'Payment Date', key: 'paymentDate', sortable: true },
  { title: 'Total Amount', key: 'totalInvoice', sortable: true },
  { title: 'Payment Method', key: 'paymentMethod', sortable: true },
  { title: 'Paid Amount', key: 'paidAmount', sortable: true },
  { title: 'Outstanding', key: 'outstandingAmount', sortable: true },
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

// Watchers
watch(
  [
    () => tableState.value.page,
    () => tableState.value.itemsPerPage,
    () => filters.value.search,
    () => filters.value.invoicePeriodMonth,
    () => filters.value.invoicePeriodYear,
    () => filters.value.clientFilter,
    () => filters.value.customerFilter,
    () => filters.value.fromDate,
    () => filters.value.toDate,
  ],
  fetchInvoices,
)

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

<template>
  <VCard>
    <!-- Header -->
    <VCardTitle class="py-3 px-4">
      <span>Invoices / Paid Off</span>
    </VCardTitle>

    <!-- Widgets Section -->
    <VRow class="pa-4">
      <VCol
        v-for="(widget, index) in [
          { title: 'Invoice Amount', icon: 'ri-file-list-3-line', color: 'primary', data: widgetData.invoiceAmount },
          { title: 'On Schedule', icon: 'ri-time-line', color: 'success', data: widgetData.onSchedule },
          { title: 'Overdue', icon: 'ri-error-warning-line', color: 'error', data: widgetData.overDue },
        ]"
        :key="index"
        cols="12"
        sm="4"
        md="4"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>{{ widget.title }}</VCardTitle>
            <template #append>
              <VIcon
                size="28"
                :icon="widget.icon"
                :color="widget.color"
              />
            </template>
          </VCardItem>
          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">
                  {{ widget.data?.totalInvoice || 0 }}
                </div>
                <div class="text-subtitle-2">
                  Invoices
                </div>
              </div>
              <div class="text-right">
                <div class="text-h6">
                  {{ formatCurrency(widget.data?.totalAmount || 0) }}
                </div>
                <div
                  class="text-subtitle-2"
                  :class="`text-${widget.color}`"
                >
                  {{ (widget.data?.percentage || 0).toFixed(1) }}%
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
          md="3"
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
          md="3"
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
          md="3"
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
          md="3"
        >
          <VTextField
            v-model="filters.search"
            label="Search"
            placeholder="Enter invoice number or customer name"
            clearable
          />
        </VCol>
      </VRow>
    </VCardText>

    <!-- Action Buttons Section -->
    <div
      v-if="showActionButtons"
      class="px-4 py-2"
    >
      <div class="d-flex align-center gap-2">
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
        
        <VBtn
          color="primary"
          size="default"
          @click="exportSelectedInvoices"
        >
          <VIcon start>
            ri-download-line
          </VIcon>
          Export {{ selectedItems.length }} invoice
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
      :item-selection-disabled="isSelectionDisabled"
      class="text-no-wrap rounded-0"
      @update:selected="handleSelectionUpdate"
      @update:options="updateTableOptions"
    >
      <!-- Table Cell Templates -->
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
        </div>
      </template>

      <!-- Numeric Columns Alignment -->
      <template #item.totalInvoice="{ item }">
        <div class="text-right">
          {{ item.totalInvoice }}
        </div>
      </template>

      <template #item.paidAmount="{ item }">
        <div class="text-right">
          {{ item.paidAmount }}
        </div>
      </template>

      <template #item.outstandingAmount="{ item }">
        <div class="text-right">
          {{ item.outstandingAmount }}
        </div>
      </template>
    </VDataTableServer>

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
            placeholder="Enter reason for revision"
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
