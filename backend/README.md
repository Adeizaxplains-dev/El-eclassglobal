# Flerläss Global — Backend

Node.js + Express + MongoDB/Mongoose API for the Flerläss Global gadget/
electronics storefront and admin dashboard. Originally built for a
different client (Umm-Faisal, a fashion retailer) and restructured here —
see "Rebrand notes" for what that means for this codebase, and "Bug fixes"
for issues found and fixed while doing that.

## Stack

Express, Mongoose, JWT auth, Zod validation, Paystack (payments),
Cloudinary (images), WhatsApp Cloud API (messaging), an in-process event
emitter driving automations (abandoned cart, payment follow-up, order
lifecycle messages).

## Setup

```bash
npm install
cp .env.example .env   # fill in Mongo URI, JWT secret, Paystack/Cloudinary/WhatsApp keys
npm run seed            # creates the Flerläss Global store, an admin user, and starter categories
npm run dev
```

## API surface

Matches what the frontend's `src/services/*.js` files already call:

| Area | Routes |
|---|---|
| Store | `GET /api/store` (public), `GET/PATCH /api/store/admin` |
| Categories | `GET /api/categories`, `GET /api/categories/:slug`, admin CRUD |
| Products | `GET /api/products`, `GET /api/products/:slug`, admin CRUD + low-stock |
| Cart | `GET/POST/PATCH/DELETE /api/cart/*` |
| Orders | `POST /api/orders`, admin list/detail/status update |
| Payments | Paystack init/verify + webhook (mounted with raw body in `app.js`) |
| Customers | Admin CRUD, denormalized order stats |
| Analytics | `GET /api/analytics/overview`, `/sales`, `/top-products`, `/funnel`, `/acquisition` |
| Events | `POST /api/events` — funnel tracking (`product_view`, `add_to_cart`, etc.) |
| Campaigns / Automations / Team / Conversations | Admin-only, for WhatsApp CRM and staff management |

## Rebrand notes (Umm-Faisal → Flerläss Global)

- **`src/utils/seed.js`** now creates the Flerläss Global store record and
  seeds gadget categories (Smartphones, Laptops, Audio, Power, Solar
  Inverter, Wearables, Gaming, Accessories) instead of the old
  Abayas/Shoes/Bags/Cosmetics. **These category names are deliberately
  short** — see the comment in that file for why: the frontend hardcodes
  links like `/shop?category=smartphones`, and a category's slug is
  auto-generated from its `name`. If an admin later renames "Smartphones"
  to something longer in the dashboard, its slug changes and that
  hardcoded frontend link breaks. Two ways to fix this properly later: keep
  category names stable once launched, or change the frontend to build its
  nav from `GET /api/categories` instead of a hardcoded list. Worth doing
  before this goes to a non-technical admin who'll want to rename things.
- **`Product` model** gained two fields the fashion schema didn't need:
  `condition` (`New` / `UK Used` / `US Used` / `Refurbished`, optional —
  never assume "New") and `warranty` (free text, admin-entered, empty by
  default). Threaded through `productValidators.js` — nothing else needed
  changing since the service layer already spreads the full payload.
- **`Store` model** gained `locations` and `sourcingCountries` (string
  arrays), settable via `PATCH /api/store/admin`. The storefront frontend
  currently has these hardcoded in its own config as a fallback; once you
  set them here, the frontend's `useStoreInfo` hook picks them up
  automatically (it merges live API data over its defaults).
- Every other "Umm-Faisal" text reference (health-check message, staff
  invite email copy, permissions doc comment, guest-checkout email domain
  used for Paystack) was swapped for Flerläss Global. No functional logic
  changed in any of these — text only.

## Bug fixes made while doing this

Three real bugs were found and fixed, all pre-existing (not introduced by
the rebrand):

1. **WhatsApp enquiry link was always `null`.** `productController.js`
   read `store.whatsappNumber`, but the `Store` schema actually nests it at
   `store.whatsapp.number`. The product-detail WhatsApp CTA link was
   silently broken. Fixed to read the correct path.
2. **The seed script wrote to a field that doesn't exist.** Same root
   cause — `seed.js` set `whatsappNumber` directly on the Store document,
   which Mongoose silently drops since it isn't in the schema. Fixed to
   write `whatsapp: { number }`.
3. **Delivery fee was hardcoded to 0**, with a `TODO` noting it should use
   `Store.deliverySettings.deliveryFee` — which already existed in the
   schema and admin settings form, just never wired into
   `createOrderFromCart`. Fixed: delivery fee is now read from the store's
   settings, and waived automatically once `freeDeliveryThreshold` is met.
4. **Dashboard low-stock count ignored variant stock.** The dashboard's
   low-stock number only checked a product's flat `stock` field, while the
   separate admin low-stock list (`listLowStockProducts`) correctly checks
   variant stock too when a product has variants. A near-sold-out variant
   product could sit at zero on the dashboard while showing up correctly
   in the admin product list. Fixed the dashboard aggregation to check
   both, matching the existing (correct) logic.

None of these were introduced by this rebrand — they were there in the
original Umm-Faisal codebase and would have affected that business too.
Worth mentioning if you're paying for or reviewing this as inherited work.

## Verification note

Every source file passed `node --check` (syntax), and the full Express app
was built end-to-end with `createApp()` outside of `server.js` (no DB
connection needed for that) to confirm every route, controller, model, and
middleware import resolves and wires up without throwing — 16 route layers
registered cleanly. This sandbox has no MongoDB available and no network
path to install one, so **no actual database read/write, login, checkout,
or webhook flow was executed against real data**. Please run
`npm install && npm run seed && npm run dev` locally, log in with the
seeded admin, and walk through creating a category → a product → a test
order — I'd rather catch anything real against your own output than claim
more than the syntax/wiring check actually proves.
