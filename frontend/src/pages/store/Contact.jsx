import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { Button } from '../../components/ui/Button.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { STORE_CONFIG } from '../../config/store.config.js';

export function Contact() {
  const { store, loading } = useStoreInfo();

  if (loading) return <PageSpinner />;

  const whatsappHref = store
    ? buildWhatsAppLink(store.whatsapp?.number || store.whatsappNumber, `Hello ${store.name}, I'd like to get in touch.`)
    : '#';

  return (
    <div className="container-page max-w-xl py-14">
      <h1 className="font-display text-3xl font-bold text-charcoal">Get in touch</h1>
      <p className="mt-3 text-sm text-charcoal/80">
        The fastest way to reach us is on WhatsApp — send us a message and we'll respond as soon as we can.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-card">
        {store?.contact?.phone && (
          <div className="flex justify-between border-b border-border py-3 text-sm">
            <span className="text-muted">Phone</span>
            <span className="text-charcoal">{store.contact.phone}</span>
          </div>
        )}
        {store?.contact?.email && (
          <div className="flex justify-between border-b border-border py-3 text-sm">
            <span className="text-muted">Email</span>
            <span className="text-charcoal">{store.contact.email}</span>
          </div>
        )}
        <div className="flex justify-between py-3 text-sm">
          <span className="text-muted">Locations</span>
          <span className="text-charcoal">{STORE_CONFIG.locations.join(', ')}</span>
        </div>
        <div className="flex justify-between py-3 text-sm">
          <span className="text-muted">Delivery</span>
          <span className="text-charcoal">{STORE_CONFIG.delivery.coverage}</span>
        </div>

        <Button as="a" href={whatsappHref} target="_blank" rel="noreferrer" variant="whatsapp" size="lg" className="mt-5 w-full">
          <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp
        </Button>
      </div>
    </div>
  );
}
