<template>
  <div
    class="dashboard"
  >
    <VOverlay
      :model-value="isLoading"
      class="align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VOverlay>

    <VAlert
      v-if="error"
      type="error"
      closable
      class="mb-4"
      @click:close="clearError"
    >
      {{ error }}
    </VAlert>

    <template v-if="dashboardData && !isLoading">
      <!-- Welcome Widget -->
      <RouterLink :to="{ name: 'invoices-need-confirmations-new' }">
        <VCard class="mb-4">
          <VRow>
            <VCol
              cols="6"
              sm="6"
            >
              <VCardItem>
                <VCardTitle>
                  <h4 class="text-h4 text-wrap">
                    {{ isExternalUser ? 'Welcome' : 'Hi' }} <strong>{{ userName }}!</strong> 
                  </h4>
                </VCardTitle>
              </VCardItem>
              <VCardText class="pt-2">
                <div
                  class="mb-0 text-body-1 me-2"
                  v-html="welcomeMessage"
                />
              </VCardText>
            </VCol>
            <VCol
              cols="6"
              sm="6"
              class="text-center"
            >
              <img
                :src="illustrationJohn2"
                :height="$vuetify.display.xs ? '165' : '200'"
                class="john-illustration flip-in-rtl mt-6 mt-sm-0"
              >
            </VCol>
          </VRow>
        </VCard>
      </RouterLink>

      <!-- Summary Metrics -->
      <VRow>
        <VCol
          v-for="(metric, index) in summaryMetrics"
          :key="index"
          cols="6"
          md="4"
        >
          <VCard class="h-[170px]">
            <VCardText class="pa-4">
              <div class="text-subtitle-2 text-grey-darken-1 mb-2">
                {{ metric.title }}
              </div>
              <div class="text-h4 font-weight-bold mb-1">
                {{ metric.formatted }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Customer Aging Chart -->
      <VCard class="mt-4">
        <VCardTitle class="text-h6">
          Invoice by Customer
        </VCardTitle>
        <VCardText>
          <VueApexCharts
            type="bar"
            height="400"
            :options="customerChartOptions"
            :series="customerChartSeries"
          />
        </VCardText>
      </VCard>

      <!-- Financial Metrics -->
      <VRow class="mt-4">
        <VCol
          v-for="(metric, index) in financialMetrics"
          :key="index"
          cols="6"
          md="4"
        >
          <VCard>
            <VCardText class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center">
                  <VIcon
                    :color="metric.iconColor"
                    size="32"
                    :icon="metric.icon"
                    class="me-3"
                  />
                  <span class="text-subtitle-1">{{ metric.title }}</span>
                </div>
                <VChip
                  :color="getPercentageColor(metric.percentage)"
                  size="small"
                  class="font-weight-medium"
                >
                  {{ formatPercentage(metric.percentage) }}
                </VChip>
              </div>
              <div class="text-h5 font-weight-bold mb-1">
                {{ formatCurrency(metric.value) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Invoices Over Time -->
      <VCard class="mt-4">
        <VCardTitle class="d-flex align-center">
          <span>Invoices over Time ({{ selectedYear }})</span>
          <VSpacer />
          <VSelect
            v-model="selectedYear"
            :items="yearOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="ms-4"
            style="max-width: 150px"
            @update:model-value="handleYearChange"
          />
        </VCardTitle>
        <VCardText>
          <VueApexCharts
            type="bar"
            height="350"
            :options="timeChartOptions"
            :series="timeChartSeries"
          />
        </VCardText>
      </VCard>

      <!-- Age Distribution -->
      <VRow class="mt-4">
        <VCol
          cols="6"
          md="6"
        >
          <VCard>
            <VCardTitle class="text-h6">
              Invoices by Age
            </VCardTitle>
            <VCardText>
              <VueApexCharts
                type="donut"
                height="350"
                :options="ageChartOptions"
                :series="ageChartSeries"
              />
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          md="6"
        >
          <VCard>
            <VCardTitle class="text-h6">
              Age Distribution
            </VCardTitle>
            <VCardText>
              <VTable>
                <thead>
                  <tr>
                    <th>AGE</th>
                    <th>INVOICES</th>
                    <th>AMOUNT</th>
                    <th>DISTRIBUTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in dashboardData.widgetSix"
                    :key="item.aging"
                  >
                    <td>{{ item.aging }}</td>
                    <td>{{ item.totalInvoice }}</td>
                    <td>{{ formatCurrency(item.totalAmount) }}</td>
                    <td style="width: 200px">
                      <VProgressLinear
                        :model-value="calculateDistribution(item.totalInvoice)"
                        color="primary"
                        height="8"
                      />
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Assignment Progress -->
      <VCard class="mt-4">
        <VCardTitle class="text-h6">
          Assignment Progress
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol 
              v-for="(status, key) in dashboardData.widgetSeven"
              :key="key"
              cols="6"
              sm="6"
              md="3"
            >
              <VCard>
                <VCardTitle>{{ formatStatusTitle(key) }}</VCardTitle>
                <VCardText class="text-center">
                  <div class="text-h5 font-weight-bold mb-4">
                    {{ status.totalInvoice }}
                  </div>
                  <VProgressCircular
                    :model-value="status.percentage"
                    :color="getStatusColor(key)"
                    size="64"
                  >
                    {{ formatPercentage(status.percentage) }}
                  </VProgressCircular>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Refresh Button -->
      <VBtn
        color="primary"
        class="mt-4"
        :loading="isLoading"
        @click="fetchDashboardData"
      >
        Refresh Dashboard
      </VBtn>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import VueApexCharts from 'vue3-apexcharts'
import illustrationJohn2 from '@images/cards/illustration-john-2.png'
import { $crmApi } from '@/api/crmApi'

definePage({
  meta: {
    public: true,
  },
})

const isLoading = ref(true)
const dashboardData = ref(null)
const error = ref(null)
const selectedYear = ref(new Date().getFullYear())
const vuetifyTheme = useTheme()

const welcomeMessage = computed(() => {
  if (!dashboardData.value) return ''
  
  return dashboardData.value.widgetOne.messages.replace('\n', '<br>')
})

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  
  return Array.from({ length: 5 }, (_, i) => ({
    title: String(currentYear - 2 + i),
    value: currentYear - 2 + i,
  }))
})

const summaryMetrics = computed(() => {
  if (!dashboardData.value) return []
  
  return [
    {
      title: 'Total Invoices',
      value: dashboardData.value.widgetTwo.totalInvoice,
      formatted: dashboardData.value.widgetTwo.totalInvoice.toString(),
    },
    {
      title: 'Total Amount',
      value: dashboardData.value.widgetTwo.totalAmount,
      formatted: formatCurrency(dashboardData.value.widgetTwo.totalAmount),
    },
    {
      title: 'Total Customers',
      value: dashboardData.value.widgetTwo.totalCustomer,
      formatted: dashboardData.value.widgetTwo.totalCustomer.toString(),
    },
  ]
})

const financialMetrics = computed(() => {
  if (!dashboardData.value) return []
  
  return [
    {
      title: 'Invoice Amount',
      value: dashboardData.value.widgetFour.invoiceAmount.totalAmount,
      percentage: dashboardData.value.widgetFour.invoiceAmount.percentage,
      icon: 'mdi-file-document-outline',
      iconColor: 'success',
    },
    {
      title: 'Paid Amount',
      value: dashboardData.value.widgetFour.paidAmount.totalPaidAmount,
      percentage: dashboardData.value.widgetFour.paidAmount.percentage,
      icon: 'mdi-cash',
      iconColor: 'success',
    },
    {
      title: 'Outstanding Amount',
      value: dashboardData.value.widgetFour.outstandingAmount.totalOutstandingAmount,
      percentage: dashboardData.value.widgetFour.outstandingAmount.percentage,
      icon: 'mdi-alert-circle-outline',
      iconColor: 'error',
    },
  ]
})

const customerChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    stackType: '100%',
  },
  plotOptions: {
    bar: { horizontal: true },
  },
  xaxis: {
    categories: dashboardData.value?.widgetThree.map(c => c.customerName) || [],
  },
  colors: ['#68CD86', '#FFD773', '#FFA773', '#FF7373', '#D35656', '#8B3232'],
}))

const customerChartSeries = computed(() => {
  const agingCategories = ['0-7 Days', '8-15 Days', '16-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days']
  
  return agingCategories.map(category => ({
    name: category,
    data: dashboardData.value?.widgetThree.map(customer => {
      const aging = customer.agingInvoices.find(a => a.aging === category)
      
      return aging ? aging.totalInvoice : 0
    }) || [],
  }))
})

const timeChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: true,
  },
  plotOptions: {
    bar: { horizontal: false },
  },
  xaxis: {
    categories: dashboardData.value?.widgetFive.invoiceOverTimes.map(i => i.month) || [],
  },
  colors: ['#68CD86', '#FFD773', '#FFA773', '#FF7373', '#D35656', '#8B3232'],
}))

const timeChartSeries = computed(() => [{
  name: 'Invoices',
  data: dashboardData.value?.widgetFive.invoiceOverTimes.map(i => i.totalInvoice) || [],
}])

const ageChartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: dashboardData.value?.widgetSix.map(i => i.aging) || [],
  colors: ['#8B3232', '#D35656', '#FF7373', '#FFA773', '#FFD773', '#68CD86'],
  legend: { position: 'bottom' },
}))

const ageChartSeries = computed(() => 
  dashboardData.value?.widgetSix.map(i => i.totalInvoice) || [],
)

const fetchDashboardData = async () => {
  try {
    clearError()
    isLoading.value = true

    const response = await $crmApi(`/dashboard?year=${selectedYear.value}`)
    
    if (response.resultCode === 1) {
      dashboardData.value = response.data
    } else {
      throw new Error(response.message || 'Failed to fetch dashboard data')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleYearChange = () => {
  fetchDashboardData()
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercentage = value => `${value.toFixed(1)}%`

const formatStatusTitle = key => {
  return key
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = status => {
  const colors = {
    needConfirmation: 'warning',
    onRevise: 'error',
    onSchedule: 'success',
    overDue: 'error',
  }
  
  return colors[status] || 'primary'
}

const getPercentageColor = percentage => {
  return percentage > 0 ? 'success' : percentage < 0 ? 'error' : 'primary'
}

const calculateDistribution = value => {
  const total = dashboardData.value?.widgetSix.reduce((sum, item) => sum + item.totalInvoice, 0) || 0
  
  return (value / total) * 100
}

const clearError = () => {
  error.value = null
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  margin: 0 auto;
  padding: 20px;
  zoom: 50%;
}

.v-card {
  border-radius: 8px;
}

.v-card-title {
  font-size: 1.1rem;
  font-weight: 600;
}
</style>
