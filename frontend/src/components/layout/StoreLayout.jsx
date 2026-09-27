import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { MobileBottomNav } from './MobileBottomNav.jsx';
import { FloatingWhatsApp } from './FloatingWhatsApp.jsx';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingWhatsApp />
    </div>
  );
}
