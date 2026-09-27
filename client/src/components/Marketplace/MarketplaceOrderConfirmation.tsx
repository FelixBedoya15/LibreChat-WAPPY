import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import type { MarketplaceOrder } from './types';

interface Props {
  orderNumber: string;
  onBackToCatalog: () => void;
}

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceOrderConfirmation: React.FC<Props> = ({ orderNumber, onBackToCatalog }) => {
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/api/marketplace/orders/${orderNumber}`);
        if (isMounted && data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Error fetching order confirmation:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Clock className="h-8 w-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-semibold">Cargando confirmación de pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Orden no encontrada</h3>
        <p className="text-xs text-slate-500">No pudimos localizar la orden {orderNumber}.</p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
        >
          Volver a la Tienda
        </button>
      </div>
    );
  }

  const isApproved = order.paymentStatus === 'APPROVED';
  const isReview = order.paymentStatus === 'MANUAL_REVIEW';

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Hola equipo WAPPY, acabo de formalizar la orden ${order.orderNumber} por valor de ${formatCOP(order.totalAmount)} para los servicios de Salud Ocupacional. Solicito la asignación de especialista y cronograma de inicio.`
    );
    window.open(`https://wa.me/573105000000?text=${text}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6"
    >
      {/* Celebration Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-200/80 dark:border-teal-900/50 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400 mx-auto flex items-center justify-center shadow-md">
          {isApproved ? (
            <CheckCircle2 className="h-9 w-9 text-teal-600" />
          ) : isReview ? (
            <FileCheck className="h-9 w-9 text-amber-500" />
          ) : (
            <Clock className="h-9 w-9 text-blue-500" />
          )}
        </div>

        <span className="inline-block text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
          NÚMERO DE ORDEN: {order.orderNumber}
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
          {isApproved
            ? '¡Contratación Confirmada con Éxito!'
            : isReview
            ? 'Comprobante Recibido para Verificación'
            : 'Pedido Registrado'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-lg mx-auto">
          {isApproved
            ? 'El pago fue aprobado satisfactoriamente por Wompi. Tu orden ha sido enviada al equipo de operaciones y un especialista en SST se pondrá en contacto.'
            : 'Hemos recibido tu comprobante de pago. Un asesor validará la consignación y activará el cronograma de ejecución.'}
        </p>

        {/* Action WhatsApp Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleWhatsAppContact}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Coordinar Servicio por WhatsApp Inmediatamente</span>
          </button>
        </div>
      </div>

      {/* Customer & Company Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cliente / Responsable</span>
          <div className="font-bold text-slate-800 dark:text-zinc-100">{order.customer.fullName}</div>
          <div className="text-slate-500 text-[11px]">{order.customer.documentId}</div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Empresa / Ciudad</span>
          <div className="font-bold text-slate-800 dark:text-zinc-100">
            {order.customer.companyName || 'Empresa No Especificada'}
          </div>
          <div className="text-slate-500 text-[11px]">{order.customer.city || 'Colombia'}</div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contacto Registrado</span>
          <div className="font-bold text-slate-800 dark:text-zinc-100">{order.customer.phone}</div>
          <div className="text-slate-500 text-[11px] truncate">{order.customer.email}</div>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Servicios Contratados ({order.items.length})
        </h4>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-xs text-slate-800 dark:text-zinc-100">{item.title}</h5>
                {item.selectedVariant && (
                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                    Opción: {item.selectedVariant.label}
                  </span>
                )}
                <div className="text-[11px] text-slate-400">Cantidad: {item.quantity}</div>
              </div>

              <div className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                {formatCOP(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-sm font-black text-slate-900 dark:text-zinc-100">
          <span>Inversión Total:</span>
          <span className="text-base text-teal-700 dark:text-teal-300">{formatCOP(order.totalAmount)}</span>
        </div>
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 shadow-xs transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Catálogo del Marketplace</span>
        </button>
      </div>
    </motion.div>
  );
};

export default MarketplaceOrderConfirmation;
