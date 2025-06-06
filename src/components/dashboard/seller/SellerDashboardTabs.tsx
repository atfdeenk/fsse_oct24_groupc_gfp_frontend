"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser, logout } from '@/lib/auth';
import { toast } from 'react-hot-toast';

interface SellerDashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: AuthUser | null;
}

export default function SellerDashboardTabs({
  activeTab,
  onTabChange,
  user
}: SellerDashboardTabsProps) {
  const router = useRouter();

  const tabs = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'products',
      label: 'Inventory Management',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'vouchers',
      label: 'Vouchers',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-neutral-800/50 rounded-lg border border-white/10 p-4">
      {user && (
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-2xl font-bold mb-3">
            {user.first_name?.charAt(0) || user.email?.charAt(0) || 'S'}
          </div>
          <h3 className="text-white font-medium text-lg">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email}
          </h3>
          {user.username && (
            <p className="text-white/60 text-sm mb-1">@{user.username}</p>
          )}
          <p className="text-amber-500 text-sm">
            Seller {user.id && <span className="ml-1">(ID: {user.id})</span>}
          </p>
        </div>
      )}

      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-500 border-l-2 border-amber-500'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="mr-3">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
        <Link
          href="/"
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Store
        </Link>
        
        <button
          onClick={() => {
            logout();
            toast.success('You have been signed out');
            router.push('/');
          }}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
