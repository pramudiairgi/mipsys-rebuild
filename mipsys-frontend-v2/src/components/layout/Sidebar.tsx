'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/auth-context';
import {
  Layout,
  ClipboardText,
  Package,
  Wallet,
  Users,
  ShoppingBag,
} from '@phosphor-icons/react';
import { Printer, SignOut, X } from '@phosphor-icons/react';

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const menuItems = [
    { title: 'Dashboard', icon: <Layout size={20} />, link: '/' },
    {
      title: 'Service Request',
      icon: <ClipboardText size={20} />,
      link: '/service-request',
    },
    {
      title: 'Inventory & Parts',
      icon: <Package size={20} />,
      link: '/inventory',
    },
    {
      title: 'Part Order',
      icon: <ShoppingBag size={20} />,
      link: '/part-order',
    },
    ...(isAdmin
      ? [
          {
            title: 'Finance & Billing',
            icon: <Wallet size={20} />,
            link: '/finance',
          },
          {
            title: 'Master Database',
            icon: <Users size={20} />,
            link: '/master-data',
          },
        ]
      : []),
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-foreground flex flex-col 
        transform transition-transform duration-300 ease-in-out border-r border-white/5
        md:sticky md:top-0 md:h-dvh md:shrink-0 md:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sidebar-active rounded-lg flex items-center justify-center shadow-lg">
              <Printer size={18} strokeWidth={3} className="text-sidebar-bg" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none text-sidebar-foreground">
                MIPSYS
              </h1>
              <p className="text-[9px] font-black text-sidebar-muted tracking-widest uppercase mt-0.5">
                Enterprise AAA
              </p>
            </div>
          </div>
          <button className="md:hidden text-sidebar-muted" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-sidebar-muted mb-4">
            Modul Sistem
          </p>
          {menuItems.map((item) => {
            const isActive =
              item.link === '/'
                ? pathname === '/'
                : pathname.startsWith(item.link);

            return (
              <Link
                key={item.title}
                href={item.link}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-sidebar-active/15 text-sidebar-active shadow-md'
                    : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive
                        ? 'text-sidebar-active'
                        : 'group-hover:text-sidebar-active'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold tracking-tight">
                    {item.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-black/20">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="h-8 w-8 rounded-full bg-sidebar-active flex items-center justify-center font-bold text-xs text-sidebar-bg">
              {(user?.username ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate uppercase">
                {user?.username ?? 'User'}
              </p>
              <p className="text-[9px] font-black text-sidebar-muted uppercase tracking-tighter">
                {user?.role ?? '-'}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-1.5 hover:text-destructive transition-colors text-sidebar-muted"
              aria-label="Logout"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
