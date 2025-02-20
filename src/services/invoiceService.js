// Fetch invoices for the main list (waiting confirmation)
export async function fetchInvoicesAPI(queryString) {
  try {
    const response = await $crmApi(`/invoices/waiting-confirm?${queryString}`)
    
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch invoices: ' + error.message)
  }
}
  
// Fetch revision invoices
export async function fetchRevisionInvoicesAPI(queryString) {
  try {
    const response = await $crmApi(`/invoices/revision?${queryString}`)
    
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch revision invoices: ' + error.message)
  }
}
  
// Fetch outstanding payments
export async function fetchOutstandingPaymentsAPI(queryString) {
  try {
    const response = await $crmApi(`/invoices/outstanding-payments?${queryString}`)
    
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch outstanding payments: ' + error.message)
  }
}
  
// Fetch paid off invoices
export async function fetchPaidOffInvoicesAPI(queryString) {
  try {
    const response = await $crmApi(`/invoices/paid-off?${queryString}`)
    
    return response.data
  } catch (error) {
    throw new Error('Failed to fetch paid off invoices: ' + error.message)
  }
}
  
// Confirm an invoice
export async function confirmInvoiceAPI(invoiceId) {
  try {
    const response = await $crmApi(`/invoices/accept-action`, {
      method: 'POST',
      headers: { 'invoice-id': invoiceId },
      body: JSON.stringify({
        note: null,
      }),
    })

    return response.data
  } catch (error) {
    throw new Error('Failed to confirm invoice: ' + error.message)
  }
}
  
// Revise an invoice
export async function reviseInvoiceAPI(invoiceId, note) {
  try {
    const response = await $crmApi(`/invoices/revise-action`, {
      method: 'POST',
      headers: { 'invoice-id': invoiceId },
      body: JSON.stringify({
        note,
      }),
    })

    return response.data
  } catch (error) {
    throw new Error('Failed to revise invoice: ' + error.message)
  }
}
  