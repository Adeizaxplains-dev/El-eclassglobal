# Flerläss Global — Frontend

React + Vite + Tailwind gadget/electronics storefront and admin dashboard,
built against the `backend/` API in this repo. Originally built for a
different client (Umm-Faisal, a fashion retailer) and restructured for
Flerläss Global — see "Rebrand notes" below for what that means for this
codebase.

## Structure

```
frontend/src/
├── app/                providers (Auth, Cart), routes.jsx, App.jsx, ScrollToTop
├── components/
│   ├── ui/               Button, Card, Badge, Input, Select, Spinner, EmptyState, etc.
│   ├── layout/            Header, Footer, MobileBottomNav, StoreLayout, AdminLayout, AdminSidebar
│   ├── product/            ProductCard, ProductGrid, ProductFilters, VariantSelector
│   ├── cart/                CartItemRow, CartSummary
│   ├── checkout/             CheckoutForm
│   └── admin/                 StatCard, DataTable, Pagination
├── pages/
│   ├── store/              Home, Shop, ProductDetail, Cart, Checkout, OrderDetail, About, Contact, Search, NotFound
│   └── admin/                Login, Dashboard, Products, ProductForm, Categories, Orders, OrderDetail, Customers, CustomerDetail
├── hooks/                 useCart, useAuth, useDebounce, useStoreInfo
├── services/               one file per API resource — the only place that calls the backend
├── context/                 CartContext, AuthContext (state lives in app/providers)
└── utils/                    currency, session id, UTM attribution capture, WhatsApp link builder
```

## Design system

- **Colors**: white background, brand red (`#C90016`) primary/action color, near-black secondary accent, WhatsApp's own green reserved only for WhatsApp CTAs.
- **Type**: Sora for headings, Inter for body/UI — loaded via Google Fonts in `index.html`.
- All tokens live in `src/config/theme.config.js`, which `tailwind.config.js` imports — change the palette there, not in components. See "Rebrand notes" for why the underlying Tailwind class names (`emerald`, `gold`, etc.) don't match the current color names.

## Rebrand notes (Umm-Faisal → Flerläss Global)

This codebase was originally built for a fashion retailer (abayas, shoes,
bags, cosmetics) and has been restructured into a gadget/electronics
storefront for Flerläss Global. What changed and what didn't:

- **`src/config/`** is new — `store.config.js` (brand, contact, locations,
  sourcing countries, delivery, payment methods, socials),
  `navigation.config.js`, `categories.config.js`, `theme.config.js`, and
  `demo-products.js`. This is the one place to edit business info, nav,
  categories or color tokens — components should not need to change.
- **Tailwind color tokens kept their old names** (`emerald`, `gold`,
  `ivory`, `charcoal`, `muted`, `terracotta`) but now point at the red/
  black/white palette instead of the old emerald/gold one — see the
  comment at the top of `theme.config.js`. This was a deliberate choice:
  ~50 components already reference these class names, and repointing the
  values in one file re-themes everything with zero risk to working cart/
  checkout/admin logic. New sections (Home, Header, Footer) also use
  clearer new tokens (`primary`, `black`, `surface`, `border`) — prefer
  those for anything you add going forward, and consider a full rename
  pass later if you want the class names to match what they mean.
- **`src/config/demo-products.js`** holds icon-based placeholder products
  (no photos — icons only, so nothing can be mistaken for a real product
  photo) shown on the homepage only when the live API returns zero
  products for a section. Once the backend catalogue has real products,
  these stop appearing automatically. Prices and stock in this file are
  illustrative only, not confirmed pricing.
- **Cart, checkout, Paystack integration, auth, and all backend API
  contracts are untouched** — this was a visual/content restructure, not
  a rewrite of commerce logic.
- **Logo**: `src/assets/brand/logo.png` is the client-supplied logo,
  cropped from a WhatsApp profile-picture screenshot (the phone number/
  Instagram-handle row baked into that screenshot was cropped out, since
  that's contact info — already in `store.config.js` — not part of the
  logo mark itself). Swap this file for a higher-resolution export when
  the client provides one; the WhatsApp number, phone, email and socials
  in `store.config.js` are still placeholders and need the client's real
  details before launch.

## How it maps to the backend

Every page talks to the backend only through `src/services/*.js` — no component calls `fetch`/`axios` directly. Each service file mirrors one backend resource:

| Service | Backend routes it calls |
|---|---|
| `storeService` | `GET /api/store` |
| `categoryService` | `GET/POST/PATCH/DELETE /api/categories` |
| `productService` | `GET /api/products`, `/api/products/admin/*` |
| `cartService` | `/api/cart` (guest cart via `X-Session-Id` header, set automatically) |
| `orderService` | `/api/orders`, `/api/orders/admin` |
| `paymentService` | `/api/payments/initialize`, `/api/payments/:reference/verify` |
| `customerService` | `/api/customers` |
| `analyticsService` | `/api/analytics/*` |
| `authService` | `/api/auth/login`, `/api/auth/me` |
| `uploadService` | `/api/products/admin/upload-image` |
| `eventService` | `/api/events` (conversion funnel tracking) |

`src/services/api.js` is the single axios instance: it attaches the guest
session id to every request, attaches the admin JWT once logged in, unwraps
the backend's `{ success, data, message }` envelope automatically, and
redirects to `/admin/login` on a 401 inside `/admin/*`.

### Conversion funnel wired end-to-end

- Product page view → `product_view` event (fired by the backend itself when `?sessionId=` is present on `GET /api/products/:slug`)
- Add to cart → `add_to_cart` event
- Checkout submission → `checkout_started` event
- Payment initialization → `payment_attempted` event
- Backend-verified payment success → recorded server-side via `orderService.markOrderPaid`, which also updates the customer's CRM stats and fires the WhatsApp order-confirmation automation

All of this feeds `GET /api/analytics/funnel` on the admin dashboard.

### Payment flow (frontend side)

Checkout never marks anything "paid" itself:

1. `orderService.createOrder()` creates a `pending` order from the cart
2. `paymentService.initializePayment()` gets a Paystack `authorization_url` and redirects the browser there
3. Paystack redirects back to `/order/:id?reference=...`
4. `OrderDetail` calls `paymentService.verifyPayment(reference)`, which hits the backend's verify endpoint — **the backend, not the frontend, decides whether the order is paid**
5. The page then reloads the order and displays whatever the backend says the status actually is

## Setup

```bash
cd frontend
cp .env.example .env    # points at your backend, defaults to http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Make sure the backend is running first (see `../backend/README.md`) and
that `CLIENT_URL` in the backend's `.env` matches this dev server's origin
(`http://localhost:5173` by default) — CORS will reject requests otherwise.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

## Admin access

Visit `/admin/login` and sign in with the admin account created by the
backend's `npm run seed` script (see backend README for default
credentials — change them before going live).

## What's real vs. not yet built

| Area | Status |
|---|---|
| Storefront (home, shop, product detail, cart, checkout, order tracking, search, about, contact) | Fully built against live API data — no hardcoded products |
| Admin (dashboard, products + image upload + variants, categories, orders, customers) | Fully built against live API data |
| Paystack checkout redirect + backend-verified confirmation | Fully wired |
| WhatsApp CTAs (product page, cart, footer, contact, order confirmation) | Fully wired — links are live once the backend's `whatsappNumber` is set; actual message *sending* depends on the backend's WhatsApp credentials (see backend README) |
| Customer accounts (`/account/*`) | Not built — guest checkout only, per the MVP priority in the brief |
| Abandoned-cart recovery UI | Not built — backend data model supports it (Phase 8), no scheduled job or admin view yet |

## Verification note

For this rebrand, `npm install` and `npm run build` were both run
end-to-end against this exact codebase and completed with no errors — the
production bundle builds cleanly and the compiled CSS was checked to
confirm the new brand red (`#C90016`) is actually present in the output.
That confirms the dependency graph, Tailwind config and JSX are all sound.
It does not replace testing real user flows in a browser — please run
`npm install && npm run dev`, click through the storefront (especially
cart → checkout, since Paystack needs your real keys) and tell me what you
see.
