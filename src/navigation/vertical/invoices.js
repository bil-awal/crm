const userData = useCookie('userData').value

export default [

  { heading: 'Invoice' },
  {
    title: 'Invoice',
    icon: { icon: 'ri-file-list-3-line' },
    children: [
      {
        title: 'Need Confirmation',
        icon: { icon: 'ri-archive-stack-line' },
        to: { name: 'invoices-need-confirmations' },
        subject: 'INVOICE_LIST',
        children: [
          {
            title: 'New Invoice',
            icon: { icon: 'ri-sticky-note-add-line' },
            to: { name: 'invoices-need-confirmations-new' },
            subject: 'INVOICE_LIST',
          },
          {
            title: 'Revised Invoice',
            icon: { icon: 'ri-file-edit-line' },
            to: { name: 'invoices-need-confirmations-revised' },
            subject: 'INVOICE_DETAIL_AFTER_VIEW',
          },
        ],
      },
      {
        title: 'On-Revise',
        icon: { icon: 'ri-edit-line' },
        to: { name: 'invoices-on-revise' },
        subject: 'INVOICE_LIST_ON_REVISION',
      },
      {
        title: 'Outstanding Payments',
        icon: { icon: 'ri-error-warning-line' },
        to: { name: 'invoices-outstanding-payment' },
        subject: 'INVOICE_PAYMENT_OUTSTANDING_LIST',
      },
      {
        title: 'Paid Off',
        icon: { icon: 'ri-checkbox-circle-line' },
        to: { name: 'invoices-paid-off' },
        subject: 'INVOICE_PAYMENT_PAID_OFF_LIST',
      },
    ],
  },
]
