import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  Zap,
  MessageSquare,
  Tag,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const LINKS = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Package,
  },
  {
    to: '/admin/categories',
    label: 'Categories',
    icon: Tag,
  },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ShoppingCart,
  },
  {
    to: '/admin/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    to: '/admin/automations',
    label: 'Control Center',
    icon: Zap,
  },
  {
    to: '/admin/conversations',
    label: 'Conversations',
    icon: MessageSquare,
  },

    {
    to: '/admin/team',
    label: 'Team',
    icon: UserCog,
  },

  {
    to: '/admin/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
  },
  {
    to: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function AdminSidebar({ open = false, onClose = () => {} }) {
  const { logout, user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col
          border-r border-charcoal/10 bg-white
          transition-transform duration-200 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-charcoal/10 px-6">
          <span className="font-display text-lg font-semibold text-emerald">
            Flerläss Global Admin
          </span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="rounded-lg p-2 text-charcoal hover:bg-emerald/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald text-ivory'
                    : 'text-charcoal/80 hover:bg-emerald/10'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div className="border-t border-charcoal/10 p-4">
          <p className="truncate text-xs text-muted">
            {user?.email}
          </p>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="mt-2 flex items-center gap-2 text-sm font-medium text-terracotta"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
