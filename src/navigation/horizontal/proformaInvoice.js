const userData = useCookie('userData').value

export default [
  

  { heading: 'Invoices' },
  {
    title: 'Proforma Invoice',
    icon: { icon: 'ri-file-list-3-line' },
    children: [
      {
        title: 'Need Confirmations',
        to: { name: 'invoices-need-confirmations-id', params: { id: `${userData.companySession.client.id}.${userData.companySession.company.id}` } },
        action: 'read',
        subject: 'InvoiceNeedConfirmations',
      },
      {
        title: 'Outstanding Payments',
        to: { name: 'invoices-outstanding-payments-id', params: { id: `${userData.companySession.client.id}.${userData.companySession.company.id}` } },
        action: 'read',
        subject: 'InvoiceOutstandingPayments',
      },
      {
        title: 'Paid Off',
        to: { name: 'invoices-paid-off-id', params: { id: `${userData.companySession.client.id}.${userData.companySession.company.id}` } },
        action: 'read',
        subject: 'InvoicePaidOff',
      },
    ],
  },
]
