import React from 'react';

/**
 * Groups a flat variant list into color/size choices and reports the
 * matching variant back to the parent — variant selection here isn't
 * cosmetic, it drives price/SKU/stock in the parent product page.
 */
export function VariantSelector({ variants, selectedColor, selectedSize, onSelectColor, onSelectSize }) {
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-charcoal">Colour</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  selectedColor === color ? 'border-emerald bg-emerald text-ivory' : 'border-charcoal/15 text-charcoal'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-charcoal">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = variants.some(
                (v) => v.size === size && (!selectedColor || v.color === selectedColor) && v.stock > 0
              );
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => onSelectSize(size)}
                  className={`rounded-xl border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30 ${
                    selectedSize === size ? 'border-emerald bg-emerald text-ivory' : 'border-charcoal/15 text-charcoal'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
