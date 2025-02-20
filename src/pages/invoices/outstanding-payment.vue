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
    subject: `INVOICE_PAYMENT_OUTSTANDING_LIST`,
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
  outstandingAmount: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
  onSchedule: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
  invoiceAmount: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
  paidAmount: { totalAmount: 0, totalInvoice: 0, percentage: 0 },
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

const dialogState = ref({
  revise: { open: false, note: '' },
  message: { open: false, invoiceId: null },
})

// User info
const userData = useCookie('userData').value
const isCustomerUser = computed(() => userData?.tenantType === 'CUSTOMER')

// Computed
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
    const response = await $crmApi('/dashboard/invoice-amount?menu=INVOICE_PAYMENT_OUTSTANDING_LIST')
    if (response.data) {
      widgetData.value = response.data
    }
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

    const url = `/invoices/outstanding?${queryString}${filtersQuery ? `&${filtersQuery}` : ''}&sort=${tableState.value.sortBy},${tableState.value.orderBy}`
   
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
const statusConfigs = {
  WAIT_CONFIRM: { color: 'warning', icon: 'ri-time-line', label: 'Waiting Confirmation' },
  ON_REVISION: { color: 'warning', icon: 'ri-refresh-line', label: 'On Revision' },
  REVISED: { color: 'info', icon: 'ri-edit-line', label: 'Revised' },
  ACCEPT: { color: 'success', icon: 'ri-check-line', label: 'Accepted' },
}

const getStatusConfig = status => statusConfigs[status] || { color: 'info', icon: 'ri-information-line', label: 'Unknown' }

const paymentStatusConfigs = {
  NOT_PAID: { color: 'error', icon: 'ri-close-line', label: 'Not Paid' },
  PAID_HALF: { color: 'warning', icon: 'ri-time-line', label: 'Half Paid' },
  PAID_OFF: { color: 'success', icon: 'ri-check-line', label: 'Paid Full' },
}

const getPaymentStatusConfig = status => 
  paymentStatusConfigs[status] || { color: 'info', icon: 'ri-information-line', label: 'Unknown' }

const paymentStatusOptions = [
  { title: 'All', value: null },
  { title: 'Not Paid', value: 'NOT_PAID' },
  { title: 'Half Paid', value: 'PAID_HALF' },
  { title: 'Paid Full', value: 'PAID_OFF' },
]

const tableHeaders = [
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' },
  ...(isCustomerUser.value ? [] : [{ title: 'Customer', key: 'customerName', sortable: true }]),
  { title: 'Payment Status', key: 'paymentStatus', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
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

// Watchers
watch(
  [
    () => tableState.value.page,
    () => tableState.value.itemsPerPage,
    () => filters.value.search,
    () => filters.value.paymentStatus,
    () => filters.value.fromDate,
    () => filters.value.toDate,
    () => filters.value.selectedCustomer,
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
      <span>Invoices / Outstanding Payment</span>
    </VCardTitle>

    <!-- Updated Widgets Section -->
    <VRow
      class="pa-4"
      style="zoom: 80%"
    >
      <VCol
        v-for="(widget, index) in [
          { title: 'Invoice Amount', icon: 'ri-file-list-3-line', color: 'primary', data: widgetData.invoiceAmount },
          { title: 'Outstanding Amount', icon: 'ri-money-dollar-circle-line', color: 'warning', data: widgetData.outstandingAmount },
          { title: 'Paid Amount', icon: 'ri-checkbox-circle-line', color: 'success', data: widgetData.paidAmount },
          { title: 'On Schedule', icon: 'ri-time-line', color: 'info', data: widgetData.onSchedule },
          { title: 'Overdue', icon: 'ri-error-warning-line', color: 'error', data: widgetData.overDue }, 
        ]"
        :key="index"
        cols="12"
        sm="6"
        md="4"
        lg="2.4"
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
                <div class="text-subtitle-2" :class="`text-${widget.color}`">
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
      <template #item.status="{ item }">
        <VChip
          size="x-small"
          :color="getStatusConfig(item.status).color"
        >
          {{ getStatusConfig(item.status).label }}
        </VChip>
      </template>

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
