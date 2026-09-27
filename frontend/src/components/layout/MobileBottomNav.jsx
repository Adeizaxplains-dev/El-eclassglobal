import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Search, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '../../hooks/useCart.js';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';

const ITEM_CLASS = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-emerald' : 'text-muted'}`;

export function MobileBottomNav() {
  const { itemCount } = useCart();
  const { store } = useStoreInfo();
  const whatsappHref = store ? buildWhatsAppLink(store.whatsappNumber, `Hello ${store.name}, I have a question.`) : '#';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-charcoal/10 bg-ivory/95 backdrop-blur lg:hidden">
      <NavLink to="/" className={ITEM_CLASS} end>
        <Home className="h-5 w-5" />
        Home
      </NavLink>
      <NavLink to="/shop" className={ITEM_CLASS}>
        <Store className="h-5 w-5" />
        Shop
      </NavLink>
      <NavLink to="/search" className={ITEM_CLASS}>
        <Search className="h-5 w-5" />
        Search
      </NavLink>
      <NavLink to="/cart" className={ITEM_CLASS}>
        <span className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-semibold text-ivory">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </span>
        Cart
      </NavLink>
      <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-whatsapp">
        <MessageCircle className="h-5 w-5" />
        Chat
      </a>
    </nav>
  );
}
