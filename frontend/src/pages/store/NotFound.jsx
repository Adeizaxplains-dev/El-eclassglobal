import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-semibold text-emerald">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-charcoal">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist or may have moved.</p>
      <Button as={Link} to="/" className="mt-6">Back to home</Button>
    </div>
  );
}
