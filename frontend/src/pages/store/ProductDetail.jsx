import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import * as productService from '../../services/productService.js';
import * as eventService from '../../services/eventService.js';
import { useCart } from '../../hooks/useCart.js';
import { getSessionId } from '../../utils/session.js';
import { formatCurrency } from '../../utils/currency.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { QuantityStepper } from '../../components/ui/QuantityStepper.jsx';
import { VariantSelector } from '../../components/product/VariantSelector.jsx';
import { ProductGrid } from '../../components/product/ProductGrid.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { STORE_CONFIG } from '../../config/store.config.js';

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { store } = useStoreInfo();
  const storeName = store?.name || STORE_CONFIG.brand.name;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setData(null);
    setError(null);
    setSelectedColor('');
    setSelectedSize('');
    setQuantity(1);
    setActiveImage(0);

    productService
      .getProduct(slug, getSessionId())
      .then(setData)
      .catch((err) => setError(err.message));
  }, [slug]);

  const product = data?.product;

  const matchedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;

    return product.variants.find(
      (v) =>
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    );
  }, [product, selectedColor, selectedSize]);

  const hasVariants = product?.variants?.length > 0;

  const effectivePrice =
    matchedVariant?.priceOverride ??
    (product?.salePrice != null &&
    product.salePrice < product.basePrice
      ? product.salePrice
      : product?.basePrice);

  const onSale =
    !matchedVariant?.priceOverride &&
    product?.salePrice != null &&
    product.salePrice < product.basePrice;

  const stock = hasVariants
    ? matchedVariant?.stock ?? 0
    : product?.stock ?? 0;

  const canAddToCart = hasVariants
    ? Boolean(matchedVariant) && stock > 0
    : stock > 0;

  /*
   * Build the WhatsApp enquiry dynamically.
   *
   * This uses:
   * - product name
   * - current selling price
   * - selected colour
   * - selected size
   * - quantity
   * - product image URL
   *
   * The image URL is included in the message because wa.me links
   * cannot attach an image themselves.
   */
  const whatsappLink = useMemo(() => {
    if (!product || !data?.whatsappLink) return null;

    try {
      const whatsappUrl = new URL(data.whatsappLink);
      const businessNumber = whatsappUrl.pathname.replace(/\D/g, '');

      if (!businessNumber) return data.whatsappLink;

      const imageUrl = product.images?.[0]?.url || '';

      const lines = [
        `Hello ${storeName},`,
        '',
        `I'm interested in this product:`,
        `🛍️ ${product.name}`,
        `💰 Price: ${formatCurrency(effectivePrice)}`,
        `📦 Quantity: ${quantity}`,
      ];

      if (selectedSize) {
        lines.push(`📏 Size: ${selectedSize}`);
      }

      if (selectedColor) {
        lines.push(`🎨 Colour: ${selectedColor}`);
      }

      if (product.categoryId?.name) {
        lines.push(`📂 Category: ${product.categoryId.name}`);
      }

      if (imageUrl) {
        lines.push('', `🖼️ Product image: ${imageUrl}`);
      }

      lines.push(
        '',
        `Please let me know if this item is available.`
      );

      const message = lines.join('\n');

      return buildWhatsAppLink(businessNumber, message);
    } catch {
      return data.whatsappLink;
    }
  }, [
    data?.whatsappLink,
    product,
    effectivePrice,
    quantity,
    selectedSize,
    selectedColor,
    storeName,
  ]);

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!canAddToCart) return;

    setAdding(true);
    setFeedback('');

    try {
      await addItem({
        productId: product._id,
        variantId: matchedVariant?._id || null,
        quantity,
      });

      eventService.trackEvent('add_to_cart', {
        productId: product._id,
      });

      if (redirectToCheckout) {
        navigate('/cart');
      } else {
        setFeedback('Added to cart.');
      }
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!data) {
    return <PageSpinner />;
  }

  const images = product.images?.length
    ? product.images
    : [{ url: '' }];

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">

        {/* Gallery */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-charcoal/5">
            {images[activeImage]?.url ? (
              <img
                src={images[activeImage].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No image available
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    activeImage === i
                      ? 'border-emerald'
                      : 'border-transparent'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  {img.url && (
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.categoryId?.name && (
            <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">
              {product.categoryId.name}
            </p>
          )}

          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-semibold text-emerald">
              {formatCurrency(effectivePrice)}
            </span>

            {onSale && (
              <span className="text-sm text-muted line-through">
                {formatCurrency(product.basePrice)}
              </span>
            )}

            {stock <= 0 && (
              <Badge variant="neutral">
                Out of stock
              </Badge>
            )}

            {stock > 0 && stock <= 5 && (
              <Badge variant="sale">
                Only {stock} left
              </Badge>
            )}
          </div>

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">
              {product.description}
            </p>
          )}

          {/* Variants */}
          {hasVariants && (
            <div className="mt-6">
              <VariantSelector
                variants={product.variants}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onSelectColor={setSelectedColor}
                onSelectSize={setSelectedSize}
              />
            </div>
          )}

          {/* Quantity + SKU */}
          <div className="mt-6 flex items-center gap-4">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(stock, 1)}
              disabled={!canAddToCart}
            />

            <span className="text-xs text-muted">
              SKU: {matchedVariant?.sku || '—'}
            </span>
          </div>

          {feedback && (
            <p className="mt-3 text-sm text-emerald">
              {feedback}
            </p>
          )}

          {/* Cart buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => handleAddToCart(false)}
              disabled={!canAddToCart || adding}
              size="lg"
              className="flex-1"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </Button>

            <Button
              onClick={() => handleAddToCart(true)}
              disabled={!canAddToCart || adding}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Buy now
            </Button>
          </div>

          {/* WhatsApp */}
          {whatsappLink && (
            <Button
              as="a"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              variant="whatsapp"
              size="lg"
              className="mt-3 w-full"
            >
              <MessageCircle className="h-4 w-4" />
              Ask about this on WhatsApp
            </Button>
          )}

          {/* WhatsApp preview */}
          {whatsappLink && (
            <p className="mt-2 text-center text-xs text-muted">
              Your product name, price, quantity, selected options and
              product image link will be included in the message.
            </p>
          )}
        </div>
      </div>

      {/* Related products */}
      {data.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            You may also like
          </h2>

          <div className="mt-6">
            <ProductGrid products={data.related} />
          </div>
        </section>
      )}
    </div>
  );
}