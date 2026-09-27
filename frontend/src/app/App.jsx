import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { CartProvider } from './providers/CartProvider.jsx';
import { AppRoutes } from './routes.jsx';
import { ScrollToTop } from './ScrollToTop.jsx';
import { captureAttribution } from '../utils/attribution.js';

function AttributionCapture() {
  const location = useLocation();
  useEffect(() => {
    captureAttribution(location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <AttributionCapture />
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
