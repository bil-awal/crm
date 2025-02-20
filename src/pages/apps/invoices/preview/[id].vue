<script setup>
import PDFExample from "@/components/example/PDFExample.vue";
import InvoiceAddPaymentDrawer from '@/views/apps/invoice/InvoiceAddPaymentDrawer.vue';
import InvoiceRevisionDrawer from '@/views/apps/invoice/InvoiceRevisionDrawer.vue';
import InvoiceSendInvoiceDrawer from '@/views/apps/invoice/InvoiceSendInvoiceDrawer.vue';

definePage({
  meta: {
    action: 'read',
    subject: 'AppInvoicePreview',
  },
})

const route = useRoute('apps-invoices-preview-id')
const isAddPaymentSidebarVisible = ref(false)
const isSendPaymentSidebarVisible = ref(false)
const isRevisionSidebarVisible = ref(false)

// const { data: invoiceData } = await useApi(`/apps/invoices/${ route.params.id }`)
// const invoice = invoiceData.value.invoice
// const paymentDetails = invoiceData.value.paymentDetails

// watch(() => route.query, () => {
//   // Check if the 'accept' query parameter is set to 'confirm'
//   if (route.query.accept === 'confirm') {
//     // Set the variable to true to show the dialog
//     isAcceptConfirmDialogVisible.value = true;
//     console.log('isAcceptConfirmDialogVisible', 'TRUE')
//   } else {
//     // Ensure the dialog is hidden if the query parameter is not present or set to something else
//     isAcceptConfirmDialogVisible.value = false;
//     console.log('isAcceptConfirmDialogVisible', 'FALSE')
//   }
// });


const purchasedProducts = [
  {
    name: 'Premium Branding Package',
    description: 'Branding & Promotion',
    qty: 1,
    hours: 15,
    price: 32,
  },
  {
    name: 'SMM',
    description: 'Social media templates',
    qty: 1,
    hours: 14,
    price: 28,
  },
  {
    name: 'Web Design',
    description: 'Web designing package',
    qty: 1,
    hours: 12,
    price: 24,
  },
  {
    name: 'SEO',
    description: 'Search engine optimization',
    qty: 1,
    hours: 5,
    price: 22,
  },
]

const printInvoice = () => {
  window.print()
}
</script>

<template>
  <section>
    <VRow>
      <VCol
        cols="12"
        md="9"
      >
        <PDFExample />
      </VCol>

      <VCol
        cols="12"
        md="3"
        class="d-print-none"
      >
        <VCard>
          <VCardText>
            <VBtn
              block
              variant="outlined"
              color="secondary"
              class="mb-4"
              @click="printInvoice"
            >
              Dowload
            </VBtn>
            <div class="d-flex flex-wrap gap-4">

              <VBtn
                color="secondary"
                variant="outlined"
                class="flex-grow-1"
                @click="isRevisionSidebarVisible = true"
              >
                Revision
              </VBtn>
              <AcceptConfirmDialog/>
            </div>

           
          </VCardText>

          <InvoiceLog />
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 Add Payment Sidebar -->
    <InvoiceAddPaymentDrawer v-model:isDrawerOpen="isAddPaymentSidebarVisible" />

    <!-- 👉 Send Invoice Sidebar -->
    <InvoiceSendInvoiceDrawer v-model:isDrawerOpen="isSendPaymentSidebarVisible" />

    <!-- 👉Revision Invoice Sidebar -->
    <InvoiceRevisionDrawer  v-model:isDrawerOpen="isRevisionSidebarVisible" />
  </section>
</template>

<style lang="scss">
.invoice-preview-table {
  --v-table-header-color: var(--v-theme-surface);

  &.v-table .v-table__wrapper table thead tr th{
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  }
}

@media print {
  .v-theme--dark {
    --v-theme-surface: 255, 255, 255;
    --v-theme-on-surface: 94, 86, 105;
  }

  body {
    background: none !important;
  }

  .invoice-header-preview,
  .invoice-preview-wrapper {
    padding: 0 !important;
  }

  .product-buy-now {
    display: none;
  }

  .v-navigation-drawer,
  .layout-vertical-nav,
  .app-customizer-toggler,
  .layout-footer,
  .layout-navbar,
  .layout-navbar-and-nav-container {
    display: none;
  }

  .v-card {
    box-shadow: none !important;

    .print-row {
      flex-direction: row !important;
    }
  }

  .layout-content-wrapper {
    padding-inline-start: 0 !important;
  }

  .v-table__wrapper {
    overflow: hidden !important;
  }
}
</style>
