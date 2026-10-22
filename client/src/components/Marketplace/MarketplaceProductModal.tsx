import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ShoppingCart,
  Zap,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import type { MarketplaceProduct, ProductVariantOption } from './types';
import { useMarketplace } from './MarketplaceContext';

interface Props {
  product: MarketplaceProduct | null;
  onClose: () => void;
}

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const parsePos = (pos?: string) => {
  const parts = (pos || '50% 50%').split(' ');
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  };
};

const MarketplaceProductModal: React.FC<Props> = ({ product, onClose }) => {
  const { user } = useAuthContext();
  const { addToCart, setIsCheckoutOpen, openEditProduct } = useMarketplace();

  const isAdmin = user?.role === 'ADMIN';

  // Find first variant group
  const variantGroup = product?.variants?.[0];
  const initialOption = variantGroup?.options?.find((o) => o.isDefault) || variantGroup?.options?.[0];

  const [selectedOption, setSelectedOption] = useState<ProductVariantOption | undefined>(initialOption);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!product) return null;

  const basePrice = product.hasDiscount && (product.salePrice ?? 0) > 0 ? (product.salePrice ?? product.regularPrice) : product.regularPrice;
  const currentPrice = basePrice + (selectedOption?.priceDelta || 0);
  const regularCurrentPrice = product.regularPrice + (selectedOption?.priceDelta || 0);
  const discountPercent = product.hasDiscount && (product.salePrice ?? 0) > 0
    ? Math.round(((product.regularPrice - (product.salePrice ?? 0)) / product.regularPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, selectedOption, variantGroup?.name, 1);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedOption, variantGroup?.name, 1);
    onClose();
    setIsCheckoutOpen(true);
  };

  const handleWhatsAppInquiry = () => {
    const rawPhone = (product.whatsappNumber || '573102913651').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone || '573102913651';
    const text = encodeURIComponent(
      `Hola, estoy interesado en "${product.title}" de la Tienda WAPPY ($${Math.round(currentPrice).toLocaleString('es-CO')} COP). Quisiera recibir más información.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const modalImgPos = parsePos(
    product.modalImage ? product.modalImagePosition : product.modalImagePosition || product.featuredImagePosition
  );
  const modalImgScale = (product.modalImageScale || 100) / 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-slate-100 dark:border-zinc-800">
            {/* Image section */}
            <div className="md:col-span-5 relative bg-slate-950 dark:bg-zinc-950 min-h-[260px] md:min-h-full overflow-hidden">
              <div
                style={{
                  backgroundImage: `url("${
                    product.modalImage ||
                    product.featuredImage ||
                    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80'
                  }")`,
                  backgroundPosition: `${modalImgPos.x}% ${modalImgPos.y}%`,
                  backgroundSize: `${Math.round((product.modalImageScale || 100) * 1.55)}%`,
                  backgroundRepeat: 'no-repeat',
                }}
                className="w-full h-full min-h-[260px]"
                role="img"
                aria-label={product.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              <div className="absolute bottom-3 left-3 flex gap-2 md:hidden">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-600 text-white shadow-md">
                  {formatCOP(currentPrice)}
                </span>
              </div>
            </div>

            {/* Title & Details intro */}
            <div className="md:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {product.status === 'draft' ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs border border-amber-300">
                      📝 Estado Borrador (Solo Admin)
                    </span>
                  ) : product.isTest ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs border border-amber-300">
                      🧪 Modo Prueba (Solo Admin)
                    </span>
                  ) : (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-teal-600 text-white shadow-xs">
                      🌟 Servicio Oficial WAPPY
                    </span>
                  )}
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50">
                    {product.category?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {product.sku && (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      SKU: {product.sku}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white shadow-xs">
                      OFERTA -{discountPercent}%
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 leading-tight mb-2.5">
                  {product.title}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 mb-4">
                  <div className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-400">({product.reviewsCount || 1} calificaciones)</span>
                  </div>
                  {product.estimatedDeliveryDays && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      <span>Plazo: <strong>{product.estimatedDeliveryDays}</strong></span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {product.description || product.shortDescription}
                </p>
              </div>

              {/* Price card within header */}
              <div className="mt-5 p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 flex flex-col gap-3.5">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                    {product.paymentRecipient === 'PROVIDER'
                      ? `Recaudo Directo Proveedor: ${product.providerName || 'Aliado'}`
                      : product.isTest
                      ? 'Inversión'
                      : 'Pago de Contado (Opciones a Crédito)'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-teal-900 dark:text-teal-100">
                      {formatCOP(currentPrice)}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatCOP(regularCurrentPrice)}
                      </span>
                    )}
                  </div>
                  {product.slug === 'curso-ecosistema-autonomo-sst' && (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                      💳 Opción a crédito: 4 cuotas de $155.000 COP (0% interés con Bancolombia / Nequi)
                    </div>
                  )}
                  {product.paymentRecipient === 'PROVIDER' && (
                    <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mt-1">
                      🤝 Pasarela Wompi conectada a {product.providerName || 'Proveedor Aliado'}
                    </div>
                  )}
                </div>

                {/* Stable Buttons Toolbar (No dynamic wrapping/jumping - Fixed Height & Smooth Expand) */}
                <div className="flex items-center gap-2 pt-2 border-t border-teal-200/60 dark:border-teal-900/40 overflow-x-auto no-scrollbar">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditProduct(product)}
                      title="Editar Producto / Configurar Wompi"
                      className="group/editModal shrink-0 flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl font-bold text-xs shadow-md transition-colors duration-200 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      <Edit className="h-4 w-4 shrink-0" />
                      <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover/editModal:ml-1.5 group-hover/editModal:max-w-[180px] group-hover/editModal:opacity-100">
                        <span>Editar Producto / Wompi</span>
                      </div>
                    </button>
                  )}

                  {(product.landingPageUrl?.trim() || (product.slug === 'curso-ecosistema-autonomo-sst' ? '/cursowappy01' : '')) && (
                    <a
                      href={product.landingPageUrl?.trim() || '/cursowappy01'}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver Landing Page"
                      className="group/landingBtn shrink-0 flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors duration-200"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover/landingBtn:ml-1.5 group-hover/landingBtn:max-w-[160px] group-hover/landingBtn:opacity-100">
                        <span>Ver Landing Page</span>
                      </div>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    title="Añadir al Carrito"
                    className="group/cartModal shrink-0 flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl font-bold text-xs shadow-md transition-colors duration-200 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover/cartModal:ml-1.5 group-hover/cartModal:max-w-[140px] group-hover/cartModal:opacity-100">
                      <span>Al Carrito</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    title={product.isTest ? 'Probar Compra' : 'Comprar Ahora'}
                    className="group/buyModal shrink-0 flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl font-bold text-xs shadow-md transition-colors duration-200 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
                  >
                    <Zap className="h-4 w-4 shrink-0" />
                    <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover/buyModal:ml-1.5 group-hover/buyModal:max-w-[160px] group-hover/buyModal:opacity-100">
                      <span>{product.isTest ? 'Probar Compra' : 'Comprar Ahora'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body / Tabs Content */}
          <div className="p-6 space-y-6">
            {/* Variants Selector */}
            {variantGroup && variantGroup.options?.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-2.5">
                  Selecciona la opción para tu empresa ({variantGroup.name}):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {variantGroup.options.map((opt, idx) => {
                    const isSelected = selectedOption?.label === opt.label;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs">{opt.label}</span>
                        {opt.priceDelta > 0 && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">
                            +{formatCOP(opt.priceDelta)}
                          </span>
                        )}
                        {opt.priceDelta === 0 && (
                          <span className="text-[10px] text-slate-400 mt-1">Precio Base</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deliverables & Requirements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deliverables */}
              {product.deliverables && product.deliverables.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Entregables Incluidos</span>
                  </div>
                  <ul className="space-y-2">
                    {product.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {product.requirements && product.requirements.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>Requisitos para Ejecutar el Servicio</span>
                  </div>
                  <ul className="space-y-2">
                    {product.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* FAQs Accordion */}
            {product.faqs && product.faqs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-3">
                  Preguntas Frecuentes del Servicio
                </h4>
                <div className="space-y-2">
                  {product.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-50/50 dark:bg-zinc-800/40"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:text-teal-600"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-200/60 dark:border-zinc-800 pt-2.5">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Contact */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
              <span>¿Tienes dudas técnicas o necesitas una propuesta a la medida?</span>
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 font-bold transition-colors shadow-2xs"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MarketplaceProductModal;
