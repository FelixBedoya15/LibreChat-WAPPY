import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  Layers,
  Clock,
  ShieldCheck,
  Settings,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { MarketplaceProvider, useMarketplace } from './MarketplaceContext';
import { useOutletContext } from 'react-router-dom';
import type { ContextType } from '~/common';
import { OpenSidebar } from '~/components/Chat/Menus';
import MarketplaceCatalog from './MarketplaceCatalog';
import MarketplaceOrdersView from './MarketplaceOrdersView';
import MarketplaceAdminDashboard from './MarketplaceAdminDashboard';
import MarketplaceProductModal from './MarketplaceProductModal';
import MarketplaceCartDrawer from './MarketplaceCartDrawer';
import MarketplaceCheckoutModal from './MarketplaceCheckoutModal';
import MarketplaceOrderConfirmation from './MarketplaceOrderConfirmation';

const MarketplaceContent: React.FC = () => {
  const { user } = useAuthContext();
  const outletContext = useOutletContext<ContextType>();
  const navVisible = outletContext?.navVisible ?? true;
  const setNavVisible = outletContext?.setNavVisible ?? (() => {});

  const {
    totalItems,
    setIsCartOpen,
    selectedProductDetail,
    setSelectedProductDetail,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my-orders' | 'admin'>('catalog');
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.email?.toLowerCase() === 'felix.bedoya15@gmail.com';

  const handleCheckoutSuccess = (orderNumber: string) => {
    setCompletedOrderNumber(orderNumber);
  };

  const handleBackToCatalog = () => {
    setCompletedOrderNumber(null);
    setActiveTab('catalog');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50/50 dark:bg-zinc-950 px-4 py-6 sm:px-8 sm:py-8 pb-28 scroll-smooth">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header & Floating Capsule Toolbar (WAPPY SGSSTToolbar standard) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!navVisible && (
              <div className="hidden md:block mr-1">
                <OpenSidebar setNavVisible={setNavVisible} />
              </div>
            )}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Tienda</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  WAPPY Oficial
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Cursos certificados, servicios oficiales y soluciones de Seguridad y Salud en el Trabajo
              </p>
            </div>
          </div>

          {/* Floating Capsule Toolbar */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
              {/* Tab: Catálogo */}
              <button
                type="button"
                onClick={() => {
                  setCompletedOrderNumber(null);
                  setActiveTab('catalog');
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 ${
                  activeTab === 'catalog' && !completedOrderNumber
                    ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
                }`}
                title="Catálogo de la Tienda"
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Tab: Mis Pedidos */}
              <button
                type="button"
                onClick={() => {
                  setCompletedOrderNumber(null);
                  setActiveTab('my-orders');
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 ${
                  activeTab === 'my-orders' && !completedOrderNumber
                    ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
                }`}
                title="Mis Servicios Contratados"
              >
                <Clock className="h-4 w-4" />
              </button>

              {/* Tab: Administración WooCommerce (Solo ADMIN) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedOrderNumber(null);
                    setActiveTab('admin');
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 ${
                    activeTab === 'admin' && !completedOrderNumber
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
                  }`}
                  title="Gestor WooCommerce (Administración de Pedidos y Catálogo)"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 text-slate-700 dark:text-zinc-200"
            >
              <ShoppingCart className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="bg-teal-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {completedOrderNumber ? (
          <MarketplaceOrderConfirmation
            orderNumber={completedOrderNumber}
            onBackToCatalog={handleBackToCatalog}
          />
        ) : (
          <>
            {activeTab === 'catalog' && <MarketplaceCatalog />}
            {activeTab === 'my-orders' && <MarketplaceOrdersView />}
            {activeTab === 'admin' && isAdmin && <MarketplaceAdminDashboard />}
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      <MarketplaceProductModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
      />
      <MarketplaceCartDrawer />
      <MarketplaceCheckoutModal onSuccess={handleCheckoutSuccess} />
    </div>
  );
};

const MarketplaceDashboard: React.FC = () => {
  return (
    <MarketplaceProvider>
      <MarketplaceContent />
    </MarketplaceProvider>
  );
};

export default MarketplaceDashboard;
