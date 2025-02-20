import invoices from './invoices'
import dashboard from './dashboard'
import manage from './manage'
import master from './master'
import proformaInvoice from './proformaInvoice'

export default [...dashboard, ...invoices, ...proformaInvoice, ...manage, ...master]
