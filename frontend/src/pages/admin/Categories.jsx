import React, { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';

import * as categoryService from '../../services/categoryService.js';
import { api } from '../../services/api.js';

import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read image'));

    reader.readAsDataURL(file);
  });


async function uploadCategoryImage(file) {
  if (!file) {
    throw new Error('Please select an image');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be 5MB or smaller');
  }

  const dataUri = await fileToDataUri(file);

  /*
   * The existing backend upload endpoint is reused here.
   *
   * The API interceptor returns the outer API response,
   * so response.data contains:
   *
   * {
   *   url,
   *   publicId
   * }
   */
  const response = await api.post('/products/admin/upload-image', {
    dataUri,
  });

  const imageUrl = response.data?.url || '';

  if (!imageUrl) {
    throw new Error('Image upload succeeded but no image URL was returned');
  }

  return imageUrl;
}


/*
|--------------------------------------------------------------------------
| Categories Page
|--------------------------------------------------------------------------
*/

export function Categories() {
  const [categories, setCategories] = useState(null);

  const [error, setError] = useState(null);

  const [newName, setNewName] = useState('');

  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  const [saving, setSaving] = useState(false);

  const [uploadingCategoryId, setUploadingCategoryId] = useState(null);

  /*
   * Load categories
   */
  const load = async () => {
    try {
      setError(null);

      const data = await categoryService.listCategories();

      setCategories(data);
    } catch (err) {
      setError(err?.message || 'Unable to load categories.');
    }
  };

  useEffect(() => {
    load();
  }, []);


  /*
|--------------------------------------------------------------------------
| New category image
|--------------------------------------------------------------------------
*/

  const handleNewImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5MB or smaller.');
      e.target.value = '';
      return;
    }

    setNewImage(file);

    const previewUrl = URL.createObjectURL(file);

    setNewImagePreview(previewUrl);

    e.target.value = '';
  };


  /*
   * Remove selected new-category image
   */
  const removeNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    setNewImage(null);
    setNewImagePreview('');
  };


  /*
|--------------------------------------------------------------------------
| Create category
|--------------------------------------------------------------------------
*/

  const handleCreate = async (e) => {
    e.preventDefault();

    const name = newName.trim();

    if (!name) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrl = '';

      /*
       * Upload image first if one was selected.
       */
      if (newImage) {
        imageUrl = await uploadCategoryImage(newImage);
      }

      await categoryService.createCategory({
        name,
        imageUrl,
      });

      setNewName('');

      removeNewImage();

      await load();
    } catch (err) {
      setError(err?.message || 'Unable to create category.');
    } finally {
      setSaving(false);
    }
  };


  /*
|--------------------------------------------------------------------------
| Add / change image on an existing category
|--------------------------------------------------------------------------
*/

  const handleExistingImageChange = async (categoryId, e) => {
    const file = e.target.files?.[0];

    /*
     * Reset input so the same file can be selected again later.
     */
    e.target.value = '';

    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5MB or smaller.');
      return;
    }

    setUploadingCategoryId(categoryId);

    try {
      /*
       * 1. Upload image to Cloudinary.
       */
      const imageUrl = await uploadCategoryImage(file);

      /*
       * 2. Save returned Cloudinary URL to the category.
       */
      await categoryService.updateCategory(categoryId, {
        imageUrl,
      });

      /*
       * 3. Reload categories so the new image appears immediately.
       */
      await load();
    } catch (err) {
      setError(err?.message || 'Unable to update category image.');
    } finally {
      setUploadingCategoryId(null);
    }
  };


  /*
|--------------------------------------------------------------------------
| Deactivate category
|--------------------------------------------------------------------------
*/

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(
      'Deactivate this category? Products in it will keep their reference but it will no longer show on the storefront.'
    );

    if (!confirmed) return;

    setError(null);

    try {
      await categoryService.deleteCategory(id);

      await load();
    } catch (err) {
      setError(err?.message || 'Unable to deactivate category.');
    }
  };


  /*
|--------------------------------------------------------------------------
| Loading / error states
|--------------------------------------------------------------------------
*/

  if (!categories) {
    return <PageSpinner />;
  }


  /*
|--------------------------------------------------------------------------
| Render
|--------------------------------------------------------------------------
*/

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Categories
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your store categories and their storefront images.
        </p>
      </div>


      {/* Error */}
      {error && (
        <div className="mt-5">
          <ErrorState message={error} />
        </div>
      )}


      {/* ================================================================
          CREATE CATEGORY
          ================================================================ */}

      <div className="mt-6 rounded-xl border border-charcoal/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-charcoal">
            Add category
          </h2>

          <p className="mt-1 text-sm text-muted">
            Create a category and optionally give it a storefront image.
          </p>
        </div>

        <form onSubmit={handleCreate} className="mt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Category name */}
            <div className="flex-1">
              <Input
                label="Category name"
                placeholder="e.g. Smartphones"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Image selector */}
            <div>
              <label
                htmlFor="new-category-image"
                className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-charcoal/15 bg-white px-4 text-sm font-medium text-charcoal transition hover:bg-charcoal/5 ${
                  saving ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ImagePlus className="h-4 w-4" />

                {newImage ? 'Change image' : 'Choose image'}
              </label>

              <input
                id="new-category-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleNewImageSelect}
                disabled={saving}
              />
            </div>

            {/* Create */}
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />

              {saving ? 'Adding...' : 'Add category'}
            </Button>
          </div>


          {/* New image preview */}
          {newImagePreview && (
            <div className="mt-4 flex items-center gap-4 rounded-lg border border-charcoal/10 bg-cream/30 p-3">
              <img
                src={newImagePreview}
                alt="New category preview"
                className="h-20 w-24 rounded-lg object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-charcoal">
                  {newImage?.name}
                </p>

                <p className="mt-1 text-xs text-muted">
                  This image will be uploaded when you create the category.
                </p>
              </div>

              <button
                type="button"
                onClick={removeNewImage}
                className="rounded-lg p-2 text-muted transition hover:bg-charcoal/5 hover:text-terracotta"
                aria-label="Remove selected image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            Recommended: use a clear category photo. Maximum file size: 5MB.
          </p>
        </form>
      </div>


      {/* ================================================================
          EXISTING CATEGORIES
          ================================================================ */}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-charcoal">
              Existing categories
            </h2>

            <p className="mt-1 text-sm text-muted">
              Add or change the image used on each category card.
            </p>
          </div>

          <span className="text-sm text-muted">
            {categories.length} categor
            {categories.length === 1 ? 'y' : 'ies'}
          </span>
        </div>


        <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-sm">
          {categories.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-muted">
                No categories yet.
              </p>
            </div>
          )}


          {categories.map((category) => {
            const isUploading =
              uploadingCategoryId === category._id;

            return (
              <div
                key={category._id}
                className="border-b border-charcoal/10 last:border-b-0"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {/* Category image */}
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted">
                        <ImagePlus className="h-5 w-5" />

                        <span className="mt-1 text-[10px]">
                          No image
                        </span>
                      </div>
                    )}
                  </div>


                  {/* Category information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">
                        {category.name}
                      </span>

                      <Badge
                        variant={
                          category.status === 'active'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {category.status}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-muted">
                      {category.imageUrl
                        ? 'Storefront image configured'
                        : 'No storefront image configured'}
                    </p>
                  </div>


                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Image upload / change */}
                    <label
                      htmlFor={`category-image-${category._id}`}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-xs font-medium text-charcoal transition hover:bg-charcoal/5 ${
                        isUploading
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 animate-pulse" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />

                          {category.imageUrl
                            ? 'Change image'
                            : 'Add image'}
                        </>
                      )}
                    </label>

                    <input
                      id={`category-image-${category._id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleExistingImageChange(
                          category._id,
                          e
                        )
                      }
                      disabled={isUploading}
                    />


                    {/* Deactivate */}
                    {category.status === 'active' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeactivate(category._id)
                        }
                        aria-label={`Deactivate ${category.name}`}
                        className="rounded-lg p-2 text-muted transition hover:bg-terracotta/10 hover:text-terracotta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ================================================================
          INFORMATION
          ================================================================ */}

      <div className="mt-6 rounded-xl border border-emerald/10 bg-emerald/5 p-4">
        <div className="flex gap-3">
          <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />

          <div>
            <h3 className="text-sm font-semibold text-charcoal">
              Category images
            </h3>

            <p className="mt-1 text-sm leading-6 text-muted">
              Category images are uploaded to Cloudinary and the resulting
              image URL is saved to the category. The storefront can then
              use that URL for the category card.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}