import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PageSpinner } from '../ui/Spinner.jsx';

export function AdminLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="min-w-0 flex-1 overflow-x-hidden">
        {/* Mobile admin header */}
        <header className="flex h-16 items-center border-b border-charcoal/10 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
            className="mr-3 rounded-lg p-2 text-charcoal hover:bg-emerald/10"
          >
            <Menu className="h-6 w-6" />
          </button>

          <span className="font-display text-lg font-semibold text-emerald">
            Flerläss Global Admin
          </span>
        </header>

        <main className="container-page py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}