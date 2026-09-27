/**
 * Flerläss Global
 * Team & User Permission Definitions
 *
 * `role` controls system-level access:
 *   - admin
 *   - staff
 *
 * `permissions` controls the specific activities a staff member
 * is allowed to perform.
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_INVENTORY: 'products.inventory',

  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EDIT: 'customers.edit',

  // Conversations
  CONVERSATIONS_VIEW: 'conversations.view',
  CONVERSATIONS_REPLY: 'conversations.reply',
  CONVERSATIONS_RESOLVE: 'conversations.resolve',
  CONVERSATIONS_AI: 'conversations.ai',

  // Campaigns
  CAMPAIGNS_VIEW: 'campaigns.view',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_EDIT: 'campaigns.edit',
  CAMPAIGNS_LAUNCH: 'campaigns.launch',
  CAMPAIGNS_CANCEL: 'campaigns.cancel',

  // Automations
  AUTOMATIONS_VIEW: 'automations.view',
  AUTOMATIONS_MANAGE: 'automations.manage',
  AUTOMATIONS_RETRY: 'automations.retry',
  AUTOMATIONS_CANCEL: 'automations.cancel',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',

  // Store settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  // Team & users
  TEAM_VIEW: 'team.view',
  TEAM_INVITE: 'team.invite',
  TEAM_EDIT: 'team.edit',
  TEAM_DEACTIVATE: 'team.deactivate',

  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_MANAGE: 'payments.manage',
};

export const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: [
      {
        key: PERMISSIONS.DASHBOARD_VIEW,
        label: 'View dashboard',
      },
    ],
  },

  {
    key: 'products',
    label: 'Products & Inventory',
    permissions: [
      {
        key: PERMISSIONS.PRODUCTS_VIEW,
        label: 'View products',
      },
      {
        key: PERMISSIONS.PRODUCTS_CREATE,
        label: 'Create products',
      },
      {
        key: PERMISSIONS.PRODUCTS_EDIT,
        label: 'Edit products',
      },
      {
        key: PERMISSIONS.PRODUCTS_DELETE,
        label: 'Delete products',
      },
      {
        key: PERMISSIONS.PRODUCTS_INVENTORY,
        label: 'Manage inventory',
      },
    ],
  },

  {
    key: 'orders',
    label: 'Orders',
    permissions: [
      {
        key: PERMISSIONS.ORDERS_VIEW,
        label: 'View orders',
      },
      {
        key: PERMISSIONS.ORDERS_UPDATE,
        label: 'Update orders',
      },
      {
        key: PERMISSIONS.ORDERS_CANCEL,
        label: 'Cancel orders',
      },
      {
        key: PERMISSIONS.ORDERS_REFUND,
        label: 'Manage refunds',
      },
    ],
  },

  {
    key: 'customers',
    label: 'Customers',
    permissions: [
      {
        key: PERMISSIONS.CUSTOMERS_VIEW,
        label: 'View customers',
      },
      {
        key: PERMISSIONS.CUSTOMERS_EDIT,
        label: 'Edit customers',
      },
    ],
  },

  {
    key: 'conversations',
    label: 'Conversations',
    permissions: [
      {
        key: PERMISSIONS.CONVERSATIONS_VIEW,
        label: 'View conversations',
      },
      {
        key: PERMISSIONS.CONVERSATIONS_REPLY,
        label: 'Reply to customers',
      },
      {
        key: PERMISSIONS.CONVERSATIONS_RESOLVE,
        label: 'Resolve conversations',
      },
      {
        key: PERMISSIONS.CONVERSATIONS_AI,
        label: 'Use AI assistance',
      },
    ],
  },

  {
    key: 'campaigns',
    label: 'Campaigns',
    permissions: [
      {
        key: PERMISSIONS.CAMPAIGNS_VIEW,
        label: 'View campaigns',
      },
      {
        key: PERMISSIONS.CAMPAIGNS_CREATE,
        label: 'Create campaigns',
      },
      {
        key: PERMISSIONS.CAMPAIGNS_EDIT,
        label: 'Edit campaigns',
      },
      {
        key: PERMISSIONS.CAMPAIGNS_LAUNCH,
        label: 'Launch campaigns',
      },
      {
        key: PERMISSIONS.CAMPAIGNS_CANCEL,
        label: 'Cancel campaigns',
      },
    ],
  },

  {
    key: 'automations',
    label: 'Automations',
    permissions: [
      {
        key: PERMISSIONS.AUTOMATIONS_VIEW,
        label: 'View automations',
      },
      {
        key: PERMISSIONS.AUTOMATIONS_MANAGE,
        label: 'Manage automations',
      },
      {
        key: PERMISSIONS.AUTOMATIONS_RETRY,
        label: 'Retry automations',
      },
      {
        key: PERMISSIONS.AUTOMATIONS_CANCEL,
        label: 'Cancel automations',
      },
    ],
  },

  {
    key: 'analytics',
    label: 'Analytics',
    permissions: [
      {
        key: PERMISSIONS.ANALYTICS_VIEW,
        label: 'View analytics',
      },
    ],
  },

  {
    key: 'settings',
    label: 'Store Settings',
    permissions: [
      {
        key: PERMISSIONS.SETTINGS_VIEW,
        label: 'View settings',
      },
      {
        key: PERMISSIONS.SETTINGS_MANAGE,
        label: 'Manage settings',
      },
    ],
  },

  {
    key: 'team',
    label: 'Team & Users',
    permissions: [
      {
        key: PERMISSIONS.TEAM_VIEW,
        label: 'View team members',
      },
      {
        key: PERMISSIONS.TEAM_INVITE,
        label: 'Invite users',
      },
      {
        key: PERMISSIONS.TEAM_EDIT,
        label: 'Edit users and permissions',
      },
      {
        key: PERMISSIONS.TEAM_DEACTIVATE,
        label: 'Activate/deactivate users',
      },
    ],
  },

  {
    key: 'payments',
    label: 'Payments',
    permissions: [
      {
        key: PERMISSIONS.PAYMENTS_VIEW,
        label: 'View payments',
      },
      {
        key: PERMISSIONS.PAYMENTS_MANAGE,
        label: 'Manage payments',
      },
    ],
  },
];

/**
 * Flatten all available permissions into a simple array.
 * Useful for validation when creating/updating users.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Built-in business roles.
 *
 * These are starting templates.
 * Later, the admin can create custom roles without changing
 * the permission system itself.
 */
export const DEFAULT_ROLES = [
  {
    key: 'order_manager',
    name: 'Order Manager',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
  },

  {
    key: 'customer_support',
    name: 'Customer Support',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CONVERSATIONS_VIEW,
      PERMISSIONS.CONVERSATIONS_REPLY,
      PERMISSIONS.CONVERSATIONS_RESOLVE,
      PERMISSIONS.CONVERSATIONS_AI,
      PERMISSIONS.ORDERS_VIEW,
    ],
  },

  {
    key: 'marketing_manager',
    name: 'Marketing Manager',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CAMPAIGNS_VIEW,
      PERMISSIONS.CAMPAIGNS_CREATE,
      PERMISSIONS.CAMPAIGNS_EDIT,
      PERMISSIONS.CAMPAIGNS_LAUNCH,
      PERMISSIONS.CAMPAIGNS_CANCEL,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
  },

  {
    key: 'inventory_manager',
    name: 'Inventory Manager',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_INVENTORY,
      PERMISSIONS.ORDERS_VIEW,
    ],
  },

  {
    key: 'sales_agent',
    name: 'Sales Agent',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CONVERSATIONS_VIEW,
      PERMISSIONS.CONVERSATIONS_REPLY,
      PERMISSIONS.CONVERSATIONS_AI,
      PERMISSIONS.ORDERS_VIEW,
    ],
  },
];