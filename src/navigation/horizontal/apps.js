export default [
  { heading: 'Apps' },
  {
    title: 'Proforma Invoice',
    icon: { icon: 'ri-bill-line' },
    children: [
      {
        title: 'Need Confirmations',
        to: 'apps-invoices-need-confirm',
        action: 'read',
        subject: 'AppInvoiceConfirm',
      },
      {
        title: 'Outstanding Payments',
        to: 'apps-invoices-outstanding-payments',
        action: 'read',
        subject: 'AppInvoiceOutstanding',
      },
      {
        title: 'Paid Off',
        to: 'apps-invoices-success-paid',
        action: 'read',
        subject: 'AppInvoicePaid',
      },
    ],
  },
]
