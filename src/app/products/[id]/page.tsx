"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Product } from '@/types/apiResponses';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import productService from '@/services/api/products';
import { useCart } from '@/hooks/useCart';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';
// Using centralized toast system
import { Toaster } from '@/utils/toast';
import { Header, Footer } from '@/components';
import {
  Toast,
  ErrorState,
  ProductInfo,
  SellerInfo,
  AddToCartButton,
  RelatedProducts,
  ProductImages,
  QuantityInput
} from '@/components/ui';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCustomer, setIsCustomer] = useState(true);

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      if (isAuthenticated()) {
        try {
          const user = await getCurrentUser();
          setUserRole(user?.role || null);
          // Only customers should see cart functionality
          setIsCustomer(user?.role === 'customer');
        } catch (error) {
          console.error('Error fetching user role:', error);
          setIsCustomer(true); // Default to showing cart functionality if role check fails
        }
      } else {
        setUserRole(null);
        setIsCustomer(true); // Non-logged in users should see cart functionality
      }
    };
    
    checkUserRole();
  }, []);

  useEffect(() => {
    const productId = params?.id as string;
    if (!productId) return;

    setLoading(true);
    productService.getProduct(productId)
      .then((res) => {
        if (!res) throw new Error("Product not found");
        setProduct(res);
        // Fetch related products
        return productService.getProducts({ limit: 4 });
      })
      .then((res) => {
        // Filter out current product and get 3 random products
        if (!res || !res.products) {
          // Handle empty response gracefully
          setRelatedProducts([]);
          return;
        }
        const otherProducts = res.products.filter(
          (p: Product) => p.id !== parseInt(productId, 10)
        );
        const randomProducts = [...otherProducts]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setRelatedProducts(randomProducts);
      })
      .catch((error: any) => {
        setError(error?.message || "Failed to load product.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params?.id]);

  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCartWithCountCheck } = useCart();

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if user is logged in
    if (!isAuthenticated()) {
      // Show toast message instead of redirecting
      import('@/utils/toast').then(({ showError }) => {
        showError('Please log in to add items to your cart');
      });
      return;
    }
    
    setAddingToCart(true);
    try {
      await addToCartWithCountCheck({ product_id: product.id, quantity });
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) setQuantity(value);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <LoadingOverlay message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product Not Found"
        message={error || "We couldn't find the product you're looking for. It might have been removed or is temporarily unavailable."}
        icon={
          <svg className="w-16 h-16 text-amber-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        buttonLabel="Back to Products"
        onButtonClick={() => router.push("/products")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      {/* Breadcrumb */}
      <div className="bg-neutral-900/50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-white/60">
            <a href="/" className="hover:text-amber-400 transition-colors">Home</a>
            <span>/</span>
            <a href="/products" className="hover:text-amber-400 transition-colors">Products</a>
            <span>/</span>
            <span className="text-amber-500 truncate">{product.name}</span>
          </div>
        </div>
      </div>
      {/* Product Details */}
      <div className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <ProductImages imageUrl={product.image_url} name={product.name} />
          {/* Product Info */}
          <div className="flex flex-col gap-8">
            <ProductInfo product={product} activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Add to Cart - Only shown for customers or non-logged in users */}
            {isCustomer && (
              <div className="pt-2 border-t border-white">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center gap-8">
                    <QuantityInput
                      value={quantity}
                      min={1}
                      onChange={q => setQuantity(q)}
                      disabled={addingToCart}
                    />
                    <AddToCartButton
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      loading={addingToCart}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Seller Info */}
            <SellerInfo
              name={typeof product.vendor_id === 'string' ? product.vendor_id : `Seller #${product.vendor_id}`}
              location={product.location}
              onViewProfile={() => { }}
            />
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
        <Footer />
      </div>
    </div>

  );
}
