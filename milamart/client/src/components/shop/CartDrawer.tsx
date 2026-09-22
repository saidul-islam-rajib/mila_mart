/** Mila Shop & Studio: a typed Shopify-cart drawer; checkout stays in Shopify for payment security. */
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

function money(amount: string) {
  return `৳ ${Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function CartDrawer() {
  const { cart, isOpen, closeCart, itemCount, loading, removeItem, updateQuantity, proceedToCheckout } = useCart();
  if (!isOpen) return null;

  return (
    <div className="cart-layer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="cart-backdrop" type="button" onClick={closeCart} aria-label="কার্ট বন্ধ করুন" />
      <aside className="cart-drawer">
        <div className="cart-drawer-head"><div><span>YOUR SELECTION</span><h2>Shopping Cart</h2></div><button type="button" onClick={closeCart} aria-label="কার্ট বন্ধ করুন"><X size={21} /></button></div>
        {itemCount === 0 ? <div className="cart-empty"><ShoppingBag size={34} /><h3>Your cart is empty.</h3><p>পছন্দের পণ্য Shop পেজ থেকে কার্টে যোগ করুন।</p><button type="button" onClick={closeCart}>Continue shopping</button></div> : <>
          <div className="cart-items">{cart?.items.map((item) => <article className="cart-item" key={item.lineId}>
            <div className="cart-item-image">{item.image ? <img src={item.image.url} alt={item.image.altText ?? item.productTitle} /> : <span>M</span>}</div>
            <div className="cart-item-copy"><p>{item.productTitle}</p>{item.variantTitle !== "Default Title" && <small>{item.variantTitle}</small>}<strong>{money(item.unitPrice.amount)}</strong><div className="cart-quantity"><button type="button" onClick={() => updateQuantity(item.lineId, item.quantity - 1)} aria-label="একটি কমান"><Minus size={13} /></button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.lineId, item.quantity + 1)} aria-label="একটি বাড়ান"><Plus size={13} /></button></div></div>
            <button className="cart-remove" type="button" onClick={() => removeItem(item.lineId)} aria-label="পণ্য বাদ দিন"><Trash2 size={16} /></button>
          </article>)}</div>
          <div className="cart-total"><span>Subtotal</span><strong>{cart ? money(cart.subtotal.amount) : "৳ 0"}</strong></div>
          <p className="cart-note">Payment ও final delivery information Shopify Checkout-এ নিরাপদভাবে সম্পন্ন হবে।</p>
          <button className="checkout-button" type="button" disabled={loading || itemCount === 0} onClick={proceedToCheckout}>{loading ? "Updating…" : "Secure Checkout"}</button>
        </>}
      </aside>
    </div>
  );
}
