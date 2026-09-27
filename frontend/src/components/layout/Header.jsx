import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart.js';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { NAV_LINKS } from '../../config/navigation.config.js';
import { STORE_CONFIG } from '../../config/store.config.js';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { itemCount } = useCart();
  const { store } = useStoreInfo();
  const navigate = useNavigate();

  function submitSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ivory/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <button
          className="text-charcoal lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={store?.logoUrl || STORE_CONFIG.brand.logo}
            alt={store?.name || STORE_CONFIG.brand.name}
            className="h-11 w-auto max-w-[150px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-charcoal/80'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative hidden flex-1 max-w-xs md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phones, laptops, audio…"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-4">
          <Link to="/search" aria-label="Search" className="text-charcoal hover:text-primary md:hidden">
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative text-charcoal hover:text-primary">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-ivory px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phones, laptops, audio…"
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </form>
          <ul className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-charcoal">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
