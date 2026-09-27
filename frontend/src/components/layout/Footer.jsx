import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Facebook, Twitter } from 'lucide-react';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { STORE_CONFIG } from '../../config/store.config.js';
import { FOOTER_LINKS } from '../../config/navigation.config.js';

export function Footer() {
  const { store } = useStoreInfo();
  const whatsappHref = store
    ? buildWhatsAppLink(store.whatsapp?.number || store.whatsappNumber, `Hello ${store.name}, I have a question.`)
    : '#';

  const social = STORE_CONFIG.social;

  return (
    <footer className="mt-20 border-t border-black bg-black text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="inline-flex rounded-lg bg-white p-2">
            <img
              src={store?.logoUrl || STORE_CONFIG.brand.logo}
              alt={store?.name || STORE_CONFIG.brand.name}
              className="h-10 w-auto max-w-[130px] object-contain"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/60">{STORE_CONFIG.brand.description}</p>
          <div className="mt-4 flex gap-4">
            <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="text-white/70 hover:text-primary">
              <MessageCircle className="h-5 w-5" />
            </a>
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-white/70 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-white/70 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {social.twitter && (
              <a href={social.twitter} target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="text-white/70 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            {FOOTER_LINKS.shop.map((l) => (
              <li key={l.label}><Link to={l.to} className="hover:text-primary">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Customer</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            {FOOTER_LINKS.customer.map((l) => (
              <li key={l.label}><Link to={l.to} className="hover:text-primary">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            {FOOTER_LINKS.company.map((l) => (
              <li key={l.label}><Link to={l.to} className="hover:text-primary">{l.label}</Link></li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-white">Locations</p>
          <ul className="mt-3 space-y-1 text-sm text-white/60">
            {STORE_CONFIG.locations.map((loc) => <li key={loc}>{loc}</li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {STORE_CONFIG.brand.name}. All rights reserved.
      </div>
    </footer>
  );
}
