export const buildFilterParams = (companies, customers) => {
  const params = new URLSearchParams()
    
  if (companies?.length) {
    params.append('filter', `company,${companies.join(',')}`)
  }
    
  if (customers?.length) {
    params.append('filter', `customer,${customers.join(',')}`)
  }
    
  return params.toString()
}
  
export const parseFilterParams = url => {
  const params = new URLSearchParams(url)
  const filters = {}
    
  params.getAll('filter').forEach(filter => {
    const [type, ...values] = filter.split(',')

    filters[type] = values
  })
    
  return filters
}
