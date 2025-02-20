<script setup>
import { useConfigStore } from '@core/stores/config'
import Shepherd from 'shepherd.js'
import { withQuery } from 'ufo'

defineOptions({
  // 👉 Is App Search Bar Visible
  inheritAttrs: false,
})

const configStore = useConfigStore()
const isAppSearchBarVisible = ref(false)

// 👉 Default suggestions
const userData = useCookie('userData').value
let suggestionGroups = []

switch (userData.role) {
case 'super':
  suggestionGroups = [
    {
      title: 'List',
      content: [
        {
          icon: 'ri-list-check-3',
          title: '[Admin] Need Confirmation',
          url: { name: 'admin-invoices-need-confirmations' },
        },
        {
          icon: 'ri-money-dollar-circle-line',
          title: '[Admin] Outstanding Payment',
          url: { name: 'admin-invoices-outstanding-payment' },
        },
        {
          icon: 'ri-check-double-line',
          title: '[Admin] Paid Off',
          url: { name: 'admin-invoices-paid-off' },
        },
      ],
    },
    {
      title: 'Invoice',
      content: [
        {
          icon: 'ri-list-check-3',
          title: 'Need Confirmation',
          url: { name: 'invoices-need-confirmations' },
        },
        {
          icon: 'ri-money-dollar-circle-line',
          title: 'Outstanding Payment',
          url: { name: 'invoices-outstanding-payment' },
        },
        {
          icon: 'ri-check-double-line',
          title: 'Paid Off',
          url: { name: 'invoices-paid-off' },
        },
      ],
    },
    {
      title: 'Management',
      content: [
        {
          icon: 'ri-user-line',
          title: 'User List',
          url: { name: 'manage-users-list' },
        },
      ],
    },
    {
      title: 'Master Data',
      content: [
        {
          icon: 'ri-government-line',
          title: 'Master Clients',
          url: { name: 'master-clients' },
        },
        {
          icon: 'ri-building-3-line',
          title: 'Master Companies',
          url: { name: 'master-companies' },
        },
        {
          icon: 'ri-lock-line',
          title: 'Master Credential',
          url: { name: 'master-credentials' },
        },
        {
          icon: 'ri-key-line',
          title: 'Master Access',
          url: { name: 'master-access' },
        },
      ],
    },
  ]
  break

case 'admin':
  suggestionGroups = [
    {
      title: 'Invoice List',
      content: [
        {
          icon: 'ri-list-check-3',
          title: '[Admin] Need Confirmation',
          url: { name: 'admin-invoices-need-confirmations' },
        },
        {
          icon: 'ri-money-dollar-circle-line',
          title: '[Admin] Outstanding Payment',
          url: { name: 'admin-invoices-outstanding-payment' },
        },
        {
          icon: 'ri-check-double-line',
          title: '[Admin] Paid Off',
          url: { name: 'admin-invoices-paid-off' },
        },
      ],
    },
  ]
  break

case 'billing':
  suggestionGroups = [
    {
      title: 'Invoice',
      content: [
        {
          icon: 'ri-list-check-3',
          title: 'Need Confirmation',
          url: { name: 'invoices-need-confirmations' },
        },
        {
          icon: 'ri-money-dollar-circle-line',
          title: 'Outstanding Payment',
          url: { name: 'invoices-outstanding-payment' },
        },
        {
          icon: 'ri-check-double-line',
          title: 'Paid Off',
          url: { name: 'invoices-paid-off' },
        },
      ],
    },
  ]
  break

default:
  suggestionGroups = []
}

// 👉 No Data suggestion
const noDataSuggestions = [
]

const searchQuery = ref('')
const router = useRouter()
const searchResult = ref([])

const fetchResults = async () => {
  const { data } = await useApi(withQuery('/app-bar/search', { q: searchQuery.value }))

  searchResult.value = data.value
}

watch(searchQuery, fetchResults)

const redirectToSuggestedOrSearchedPage = selected => {
  router.push(selected.url)
  isAppSearchBarVisible.value = false
  searchQuery.value = ''
}

const LazyAppBarSearch = defineAsyncComponent(() => import('@core/components/AppBarSearch.vue'))
</script>

<template>
  <div
    class="d-flex align-center cursor-pointer"
    v-bind="$attrs"
    style="user-select: none;"
    @click="isAppSearchBarVisible = !isAppSearchBarVisible"
  >
    <!-- 👉 Search Trigger button -->
    <!-- close active tour while opening search bar using icon -->
    <IconBtn @click="Shepherd.activeTour?.cancel()">
      <VIcon icon="ri-search-line" />
    </IconBtn>

    <span
      v-if="configStore.appContentLayoutNav === 'vertical'"
      class="d-none d-md-flex align-center text-disabled ms-2"
      @click="Shepherd.activeTour?.cancel()"
    >
      <span class="me-3">Search</span>
      <span class="meta-key">Ctrl + K</span>
    </span>
  </div>

  <!-- 👉 App Bar Search -->
  <LazyAppBarSearch
    v-model:isDialogVisible="isAppSearchBarVisible"
    :search-results="searchResult"
    @search="searchQuery = $event"
  >
    <!-- suggestion -->
    <template #suggestions>
      <VCardText class="app-bar-search-suggestions pa-12">
        <VRow v-if="suggestionGroups">
          <VCol
            v-for="suggestion in suggestionGroups"
            :key="suggestion.title"
            cols="12"
            sm="6"
          >
            <p class="custom-letter-spacing text-xs text-disabled text-uppercase py-2 px-4 mb-0">
              {{ suggestion.title }}
            </p>
            <VList class="card-list">
              <VListItem
                v-for="item in suggestion.content"
                :key="item.title"
                link
                class="app-bar-search-suggestion mx-4 mt-2"
                @click="redirectToSuggestedOrSearchedPage(item)"
              >
                <VListItemTitle>{{ item.title }}</VListItemTitle>
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="20"
                    class="me-n1"
                  />
                </template>
              </VListItem>
            </VList>
          </VCol>
        </VRow>
      </VCardText>
    </template>

    <!-- no data suggestion -->
    <template #noDataSuggestion>
      <div class="mt-9">
        <span class="d-flex justify-center text-disabled">Try searching for</span>
        <h6
          v-for="suggestion in noDataSuggestions"
          :key="suggestion.title"
          class="app-bar-search-suggestion text-h6 font-weight-regular cursor-pointer py-2 px-4"
          @click="redirectToSuggestedOrSearchedPage(suggestion)"
        >
          <VIcon
            size="20"
            :icon="suggestion.icon"
            class="me-2"
          />
          <span>{{ suggestion.title }}</span>
        </h6>
      </div>
    </template>

    <!-- search result -->
    <template #searchResult="{ item }">
      <VListSubheader class="text-disabled custom-letter-spacing font-weight-regular ps-4">
        {{ item.title }}
      </VListSubheader>
      <VListItem
        v-for="list in item.children"
        :key="list.title"
        @click="redirectToSuggestedOrSearchedPage(list)"
      >
        <template #prepend>
          <VIcon
            size="20"
            :icon="list.icon"
            class="me-n1"
          />
        </template>
        <template #append>
          <VIcon
            size="20"
            icon="ri-corner-down-left-line"
            class="enter-icon text-medium-emphasis"
          />
        </template>
        <VListItemTitle>
          {{ list.title }}
        </VListItemTitle>
      </VListItem>
    </template>
  </LazyAppBarSearch>
</template>

<style lang="scss">
@use "@styles/variables/vuetify.scss";

.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.app-bar-search-dialog {
  .custom-letter-spacing {
    letter-spacing: 0.8px;
  }

  .card-list {
    --v-card-list-gap: 8px;
  }
}
</style>
