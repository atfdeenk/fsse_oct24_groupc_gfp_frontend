import React from "react";
import { formatCurrency } from "@/utils/format";
import PromoCodeInput from "./PromoCodeInput";

interface OrderSummaryProps {
  selectedItemsCount: number;
  totalItemsCount: number;
  subtotal: number;
  discount: number;
  total: number;
  totalCartValue: number;
  promoDiscount: number;
  promoError: string;
  onApplyPromo: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  shippingLabel?: string;
  voucherDiscount?: number; // Added voucherDiscount prop
  children?: React.ReactNode; // For extra controls (e.g. checkout button)
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedItemsCount,
  totalItemsCount,
  subtotal,
  discount,
  total,
  totalCartValue,
  promoDiscount,
  promoError,
  onApplyPromo,
  promoCode,
  setPromoCode,
  shippingLabel = "Free",
  voucherDiscount = 0,
  children,
}) => {
  return (
    <div className="bg-gradient-to-b from-neutral-900/90 to-black/90 backdrop-blur-sm rounded-lg border border-white/10 sticky top-24 shadow-xl animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-900/30 to-neutral-900/30">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order Summary
          </h2>
          <div className="bg-amber-500/20 rounded-full px-3 py-1 text-xs font-medium text-amber-400">
            {selectedItemsCount} of {totalItemsCount} selected
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white/70 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Subtotal
            </span>
            <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {selectedItemsCount < totalItemsCount && (
            <div className="flex justify-between items-center text-white/50 bg-white/5 p-2 rounded-md">
              <span className="flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {totalItemsCount - selectedItemsCount} unselected items
              </span>
              <span>{formatCurrency(totalCartValue - subtotal)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-white/70 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Shipping
            </span>
            <span className="text-green-400 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {shippingLabel}
            </span>
          </div>
          
          {/* Promo Code Input */}
          <div className="mb-4">
            <h4 className="text-white/80 text-sm mb-2">Order Promo Code</h4>
            <PromoCodeInput
              value={promoCode}
              onChange={setPromoCode}
              onApply={onApplyPromo}
              error={promoError}
              successMessage={promoDiscount > 0 ? "Promo code applied successfully!" : undefined}
              onRemove={promoDiscount > 0 ? () => {
                setPromoCode("");
                // Call onApplyPromo to recalculate the discount
                setTimeout(() => onApplyPromo(), 0);
                // Clear from localStorage
                localStorage.removeItem('promoCode');
                localStorage.removeItem('promoDiscount');
              } : undefined}
            />
          </div>

          {/* Show promo code discount if applicable */}
          {promoDiscount > 0 && (
            <div className="flex justify-between items-center bg-green-500/10 p-2 rounded-md">
              <span className="text-green-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Promo Discount
              </span>
              <span className="text-green-400 font-medium">-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          
          {/* Show voucher discount if applicable */}
          {voucherDiscount > 0 && (
            <div className="flex justify-between items-center bg-green-500/10 p-2 rounded-md">
              <span className="text-green-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Item Voucher Discount
              </span>
              <span className="text-green-400 font-medium">-{formatCurrency(voucherDiscount)}</span>
            </div>
          )}
          
          {/* Show total discount if both are applied */}
          {promoDiscount > 0 && voucherDiscount > 0 && (
            <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded-md">
              <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Total Discount
              </span>
              <span className="text-amber-400 font-medium">-{formatCurrency(discount)}</span>
            </div>
          )}
          
          {/* Show savings percentage if discount is applied */}
          {discount > 0 && subtotal > 0 && (
            <div className="text-xs text-green-400/80 text-right mt-1">
              You saved {Math.round((discount / subtotal) * 100)}% on your purchase
            </div>
          )}
          
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
          
          <div className="flex justify-between items-center">
            <span className="text-white text-lg font-semibold">Total</span>
            <span className="text-amber-500 text-xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default OrderSummary;
