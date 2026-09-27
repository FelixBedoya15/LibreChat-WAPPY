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
} from 'lucide-react';
import axios from 'axios';
import type { MarketplaceProduct, MarketplaceOrder, MarketplaceCoupon } from './types';

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'coupons'>('orders');

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
  const [editingProduct, setEditingProduct] = useState<Partial<MarketplaceProduct> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

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
        params: { search: productSearch },
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
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);

    try {
      if (editingProduct._id) {
        await axios.put(`/api/marketplace/admin/products/${editingProduct._id}`, editingProduct);
        showNotification('Servicio actualizado con éxito.', 'success');
      } else {
        await axios.post('/api/marketplace/admin/products', editingProduct);
        showNotification('Servicio creado con éxito.', 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Error al guardar servicio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este servicio del catálogo?')) return;
    try {
      await axios.delete(`/api/marketplace/admin/products/${id}`);
      showNotification('Servicio eliminado.', 'success');
      fetchProducts();
    } catch (err) {
      showNotification('Error al eliminar servicio.', 'error');
    }
  };

  // Reseed catalog
  const handleReseedCatalog = async () => {
    if (!window.confirm('¿Deseas restablecer el catálogo de Salud Ocupacional a los 7 servicios predeterminados?')) return;
    try {
      await axios.post('/api/marketplace/admin/reseed');
      showNotification('Catálogo restablecido con éxito.', 'success');
      fetchProducts();
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

      {/* Top Floating Capsule Toolbar (WAPPY SGSSTToolbar Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
          {/* Tab 1: Pedidos */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 relative ${
              activeTab === 'orders'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
            title="Gestor de Pedidos (WooCommerce Orders)"
          >
            <ShoppingBag className="h-4 w-4" />
            {ordersStats.pendingReviewCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5">
                {ordersStats.pendingReviewCount}
              </span>
            )}
          </button>

          {/* Tab 2: Servicios / Productos */}
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 ${
              activeTab === 'products'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
            title="Catálogo de Servicios SST (WooCommerce Products)"
          >
            <Package className="h-4 w-4" />
          </button>

          {/* Tab 3: Cupones */}
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 ${
              activeTab === 'coupons'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-600 dark:text-teal-300 font-bold'
                : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
            title="Cupones y Descuentos"
          >
            <Ticket className="h-4 w-4" />
          </button>
        </div>

        {/* Action Header Button */}
        {activeTab === 'products' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReseedCatalog}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-slate-600 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 shadow-xs"
              title="Restablecer los 7 servicios iniciales"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingProduct({
                  title: '',
                  slug: '',
                  category: 'medicina_laboral',
                  serviceType: 'service_virtual',
                  regularPrice: 350000,
                  salePrice: 0,
                  hasDiscount: false,
                  status: 'published',
                  deliverables: [],
                  requirements: [],
                });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Servicio SST</span>
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

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Ver Detalle Micro Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-xs active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                <span className="text-[10px] font-bold">Ver</span>
                              </div>
                            </button>

                            {/* WhatsApp Micro Button */}
                            <button
                              type="button"
                              onClick={handleWhatsAppClient}
                              className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-xs active:scale-95 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
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
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio Base</th>
                  <th className="p-3">Oferta</th>
                  <th className="p-3">Ventas</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {products.map((prod) => (
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
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prod.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar Micro Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsProductModalOpen(true);
                          }}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-xs active:scale-95 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Editar</span>
                          </div>
                        </button>

                        {/* Eliminar Micro Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-xs active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Borrar</span>
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
          <div className="bg-white dark:bg-zinc-900 border rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                {editingProduct._id ? 'Editar Servicio SST' : 'Crear Nuevo Servicio SST'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full border flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Título del Servicio *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Categoría *</label>
                  <select
                    value={editingProduct.category || 'medicina_laboral'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="medicina_laboral">Medicina Laboral</option>
                    <option value="gtc45_ipevar">Matrices & Peligros GTC-45</option>
                    <option value="pesv">Seguridad Vial PESV</option>
                    <option value="psicosocial">Riesgo Psicosocial</option>
                    <option value="ergonomia">Ergonomía & Puesto de Trabajo</option>
                    <option value="auditoria">Auditoría & Consultoría SST</option>
                    <option value="capacitaciones">Capacitación Certificada</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Modalidad del Servicio</label>
                  <select
                    value={editingProduct.serviceType || 'service_virtual'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, serviceType: e.target.value as any })}
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="service_virtual">100% Virtual</option>
                    <option value="service_onsite">Presencial / En IPS</option>
                    <option value="service_hybrid">Modalidad Híbrida</option>
                    <option value="digital_download">Descargable / Formato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Precio Regular (COP) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.regularPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, regularPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Precio de Oferta (COP)</label>
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
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Descripción Corta</label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Imagen Destacada (URL)</label>
                <input
                  type="text"
                  value={editingProduct.featuredImage || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, featuredImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Plazo Estimado</label>
                  <input
                    type="text"
                    value={editingProduct.estimatedDeliveryDays || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, estimatedDeliveryDays: e.target.value })}
                    placeholder="Ej. 5 días hábiles"
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Estado</label>
                  <select
                    value={editingProduct.status || 'published'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full p-2 border rounded-xl bg-white dark:bg-zinc-800"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-xl shadow-md"
                >
                  {loading ? 'Guardando...' : 'Guardar Servicio'}
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
