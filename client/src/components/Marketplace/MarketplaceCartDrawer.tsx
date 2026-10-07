import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useMarketplace } from './MarketplaceContext';

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceCartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    totalAmount,
    totalItems,
    setIsCheckoutOpen,
  } = useMarketplace();

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity pointer-events-auto"
        />

        {/* Floating Capsule Container */}
        <div className="fixed inset-x-3 top-3 bottom-3 sm:inset-x-auto sm:top-5 sm:bottom-5 sm:right-6 sm:w-[440px] z-10 flex flex-col pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="h-full w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-zinc-800 rounded-3xl sm:rounded-[32px] shadow-2xl shadow-slate-900/20 dark:shadow-black/70 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-2xs">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-zinc-100 tracking-tight">
                    Carrito de Servicios SST
                  </h3>
                  <span className="inline-block text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/40 mt-0.5">
                    {totalItems} {totalItems === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar carrito"
                className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500">
                  <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 shadow-sm">
                    <ShoppingBag className="h-8 w-8 stroke-1.5" />
                  </div>
                  <p className="font-bold text-base text-slate-800 dark:text-zinc-200 mb-1">
                    Tu carrito está vacío
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mb-5 leading-relaxed">
                    Explora nuestro catálogo de servicios de salud ocupacional y añade las soluciones que tu empresa necesite.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:border-teal-300 dark:hover:border-teal-800/80 shadow-xs transition-all flex gap-3.5 items-center group"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.featuredImage || '/wappy-official-logo.png'}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs"
                      onError={(e: any) => {
                        e.currentTarget.src = '/wappy-official-logo.png';
                      }}
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-1">
                        {item.title}
                      </h4>
                      {item.selectedVariant && (
                        <span className="inline-block text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md mb-1.5 border border-teal-200/50">
                          {item.selectedVariant.label}
                        </span>
                      )}
                      <div className="text-xs sm:text-sm font-black text-teal-600 dark:text-teal-400">
                        {formatCOP(item.price * item.quantity)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Totals */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/90 backdrop-blur-md space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60 shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {formatCOP(subtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Descuento aplicado:</span>
                      <span>-{formatCOP(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-zinc-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Total a Pagar:</span>
                    <span className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 tracking-tight">
                      {formatCOP(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Pago seguro certificado con Wompi Bancolombia</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-teal-600/20 cursor-pointer"
                  >
                    <span>Continuar al Pago</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 cursor-pointer"
                  >
                    Vaciar Carrito
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default MarketplaceCartDrawer;
