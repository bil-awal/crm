// composables/useInvoice.js
import { ref } from 'vue'
import { $crmApi } from '@/api/crmApi'
import { ErpFileService } from '@/services/erpFileService'

export function useInvoice(invoiceId) {
  const invoice = ref(null)
  const attachments = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchInvoice = async () => {
    if (!invoiceId) return

    loading.value = true
    error.value = null

    try {
      invoice.value = await $crmApi(`/invoices/${invoiceId}`)
      if (invoice.value?.attachments?.length) {
        attachments.value = await ErpFileService.getFileList(invoice.value.attachments)
      }
    } catch (err) {
      console.error('Failed to fetch invoice:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const confirmInvoice = async () => {
    if (!invoice.value?.id) return

    try {
      await $crmApi(`/invoices/${invoice.value.id}/accept-action`, {
        method: 'POST',
        headers: { 'invoice-id': invoice.value.id },
        body: { note: null },
      })
      await fetchInvoice()
    } catch (err) {
      console.error('Failed to confirm invoice:', err)
      error.value = err.message
    }
  }

  const reviseInvoice = async (note = 'Revision requested') => {
    if (!invoice.value?.id) return

    try {
      await $crmApi(`/invoices/${invoice.value.id}/revise-action`, {
        method: 'POST',
        headers: { 'invoice-id': invoice.value.id },
        body: { note },
      })
      await fetchInvoice()
    } catch (err) {
      console.error('Failed to revise invoice:', err)
      error.value = err.message
    }
  }

  return {
    invoice,
    attachments,
    loading,
    error,
    fetchInvoice,
    confirmInvoice,
    reviseInvoice,
  }
}
