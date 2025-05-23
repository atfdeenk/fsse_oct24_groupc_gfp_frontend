"use client";

import { useState, useEffect, useRef } from "react";
import { useToggle } from "@/hooks/useToggle";
import { useCartAndWishlistCounts } from '@/hooks/useCartAndWishlistCounts';
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import CartWidget from "@/components/ui/CartWidget";
import WishlistWidget from "@/components/ui/WishlistWidget";
import AuthButtons from "@/components/ui/AuthButtons";
import UserMenu from "@/components/ui/UserMenu";
import AvatarIcon from "@/components/ui/AvatarIcon";
import SignUpIcon from "@/components/ui/SignUpIcon";
import SignInIcon from "@/components/ui/SignInIcon";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useTokenExpiryHandler } from "@/hooks/useTokenExpiryHandler";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useLogout } from "@/hooks/useLogout";
import UserBalance from "@/components/ui/UserBalance";

export default function Header() {
  const pathname = usePathname();
  const { user, isLoggedIn, refreshUser, setUser, setIsLoggedIn } = useAuthUser();
  const [showUserMenu, toggleUserMenu, setShowUserMenu] = useToggle(false);
  const { cartCount, wishlistCount } = useCartAndWishlistCounts(isLoggedIn);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = useLogout({
    setIsLoggedIn,
    setUser,
    setCartCount: () => { }, // No longer needed
    setWishlistCount: () => { }, // No longer needed
    setShowUserMenu,
  });

  useEffect(() => {
    // Fetch user on mount
    refreshUser();
  }, []);

  useTokenExpiryHandler((event: CustomEvent) => {
    handleLogout(true);
  });

  // Listen for custom login/logout events
  useEffect(() => {
    const handleLoginEvent = () => {
      refreshUser();
    };

    // Add event listeners
    window.addEventListener('user:login', handleLoginEvent);

    // Cleanup
    return () => {
      window.removeEventListener('user:login', handleLoginEvent);
    };
  }, []);


  // Close user menu when clicking outside
  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  // DEBUG: Before return
  return (
    <header className="w-full bg-black border-b border-white/10 py-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Logo />
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <Link href="/" className="text-white/70 hover:text-amber-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-white/70 hover:text-amber-400 transition-colors">
                  Shop
                </Link>
              </li>
              {pathname === '/' && (
                <li>
                  <Link href="#how-it-works" className="text-white/70 hover:text-amber-400 transition-colors">
                    How It Works
                  </Link>
                </li>
              )}
              {/* Only show on homepage */}
            </ul>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          {isLoggedIn && (
            <UserBalance className="hidden md:flex mr-2" />
          )}
          
          {/* Only show cart and wishlist for customer role */}
          {isLoggedIn && user?.role === 'customer' && (
            <>
              <CartWidget count={cartCount} isLoggedIn={isLoggedIn} />
              <WishlistWidget count={wishlistCount} isLoggedIn={isLoggedIn} />
            </>
          )}
          
          {/* Show cart and wishlist for non-logged in users to encourage sign up */}
          {!isLoggedIn && (
            <>
              <CartWidget count={cartCount} isLoggedIn={isLoggedIn} />
              <WishlistWidget count={wishlistCount} isLoggedIn={isLoggedIn} />
            </>
          )}

          {/* User Menu */}
          {isLoggedIn ? (
            <UserMenu
              user={user}
              show={showUserMenu}
              onToggle={toggleUserMenu}
              onLogout={handleLogout}
              userMenuRef={userMenuRef}
            />
          ) : (
            <>
              <AuthButtons className="ml-2" />
              <div className="relative md:hidden" ref={userMenuRef}>
                {/* Single avatar icon for mobile */}
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-neutral-800 flex items-center justify-center">
                    <AvatarIcon />
                  </div>
                </button>

                {/* Dropdown Menu for non-logged in users - only for mobile */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-sm shadow-xl z-50 animate-fade-in-down">
                    <ul>
                      <li>
                        <Link
                          href="/login"
                          className="flex items-center px-4 py-3 text-white hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <SignInIcon className="w-5 h-5 mr-3 text-white/60" />
                          <span>Sign In</span>
                        </Link>
                      </li>
                      <li className="border-t border-white/10">
                        <Link
                          href="/register"
                          className="flex items-center px-4 py-3 text-white hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <SignUpIcon className="w-5 h-5 mr-3 text-white/60" />
                          <span>Sign Up</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
