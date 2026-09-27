import React from 'react';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { STORE_CONFIG } from '../../config/store.config.js';

export function About() {
  const { store } = useStoreInfo();
  const name = store?.name || STORE_CONFIG.brand.name;

  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="font-display text-3xl font-bold text-charcoal">About {name}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-charcoal/80">
        <p>
          {name} procures smartphones, laptops, audio devices, power banks, solar and inverter
          solutions and other gadgets from {STORE_CONFIG.sourcing.join(', ')} — then delivers them
          to customers across Nigeria.
        </p>
        <p>
          We're based in {STORE_CONFIG.locations.join(', ')}, with {STORE_CONFIG.delivery.coverage.toLowerCase()}.
          Whether you're after a new phone, a laptop upgrade, or a reliable power solution, we help you
          get authentic, quality gadgets without the guesswork.
        </p>
        <p>
          We also support trade-ins — swap your old device and put its value toward an upgrade — and
          accept {STORE_CONFIG.payments.map((p) => p.label).join(', ')}.
        </p>
        <p>
          Have a question about a specific product, availability or delivery? Reach out to us directly
          on WhatsApp — we're happy to help.
        </p>
      </div>

      <div id="delivery" className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Delivery</h2>
        <p className="mt-2 text-sm text-muted">{STORE_CONFIG.delivery.coverage}. {STORE_CONFIG.delivery.feeNote}</p>
      </div>
    </div>
  );
}
