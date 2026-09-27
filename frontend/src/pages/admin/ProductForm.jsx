import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Package,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import * as uploadService from '../../services/uploadService.js';

import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';

const emptyVariant = () => ({
  sku: '',
  color: '',
  size: '',
  stock: 0,
  priceOverride: '',
});

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-display text-base font-semibold text-charcoal">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked
          ? 'border-emerald/30 bg-emerald/[0.04]'
          : 'border-charcoal/10 bg-white hover:border-charcoal/20'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? 'border-emerald bg-emerald text-white'
            : 'border-charcoal/20 bg-white'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-charcoal">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted">
          {description}
        </p>
      </div>
    </label>
  );
}

export function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    basePrice: '',
    salePrice: '',
    stock: 0,
    status: 'draft',
    isFeatured: false,
    isNewArrival: false,
    images: [],
    variants: [],
  });

  useEffect(() => {
    categoryService
      .listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    productService
      .getProductAdmin(id)
      .then((p) =>
        setForm({
          name: p.name,
          categoryId: p.categoryId?._id || p.categoryId,
          description: p.description || '',
          basePrice: p.basePrice,
          salePrice: p.salePrice ?? '',
          stock: p.stock,
          status: p.status,
          isFeatured: p.isFeatured,
          isNewArrival: p.isNewArrival,
          images: p.images || [],
          variants: p.variants || [],
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadService.uploadProductImage(file);

      update('images', [...form.images, result]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    update(
      'images',
      form.images.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const addVariant = () => {
    update('variants', [...form.variants, emptyVariant()]);
  };

  const updateVariant = (index, field, value) => {
    update(
      'variants',
      form.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  };

  const removeVariant = (index) => {
    update(
      'variants',
      form.variants.filter((_, variantIndex) => variantIndex !== index)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      basePrice: Number(form.basePrice),
      salePrice:
        form.salePrice === ''
          ? null
          : Number(form.salePrice),
      stock: Number(form.stock) || 0,
      status: form.status,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      images: form.images,
      variants: form.variants.map((variant) => ({
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        stock: Number(variant.stock) || 0,
        priceOverride:
          variant.priceOverride === ''
            ? null
            : Number(variant.priceOverride),
      })),
    };

    try {
      if (isEdit) {
        await productService.updateProduct(id, payload);
      } else {
        await productService.createProduct(payload);
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="mx-auto max-w-5xl pb-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-charcoal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald">
            Catalogue management
          </p>

          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            {isEdit ? 'Edit product' : 'Create product'}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {isEdit
              ? 'Update your product information, pricing, images and variants.'
              : 'Add a product to your catalogue and make it available in your storefront.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorState message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic information */}
        <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <div className="border-b border-charcoal/10 p-5 sm:p-6">
            <SectionHeader
              icon={Package}
              title="Basic information"
              description="The core information customers will see about this product."
            />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Product name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. iPhone 15 Pro Max 256GB"
                required
              />

              <Select
                label="Category"
                value={form.categoryId}
                onChange={(e) =>
                  update('categoryId', e.target.value)
                }
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Description"
              rows={5}
              value={form.description}
              onChange={(e) =>
                update('description', e.target.value)
              }
              placeholder="Describe the product, material, features, fit, and other useful details..."
            />
          </div>
        </section>

        {/* Pricing and inventory */}
        <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <div className="border-b border-charcoal/10 p-5 sm:p-6">
            <SectionHeader
              icon={Package}
              title="Pricing & inventory"
              description="Set the selling price and keep track of available stock."
            />
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Base price (₦)"
                type="number"
                min="0"
                value={form.basePrice}
                onChange={(e) =>
                  update('basePrice', e.target.value)
                }
                placeholder="0"
                required
              />

              <Input
                label="Sale price (₦)"
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(e) =>
                  update('salePrice', e.target.value)
                }
                placeholder="Optional"
              />

              <Input
                label="Base stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  update('stock', e.target.value)
                }
                placeholder="0"
              />
            </div>

            <div className="mt-3 rounded-xl bg-charcoal/[0.025] px-4 py-3">
              <p className="text-xs leading-5 text-muted">
                Base stock is used when this product does not have
                variants. If variants are added, their individual
                stock values are used instead.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <Select
                label="Product status"
                value={form.status}
                onChange={(e) =>
                  update('status', e.target.value)
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>

              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-charcoal">
                  Storefront visibility
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleCard
                    checked={form.isFeatured}
                    onChange={(e) =>
                      update(
                        'isFeatured',
                        e.target.checked
                      )
                    }
                    title="Featured product"
                    description="Highlight this product in featured sections."
                  />

                  <ToggleCard
                    checked={form.isNewArrival}
                    onChange={(e) =>
                      update(
                        'isNewArrival',
                        e.target.checked
                      )
                    }
                    title="New arrival"
                    description="Show this product in your new arrivals."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <div className="border-b border-charcoal/10 p-5 sm:p-6">
            <SectionHeader
              icon={ImagePlus}
              title="Product images"
              description="Upload clear product photos for your storefront."
            />
          </div>

          <div className="p-5 sm:p-6">
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {form.images.map((image, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-charcoal/10 bg-charcoal/[0.03]"
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    {index === 0 && (
                      <div className="absolute left-2 top-2 rounded-full bg-charcoal/80 px-2 py-1 text-[10px] font-semibold text-white">
                        Main image
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm transition hover:bg-terracotta hover:text-white"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-charcoal/15 bg-charcoal/[0.015] text-muted transition hover:border-emerald/40 hover:bg-emerald/[0.025] hover:text-emerald">
                  {uploading ? (
                    <>
                      <RefreshIcon />
                      <span className="mt-2 text-xs font-medium">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6" />
                      <span className="mt-2 text-xs font-semibold">
                        Add image
                      </span>
                      <span className="mt-1 text-[10px]">
                        JPG, PNG, WEBP
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            ) : (
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-charcoal/15 bg-charcoal/[0.015] px-6 text-center transition hover:border-emerald/40 hover:bg-emerald/[0.025]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                  {uploading ? (
                    <RefreshIcon />
                  ) : (
                    <UploadCloud className="h-7 w-7" />
                  )}
                </div>

                <p className="mt-4 text-sm font-semibold text-charcoal">
                  {uploading
                    ? 'Uploading image...'
                    : 'Upload your first product image'}
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  Use clear, high-quality images that show the
                  product properly.
                </p>

                {!uploading && (
                  <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-charcoal px-3 py-2 text-xs font-semibold text-white">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Choose image
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </section>

        {/* Variants */}
        <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          <div className="border-b border-charcoal/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                icon={Package}
                title="Product variants"
                description="Use variants when the product has different sizes, colours, or prices."
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add variant
              </Button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {form.variants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-charcoal/15 bg-charcoal/[0.015] px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal/[0.05] text-muted">
                  <Package className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-semibold text-charcoal">
                  No variants added
                </p>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">
                  This product will use its base price and stock.
                  Add variants if customers need to choose things
                  like colour or size.
                </p>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add your first variant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {form.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.015] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald/10 text-xs font-bold text-emerald">
                          {index + 1}
                        </span>

                        <span className="text-sm font-semibold text-charcoal">
                          Variant {index + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-terracotta/10 hover:text-terracotta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <Input
                        label="SKU"
                        placeholder="e.g. ABA-BLK-M"
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'sku',
                            e.target.value
                          )
                        }
                      />

                      <Input
                        label="Colour"
                        placeholder="Black"
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'color',
                            e.target.value
                          )
                        }
                      />

                      <Input
                        label="Size"
                        placeholder="Medium"
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'size',
                            e.target.value
                          )
                        }
                      />

                      <Input
                        label="Stock"
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'stock',
                            e.target.value
                          )
                        }
                      />

                      <Input
                        label="Price override"
                        type="number"
                        min="0"
                        placeholder="Optional"
                        value={variant.priceOverride}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            'priceOverride',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another variant
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer actions */}
        <div className="sticky bottom-3 z-20 rounded-2xl border border-charcoal/10 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate('/admin/products')}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={saving || uploading}
            >
              <Save className="h-4 w-4" />

              {saving
                ? 'Saving product...'
                : isEdit
                  ? 'Save changes'
                  : 'Create product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function RefreshIcon() {
  return (
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export default ProductForm;