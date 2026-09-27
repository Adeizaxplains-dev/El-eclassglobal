/**
 * DEV-ONLY seed script. Creates the Flerläss Global Store record, an admin
 * user, and starter categories so you can log into the admin dashboard
 * locally and immediately see a working "Shop by Category" flow.
 *
 * This must never run against a production database — it's a
 * convenience for local development, not a source of "real" data.
 * Run with: npm run seed
 */
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { logger } from '../utils/logger.js';
import { toSlug } from './slugify.js';
import mongoose from 'mongoose';

// Structural starting categories named in the project brief — not
// invented business data, just the taxonomy the store is built around.
// No products are seeded: product data must come from the admin, never
// from this script.
//
// IMPORTANT — these names are deliberately short/plain because the
// storefront frontend (src/config/navigation.config.js and
// categories.config.js) hardcodes links like /shop?category=smartphones,
// and a category's slug is auto-generated from its `name` (see
// categoryService.js). If this name is later edited in the admin
// dashboard, its slug changes too, and any hardcoded frontend link to the
// OLD slug will start returning "Category not found". Two ways to avoid
// that going forward: keep category names/slugs stable once launched, or
// change the frontend to fetch categories from GET /api/categories and
// build its nav from the live slugs instead of hardcoding them.
const STARTER_CATEGORIES = [
  'Smartphones',
  'Laptops',
  'Audio',
  'Power',
  'Solar Inverter',
  'Wearables',
  'Gaming',
  'Accessories',
];

async function seed() {
  if (env.isProduction) {
    logger.error('Refusing to run seed script in production');
    process.exit(1);
  }

  await connectDB();

  let store = await Store.findOne({ slug: 'flerlass-global' });
  if (!store) {
    store = await Store.create({
      name: 'Flerläss Global',
      slug: 'flerlass-global',
      whatsapp: {
        number: env.whatsapp.businessNumber || '2348000000000',
      },
      locations: ['Ilorin', 'Abuja', 'Lagos'],
      sourcingCountries: ['USA', 'Canada', 'UK', 'Dubai'],
      currency: 'NGN',
    });
    logger.info('Created store', { storeId: store._id.toString() });
  } else {
    logger.info('Store already exists, skipping', { storeId: store._id.toString() });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@flerlassglobal.com').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'change_me_in_dev_only', 10);
   const admin = await User.create({
  name: 'FlerlÃ¤ss Global Admin',
  email: adminEmail,
  whatsappNumber: env.whatsapp.businessNumber || '2348000000000',
  passwordHash,
  role: 'admin',
  storeId: store._id,
});
    logger.info('Created admin user', { userId: admin._id.toString(), email: adminEmail });
  } else {
    logger.info('Admin user already exists, skipping', { email: adminEmail });
  }

  for (const name of STARTER_CATEGORIES) {
    const slug = toSlug(name);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Category.exists({ storeId: store._id, slug });
    if (!exists) {
      // eslint-disable-next-line no-await-in-loop
      await Category.create({ storeId: store._id, name, slug, status: 'active' });
      logger.info('Created category', { name, slug });
    }
  }

  await mongoose.disconnect();
  logger.info('Seed complete');
}

seed().catch((err) => {
  logger.error('Seed failed', { message: err.message });
  process.exit(1);
});
