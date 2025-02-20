export default [
  { heading: 'Master' },
  {
    title: 'Master Data',
    icon: { icon: 'ri-lock-2-line' },
    children: [
      {
        title: 'Clients',
        to: 'master-clients',
        action: 'manage',
        subject: 'MasterClient',
      },
      {
        title: 'Companies',
        to: 'master-companies',
        action: 'manage',
        subject: 'MasterCompany',
      },
      {
        title: 'Credentials',
        to: 'master-credentials',
        action: 'manage',
        subject: 'MasterCredential',
      },
      {
        title: 'Access',
        to: 'master-access',
        action: 'manage',
        subject: 'MasterAccess',
      },
    ],
  },
]
  