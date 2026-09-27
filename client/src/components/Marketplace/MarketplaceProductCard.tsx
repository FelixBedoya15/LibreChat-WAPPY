import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, Clock, Eye, ShoppingCart } from 'lucide-react';
import type { MarketplaceProduct } from './types';
import { useMarketplace } from './MarketplaceContext';

interface Props {
  product: MarketplaceProduct;
}

const SERVICE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  service_virtual: { label: '100% Virtual', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50' },
  service_onsite: { label: 'Presencial / IPS', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' },
  service_hybrid: { label: 'Modalidad Híbrida', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50' },
  digital_download: { label: 'Descarga Inmediata', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' },
  consulting_hours: { label: 'Asesoría por Horas', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/50' },
};

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart, setSelectedProductDetail } = useMarketplace();

  const serviceBadge = SERVICE_TYPE_LABELS[product.serviceType] || SERVICE_TYPE_LABELS.service_virtual;
  const currentPrice = product.hasDiscount && (product.salePrice ?? 0) > 0 ? (product.salePrice ?? product.regularPrice) : product.regularPrice;
  const discountPercent = product.hasDiscount && (product.salePrice ?? 0) > 0
    ? Math.round(((product.regularPrice - (product.salePrice ?? 0)) / product.regularPrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default first variant if any
    const defaultVariantGroup = product.variants?.[0];
    const defaultOption = defaultVariantGroup?.options?.find((o) => o.isDefault) || defaultVariantGroup?.options?.[0];
    addToCart(product, defaultOption, defaultVariantGroup?.name, 1);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedProductDetail(product)}
      className="group cursor-pointer rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-200 overflow-hidden flex flex-col h-full"
    >
      {/* Header Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <img
          src={product.featuredImage || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80'}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${serviceBadge.color}`}>
            {serviceBadge.label}
          </span>
          {product.isFeatured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs">
              Destacado
            </span>
          )}
        </div>

        {discountPercent > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* Body content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Rating and delivery */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5">
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
            <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
            <span className="text-slate-400 dark:text-zinc-500 font-normal">({product.reviewsCount || 1})</span>
          </div>
          {product.estimatedDeliveryDays && (
            <div className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{product.estimatedDeliveryDays}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1.5">
          {product.title}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          {product.shortDescription || 'Servicio especializado en Seguridad y Salud en el Trabajo con acompañamiento profesional.'}
        </p>

        {/* Deliverables snippet */}
        {product.deliverables && product.deliverables.length > 0 && (
          <div className="mb-3 space-y-1 bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
            {product.deliverables.slice(0, 2).map((deliv, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
                <CheckCircle2 className="h-3 w-3 text-teal-500 shrink-0 mt-0.5" />
                <span className="truncate">{deliv}</span>
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">
              Inversión desde
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-teal-700 dark:text-teal-300">
                {formatCOP(currentPrice)}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCOP(product.regularPrice)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProductDetail(product);
              }}
              title="Examinar detalles"
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center shadow-2xs active:scale-95"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleQuickAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Contratar</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceProductCard;
