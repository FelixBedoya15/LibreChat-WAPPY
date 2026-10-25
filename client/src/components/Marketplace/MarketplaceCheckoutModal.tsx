import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Tag,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
} from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '~/hooks/AuthContext';
import { useMarketplace } from './MarketplaceContext';
import type { CustomerData } from './types';

interface Props {
  onSuccess: (orderNumber: string) => void;
}

const formatCOP = (amount: number) => {
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
};

const MarketplaceCheckoutModal: React.FC<Props> = ({ onSuccess }) => {
  const { user, token } = useAuthContext();
  const {
    cart,
    subtotal,
    discountAmount,
    totalAmount,
    appliedCoupon,
    setAppliedCoupon,
    clearCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
  } = useMarketplace();

  // Form State
  const [customer, setCustomer] = useState<CustomerData>({
    fullName: user?.name || '',
    companyName: '',
    documentId: '',
    email: user?.email || '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  // Auto-fill customer & company data from user profile, active SG-SST company profile, and local cache
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const isValidEmail = (v?: string) =>
      typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const isValidPhone = (v?: string) =>
      typeof v === 'string' && v.replace(/\D/g, '').length >= 7;
    const isValidText = (v?: string) => {
      if (typeof v !== 'string') return false;
      const t = v.trim();
      if (t.length < 3) return false;
      if (/^(asd[a-z]*|zsd[a-z]*|zxc[a-z]*|zdf[a-z]*|adv|n\/a|no registrado|sin nombre)$/i.test(t)) {
        return false;
      }
      return true;
    };
    const pickFirst = (validator: (v?: string) => boolean, ...candidates: (string | undefined)[]) => {
      for (const c of candidates) {
        if (validator(c)) return String(c).trim();
      }
      return '';
    };

    const getLocalCompanyFallback = () => {
      try {
        const activeId = localStorage.getItem('wappy_active_company_id') || '';
        const activeName = localStorage.getItem('wappy_active_company_name') || '';
        const activeNit = localStorage.getItem('wappy_active_company_nit') || '';
        const activeArl = localStorage.getItem('wappy_active_company_arl') || '';
        const activeWorkers = localStorage.getItem('wappy_active_company_workers') || '';
        const activeRisk = localStorage.getItem('wappy_active_company_risk') || '';

        const parseSafe = (raw: string | null) => {
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        };

        const draft =
          parseSafe(activeId ? localStorage.getItem(`wappy_company_draft_${activeId}`) : null) ||
          parseSafe(localStorage.getItem('wappy_company_draft_new'));

        const gtc45Company = parseSafe(localStorage.getItem('wappy_gtc45_company'));

        const companiesListRaw =
          parseSafe(localStorage.getItem('wappy_sgsst_companies')) ||
          parseSafe(localStorage.getItem('wappy_sgsst_companies_offline'));
        const companiesList: any[] = Array.isArray(companiesListRaw) ? companiesListRaw : [];
        const activeFromList =
          companiesList.find((c) => activeId && String(c?._id) === activeId) ||
          companiesList.find((c) => c?.isActive) ||
          companiesList[0] ||
          null;

        const ipvrState = parseSafe(localStorage.getItem('matrizipvr_State_v2'));
        const ipvrComp = ipvrState?.companyInfo
          ? {
              companyName: ipvrState.companyInfo.name,
              nit: ipvrState.companyInfo.nit,
              phone: ipvrState.companyInfo.phone,
              city: ipvrState.companyInfo.city,
              address: ipvrState.companyInfo.address,
              email: ipvrState.companyInfo.email,
              legalRepresentative: ipvrState.companyInfo.rep,
            }
          : null;

        const sources = [draft, activeFromList, gtc45Company, ...companiesList, ipvrComp].filter(Boolean);

        const fullName = pickFirst(
          isValidText,
          ...sources.flatMap((s) => [s?.responsibleSST, s?.legalRepresentative])
        );
        const companyName = pickFirst(
          isValidText,
          activeName,
          ...sources.map((s) => s?.companyName)
        );
        const documentId = pickFirst(
          isValidText,
          activeNit,
          ...sources.flatMap((s) => [s?.nit, s?.legalRepresentativeId])
        );
        const email = pickFirst(
          isValidEmail,
          ...sources.map((s) => s?.email)
        );
        const phone = pickFirst(
          isValidPhone,
          ...sources.flatMap((s) => [s?.phone, s?.responsibleSSTPhone])
        );
        const rawCity = pickFirst(
          isValidText,
          ...sources.map((s) => s?.city)
        );
        const rawDept = pickFirst(
          isValidText,
          ...sources.map((s) => s?.departamento)
        );
        const city =
          rawCity && rawDept && !rawCity.toLowerCase().includes(rawDept.toLowerCase())
            ? `${rawCity}, ${rawDept}`
            : rawCity;
        const address = pickFirst(
          isValidText,
          ...sources.map((s) => s?.address)
        );
        const arl = pickFirst(
          isValidText,
          activeArl,
          ...sources.map((s) => s?.arl)
        );
        const riskLevel = pickFirst(
          (v) => Boolean(v && v.trim()),
          activeRisk,
          ...sources.map((s) => s?.riskLevel)
        );
        const workers =
          activeWorkers ||
          String(sources.find((s) => Number(s?.workerCount) > 0)?.workerCount || '');

        const notesParts: string[] = [];
        if (address) notesParts.push(`Dir: ${address}`);
        if (arl) notesParts.push(`ARL: ${arl}`);
        if (riskLevel) notesParts.push(`Riesgo: ${riskLevel}`);
        if (workers && workers !== '0') notesParts.push(`${workers} trabajadores`);

        const isDemoDefault =
          companyName.toUpperCase().includes('WAPPY INDUSTRIA') ||
          activeId === 'comp_default_1' ||
          email === 'sst@wappy.club';

        return {
          fullName,
          companyName,
          documentId,
          email,
          phone,
          city,
          address,
          notes: notesParts.join(' · '),
          isDemoDefault,
        };
      } catch {
        return {
          fullName: '',
          companyName: '',
          documentId: '',
          email: '',
          phone: '',
          city: '',
          address: '',
          notes: '',
          isDemoDefault: false,
        };
      }
    };

    const localFallback = getLocalCompanyFallback();

    // 1. Immediately populate all fields from user + local company data
    setCustomer((prev) => ({
      ...prev,
      fullName: pickFirst(isValidText, prev.fullName, user?.name, localFallback.fullName),
      email: pickFirst(isValidEmail, prev.email, user?.email, localFallback.email),
      companyName: pickFirst(isValidText, prev.companyName, localFallback.companyName),
      documentId: pickFirst(isValidText, prev.documentId, localFallback.documentId),
      phone: pickFirst(isValidPhone, prev.phone, (user as any)?.phoneNumber, localFallback.phone),
      city: pickFirst(
        isValidText,
        prev.city !== 'Bogotá' ? prev.city : '',
        (user as any)?.ciudad,
        localFallback.city
      ),
      address: pickFirst(isValidText, prev.address, localFallback.address),
      notes: pickFirst(isValidText, prev.notes, localFallback.notes),
    }));

    // 2. Fetch active company info & aggregated customer profile from backend
    const fetchUserAndCompanyData = async () => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      let serverProfile: any = null;
      let serverAuthenticated = false;
      let companyInfo: any = null;
      let lastOrderCustomer: any = null;

      try {
        const { data: profileRes } = await axios.get('/api/marketplace/customer-profile', {
          headers,
          withCredentials: true,
          params: {
            nit: localFallback.documentId || undefined,
            email: user?.email || localFallback.email || undefined,
          },
        });
        if (profileRes?.profile) {
          serverProfile = profileRes.profile;
          serverAuthenticated = Boolean(profileRes.authenticated);
        }
        if (profileRes?.company) {
          companyInfo = profileRes.company;
        }
      } catch {
        // Ignore if not available
      }

      if ((!companyInfo || !companyInfo.companyName) && token) {
        try {
          const { data } = await axios.get('/api/sgsst/company-info', {
            headers,
            withCredentials: true,
          });
          if (data && typeof data === 'object' && data.companyName) {
            companyInfo = data;
          }
        } catch {
          // Ignore if not available
        }
      }

      if (!serverProfile && token) {
        try {
          const { data: ordersRes } = await axios.get('/api/marketplace/my-orders', {
            headers,
            withCredentials: true,
          });
          if (ordersRes?.orders && Array.isArray(ordersRes.orders) && ordersRes.orders.length > 0) {
            lastOrderCustomer = ordersRes.orders[0]?.customer;
          }
        } catch {
          // Ignore if not available
        }
      }

      setCustomer((prev) => {
        const preferServer = serverAuthenticated || localFallback.isDemoDefault;

        return {
          ...prev,
          fullName: pickFirst(
            isValidText,
            preferServer ? serverProfile?.fullName : prev.fullName,
            user?.name,
            serverProfile?.fullName,
            companyInfo?.responsibleSST,
            companyInfo?.legalRepresentative,
            prev.fullName,
            localFallback.fullName,
            lastOrderCustomer?.fullName
          ),
          email: pickFirst(
            isValidEmail,
            preferServer ? serverProfile?.email : prev.email,
            user?.email,
            serverProfile?.email,
            companyInfo?.email,
            prev.email,
            localFallback.email,
            lastOrderCustomer?.email
          ),
          companyName: pickFirst(
            isValidText,
            preferServer ? serverProfile?.companyName : prev.companyName,
            serverProfile?.companyName,
            companyInfo?.companyName,
            prev.companyName,
            localFallback.companyName,
            lastOrderCustomer?.companyName
          ),
          documentId: pickFirst(
            isValidText,
            preferServer ? serverProfile?.documentId : prev.documentId,
            serverProfile?.documentId,
            companyInfo?.nit,
            companyInfo?.legalRepresentativeId,
            prev.documentId,
            localFallback.documentId,
            lastOrderCustomer?.documentId
          ),
          phone: pickFirst(
            isValidPhone,
            preferServer ? serverProfile?.phone : prev.phone,
            serverProfile?.phone,
            companyInfo?.phone,
            companyInfo?.responsibleSSTPhone,
            (user as any)?.phoneNumber,
            prev.phone,
            localFallback.phone,
            lastOrderCustomer?.phone
          ),
          city: pickFirst(
            isValidText,
            preferServer ? serverProfile?.city : prev.city !== 'Bogotá' ? prev.city : '',
            serverProfile?.city,
            companyInfo?.city,
            (user as any)?.ciudad,
            prev.city !== 'Bogotá' ? prev.city : '',
            localFallback.city,
            lastOrderCustomer?.city,
            'Medellín'
          ),
          address: pickFirst(
            isValidText,
            preferServer ? serverProfile?.address : prev.address,
            serverProfile?.address,
            companyInfo?.address,
            prev.address,
            localFallback.address,
            lastOrderCustomer?.address
          ),
          notes: pickFirst(
            isValidText,
            preferServer ? serverProfile?.notes : prev.notes,
            serverProfile?.notes,
            prev.notes,
            localFallback.notes
          ),
        };
      });
    };

    fetchUserAndCompanyData();
  }, [isCheckoutOpen, user, token]);

  const [paymentMethod, setPaymentMethod] = useState<'WOMPI' | 'MANUAL_TRANSFER'>('WOMPI');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Manual payment state
  const [manualReceiptFile, setManualReceiptFile] = useState<File | null>(null);
  const [registeredOrderNumber, setRegisteredOrderNumber] = useState<string | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCheckoutOpen) return null;

  const isProviderOrder = cart.some((item) => item.paymentRecipient === 'PROVIDER');
  const activeProviderName = cart.find((item) => item.paymentRecipient === 'PROVIDER')?.providerName || 'Proveedor Aliado';

  // Coupon application
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const { data } = await axios.post('/api/marketplace/validate-coupon', {
        code: couponInput.trim(),
        orderAmount: subtotal,
      });
      if (data.success) {
        setAppliedCoupon({
          code: data.code,
          calculatedDiscount: data.calculatedDiscount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          message: data.message,
        });
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Cupón inválido o expirado.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  // Process Checkout
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customer.fullName || !customer.documentId || !customer.email || !customer.phone) {
      setErrorMessage('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('El carrito no contiene ningún servicio.');
      return;
    }

    setIsLoading(true);

    try {
      const effectivePaymentMethod = isProviderOrder ? 'WOMPI' : paymentMethod;
      // 1. Send checkout request
      const { data } = await axios.post('/api/marketplace/checkout', {
        customer,
        items: cart,
        paymentMethod: effectivePaymentMethod,
        promoCode: appliedCoupon?.code,
      });

      if (!data.success) {
        throw new Error(data.error || 'Error al generar el pedido.');
      }

      const { orderNumber, wompi } = data;

      // 2. Handle WOMPI
      if (effectivePaymentMethod === 'WOMPI' && wompi) {
        const openWompi = () => {
          try {
            // @ts-ignore
            if (typeof window.WidgetCheckout === 'undefined') {
              throw new Error('El script de pagos Wompi aún no está disponible.');
            }

            // @ts-ignore
            const checkout = new window.WidgetCheckout({
              currency: wompi.currency || 'COP',
              amountInCents: wompi.amountInCents,
              reference: wompi.reference,
              publicKey: wompi.publicKey,
              signature: wompi.signature ? { integrity: wompi.signature } : undefined,
            });

            checkout.open(async (result: any) => {
              const transaction = result?.transaction;
              if (transaction) {
                try {
                  await axios.post('/api/marketplace/verify-payment', {
                    reference: wompi.reference,
                    transactionId: transaction.id,
                  });
                } catch (verErr) {
                  console.warn('[Marketplace] Error on instant verify:', verErr);
                }
              }
              clearCart();
              setIsCheckoutOpen(false);
              onSuccess(orderNumber);
            });
            setIsLoading(false);
          } catch (widgetErr: any) {
            console.error('[Marketplace Wompi Open Error]:', widgetErr);
            setErrorMessage(widgetErr.message || 'Error al abrir la pasarela de pagos Wompi.');
            setIsLoading(false);
          }
        };

        // @ts-ignore
        if (typeof window.WidgetCheckout !== 'undefined') {
          openWompi();
        } else {
          const scriptId = 'wompi-widget-script';
          let script = document.getElementById(scriptId) as HTMLScriptElement;
          if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://checkout.wompi.co/widget.js';
            document.body.appendChild(script);
          }
          script.onload = () => openWompi();
          script.onerror = () => {
            setErrorMessage('No fue posible cargar el widget seguro de Wompi. Por favor intenta de nuevo.');
            setIsLoading(false);
          };
          // Fallback in case script was already cached/loaded
          setTimeout(() => {
            // @ts-ignore
            if (typeof window.WidgetCheckout !== 'undefined') {
              openWompi();
            }
          }, 600);
        }
        return;
      }

      // 3. Handle Manual Transfer
      if (paymentMethod === 'MANUAL_TRANSFER') {
        setRegisteredOrderNumber(orderNumber);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Marketplace Checkout Error]:', err);
      const backendError = err.response?.data?.error;
      const backendDetails = err.response?.data?.details;
      setErrorMessage(
        backendDetails ? `${backendError}: ${backendDetails}` : (backendError || err.message || 'Error al procesar el pago.')
      );
      setIsLoading(false);
    }
  };

  // Upload Manual Receipt
  const handleUploadManualReceipt = async () => {
    if (!registeredOrderNumber || !manualReceiptFile) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('orderNumber', registeredOrderNumber);
      formData.append('receipt', manualReceiptFile);

      const { data } = await axios.post('/api/marketplace/manual-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        clearCart();
        setIsCheckoutOpen(false);
        onSuccess(registeredOrderNumber);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al subir el comprobante de pago.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                Finalizar Compra · Tienda WAPPY
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Cursos oficiales y servicios SST · Pasarela de pago segura
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              aria-label="Cerrar modal"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* If manual order registered, show upload step */}
          {registeredOrderNumber ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400 mx-auto flex items-center justify-center">
                <FileCheck className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                Pedido Registrado con Éxito: {registeredOrderNumber}
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                Realiza la transferencia por <strong>{formatCOP(totalAmount)}</strong> escaneando el QR oficial WAPPY o directo a Bancolombia / Nequi, y adjunta el comprobante a continuación:
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>Datos Oficiales de Pago:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    WAPPY IA
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <img
                    src="/QRWAPPY.png"
                    alt="Código QR Oficial WAPPY"
                    className="w-24 h-24 object-contain rounded-xl border border-slate-200 dark:border-zinc-700 bg-white p-1 shrink-0"
                    onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="space-y-1">
                    <div><strong>Bancolombia:</strong> Cuenta de Ahorros</div>
                    <div><strong>Nequi / Llave:</strong> 310 291 3651</div>
                    <div><strong>Titular:</strong> Félix Bedoya / WAPPY CLUB</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Escanea el QR desde tu app Bancolombia/Nequi para pago instantáneo
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload area */}
              <div className="max-w-md mx-auto">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-400/60 rounded-2xl bg-teal-50/30 dark:bg-teal-950/20 cursor-pointer hover:bg-teal-50/50 transition-colors">
                  <UploadCloud className="h-8 w-8 text-teal-600 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {manualReceiptFile ? manualReceiptFile.name : 'Haz clic para seleccionar comprobante (JPG, PNG o PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setManualReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {errorMessage && (
                <div className="text-xs text-red-500 font-semibold">{errorMessage}</div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  disabled={!manualReceiptFile || isLoading}
                  onClick={handleUploadManualReceipt}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Subiendo comprobante...' : 'Confirmar Comprobante'}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleProcessOrder} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Customer Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    1. Datos de Contacto y Empresa
                  </h4>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Nombre Completo o Responsable SST *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={customer.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Ej. Ing. Diana Morales"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        Empresa / Razón Social
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={customer.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="Mi Empresa S.A.S."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        NIT o Cédula *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.documentId}
                        onChange={(e) => handleInputChange('documentId', e.target.value)}
                        placeholder="900.123.456-7"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={customer.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contacto@empresa.com"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        WhatsApp de Contacto *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={customer.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="310 123 4567"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        Ciudad
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={customer.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Bogotá, Medellín..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                        Notas o Requerimientos
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={customer.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Horarios, sedes..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Payment and Order Summary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    2. Método de Pago y Resumen
                  </h4>

                  {/* Payment method selector */}
                  {isProviderOrder ? (
                    <div className="p-3.5 rounded-2xl border-2 border-purple-500/70 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span>Pasarela Wompi · Proveedor Aliado</span>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-[11px] text-purple-800 dark:text-purple-300">
                        Pago procesado directamente hacia la cuenta Wompi de <strong>{activeProviderName}</strong> (Tarjetas, PSE, Nequi, Bancolombia).
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('WOMPI')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          paymentMethod === 'WOMPI'
                            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 shadow-sm'
                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <CreditCard className="h-5 w-5 text-teal-600" />
                          {paymentMethod === 'WOMPI' && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs">Pasarela Wompi</div>
                          <div className="text-[10px] text-slate-500">Tarjetas, PSE, Nequi, Bancolombia</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MANUAL_TRANSFER')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          paymentMethod === 'MANUAL_TRANSFER'
                            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 shadow-sm'
                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <QrCode className="h-5 w-5 text-teal-600" />
                          {paymentMethod === 'MANUAL_TRANSFER' && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs">Transferencia Directa</div>
                          <div className="text-[10px] text-slate-500">Nequi QR / Comprobante</div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Coupon Input */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="CÓDIGO DE CUPÓN"
                          className="w-full pl-8 pr-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 dark:bg-zinc-700 hover:bg-slate-700 text-white transition-all disabled:opacity-50"
                      >
                        {isApplyingCoupon ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ✓ {appliedCoupon.message || `Cupón ${appliedCoupon.code} aplicado`}
                      </p>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span>Subtotal ({cart.length} servicios):</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{formatCOP(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Descuento aplicado:</span>
                        <span>-{formatCOP(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-zinc-100 pt-2 border-t border-teal-200/60 dark:border-teal-900/50">
                      <span>Total Inversión:</span>
                      <span className="text-teal-700 dark:text-teal-300 text-base">{formatCOP(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isLoading ? 'Conectando con pasarela...' : `Pagar ${formatCOP(totalAmount)}`}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MarketplaceCheckoutModal;
