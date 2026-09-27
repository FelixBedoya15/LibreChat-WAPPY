import React from 'react';
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

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    Carrito de Servicios SST
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {totalItems} {totalItems === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar carrito"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500">
                  <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-zinc-600 mb-3 stroke-1" />
                  <p className="font-semibold text-sm text-slate-700 dark:text-zinc-300 mb-1">
                    Tu carrito está vacío
                  </p>
                  <p className="text-xs max-w-xs mb-4">
                    Explora nuestro catálogo de servicios de salud ocupacional y añade los que tu empresa necesite.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 hover:bg-teal-100"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex gap-3 items-center"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.featuredImage || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-200"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate mb-0.5">
                        {item.title}
                      </h4>
                      {item.selectedVariant && (
                        <span className="inline-block text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md mb-1 border border-teal-200/50">
                          {item.selectedVariant.label}
                        </span>
                      )}
                      <div className="text-xs font-black text-slate-900 dark:text-zinc-100">
                        {formatCOP(item.price * item.quantity)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700"
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
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {formatCOP(subtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Descuento aplicado:</span>
                      <span>-{formatCOP(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-zinc-100 pt-1.5 border-t border-slate-200 dark:border-zinc-800">
                    <span>Total a Pagar:</span>
                    <span className="text-teal-700 dark:text-teal-300 text-base">
                      {formatCOP(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                  <span>Pago seguro certificado con Wompi Bancolombia</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
                  >
                    <span>Continuar al Pago</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-full text-center text-[11px] text-slate-400 hover:text-red-500 py-1"
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
