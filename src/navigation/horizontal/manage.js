export default [
  { heading: 'Manage' },
  {
    title: 'Manage',
    icon: { icon: 'ri-user-line' },
    children: [
      {
        title: 'User List',
        to: 'manage-users',
        action: 'manage',
        subject: 'USER_MANAGEMENT_LIST',
      },
      {
        title: 'Create User Deals',
        to: 'manage-users-create',
        action: 'manage',
        subject: 'USER_MANAGEMENT_CREATE',
      },
      {
        title: 'Create User External',
        to: 'manage-users-store-create',
        action: 'manage',
        subject: 'USER_MANAGEMENT_CREATE',
      },
    ],
  },
]
