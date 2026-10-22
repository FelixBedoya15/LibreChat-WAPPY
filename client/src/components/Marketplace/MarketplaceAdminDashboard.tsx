import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ShoppingBag,
  Ticket,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  MessageCircle,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Save,
  X,
  Star,
} from 'lucide-react';
import axios from 'axios';
import type { MarketplaceProduct, MarketplaceOrder, MarketplaceCoupon } from './types';
import { useMarketplace } from './MarketplaceContext';

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceAdminDashboard: React.FC = () => {
  const {
    editingProduct,
    setEditingProduct,
    isProductModalOpen,
    setIsProductModalOpen,
    openEditProduct,
    triggerCatalogRefresh,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'coupons'>('products');

  // Ensure products tab is active when opening the product edit modal
  useEffect(() => {
    if (isProductModalOpen) {
      setActiveTab('products');
    }
  }, [isProductModalOpen]);

  // Orders State
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ordersStats, setOrdersStats] = useState({
    totalRevenue: 0,
    approvedCount: 0,
    pendingReviewCount: 0,
    activeFulfillmentCount: 0,
  });
  const [orderFilterPayment, setOrderFilterPayment] = useState<string>('all');
  const [orderFilterFulfillment, setOrderFilterFulfillment] = useState<string>('all');
  const [ordersSearch, setOrdersSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [newInternalNote, setNewInternalNote] = useState('');

  // Products State
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Coupons State
  const [coupons, setCoupons] = useState<MarketplaceCoupon[]>([]);
  const [newCoupon, setNewCoupon] = useState<Partial<MarketplaceCoupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/marketplace/admin/orders', {
        params: {
          paymentStatus: orderFilterPayment,
          fulfillmentStatus: orderFilterFulfillment,
          search: ordersSearch,
        },
      });
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) setOrdersStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/marketplace/products', {
        params: { search: productSearch, includeAll: 'true' },
      });
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    }
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get('/api/marketplace/admin/coupons');
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching admin coupons:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'coupons') fetchCoupons();
  }, [activeTab, orderFilterPayment, orderFilterFulfillment, ordersSearch, productSearch]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Order actions
  const handleUpdateOrderStatus = async (
    orderId: string,
    updates: { paymentStatus?: string; fulfillmentStatus?: string; assignedSpecialist?: string }
  ) => {
    try {
      const { data } = await axios.put(`/api/marketplace/admin/orders/${orderId}/status`, updates);
      if (data.success) {
        showNotification('Estado del pedido actualizado.', 'success');
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      showNotification('Error al actualizar pedido.', 'error');
    }
  };

  const handleAddOrderNote = async (orderId: string) => {
    if (!newInternalNote.trim()) return;
    try {
      const { data } = await axios.post(`/api/marketplace/admin/orders/${orderId}/notes`, {
        note: newInternalNote.trim(),
      });
      if (data.success) {
        setNewInternalNote('');
        showNotification('Nota añadida.', 'success');
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, internalNotes: data.internalNotes } : prev));
        }
      }
    } catch (err) {
      showNotification('Error al añadir nota.', 'error');
    }
  };

  // Product actions
  const handleUploadProductImage = async (file: File, targetField: 'featuredImage' | 'modalImage' = 'featuredImage') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post('/api/marketplace/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success && data.url) {
        setEditingProduct((prev) => (prev ? { ...prev, [targetField]: data.url } : prev));
        showNotification(
          targetField === 'modalImage'
            ? 'Imagen de detalle subida correctamente.'
            : 'Imagen de tarjeta subida correctamente.',
          'success'
        );
      }
    } catch (err) {
      showNotification('Error al subir la imagen del producto.', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (
      editingProduct.paymentRecipient === 'PROVIDER' &&
      !editingProduct.providerWompi?.publicKey?.trim()
    ) {
      showNotification('Debes ingresar al menos la Llave Pública de Wompi del proveedor.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (editingProduct._id) {
        await axios.put(`/api/marketplace/admin/products/${editingProduct._id}`, editingProduct);
        showNotification('Producto / Servicio actualizado con éxito.', 'success');
      } else {
        await axios.post('/api/marketplace/admin/products', editingProduct);
        showNotification('Producto / Servicio creado con éxito.', 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
      triggerCatalogRefresh();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Error al guardar servicio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (prod: MarketplaceProduct) => {
    const nextFeatured = !prod.isFeatured;
    // Optimistic in-place update so the row does not jump away under the cursor
    setProducts((prev) =>
      prev.map((p) => (p._id === prod._id ? { ...p, isFeatured: nextFeatured } : p))
    );
    try {
      const { data } = await axios.put(`/api/marketplace/admin/products/${prod._id}`, {
        isFeatured: nextFeatured,
      });
      if (data.success) {
        showNotification(
          nextFeatured
            ? `"${prod.title}" marcado como Destacado (aparecerá de primero en el catálogo).`
            : `"${prod.title}" removido de Destacados.`,
          'success'
        );
        triggerCatalogRefresh();
      } else {
        // Revert on unexpected response
        setProducts((prev) =>
          prev.map((p) => (p._id === prod._id ? { ...p, isFeatured: !nextFeatured } : p))
        );
      }
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) => (p._id === prod._id ? { ...p, isFeatured: !nextFeatured } : p))
      );
      showNotification('Error al actualizar estado destacado.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este servicio del catálogo?')) return;
    try {
      await axios.delete(`/api/marketplace/admin/products/${id}`);
      showNotification('Servicio eliminado.', 'success');
      fetchProducts();
      triggerCatalogRefresh();
    } catch (err) {
      showNotification('Error al eliminar servicio.', 'error');
    }
  };

  // Reseed catalog
  const handleReseedCatalog = async () => {
    if (!window.confirm('¿Deseas restablecer el catálogo de Salud Ocupacional a los servicios predeterminados?')) return;
    try {
      await axios.post('/api/marketplace/admin/reseed');
      showNotification('Catálogo restablecido con éxito.', 'success');
      fetchProducts();
      triggerCatalogRefresh();
    } catch (err) {
      showNotification('Error al restablecer catálogo.', 'error');
    }
  };

  // Coupon actions
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || newCoupon.discountValue === undefined) return;
    try {
      await axios.post('/api/marketplace/admin/coupons', newCoupon);
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, active: true });
      showNotification('Cupón creado exitosamente.', 'success');
      fetchCoupons();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Error al crear cupón.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await axios.delete(`/api/marketplace/admin/coupons/${id}`);
      showNotification('Cupón eliminado.', 'success');
      fetchCoupons();
    } catch (err) {
      showNotification('Error al eliminar cupón.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Floating Capsule Toolbar (WAPPY SGSSTToolbar Style - Expandable/Collapsible on Hover) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
          {/* Tab 1: Servicios / Productos */}
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] px-2 sm:px-2.5 items-center justify-center rounded-xl border px-2.5 text-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-2xs active:scale-95 ${
              activeTab === 'products'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold'
            }`}
            title="Catálogo de Servicios y Cursos (Productos)"
          >
            <Package className="h-4 w-4 shrink-0" />
            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[180px] group-hover:opacity-100">
              <span>Productos y Cursos</span>
            </div>
          </button>

          {/* Tab 2: Pedidos */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] px-2 sm:px-2.5 items-center justify-center rounded-xl border px-2.5 text-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-2xs active:scale-95 relative ${
              activeTab === 'orders'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold'
            }`}
            title="Gestor de Pedidos"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              {ordersStats.pendingReviewCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center absolute -top-2 -right-2">
                  {ordersStats.pendingReviewCount}
                </span>
              )}
            </div>
            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[140px] group-hover:opacity-100">
              <span>Pedidos</span>
            </div>
          </button>

          {/* Tab 3: Cupones */}
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] px-2 sm:px-2.5 items-center justify-center rounded-xl border px-2.5 text-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-2xs active:scale-95 ${
              activeTab === 'coupons'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold'
            }`}
            title="Cupones y Descuentos"
          >
            <Ticket className="h-4 w-4 shrink-0" />
            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[140px] group-hover:opacity-100">
              <span>Cupones</span>
            </div>
          </button>
        </div>

        {/* Action Header Buttons (Expandable/Collapsible on Hover) */}
        {activeTab === 'products' && (
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
            <button
              type="button"
              onClick={handleReseedCatalog}
              className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] px-2 sm:px-2.5 items-center justify-center px-2.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 active:scale-95"
              title="Restablecer servicios iniciales"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[180px] group-hover:opacity-100">
                <span>Restablecer Catálogo</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openEditProduct()}
              title="Nuevo Producto / Servicio"
              className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] px-2 sm:px-2.5 items-center justify-center px-2.5 rounded-xl font-bold text-xs shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 active:scale-95 border rounded-xl bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs "
            >
              <Plus className="h-4 w-4 shrink-0" />
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100">
                <span>Nuevo Producto / Servicio</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Ingresos Aprobados
              </span>
              <div className="text-lg font-black text-teal-700 dark:text-teal-300">
                {formatCOP(ordersStats.totalRevenue)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Pedidos Aprobados
              </span>
              <div className="text-lg font-black text-slate-800 dark:text-zinc-100">
                {ordersStats.approvedCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Por Revisar (Comprobante)
              </span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                {ordersStats.pendingReviewCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                En Ejecución
              </span>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                {ordersStats.activeFulfillmentCount}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-2.5 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                placeholder="Buscar por orden, cliente, empresa o teléfono..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={orderFilterPayment}
                onChange={(e) => setOrderFilterPayment(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="all">Todos los Pagos</option>
                <option value="APPROVED">Aprobados</option>
                <option value="MANUAL_REVIEW">Comprobante Pendiente</option>
                <option value="PENDING">Pendientes</option>
                <option value="DECLINED">Rechazados</option>
              </select>

              <select
                value={orderFilterFulfillment}
                onChange={(e) => setOrderFilterFulfillment(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="all">Todas las Ejecuciones</option>
                <option value="NUEVO">Nuevo</option>
                <option value="CONTACTADO">Contactado</option>
                <option value="EN_EJECUCION">En Ejecución</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>
          </div>

          {/* Orders Table with Hover-Expanding Micro Buttons */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3">Orden / Fecha</th>
                  <th className="p-3">Cliente / Empresa</th>
                  <th className="p-3">Servicios</th>
                  <th className="p-3">Inversión</th>
                  <th className="p-3">Estado Pago</th>
                  <th className="p-3">Ejecución</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No se encontraron pedidos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const handleWhatsAppClient = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const text = encodeURIComponent(
                        `Hola ${ord.customer?.fullName}, me comunico desde WAPPY respecto a tu orden ${ord.orderNumber}.`
                      );
                      window.open(`https://wa.me/57${ord.customer?.phone?.replace(/\D/g, '')}?text=${text}`, '_blank');
                    };

                    return (
                      <tr
                        key={ord._id}
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {ord.orderNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString('es-CO')}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-800 dark:text-zinc-100">
                            {ord.customer?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ord.customer?.companyName || ord.customer?.phone}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="max-w-[200px] truncate text-slate-700 dark:text-zinc-300">
                            {ord.items.map((i) => i.title).join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.items.length} {ord.items.length === 1 ? 'servicio' : 'servicios'}
                          </div>
                        </td>

                        <td className="p-3 font-extrabold text-teal-700 dark:text-teal-300">
                          {formatCOP(ord.totalAmount)}
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ord.paymentStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ord.paymentStatus === 'MANUAL_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                            {ord.fulfillmentStatus}
                          </span>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap min-w-[140px]">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Ver Detalle Micro Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              title="Ver detalles del pedido"
                              className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100"
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100">
                                <span className="text-[10px] font-bold">Ver</span>
                              </div>
                            </button>

                            {/* WhatsApp Micro Button */}
                            <button
                              type="button"
                              onClick={handleWhatsAppClient}
                              title="Contactar al cliente por WhatsApp"
                              className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100">
                                <span className="text-[10px] font-bold">WhatsApp</span>
                              </div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">{products.length} servicios registrados</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3">Servicio / Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Recaudo Wompi</th>
                  <th className="p-3">Precio Base</th>
                  <th className="p-3">Oferta</th>
                  <th className="p-3">Ventas</th>
                  <th className="p-3">Estado & Visibilidad</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {products.map((prod) => {
                  const isProvider = prod.paymentRecipient === 'PROVIDER';
                  const isSandboxKey = prod.providerWompi?.publicKey?.startsWith('pub_test_');
                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.featuredImage || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80'}
                            alt={prod.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-zinc-100">{prod.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                          {prod.category}
                        </span>
                      </td>

                      <td className="p-3">
                        {isProvider ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🤝 Proveedor: {prod.providerName || 'Aliado'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {isSandboxKey ? '🧪 Wompi Sandbox' : '✅ Wompi Prod'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            🏢 WAPPY Oficial
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-semibold">{formatCOP(prod.regularPrice)}</td>

                      <td className="p-3">
                        {prod.hasDiscount && (prod.salePrice ?? 0) > 0 ? (
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            {formatCOP(prod.salePrice ?? 0)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="p-3 font-bold">{prod.salesCount || 0}</td>

                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prod.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {prod.status === 'published' ? 'Publicado' : prod.status === 'draft' ? 'Borrador' : 'Archivado'}
                          </span>
                          {prod.isTest ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              🧪 Solo Admin
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                              🌟 Público
                            </span>
                          )}
                          {prod.isFeatured && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                              <Star className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                              Destacado
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap min-w-[160px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Destacar Micro Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(prod)}
                            title={
                              prod.isFeatured
                                ? 'Quitar de Destacados'
                                : 'Marcar como Destacado (Aparecer de primero)'
                            }
                            className={`group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 ${
                              prod.isFeatured
                                ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-200'
                                : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600'
                            }`}
                          >
                            <Star
                              className={`h-3.5 w-3.5 shrink-0 ${
                                prod.isFeatured ? 'fill-orange-500 text-orange-500' : ''
                              }`}
                            />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                              <span className="text-[10px] font-bold">
                                {prod.isFeatured ? 'Destacado' : 'Destacar'}
                              </span>
                            </div>
                          </button>

                          {/* Editar Micro Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct({
                                ...prod,
                                paymentRecipient: prod.paymentRecipient || 'WAPPY',
                                providerName: prod.providerName || '',
                                providerWompi: {
                                  publicKey: prod.providerWompi?.publicKey || '',
                                  privateKey: prod.providerWompi?.privateKey || '',
                                  eventsSecret: prod.providerWompi?.eventsSecret || '',
                                  integritySecret: prod.providerWompi?.integritySecret || '',
                                },
                              });
                              setIsProductModalOpen(true);
                            }}
                            title="Editar Servicio / Producto"
                            className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100"
                          >
                            <Edit className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100">
                              <span className="text-[10px] font-bold">Editar</span>
                            </div>
                          </button>

                          {/* Eliminar Micro Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod._id)}
                            title="Eliminar Servicio / Producto"
                            className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100">
                              <span className="text-[10px] font-bold">Borrar</span>
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create coupon form */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              Crear Nuevo Cupón
            </h4>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Código del Cupón</label>
                <input
                  type="text"
                  required
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="EJEMPLO: BIENVENIDA15"
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tipo</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Fijo (COP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Valor</label>
                  <input
                    type="number"
                    required
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 shadow-md transition-all active:scale-95"
              >
                Guardar Cupón
              </button>
            </form>
          </div>

          {/* List of coupons */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              Cupones Activos ({coupons.length})
            </h4>
            <div className="space-y-2">
              {coupons.map((c) => (
                <div
                  key={c._id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg border border-teal-200">
                      {c.code}
                    </span>
                    <span className="text-slate-600 dark:text-zinc-300">
                      {c.discountType === 'percentage' ? `${c.discountValue}% de descuento` : `$${c.discountValue.toLocaleString()} COP`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{c.usedCount || 0} usos</span>
                    <button
                      type="button"
                      onClick={() => c._id && handleDeleteCoupon(c._id)}
                      title="Eliminar Cupón"
                      className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100">
                        <span className="text-[10px] font-bold">Borrar</span>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: SELECTED ORDER DETAILS */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto space-y-5 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  {selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString('es-CO')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions for Manual Receipt */}
            {selectedOrder.manualReceiptUrl && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                  <span>Comprobante de Pago Adjuntado</span>
                  <a
                    href={selectedOrder.manualReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal-600 underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Ver Imagen</span>
                  </a>
                </div>
                <img
                  src={selectedOrder.manualReceiptUrl}
                  alt="Comprobante"
                  className="w-full max-h-48 object-contain rounded-xl bg-white border"
                />

                {selectedOrder.paymentStatus !== 'APPROVED' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, { paymentStatus: 'APPROVED' })}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                    >
                      Aprobar Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, { paymentStatus: 'DECLINED' })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status updates selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border space-y-3 text-xs">
              <div className="font-bold text-slate-800 dark:text-zinc-200">Gestión de Estados</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Estado de Pago</label>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, { paymentStatus: e.target.value })}
                    className="w-full p-1.5 rounded-xl border bg-white dark:bg-zinc-800"
                  >
                    <option value="APPROVED">APPROVED (Aprobado)</option>
                    <option value="MANUAL_REVIEW">MANUAL_REVIEW (Comprobante)</option>
                    <option value="PENDING">PENDING (Pendiente)</option>
                    <option value="DECLINED">DECLINED (Rechazado)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-400 block mb-1">Estado Operativo</label>
                  <select
                    value={selectedOrder.fulfillmentStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, { fulfillmentStatus: e.target.value })}
                    className="w-full p-1.5 rounded-xl border bg-white dark:bg-zinc-800"
                  >
                    <option value="NUEVO">NUEVO</option>
                    <option value="CONTACTADO">CONTACTADO</option>
                    <option value="EN_EJECUCION">EN_EJECUCION</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-zinc-200">Datos del Cliente:</div>
              <div><strong>Nombre:</strong> {selectedOrder.customer.fullName}</div>
              <div><strong>Empresa:</strong> {selectedOrder.customer.companyName || 'N/A'}</div>
              <div><strong>NIT/CC:</strong> {selectedOrder.customer.documentId}</div>
              <div><strong>Email:</strong> {selectedOrder.customer.email}</div>
              <div><strong>WhatsApp:</strong> {selectedOrder.customer.phone}</div>
              <div><strong>Notas:</strong> {selectedOrder.customer.notes || 'Ninguna'}</div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-zinc-200">Notas Internas:</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedOrder.internalNotes?.map((n, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{n.note}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">{n.author}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  placeholder="Agregar nota interna..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-white dark:bg-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => handleAddOrderNote(selectedOrder._id)}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-white"
                >
                  Añadir
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  {editingProduct._id ? 'Editar Producto / Servicio SST' : 'Crear Nuevo Producto / Servicio SST'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Configura las características del curso o servicio y define si el recaudo va a WAPPY o a un proveedor aliado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              {/* 1. Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                    Título del Curso / Producto / Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Curso Adelanto"
                    value={editingProduct.title || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. WAPPY-ADELANTO-01"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Categoría *</label>
                  <select
                    value={editingProduct.category || 'capacitaciones'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="complementos_wappy">Complementos WAPPY (Empresa, Automatizaciones, Subusuarios)</option>
                    <option value="capacitaciones">Capacitación Certificada / Cursos</option>
                    <option value="medicina_laboral">Medicina Laboral</option>
                    <option value="gtc45_ipevar">Matrices & Peligros GTC-45</option>
                    <option value="pesv">Seguridad Vial PESV</option>
                    <option value="psicosocial">Riesgo Psicosocial</option>
                    <option value="ergonomia">Ergonomía & Puesto de Trabajo</option>
                    <option value="auditoria">Auditoría & Consultoría SST</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Modalidad del Servicio</label>
                  <select
                    value={editingProduct.serviceType || 'service_virtual'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, serviceType: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="service_virtual">100% Virtual</option>
                    <option value="service_onsite">Presencial / En IPS</option>
                    <option value="service_hybrid">Modalidad Híbrida</option>
                    <option value="digital_download">Descargable / Formato</option>
                    <option value="consulting_hours">Asesoría por Horas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Precio Regular (COP) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.regularPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, regularPrice: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Precio de Oferta (COP)</label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        salePrice: Number(e.target.value),
                        hasDiscount: Number(e.target.value) > 0,
                      })
                    }
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* 2. DESTINO DE PAGO: WAPPY VS PROVEEDOR */}
              <div className="p-4 rounded-2xl border-2 border-teal-500/30 dark:border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 block">
                      Destino del Pago (Pasarela Wompi)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Elige si los pagos de este producto ingresan a la cuenta Wompi de WAPPY o a la cuenta Wompi de un proveedor/compañero.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, paymentRecipient: 'WAPPY' })}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      (editingProduct.paymentRecipient || 'WAPPY') === 'WAPPY'
                        ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20 font-bold'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🏢 Pago a WAPPY (Por defecto)</div>
                      <div className="text-[10px] opacity-80 font-normal mt-0.5">
                        Usa las credenciales globales de Wompi configuradas en el servidor de WAPPY.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        paymentRecipient: 'PROVIDER',
                        providerWompi: editingProduct.providerWompi || {
                          publicKey: '',
                          privateKey: '',
                          eventsSecret: '',
                          integritySecret: '',
                        },
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      editingProduct.paymentRecipient === 'PROVIDER'
                        ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-600 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 font-bold'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🤝 Pago a Proveedor / Aliado</div>
                      <div className="text-[10px] opacity-80 font-normal mt-0.5">
                        Conecta este producto a las llaves de Wompi propias de un compañero o proveedor.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Provider Wompi Credentials Form */}
                {editingProduct.paymentRecipient === 'PROVIDER' && (
                  <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                      <div>
                        <h4 className="font-bold text-xs text-purple-800 dark:text-purple-300">
                          Credenciales Wompi del Proveedor
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Soporta llaves de pruebas (Sandbox: <code className="font-mono">pub_test_...</code>) o de producción (<code className="font-mono">pub_prod_...</code>).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            providerName: editingProduct.providerName || 'Mauricio Posada',
                            providerWompi: {
                              publicKey: 'pub_test_2GjhltTKLs90rNb19ddrcv4Cj8xZujfk',
                              privateKey: 'prv_test_UxyMfuX6vAhnhDfUMyNsCmpiViBlwpuu',
                              eventsSecret: 'test_events_onGHUTU2i0mPJq1utJ6jVISerJrizpMn',
                              integritySecret: 'test_integrity_MeG6viY2yh3tOrOpg2gxSLmUu3VxeCtm',
                            },
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors"
                      >
                        ⚡ Cargar llaves de prueba (Mauricio Posada)
                      </button>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                        Nombre del Proveedor / Compañero Aliado *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Mauricio Posada"
                        value={editingProduct.providerName || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, providerName: e.target.value })}
                        className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                          Llave Pública (Public Key) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="pub_test_... o pub_prod_..."
                          value={editingProduct.providerWompi?.publicKey || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              providerWompi: {
                                ...editingProduct.providerWompi,
                                publicKey: e.target.value.trim(),
                              },
                            })
                          }
                          className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                          Llave Privada (Private Key)
                        </label>
                        <input
                          type="text"
                          placeholder="prv_test_... o prv_prod_..."
                          value={editingProduct.providerWompi?.privateKey || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              providerWompi: {
                                ...editingProduct.providerWompi,
                                privateKey: e.target.value.trim(),
                              },
                            })
                          }
                          className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                          Secreto de Integridad (Integrity Secret) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="test_integrity_... o prod_integrity_..."
                          value={editingProduct.providerWompi?.integritySecret || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              providerWompi: {
                                ...editingProduct.providerWompi,
                                integritySecret: e.target.value.trim(),
                              },
                            })
                          }
                          className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                          Secreto de Eventos (Events Secret)
                        </label>
                        <input
                          type="text"
                          placeholder="test_events_... o prod_events_..."
                          value={editingProduct.providerWompi?.eventsSecret || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              providerWompi: {
                                ...editingProduct.providerWompi,
                                eventsSecret: e.target.value.trim(),
                              },
                            })
                          }
                          className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    {editingProduct.providerWompi?.publicKey && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg ${
                            editingProduct.providerWompi.publicKey.startsWith('pub_test_')
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {editingProduct.providerWompi.publicKey.startsWith('pub_test_')
                            ? '🧪 Modo Detectado: Wompi Sandbox (Escenario de Pruebas)'
                            : '✅ Modo Detectado: Wompi Producción (Pagos Reales)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          URL Eventos (Webhook): {window.location.origin}/api/marketplace/webhook
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Descriptions & Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Descripción Corta (Tarjeta)</label>
                  <textarea
                    rows={2}
                    placeholder="Resumen atractivo que se muestra en el catálogo..."
                    value={editingProduct.shortDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Descripción Detallada (Modal)</label>
                  <textarea
                    rows={2}
                    placeholder="Explicación completa del curso o servicio..."
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Deliverables & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                    Entregables Incluidos (1 por línea)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={'Acceso a las sesiones en vivo\nMaterial descargable\nCertificado de asistencia'}
                    value={(editingProduct.deliverables || []).join('\n')}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        deliverables: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                      })
                    }
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                    Requisitos del Servicio (1 por línea)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={'Conexión a internet estable\nCorreo electrónico activo'}
                    value={(editingProduct.requirements || []).join('\n')}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        requirements: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                      })
                    }
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Images (Card Banner + Modal Detail Vertical Image) with Interactive Drag & Zoom Framing */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 space-y-4">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 block">
                    Imágenes y Encuadre Personalizado (Arrastra para acomodar)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Puedes usar una imagen horizontal para la tarjeta y otra imagen distinta (o la misma reencuadrada) para la ventana de detalle ("Ver / Examinar").
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Card Image (Horizontal Banner) */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                    <label className="font-bold text-xs block text-slate-800 dark:text-zinc-100">
                      1. Imagen de Tarjeta / Banner Principal (Horizontal)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.featuredImage || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, featuredImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 text-[11px]"
                      />
                      <label className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 cursor-pointer font-bold flex items-center gap-1.5 shrink-0 text-[11px]">
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProductImage(file, 'featuredImage');
                          }}
                        />
                      </label>
                    </div>

                    {/* Interactive Preview Box for Card Image */}
                    {editingProduct.featuredImage && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>🖱️ Arrastra la imagen o usa los controles para encuadrar:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                featuredImagePosition: '50% 50%',
                                featuredImageScale: 100,
                              })
                            }
                            className="text-teal-600 hover:underline font-bold"
                          >
                            Centrar (Reset)
                          </button>
                        </div>

                        <div
                          className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-zinc-700 cursor-grab active:cursor-grabbing select-none touch-none"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const parts = (editingProduct.featuredImagePosition || '50% 50%').split(' ');
                            const initX = Number.isFinite(parseFloat(parts[0])) ? parseFloat(parts[0]) : 50;
                            const initY = Number.isFinite(parseFloat(parts[1])) ? parseFloat(parts[1]) : 50;

                            const onMove = (moveEvent: PointerEvent) => {
                              const dx = moveEvent.clientX - startX;
                              const dy = moveEvent.clientY - startY;
                              // Natural drag: dragging image right reveals left side (decreases backgroundPosition X%)
                              const newX = Math.max(0, Math.min(100, Math.round(initX - dx * 0.4)));
                              const newY = Math.max(0, Math.min(100, Math.round(initY - dy * 0.4)));
                              setEditingProduct((prev) =>
                                prev ? { ...prev, featuredImagePosition: `${newX}% ${newY}%` } : prev
                              );
                            };
                            const onUp = () => {
                              window.removeEventListener('pointermove', onMove);
                              window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                          }}
                        >
                          {(() => {
                            const parts = (editingProduct.featuredImagePosition || '50% 50%').split(' ');
                            const px = Number.isFinite(parseFloat(parts[0])) ? parseFloat(parts[0]) : 50;
                            const py = Number.isFinite(parseFloat(parts[1])) ? parseFloat(parts[1]) : 50;
                            return (
                              <div
                                style={{
                                  backgroundImage: `url("${editingProduct.featuredImage}")`,
                                  backgroundPosition: `${px}% ${py}%`,
                                  backgroundSize: `${Math.round((editingProduct.featuredImageScale || 100) * 1.15)}%`,
                                  backgroundRepeat: 'no-repeat',
                                }}
                                className="w-full h-full pointer-events-none"
                              />
                            );
                          })()}
                          <div className="absolute bottom-1.5 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono">
                            Pos: {editingProduct.featuredImagePosition || '50% 50%'} · Zoom: {editingProduct.featuredImageScale || 100}%
                          </div>
                        </div>

                        {/* Sliders for fine control */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                          <div>
                            <label className="block text-slate-500 mb-0.5">Horizontal (X)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={
                                Number.isFinite(parseFloat((editingProduct.featuredImagePosition || '50% 50%').split(' ')[0]))
                                  ? parseFloat((editingProduct.featuredImagePosition || '50% 50%').split(' ')[0])
                                  : 50
                              }
                              onChange={(e) => {
                                const y = (editingProduct.featuredImagePosition || '50% 50%').split(' ')[1] || '50%';
                                setEditingProduct({
                                  ...editingProduct,
                                  featuredImagePosition: `${e.target.value}% ${y}`,
                                });
                              }}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Vertical (Y)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={
                                Number.isFinite(parseFloat((editingProduct.featuredImagePosition || '50% 50%').split(' ')[1]))
                                  ? parseFloat((editingProduct.featuredImagePosition || '50% 50%').split(' ')[1])
                                  : 50
                              }
                              onChange={(e) => {
                                const x = (editingProduct.featuredImagePosition || '50% 50%').split(' ')[0] || '50%';
                                setEditingProduct({
                                  ...editingProduct,
                                  featuredImagePosition: `${x} ${e.target.value}%`,
                                });
                              }}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Zoom ({editingProduct.featuredImageScale || 100}%)</label>
                            <input
                              type="range"
                              min={60}
                              max={260}
                              value={editingProduct.featuredImageScale || 100}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  featuredImageScale: Number(e.target.value),
                                })
                              }
                              className="w-full accent-teal-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Modal Detail Image (Vertical / Square) */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs block text-slate-800 dark:text-zinc-100">
                        2. Imagen del Detalle al "Examinar / Ver" (Opcional)
                      </label>
                      {editingProduct.modalImage && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, modalImage: '' })}
                          className="text-[10px] text-red-500 hover:underline font-semibold"
                        >
                          Usar la de tarjeta
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.modalImage || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, modalImage: e.target.value })}
                        placeholder="Vacío = usa la misma imagen de tarjeta..."
                        className="flex-1 p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 text-[11px]"
                      />
                      <label className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer font-bold flex items-center gap-1.5 shrink-0 text-[11px]">
                        <span>Subir Otra</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProductImage(file, 'modalImage');
                          }}
                        />
                      </label>
                    </div>

                    {/* Interactive Preview Box for Modal Detail Image */}
                    {(editingProduct.modalImage || editingProduct.featuredImage) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>🖱️ Vista previa del panel izquierdo en "Examinar":</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                modalImagePosition: '50% 50%',
                                modalImageScale: 100,
                              })
                            }
                            className="text-teal-600 hover:underline font-bold"
                          >
                            Centrar (Reset)
                          </button>
                        </div>

                        <div
                          className="relative aspect-[4/5] w-44 mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-zinc-700 cursor-grab active:cursor-grabbing select-none touch-none"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const parts = (editingProduct.modalImagePosition || '50% 50%').split(' ');
                            const initX = Number.isFinite(parseFloat(parts[0])) ? parseFloat(parts[0]) : 50;
                            const initY = Number.isFinite(parseFloat(parts[1])) ? parseFloat(parts[1]) : 50;

                            const onMove = (moveEvent: PointerEvent) => {
                              const dx = moveEvent.clientX - startX;
                              const dy = moveEvent.clientY - startY;
                              // Natural drag: dragging image right reveals left side (decreases backgroundPosition X%)
                              const newX = Math.max(0, Math.min(100, Math.round(initX - dx * 0.4)));
                              const newY = Math.max(0, Math.min(100, Math.round(initY - dy * 0.4)));
                              setEditingProduct((prev) =>
                                prev ? { ...prev, modalImagePosition: `${newX}% ${newY}%` } : prev
                              );
                            };
                            const onUp = () => {
                              window.removeEventListener('pointermove', onMove);
                              window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                          }}
                        >
                          {(() => {
                            const parts = (editingProduct.modalImagePosition || '50% 50%').split(' ');
                            const px = Number.isFinite(parseFloat(parts[0])) ? parseFloat(parts[0]) : 50;
                            const py = Number.isFinite(parseFloat(parts[1])) ? parseFloat(parts[1]) : 50;
                            return (
                              <div
                                style={{
                                  backgroundImage: `url("${editingProduct.modalImage || editingProduct.featuredImage}")`,
                                  backgroundPosition: `${px}% ${py}%`,
                                  backgroundSize: `${Math.round((editingProduct.modalImageScale || 100) * 1.55)}%`,
                                  backgroundRepeat: 'no-repeat',
                                }}
                                className="w-full h-full pointer-events-none"
                              />
                            );
                          })()}
                          <div className="absolute bottom-1.5 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono">
                            Pos: {editingProduct.modalImagePosition || '50% 50%'} · Zoom: {editingProduct.modalImageScale || 100}%
                          </div>
                        </div>

                        {/* Sliders for fine control */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                          <div>
                            <label className="block text-slate-500 mb-0.5">Horizontal (X)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={
                                Number.isFinite(parseFloat((editingProduct.modalImagePosition || '50% 50%').split(' ')[0]))
                                  ? parseFloat((editingProduct.modalImagePosition || '50% 50%').split(' ')[0])
                                  : 50
                              }
                              onChange={(e) => {
                                const y = (editingProduct.modalImagePosition || '50% 50%').split(' ')[1] || '50%';
                                setEditingProduct({
                                  ...editingProduct,
                                  modalImagePosition: `${e.target.value}% ${y}`,
                                });
                              }}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Vertical (Y)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={
                                Number.isFinite(parseFloat((editingProduct.modalImagePosition || '50% 50%').split(' ')[1]))
                                  ? parseFloat((editingProduct.modalImagePosition || '50% 50%').split(' ')[1])
                                  : 50
                              }
                              onChange={(e) => {
                                const x = (editingProduct.modalImagePosition || '50% 50%').split(' ')[0] || '50%';
                                setEditingProduct({
                                  ...editingProduct,
                                  modalImagePosition: `${x} ${e.target.value}%`,
                                });
                              }}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">Zoom ({editingProduct.modalImageScale || 100}%)</label>
                            <input
                              type="range"
                              min={60}
                              max={260}
                              value={editingProduct.modalImageScale || 100}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  modalImageScale: Number(e.target.value),
                                })
                              }
                              className="w-full accent-teal-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Landing Page Link & WhatsApp Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-zinc-800">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                      Link / URL de Landing Page (Opcional · botón "Ver Landing Page")
                    </label>
                    <input
                      type="text"
                      value={editingProduct.landingPageUrl || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, landingPageUrl: e.target.value })}
                      placeholder="Ej. /cursowappy01 o https://tu-landing.com"
                      className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">
                      Número de WhatsApp de Contacto (Para este curso/servicio)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.whatsappNumber || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, whatsappNumber: e.target.value })}
                      placeholder="Ej. 573102913651 o 3102913651"
                      className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery, Status & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Plazo / Fecha de Inicio</label>
                  <input
                    type="text"
                    value={editingProduct.estimatedDeliveryDays || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, estimatedDeliveryDays: e.target.value })}
                    placeholder="Ej. Acceso inmediato"
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Visibilidad en Tienda</label>
                  <select
                    value={editingProduct.isTest ? 'test' : 'public'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isTest: e.target.value === 'test' })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="public">🌟 Público (Visible para todos)</option>
                    <option value="test">🧪 Modo Prueba (Solo Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-zinc-200">Estado de Publicación</label>
                  <select
                    value={editingProduct.status || 'published'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  {loading ? 'Guardando...' : 'Guardar Producto / Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceAdminDashboard;
