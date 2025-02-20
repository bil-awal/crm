/*
  ~ / plugins / 1.router / additional-routes.js
*/
import { eventBus } from '@/utils/eventBus'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

const FEATURE_DEFINITIONS = {
  INVOICE_LIST: {
    name: 'Listing Waiting Confirm',
    route: 'invoices-need-confirmations-new',
  },
  INVOICE_DETAIL_VIEW: {
    name: 'View Detail Waiting Confirm',
    route: 'invoices-preview-id',
  },
  INVOICE_LIST_AFTER_REVISION: {
    name: 'Listing After Revision',
    route: 'invoices-need-confirmations-revised',
  },
  INVOICE_DETAIL_AFTER_VIEW: {
    name: 'View Detail After Revision',
    route: 'invoices-preview-id',
  },
  INVOICE_LIST_ON_REVISION: {
    name: 'Listing On Revision',
    route: 'invoices-on-revise',
  },
  INVOICE_DETAIL_ON_REVISION_VIEW: {
    name: 'View Detail',
    route: 'invoices-preview-id',
  },
  INVOICE_PAYMENT_OUTSTANDING_LIST: {
    name: 'Outstanding Payment Listing',
    route: 'invoices-outstanding-payment',
  },
  INVOICE_PAYMENT_OUTSTANDING_DETAIL: {
    name: 'View Detail Outstanding Payment',
    route: 'invoices-preview-id',
  },
  INVOICE_PAYMENT_PAID_OFF_LIST: {
    name: 'Paid Off Listing',
    route: 'invoices-paid-off',
  },
  INVOICE_PAYMENT_PAID_OFF_DETAIL: {
    name: 'View Detail Paid Off',
    route: 'invoices-preview-id',
  },
}

const FEATURE_ROUTE_MAP = Object.entries(FEATURE_DEFINITIONS).reduce((acc, [id, def]) => {
  acc[id] = def.route
  
  return acc
}, {})

// Default landing pages based on tenant type
const DEFAULT_LANDING_PAGES = {
  INTERNAL: 'INVOICE_LIST',
  EXTERNAL: 'INVOICE_LIST',
  ADMIN: 'INVOICE_LIST',
}

const getDefaultRoute = (tenantType, featureRoles) => {
  const defaultFeature = DEFAULT_LANDING_PAGES[tenantType] || DEFAULT_LANDING_PAGES.EXTERNAL
  
  if (featureRoles.includes(defaultFeature)) {
    return FEATURE_ROUTE_MAP[defaultFeature]
  }
  
  const firstAvailableFeature = featureRoles.find(feature => FEATURE_ROUTE_MAP[feature])
  
  return firstAvailableFeature ? FEATURE_ROUTE_MAP[firstAvailableFeature] : 'login'
}

export const redirects = [
  {
    path: '/',
    name: 'index',
    redirect: to => {
      if (isMaintenanceMode) {
        console.log('Redirecting to maintenance page')
        
        return { name: 'maintenance' }
      }

      const userData = useCookie('userData').value
      
      // Jika tidak ada user data, redirect ke login
      if (!userData) {
        return { name: 'login', query: to.query || {} }
      }

      // Langsung redirect ke welcome
      return { name: 'dashboards', query: to.query || {} }
    },
  },
]

export const routes = [
  {
    path: '/manage/users/:id',
    name: 'UserEdit',
    meta: {
      requiresAuth: true,
      subject: 'INVOICE_LIST',
    },
    component: () => import('@/pages/manage/users/edit/id.vue'),
  },
  {
    path: '/manage/users/:id/feature/:roleType',
    name: 'UserFeaturePermissions',
    meta: {
      requiresAuth: true,
      subject: 'INVOICE_LIST',
    },
    component: () => import('@/pages/manage/users/edit/feature.vue'),
  },
  {
    path: '/manage/users/:id/data/:roleType',
    name: 'UserDataPermissions', 
    meta: {
      requiresAuth: true,
      subject: 'INVOICE_LIST',
    },
    component: () => import('@/pages/manage/users/edit/data.vue'),
  },
]
