<!-- Classic.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { $crmApi } from '@/api/crmApi'

definePage({
  meta: {
    public: true,
  },
})

// Component state
const isLoading = ref(true)
const dashboardData = ref(null)
const errorMessage = ref('')
const showError = ref(false)

// Format currency with locale
const formatCurrency = amount => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(amount)
}

// Format percentage
const formatPercentage = value => {
  return `${value.toFixed(1)}%`
}

// Handle error display
const handleError = message => {
  errorMessage.value = message
  showError.value = true
}

// Clear error message
const clearError = () => {
  errorMessage.value = ''
  showError.value = false
}

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    clearError()
    isLoading.value = true

    const response = await $crmApi('/dashboard')
    
    if (response.resultCode === 1) {
      dashboardData.value = response.data
    } else {
      throw new Error(response.message || 'Failed to fetch dashboard data')
    }
  } catch (err) {
    handleError(err.message)
  } finally {
    isLoading.value = false
  }
}

// Initialize component
onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard">
    <!-- Loading State -->
    <VOverlay
      v-model="isLoading"
      class="align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VOverlay>

    <!-- Error Alert -->
    <VAlert
      v-if="showError"
      type="error"
      closable
      class="mb-4"
      @click:close="clearError"
    >
      {{ errorMessage }}
    </VAlert>

    <!-- Dashboard Content -->
    <div v-if="dashboardData && !isLoading">
      <!-- Notifications -->
      <VAlert
        v-if="dashboardData.widgetOne.messages"
        type="info"
        class="mb-4"
      >
        {{ dashboardData.widgetOne.messages }}
      </VAlert>

      <VRow>
        <!-- Total Invoice Summary Card -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard style="height: 170px">
            <VCardTitle class="text-h6">
              Total Invoices
            </VCardTitle>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h4 mb-1">
                    {{ formatCurrency(dashboardData.widgetTwo.totalAmount) }}
                  </div>
                  <div class="text-body-1">
                    {{ dashboardData.widgetTwo.totalInvoice }} Invoices
                  </div>
                  <div class="text-caption">
                    {{ dashboardData.widgetTwo.totalCustomer }} Customers
                  </div>
                </div>
                <VIcon
                  size="48"
                  color="primary"
                  icon="ri-file-list-3-line"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- On Schedule Card -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard style="height: 170px">
            <VCardTitle class="text-h6">
              On Schedule
            </VCardTitle>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h4 mb-1">
                    {{ dashboardData.widgetSeven.onSchedule.totalInvoice }}
                  </div>
                  <div class="text-body-1">
                    Invoices
                  </div>
                </div>
                <VIcon
                  size="48"
                  color="success"
                  icon="ri-check-line"
                />
              </div>
              <VProgressLinear
                :model-value="dashboardData.widgetSeven.onSchedule.percentage"
                color="success"
                height="8"
                rounded
                class="mt-4"
              />
              <div class="text-caption mt-1">
                {{ formatPercentage(dashboardData.widgetSeven.onSchedule.percentage) }} of total
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Overdue Card -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard style="height: 170px">
            <VCardTitle class="text-h6">
              Overdue
            </VCardTitle>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h4 mb-1">
                    {{ dashboardData.widgetSeven.overDue.totalInvoice }}
                  </div>
                  <div class="text-body-1">
                    Invoices
                  </div>
                </div>
                <VIcon
                  size="48"
                  color="error"
                  icon="ri-time-line"
                />
              </div>
              <VProgressLinear
                :model-value="dashboardData.widgetSeven.overDue.percentage"
                color="error"
                height="8"
                rounded
                class="mt-4"
              />
              <div class="text-caption mt-1">
                {{ formatPercentage(dashboardData.widgetSeven.overDue.percentage) }} of total
              </div>
            </VCardText>
          </VCard>
        </VCol>       
      </VRow>

      <!-- Financial Summary -->
      <VRow class="mt-4">
        <VCol cols="12">
          <VCard>
            <VCardTitle class="text-h6">
              Financial Summary
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="4"
                >
                  <div class="text-h6">
                    Total Invoice Amount
                  </div>
                  <div class="text-h4">
                    {{ formatCurrency(dashboardData.widgetFour.invoiceAmount.totalAmount) }}
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <div class="text-h6">
                    Paid Amount
                  </div>
                  <div class="text-h4">
                    {{ formatCurrency(dashboardData.widgetFour.paidAmount.totalPaidAmount) }}
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <div class="text-h6">
                    Outstanding Amount
                  </div>
                  <div class="text-h4">
                    {{ formatCurrency(dashboardData.widgetFour.outstandingAmount.totalOutstandingAmount) }}
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Aging Summary -->
      <VRow class="mt-4">
        <VCol cols="12">
          <VCard>
            <VCardTitle class="text-h6">
              Invoice Aging Summary
            </VCardTitle>
            <VCardText>
              <VTable>
                <thead>
                  <tr>
                    <th>Aging Period</th>
                    <th class="text-right">
                      Total Invoices
                    </th>
                    <th class="text-right">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="aging in dashboardData.widgetSix"
                    :key="aging.aging"
                  >
                    <td>{{ aging.aging }}</td>
                    <td class="text-right">
                      {{ aging.totalInvoice }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(aging.totalAmount) }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Customer Aging Details -->
      <VRow class="mt-4">
        <VCol cols="12">
          <VCard>
            <VCardTitle class="text-h6">
              Customer Aging Details
            </VCardTitle>
            <VCardText>
              <VTable>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th class="text-right">
                      Total Invoices
                    </th>
                    <th>Aging Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="customer in dashboardData.widgetThree"
                    :key="customer.customerName"
                  >
                    <td>{{ customer.customerName }}</td>
                    <td class="text-right">
                      {{ customer.totalInvoice }}
                    </td>
                    <td>
                      <div
                        v-for="aging in customer.agingInvoices"
                        :key="aging.aging"
                        class="d-flex align-center mb-1"
                      >
                        <div class="flex-grow-1">
                          {{ aging.aging }}:
                        </div>
                        <div class="ml-2">
                          {{ aging.totalInvoice }} ({{ formatPercentage(aging.percentage) }})
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Refresh Button -->
      <VBtn
        color="primary"
        class="mt-4"
        :loading="isLoading"
        @click="fetchDashboardData"
      >
        Refresh Dashboard
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  position: relative;
  min-height: 400px;
}
</style>
