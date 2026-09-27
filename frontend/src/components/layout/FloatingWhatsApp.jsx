import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';

export function FloatingWhatsApp() {
  const { store } = useStoreInfo();
  const href = store
    ? buildWhatsAppLink(store.whatsapp?.number || store.whatsappNumber, `Hello ${store.name}, I have a question.`)
    : '#';

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-card-hover transition hover:brightness-95 lg:flex"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
