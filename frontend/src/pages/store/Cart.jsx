import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart.js';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { CartItemRow } from '../../components/cart/CartItemRow.jsx';
import { CartSummary } from '../../components/cart/CartSummary.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { buildWhatsAppLink, buildCartWhatsAppMessage } from '../../utils/whatsapp.js';

export function Cart() {
  const { items, subtotal, updateItem, removeItem, loading } = useCart();
  const { store } = useStoreInfo();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  const handleUpdateQuantity = async (itemId, quantity) => {
    setUpdating(true);
    try {
      await updateItem(itemId, quantity);
    } finally {
      setUpdating(false);
    }
  };

const whatsappHref = store
  ? buildWhatsAppLink(
      store.whatsapp?.number,
      buildCartWhatsAppMessage(store.name, items)
    )
  : '#';
  if (loading) return null;

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our gadgets and add items you love."
          action={<Button as={Link} to="/shop">Start shopping</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-card lg:col-span-2">
          {items.map((item) => (
            <CartItemRow key={item._id} item={item} onUpdateQuantity={handleUpdateQuantity} onRemove={removeItem} updating={updating} />
          ))}
        </div>

        <div className="space-y-4">
          <CartSummary subtotal={subtotal}>
            <Button onClick={() => navigate('/checkout')} size="lg" className="mt-5 w-full">
              Proceed to checkout
            </Button>
          </CartSummary>

          {store && (
            <Button as="a" href={whatsappHref} target="_blank" rel="noreferrer" variant="whatsapp" size="lg" className="w-full">
              <MessageCircle className="h-4 w-4" /> Checkout via WhatsApp instead
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
