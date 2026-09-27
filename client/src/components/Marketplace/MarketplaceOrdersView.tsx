import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShoppingBag,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import type { MarketplaceOrder } from './types';

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const PAYMENT_STATUS_BADGES: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Pago Aprobado', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' },
  MANUAL_REVIEW: { label: 'En Verificación Manual', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' },
  PENDING: { label: 'Pago Pendiente', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200' },
  DECLINED: { label: 'Rechazado', color: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200' },
  VOIDED: { label: 'Anulado', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-300' },
};

const FULFILLMENT_BADGES: Record<string, { label: string; color: string }> = {
  NUEVO: { label: 'Nuevo Pedido', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' },
  CONTACTADO: { label: 'Especialista Asignado', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  EN_EJECUCION: { label: 'En Ejecución / Campo', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
  ENTREGADO: { label: 'Servicio Finalizado', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
};

const MarketplaceOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/api/marketplace/my-orders');
        if (isMounted && data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching my orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Clock className="h-7 w-7 animate-spin text-teal-600 mb-2" />
        <span className="text-xs">Cargando tus órdenes de servicio...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/50 flex items-center justify-center text-teal-600 mx-auto">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">
          No tienes servicios contratados aún
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Cuando adquieras exámenes médicos, matrices IPEVAR, PESV o consultorías SST desde el catálogo, podrás hacer seguimiento a su estado y entregables aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Mis Servicios SST Contratados
          </h2>
          <p className="text-xs text-slate-500">
            Historial de pedidos y trazabilidad de ejecución
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}
        </span>
      </div>

      <div className="space-y-3">
        {orders.map((ord) => {
          const payBadge = PAYMENT_STATUS_BADGES[ord.paymentStatus] || PAYMENT_STATUS_BADGES.PENDING;
          const fulBadge = FULFILLMENT_BADGES[ord.fulfillmentStatus] || FULFILLMENT_BADGES.NUEVO;

          const handleWhatsApp = () => {
            const text = encodeURIComponent(
              `Hola equipo WAPPY, consulto por el avance de mi orden ${ord.orderNumber} contratada en el Marketplace.`
            );
            window.open(`https://wa.me/573105000000?text=${text}`, '_blank');
          };

          return (
            <motion.div
              key={ord._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Empresa: <strong>{ord.customer?.companyName || ord.customer?.fullName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${payBadge.color}`}>
                    {payBadge.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${fulBadge.color}`}>
                    {fulBadge.label}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {ord.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-zinc-200">{item.title}</span>
                      {item.selectedVariant && (
                        <span className="ml-2 text-[10px] text-teal-600 dark:text-teal-400">
                          ({item.selectedVariant.label})
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {formatCOP(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Invertido:</span>
                  <span className="text-sm font-extrabold text-teal-700 dark:text-teal-300">
                    {formatCOP(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {ord.manualReceiptUrl && (
                    <a
                      href={ord.manualReceiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:underline"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Comprobante</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 transition-all active:scale-95 shadow-2xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Consultar Avance</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplaceOrdersView;
