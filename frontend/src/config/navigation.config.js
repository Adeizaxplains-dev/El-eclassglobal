/**
 * NAVIGATION CONFIGURATION
 * Header, footer and category links are generated from this list so the
 * catalogue structure only needs to change in one place.
 */

export const NAV_LINKS = [
  { label: 'Shop', to: '/shop' },
  { label: 'Smartphones', to: '/shop?category=smartphones' },
  { label: 'Laptops', to: '/shop?category=laptops' },
  { label: 'Audio', to: '/shop?category=audio' },
  { label: 'Power', to: '/shop?category=power' },
  { label: 'Accessories', to: '/shop?category=accessories' },
  { label: 'Deals', to: '/shop?deals=true' },
];

export const FOOTER_LINKS = {
  shop: [
    { label: 'Smartphones', to: '/shop?category=smartphones' },
    { label: 'Laptops', to: '/shop?category=laptops' },
    { label: 'Audio', to: '/shop?category=audio' },
    { label: 'Power', to: '/shop?category=power' },
    { label: 'Accessories', to: '/shop?category=accessories' },
    { label: 'Deals', to: '/shop?deals=true' },
  ],
  customer: [
    { label: 'Contact', to: '/contact' },
    { label: 'Delivery', to: '/about#delivery' },
    { label: 'Trade-In', to: '/trade-in' },
  ],
  company: [
    { label: 'About', to: '/about' },
    { label: 'Global Sourcing', to: '/about#sourcing' },
  ],
};
