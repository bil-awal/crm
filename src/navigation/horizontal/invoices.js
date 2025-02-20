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
        subject: 'InvoiceCustomer - Need Confirmation',
        children: [
          {
            title: 'New Invoice',
            icon: { icon: 'ri-sticky-note-add-line' },
            to: { name: 'invoices-need-confirmations-new' },
            subject: 'InvoiceCustomer - Need Confirmation',
          },
          {
            title: 'Revised Invoice',
            icon: { icon: 'ri-file-edit-line' },
            to: { name: 'invoices-need-confirmations-revised' },
            subject: 'InvoiceCustomer - Need Confirmation',
          },
        ],
      },
      {
        title: 'On-Revise',
        icon: { icon: 'ri-edit-line' },
        to: { name: 'invoices-on-revise' },
        subject: 'InvoiceCustomer - Need Confirmation',
      },
      {
        title: 'Outstanding Payments',
        icon: { icon: 'ri-error-warning-line' },
        to: { name: 'invoices-outstanding-payment' },
        subject: 'InvoiceCustomer - Outstanding Payment',
      },
      {
        title: 'Paid Off',
        icon: { icon: 'ri-checkbox-circle-line' },
        to: { name: 'invoices-paid-off' },
        subject: 'InvoiceCustomer - Paid Off',
      },
    ],
  },
]
