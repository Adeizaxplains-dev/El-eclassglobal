import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe2,
  MessageCircle,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';

import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import { ProductGrid } from '../../components/product/ProductGrid.jsx';
import { CategoryIcon } from '../../components/product/CategoryIcon.jsx';
import { DemoProductCard } from '../../components/product/DemoProductCard.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { formatCurrency } from '../../utils/currency.js';
import { STORE_CONFIG } from '../../config/store.config.js';
import { HOMEPAGE_CATEGORIES } from '../../config/categories.config.js';
import { DEMO_PRODUCTS, DEMO_DEALS } from '../../config/demo-products.js';

function getProductImage(product) {
  return product?.images?.[0]?.url || product?.images?.[0] || '';
}

/**
 * Product card used in the moving hero showcase.
 */
function HeroProductCard({ product }) {
  const image = getProductImage(product);

  if (!image) return null;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block w-52 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm sm:w-60"
    >
      <div className="aspect-square overflow-hidden bg-white">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-semibold text-white">
          {product.name}
        </p>

        <p className="mt-1 text-sm font-semibold text-primary">
          {formatCurrency(
            product.salePrice ?? product.basePrice,
            'NGN'
          )}
        </p>
      </div>
    </Link>
  );
}

export function Home() {
  const [featured, setFeatured] = useState(null);
  const [newArrivals, setNewArrivals] = useState(null);
  const [categories, setCategories] = useState(null);
  const { store } = useStoreInfo();

  useEffect(() => {
    productService
      .listProducts({ featured: 'true', limit: 12 })
      .then((d) => setFeatured(d.items))
      .catch(() => setFeatured([]));

    productService
      .listProducts({ newArrival: 'true', limit: 8 })
      .then((d) => setNewArrivals(d.items))
      .catch(() => setNewArrivals([]));

    categoryService
      .listCategories()
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const whatsappNumber = store?.whatsapp?.number || store?.whatsappNumber;

  const whatsappHref = whatsappNumber
    ? buildWhatsAppLink(
        whatsappNumber,
        `Hello ${store?.name || STORE_CONFIG.brand.name}, I'd like to know more about your gadgets.`
      )
    : '#';

  // "Today's Deals" = real products actually on sale.
  // We never invent a discount — only products where the backend
  // has set a genuine salePrice lower than basePrice are shown here.
  const realDeals = useMemo(() => {
    const pool = [...(featured || []), ...(newArrivals || [])];

    return pool
      .filter(
        (p) =>
          p.salePrice != null &&
          p.salePrice < p.basePrice
      )
      .slice(0, 8);
  }, [featured, newArrivals]);

  const dataLoaded = featured !== null;
  const showDemoTrending = dataLoaded && featured.length === 0;
  const showDemoDeals = dataLoaded && realDeals.length === 0;

  return (
    <div>
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-black">
        <div className="container-page relative grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-20">

          {/* Hero content */}
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {STORE_CONFIG.sourcing.join(' · ')}
              </p>
            </div>

            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-[3.4rem]">
              Premium Gadgets,
              <span className="block">Sourced Globally.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-white/70 sm:text-lg">
              Authentic phones, laptops, audio devices, power solutions and more —
              sourced from {STORE_CONFIG.sourcing.join(', ')} and delivered across Nigeria.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                as={Link}
                to="/shop"
                size="lg"
                variant="primary"
              >
                Shop Gadgets
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                as="a"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                size="lg"
                variant="whatsapp"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
              <span>{STORE_CONFIG.delivery.coverage}</span>

              <span className="hidden sm:inline">•</span>

              <span>{STORE_CONFIG.locations.join(' · ')}</span>
            </div>
          </div>

          {/* =====================================================
              MOVING PRODUCT SHOWCASE
          ====================================================== */}
          <div className="relative min-w-0 overflow-hidden">

            {featured && featured.length > 0 ? (
              <div className="relative overflow-hidden py-4">

                {/* Soft fade on left */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent" />

                {/* Soft fade on right */}
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent" />

                <div className="hero-product-track flex w-max gap-4">
                  {[...featured, ...featured].map((product, index) => (
                    <HeroProductCard
                      key={`${product._id || product.id}-${index}`}
                      product={product}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  'smartphone',
                  'laptop',
                  'headphones',
                  'battery',
                ].map((icon) => (
                  <div
                    key={icon}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-white/5 text-white/40 ring-1 ring-white/10"
                  >
                    <CategoryIcon
                      icon={icon}
                      className="h-10 w-10"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST / VALUE STRIP
      ========================================================== */}
      <section className="border-b border-border bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">

          <div className="flex flex-col items-start gap-2">
            <Globe2 className="h-5 w-5 text-primary" />

            <p className="text-xs font-semibold text-charcoal">
              Global Sourcing
            </p>

            <p className="text-xs text-muted">
              {STORE_CONFIG.sourcing.join(' • ')}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Truck className="h-5 w-5 text-primary" />

            <p className="text-xs font-semibold text-charcoal">
              Nationwide Delivery
            </p>

            <p className="text-xs text-muted">
              Delivered across Nigeria
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Recycle className="h-5 w-5 text-primary" />

            <p className="text-xs font-semibold text-charcoal">
              Trade-In Available
            </p>

            <p className="text-xs text-muted">
              Swap your device and upgrade
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Wallet className="h-5 w-5 text-primary" />

            <p className="text-xs font-semibold text-charcoal">
              Flexible Options
            </p>

            <p className="text-xs text-muted">
              {STORE_CONFIG.payments.map((p) => p.label).join(' • ')}
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================
          SHOP BY CATEGORY
      ========================================================== */}
      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Shop by Category
        </h2>

        <p className="mt-2 text-sm text-muted">
          Find exactly what you're looking for.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(categories || []).map((c) => {
            const fallback = HOMEPAGE_CATEGORIES.find(
              (item) => item.slug === c.slug
            );

            return (
              <Link
                key={c._id || c.slug}
                to={`/shop?category=${encodeURIComponent(c.slug)}`}
                className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/40 hover:shadow-card"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-black">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white">
                      <CategoryIcon
                        icon={fallback?.icon || 'package'}
                        className="h-10 w-10"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold text-charcoal">
                    {c.name}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {c.description ||
                      fallback?.blurb ||
                      'Explore our latest gadgets'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          TRENDING NOW
      ========================================================== */}
      <section className="container-page py-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Trending Now
          </h2>

          <Link
            to="/shop?featured=true"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-6">
          {!dataLoaded ? (
            <PageSpinner />
          ) : showDemoTrending ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {DEMO_PRODUCTS.map((p) => (
                  <DemoProductCard
                    key={p.id}
                    product={p}
                    whatsappNumber={whatsappNumber}
                  />
                ))}
              </div>

              <p className="mt-4 text-xs text-muted">
                Showing sample gadgets while the live catalogue is being
                set up — tap any item to ask about it on WhatsApp.
              </p>
            </>
          ) : (
            <ProductGrid
              products={featured}
              emptyMessage="Featured products will appear here soon."
            />
          )}
        </div>
      </section>

      {/* =========================================================
          TODAY'S DEALS
      ========================================================== */}
      <section className="bg-surface py-10">
        <div className="container-page">
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Today's Deals
          </h2>

          <div className="mt-6">
            {!dataLoaded ? (
              <PageSpinner />
            ) : showDemoDeals ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {DEMO_DEALS.map((p) => (
                    <DemoProductCard
                      key={p.id}
                      product={p}
                      whatsappNumber={whatsappNumber}
                    />
                  ))}
                </div>

                <p className="mt-4 text-xs text-muted">
                  Sample pricing for illustration — ask on WhatsApp for
                  current offers.
                </p>
              </>
            ) : (
              <ProductGrid
                products={realDeals}
                emptyMessage="No active deals right now — check back soon."
              />
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          POWER SOLUTIONS
      ========================================================== */}
      <section className="container-page py-14">
        <div className="grid items-center gap-8 rounded-2xl bg-black p-8 text-white sm:grid-cols-[1fr_auto] sm:p-12">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Stay Powered
            </p>

            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Power banks, inverters &amp; solar — never run out of charge.
            </h2>

            <p className="mt-3 max-w-lg text-sm text-white/70">
              Reliable backup power for home, work and on the go — from
              fast-charging power banks to full inverter and solar setups.
            </p>

            <Button
              as={Link}
              to="/shop?category=power"
              size="md"
              variant="primary"
              className="mt-6"
            >
              Shop Power Solutions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden gap-3 sm:flex">
            {['battery', 'zap', 'sun'].map((icon) => (
              <div
                key={icon}
                className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10 text-white"
              >
                <CategoryIcon
                  icon={icon}
                  className="h-8 w-8"
                />
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
          TRADE-IN / SWAP
      ========================================================== */}
      <section className="container-page py-8">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-white p-8 sm:grid-cols-[auto_1fr] sm:p-12">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-primary">
            <Recycle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-charcoal">
              Upgrade Without Starting From Scratch.
            </h2>

            <p className="mt-3 max-w-lg text-sm text-muted">
              Have an old device? Trade it in and put its value toward
              your next upgrade.
            </p>

            <Button
              as="a"
              href={buildWhatsAppLink(
                whatsappNumber,
                `Hello ${store?.name || STORE_CONFIG.brand.name}, I'd like to start a trade-in.`
              )}
              target="_blank"
              rel="noreferrer"
              size="md"
              variant="outline"
              className="mt-6"
            >
              Start a Trade-In
            </Button>
          </div>

        </div>
      </section>

      {/* =========================================================
          GLOBAL SOURCING
      ========================================================== */}
      <section
        id="sourcing"
        className="bg-surface py-14"
      >
        <div className="container-page text-center">

          <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
            Sourced Around the World. Delivered to You.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            We procure gadgets from trusted channels abroad so you get
            authentic products, then deliver them nationwide across Nigeria.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STORE_CONFIG.sourcing.map((country) => (
              <div
                key={country}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                  <Globe2 className="h-6 w-6" />
                </div>

                <p className="text-sm font-semibold text-charcoal">
                  {country}
                </p>

                <ArrowRight className="h-4 w-4 rotate-90 text-primary" />

                <p className="text-xs text-muted">
                  Nigeria
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
          WHY SHOP WITH US
      ========================================================== */}
      <section className="bg-white py-14">
        <div className="container-page grid gap-8 sm:grid-cols-3">

          <div>
            <ShieldCheck className="h-6 w-6 text-primary" />

            <h3 className="mt-3 font-display text-lg font-semibold text-charcoal">
              Quality, always
            </h3>

            <p className="mt-2 text-sm text-muted">
              Every gadget is checked before it reaches you — not just
              sold as-is.
            </p>
          </div>

          <div>
            <MessageCircle className="h-6 w-6 text-primary" />

            <h3 className="mt-3 font-display text-lg font-semibold text-charcoal">
              Personal service
            </h3>

            <p className="mt-2 text-sm text-muted">
              Chat with us directly on WhatsApp for specs, pricing or advice.
            </p>
          </div>

          <div>
            <Truck className="h-6 w-6 text-primary" />

            <h3 className="mt-3 font-display text-lg font-semibold text-charcoal">
              Delivered with care
            </h3>

            <p className="mt-2 text-sm text-muted">
              Nationwide delivery, carefully packaged for every order.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================
          WHATSAPP CTA BANNER
      ========================================================== */}
      <section className="container-page pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-primary p-8 text-center text-white sm:flex-row sm:text-left sm:p-10">

          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              Not sure what you need?
            </h2>

            <p className="mt-1 text-sm text-white/85">
              Chat with us on WhatsApp — we'll help you find the right gadget.
            </p>
          </div>

          <Button
            as="a"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            size="lg"
            variant="secondary"
            className="shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </Button>

        </div>
      </section>
    </div>
  );
}