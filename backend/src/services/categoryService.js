import { Category } from '../models/Category.js';
import { AppError } from '../utils/AppError.js';
import { toSlug, randomSuffix } from '../utils/slugify.js';
import { getDefaultStoreId } from './storeContext.js';

async function uniqueSlug(storeId, name) {
  let slug = toSlug(name);
  let attempt = slug;
  while (await Category.exists({ storeId, slug: attempt })) {
    attempt = `${slug}-${randomSuffix(4)}`;
  }
  return attempt;
}

export async function listCategories({ status } = {}) {
  const storeId = await getDefaultStoreId();

  const filter = {
    storeId,
    status: status || 'active',
  };

  return Category.find(filter).sort({ name: 1 });
}

export async function getCategoryBySlug(slug) {
  const storeId = await getDefaultStoreId();
  const category = await Category.findOne({ storeId, slug });
  if (!category) throw AppError.notFound('Category not found');
  return category;
}

export async function createCategory(payload) {
  const storeId = await getDefaultStoreId();
  const slug = await uniqueSlug(storeId, payload.name);
  return Category.create({ ...payload, storeId, slug });
}

export async function updateCategory(id, payload) {
  const category = await Category.findById(id);
  if (!category) throw AppError.notFound('Category not found');

  if (payload.name && payload.name !== category.name) {
    payload.slug = await uniqueSlug(category.storeId, payload.name);
  }

  Object.assign(category, payload);
  await category.save();
  return category;
}

export async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) throw AppError.notFound('Category not found');
  // Soft-delete via status rather than a hard delete, so existing products
  // referencing this category don't end up pointing at nothing.
  category.status = 'inactive';
  await category.save();
  return category;
}
