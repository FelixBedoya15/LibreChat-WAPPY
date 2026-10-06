import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Camera,
  Search,
  Filter,
  History,
  Send,
  Loader2,
  ArrowLeft,
  Sparkles,
  Award,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import { useWorkerSession } from '../../hooks/useWorkerSession';

interface EppCatalogItem {
  _id: string;
  codigo?: string;
  nombre: string;
  categoria: string;
  tipo?: string;
  stockActual?: number;
  talla?: string;
  unidad?: string;
  foto?: string;
}

interface SelectedItem {
  eppId?: string;
  codigo?: string;
  nombre: string;
  categoria: string;
  tipo: string;
  talla: string;
  cantidad: number;
  motivo: string;
  observaciones: string;
}

const MOTIVOS_SOLICITUD = [
  'Desgaste normal por uso',
  'Daño o rotura accidental',
  'Pérdida o extravío',
  'Cambio de talla / Incomodidad',
  'Dotación periódica reglamentaria (Art. 230 CST)',
  'Nuevo riesgo identificado en puesto de trabajo'
];

export default function PublicSolicitudEpp() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { session, worker: sessionWorker, isAuthenticated, saveSession } = useWorkerSession(companyId);

  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get('tab') === 'historial' ? 'historial' : 'solicitar';
  const [activeTab, setActiveTab] = useState<'solicitar' | 'historial'>(initialTab);

  useEffect(() => {
    const qTab = new URLSearchParams(window.location.search).get('tab');
    if (qTab === 'historial' || qTab === 'solicitar') {
      setActiveTab(qTab);
    }
  }, [window.location.search]);

  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<EppCatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Worker Data
  const [documento, setDocumento] = useState('');
  const [nombreTrabajador, setNombreTrabajador] = useState('');
  const [cargo, setCargo] = useState('');

  // Request Data
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [justificacion, setJustificacion] = useState('');
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);
  const [urgencia, setUrgencia] = useState<'Baja' | 'Media' | 'Alta'>('Media');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History Data
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync session worker
  useEffect(() => {
    if (sessionWorker || session) {
      setDocumento(sessionWorker?.cedula || session?.cedula || '');
      setNombreTrabajador(sessionWorker?.nombre || session?.nombre || '');
      setCargo(sessionWorker?.cargo || session?.cargo || '');
    }
  }, [sessionWorker, session]);

  // Load catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/public-sgsst/epp/catalogo/${companyId}`);
        setCatalog(res.data?.catalogo || []);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchCatalog();
  }, [companyId]);

  // Load history when tab is clicked
  useEffect(() => {
    if (activeTab === 'historial' && documento && companyId) {
      fetchHistory();
    }
  }, [activeTab, documento, companyId]);

  const fetchHistory = async () => {
    if (!documento) return;
    try {
      setLoadingHistory(true);
      const res = await axios.get(`/api/public-sgsst/epp/mis-solicitudes/${companyId}/${documento}`);
      setSolicitudes(res.data?.solicitudes || []);
    } catch (err) {
      console.error('Error fetching user solicitudes:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const categories = ['Todas', ...Array.from(new Set(catalog.map(c => c.categoria).filter(Boolean)))];

  const filteredCatalog = catalog.filter(item => {
    const matchCat = selectedCategory === 'Todas' || item.categoria === selectedCategory;
    const matchSearch = (item.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.codigo || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddItem = (item: EppCatalogItem) => {
    const exists = selectedItems.find(s => s.eppId === item._id || s.nombre === item.nombre);
    if (exists) {
      setSelectedItems(selectedItems.map(s => 
        (s.eppId === item._id || s.nombre === item.nombre)
          ? { ...s, cantidad: s.cantidad + 1 }
          : s
      ));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          eppId: item._id,
          codigo: item.codigo || '',
          nombre: item.nombre,
          categoria: item.categoria,
          tipo: item.tipo || 'Regular',
          talla: item.talla || 'Única',
          cantidad: 1,
          motivo: MOTIVOS_SOLICITUD[0],
          observaciones: ''
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof SelectedItem, val: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: val };
    setSelectedItems(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoEvidencia(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim() || !nombreTrabajador.trim()) {
      alert('Por favor ingrese su documento de identidad y nombre completo.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Por favor seleccione al menos un Elemento de Protección Personal (EPP).');
      return;
    }

    try {
      setSubmitting(true);
      saveSession(documento.trim(), nombreTrabajador.trim(), cargo.trim());

      const payload = {
        workerId: documento.trim(),
        documento: documento.trim(),
        nombreTrabajador: nombreTrabajador.trim(),
        cargo: cargo.trim() || 'Colaborador',
        items: selectedItems,
        justificacion,
        fotoEvidencia,
        urgencia
      };

      const res = await axios.post(`/api/public-sgsst/epp/solicitar/${companyId}`, payload);
      setSuccessMessage(res.data?.message || '¡Solicitud radicada con éxito!');
      setSelectedItems([]);
      setJustificacion('');
      setFotoEvidencia(null);
      // Auto-load history
      fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al radicar solicitud de EPP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans">
      <PublicWorkerHeader 
        companyId={companyId || ''}
        currentModule="epp"
        title="Solicitud y Reposición de EPP"
        subtitle="Dotación, reposición por desgaste y trazabilidad en almacén"
        workerCedula={documento}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Banner Superior con Puntos de Gamificación */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-teal-300" /> Trazabilidad Directa de Bodega
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Solicitud y Reposición de EPP
            </h1>
            <p className="text-teal-100/90 text-sm max-w-xl">
              Solicita tus elementos de protección personal por reposición, deterioro o dotación periódica. Tu solicitud se enlaza en tiempo real con el inventario de la empresa.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-teal-200">Recompensa</span>
              <span className="text-xl font-black text-amber-300">+25 Puntos</span>
              <span className="block text-[10px] text-teal-100">Cuidado Biocéntrico</span>
            </div>
          </div>
        </div>

        {/* Botonera de Navegación Cápsula (Design System) */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-md">
            <button
              onClick={() => { setActiveTab('solicitar'); setSuccessMessage(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'solicitar'
                  ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Nueva Solicitud
              {selectedItems.length > 0 && (
                <span className="bg-teal-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {selectedItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('historial'); setSuccessMessage(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'historial'
                  ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <History className="w-4 h-4" />
              Mis Solicitudes & Entregas
              {solicitudes.length > 0 && (
                <span className="bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {solicitudes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">{successMessage}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Puedes consultar su estado en la pestaña "Mis Solicitudes & Entregas".</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('historial')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
            >
              Ver Estado
            </button>
          </div>
        )}

        {/* ─── PESTAÑA 1: NUEVA SOLICITUD ─── */}
        {activeTab === 'solicitar' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Datos del Colaborador */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" /> Datos del Colaborador Solicitante
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Documento de Identidad (Cédula) *
                  </label>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreTrabajador}
                    onChange={e => setNombreTrabajador(e.target.value)}
                    placeholder="Ej. Andrés Camilo Torres"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Cargo u Operación
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="Ej. Operario de Producción"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Catálogo Disponible para Selección */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-600" /> Catálogo de Protección Personal (Almacén)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Selecciona los elementos que requieres para tu labor diaria.
                  </p>
                </div>
                {/* Buscador */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar EPP..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Filtro por Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid del Catálogo */}
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                  <p className="text-xs text-slate-500">Consultando catálogo de EPP...</p>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                  <p className="text-xs text-slate-500">No se encontraron EPP con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCatalog.map((item, idx) => {
                    const isSelected = selectedItems.some(s => s.eppId === item._id || s.nombre === item.nombre);
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-500/80 shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                              {item.categoria}
                            </span>
                            {item.stockActual !== undefined && (
                              <span className={`text-[10px] font-bold ${item.stockActual > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                                {item.stockActual > 0 ? `Stock: ${item.stockActual}` : 'Bajo pedido'}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-xs text-slate-900 dark:text-zinc-100 leading-tight">
                            {item.nombre}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                          <span className="text-[10px] text-slate-400">
                            {item.talla ? `Talla: ${item.talla}` : 'Estándar'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddItem(item)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {isSelected ? 'Agregar otro' : 'Solicitar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Lista de Ítems Seleccionados para la Solicitud */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" /> Ítems a Solicitar ({selectedItems.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Ajusta la cantidad, talla requerida y el motivo de la reposición.
                  </p>
                </div>
              </div>

              {selectedItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">
                    No has seleccionado ningún elemento aún.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic en "Solicitar" en cualquiera de los elementos del catálogo superior.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                            {item.categoria}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                            {item.nombre}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Eliminar de la solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 dark:border-zinc-700/60">
                        {/* Cantidad */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                            Cantidad Solicitada
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, 'cantidad', Math.max(1, item.cantidad - 1))}
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center font-black text-sm active:scale-95"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black text-sm text-slate-900 dark:text-zinc-100">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, 'cantidad', item.cantidad + 1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center font-black text-sm active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Talla */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                            Talla / Dimensión
                          </label>
                          <input
                            type="text"
                            value={item.talla}
                            onChange={e => handleUpdateItem(idx, 'talla', e.target.value)}
                            placeholder="Ej. M, L, 39, 41, Única"
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        {/* Motivo */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                            Motivo de la Solicitud
                          </label>
                          <select
                            value={item.motivo}
                            onChange={e => handleUpdateItem(idx, 'motivo', e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                          >
                            {MOTIVOS_SOLICITUD.map((m, mIdx) => (
                              <option key={mIdx} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Justificación y Evidencia Fotográfica */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600" /> Justificación y Evidencia (Opcional)
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    Observaciones o Justificación Adicional
                  </label>
                  <textarea
                    rows={2}
                    value={justificacion}
                    onChange={e => setJustificacion(e.target.value)}
                    placeholder="Detalla si hubo rotura, en qué tarea se dañó el EPP o detalles para el encargado de almacén..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Nivel de Urgencia */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      Nivel de Urgencia Operativa
                    </label>
                    <div className="flex items-center gap-2">
                      {(['Baja', 'Media', 'Alta'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setUrgencia(lvl)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                            urgencia === lvl
                              ? lvl === 'Alta' 
                                ? 'bg-red-500 text-white border-red-500' 
                                : lvl === 'Media'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-teal-600 text-white border-teal-600'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {lvl === 'Alta' ? '🚨 Alta (Inmediata)' : lvl === 'Media' ? '⚠️ Media' : 'Normal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Foto Evidencia */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      Foto de Evidencia de Desgaste (Recomendado)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {fotoEvidencia ? (
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-400">
                        <img src={fotoEvidencia} alt="Evidencia" className="w-10 h-10 object-cover rounded-lg" />
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 truncate flex-1">Foto adjunta con éxito</span>
                        <button
                          type="button"
                          onClick={() => setFotoEvidencia(null)}
                          className="text-xs text-red-500 hover:underline font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-teal-500 text-xs font-bold transition-all"
                      >
                        <Camera className="w-4 h-4 text-teal-600" />
                        Subir foto de EPP deteriorado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Envío Oficial */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || selectedItems.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Radicando Solicitud...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Radicar Solicitud de EPP (+25 pts)
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ─── PESTAÑA 2: HISTORIAL Y ESTADO DE SOLICITUDES ─── */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-600" /> Historial de Solicitudes y Trazabilidad
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Consulta el estado de entrega y aprobación de tus requerimientos de dotación.
                  </p>
                </div>
                {/* Selector de cédula para consultar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    placeholder="Tu Cédula..."
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={fetchHistory}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {loadingHistory ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                  <p className="text-xs text-slate-500">Cargando tus solicitudes...</p>
                </div>
              ) : solicitudes.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                    No tienes solicitudes de EPP registradas con la cédula {documento || '[Sin cédula]'}.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puedes radicar una nueva solicitud en la pestaña "Nueva Solicitud".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {solicitudes.map((sol, sIdx) => {
                    const statusColor = 
                      sol.estado === 'entregada'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : sol.estado === 'aprobada'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                        : sol.estado === 'rechazada'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';

                    const statusIcon = 
                      sol.estado === 'entregada' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                      sol.estado === 'aprobada' ? <Check className="w-3.5 h-3.5" /> :
                      sol.estado === 'rechazada' ? <XCircle className="w-3.5 h-3.5" /> :
                      <Clock className="w-3.5 h-3.5" />;

                    const statusLabel = 
                      sol.estado === 'entregada' ? 'Entregada en Bodega' :
                      sol.estado === 'aprobada' ? 'Aprobada (Lista para Entrega)' :
                      sol.estado === 'rechazada' ? 'Rechazada' :
                      'Pendiente de Revisión';

                    return (
                      <div
                        key={sIdx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              #{sol._id.toString().slice(-6).toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${statusColor}`}>
                              {statusIcon} {statusLabel}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(sol.createdAt || sol.fechaSolicitud).toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {sol.urgencia && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              sol.urgencia === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              Urgencia: {sol.urgencia}
                            </span>
                          )}
                        </div>

                        {/* Ítems */}
                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg space-y-1">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Elementos solicitados ({sol.items?.length || 0}):
                          </p>
                          <ul className="text-xs space-y-1">
                            {(sol.items || []).map((it: any, iIdx: number) => (
                              <li key={iIdx} className="flex items-center justify-between text-slate-800 dark:text-zinc-200">
                                <span>
                                  <strong>{it.cantidad}x</strong> {it.nombre} {it.talla ? `(Talla: ${it.talla})` : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 italic">
                                  {it.motivo}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Respuesta / Observación de SST */}
                        {sol.notasRespuesta && (
                          <div className="p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs">
                            <span className="font-bold text-teal-800 dark:text-teal-300">Respuesta SST ({sol.respondidoPor || 'Responsable'}): </span>
                            <span className="text-teal-900 dark:text-teal-200">{sol.notasRespuesta}</span>
                          </div>
                        )}

                        {sol.motivoRechazo && (
                          <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs">
                            <span className="font-bold text-rose-800 dark:text-rose-300">Motivo de Rechazo: </span>
                            <span className="text-rose-900 dark:text-rose-200">{sol.motivoRechazo}</span>
                          </div>
                        )}

                        {sol.fechaEntrega && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Entregado el: {new Date(sol.fechaEntrega).toLocaleDateString('es-CO')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
