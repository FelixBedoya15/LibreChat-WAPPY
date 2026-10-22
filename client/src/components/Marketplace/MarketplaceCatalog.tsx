import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Stethoscope,
  FileSpreadsheet,
  Car,
  HeartPulse,
  Activity,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Edit,
  Plus,
} from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '~/hooks/AuthContext';
import type { MarketplaceProduct, MarketplaceCategory } from './types';
import { useMarketplace } from './MarketplaceContext';
import MarketplaceProductCard from './MarketplaceProductCard';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Layers className="h-3.5 w-3.5" />,
  complementos_wappy: <Sparkles className="h-3.5 w-3.5" />,
  medicina_laboral: <Stethoscope className="h-3.5 w-3.5" />,
  gtc45_ipevar: <FileSpreadsheet className="h-3.5 w-3.5" />,
  pesv: <Car className="h-3.5 w-3.5" />,
  psicosocial: <HeartPulse className="h-3.5 w-3.5" />,
  ergonomia: <Activity className="h-3.5 w-3.5" />,
  auditoria: <ClipboardCheck className="h-3.5 w-3.5" />,
  capacitaciones: <GraduationCap className="h-3.5 w-3.5" />,
};

const MarketplaceCatalog: React.FC = () => {
  const { user } = useAuthContext();
  const { catalogRefreshKey, openEditProduct, setActiveTab, setSelectedProductDetail } = useMarketplace();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState<boolean>(true);

  // Load categories
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const { data } = await axios.get('/api/marketplace/categories');
        if (isMounted && data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load products based on filters
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/marketplace/products', {
          params: {
            category: selectedCategory,
            search: searchQuery,
            sort: sortBy,
          },
        });
        if (isMounted && data.success) {
          const loaded: MarketplaceProduct[] = data.products || [];
          setProducts(loaded);

          // Support direct product link ?producto=slug or ?curso=slug
          const params = new URLSearchParams(window.location.search);
          const targetSlug = params.get('producto') || params.get('curso') || params.get('product');
          if (targetSlug) {
            const match = loaded.find(
              (p) => p.slug?.toLowerCase() === targetSlug.toLowerCase() || p._id === targetSlug
            );
            if (match) {
              setSelectedProductDetail(match);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, sortBy, catalogRefreshKey]);

  // Non-admins strictly only see public non-test published products; featured products always appear first when sortBy === 'featured'
  const baseProducts = isAdmin
    ? products
    : products.filter((p) => !p.isTest && p.status === 'published');

  const visibleProducts =
    sortBy === 'featured'
      ? [...baseProducts].sort((a, b) => {
          const featDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
          if (featDiff !== 0) return featDiff;
          return Number(Boolean(a.isTest)) - Number(Boolean(b.isTest));
        })
      : baseProducts;

  return (
    <div className="space-y-6">
      {/* Hero Banner with Value Proposition */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-teal-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Tienda Oficial WAPPY</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
            Cursos, Formación y Servicios SST
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Formación especializada de alto nivel y contratación directa de soluciones para la gestión integral de Seguridad y Salud en el Trabajo.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-teal-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              <span>Garantía de Cumplimiento Legal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Especialistas con Licencia SST Vigente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-400" />
              <span>Cupos Exclusivos & Acompañamiento VIP</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Admin Test Notification Banner */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-base">👑</span>
            <span>
              <strong>Panel Admin Activo:</strong> Estás viendo los productos públicos y los <strong>productos en borrador / prueba</strong> ({visibleProducts.filter((p) => p.isTest || p.status === 'draft').length} exclusivos para Admin). Puedes editarlos pasando el cursor sobre el botón de edición en cualquier tarjeta.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              title="Abrir Tabla de Productos y Cursos"
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-zinc-700 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs transition-all duration-300 active:scale-95"
            >
              <Edit className="h-4 w-4 shrink-0" />
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[180px] group-hover:opacity-100">
                <span className="text-xs font-bold">Tabla de Productos</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openEditProduct()}
              title="Crear Nuevo Producto o Curso"
              className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 font-bold text-xs bg-white dark:bg-gray-900 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 border border-border-medium/40 text-orange-600 dark:text-orange-400 shadow-sm transition-all duration-300 active:scale-95"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <div className="flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[180px] group-hover:opacity-100">
                <span className="text-xs font-bold">Nuevo Producto</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por servicio, norma o palabra clave (ej. IPEVAR, PESV, Exámenes)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-hidden focus:border-teal-500"
          />
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-zinc-500 shrink-0 font-medium">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 shadow-2xs focus:outline-hidden focus:border-teal-500 font-semibold"
          >
            <option value="featured">Destacados Primero</option>
            <option value="price_asc">Menor Inversión</option>
            <option value="price_desc">Mayor Inversión</option>
            <option value="rating">Mejor Calificados</option>
            <option value="sales">Más Solicitados</option>
          </select>
        </div>
      </div>

      {/* Categories Filter Pills (Expandable / Collapsible on Hover) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          title="Todos los Servicios"
          className={`group flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 active:scale-95 shadow-2xs ${
            selectedCategory === 'all'
              ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-500/20 shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
          }`}
        >
          <span className="shrink-0">{CATEGORY_ICONS.all}</span>
          <div
            className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
              selectedCategory === 'all'
                ? 'ml-1.5 max-w-[200px] opacity-100'
                : 'max-w-0 opacity-0 group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100'
            }`}
          >
            <span>Todos los Servicios</span>
          </div>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              title={cat.name}
              className={`group flex h-9 min-w-[36px] items-center justify-center px-2.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 active:scale-95 shadow-2xs ${
                isSelected
                  ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-500/20 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="shrink-0">{CATEGORY_ICONS[cat.slug] || <Layers className="h-3.5 w-3.5" />}</span>
              <div
                className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isSelected
                    ? 'ml-1.5 max-w-[200px] opacity-100'
                    : 'max-w-0 opacity-0 group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100'
                }`}
              >
                <span>{cat.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse border border-slate-200 dark:border-zinc-700"
            />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="p-12 text-center max-w-md mx-auto space-y-3">
          <Search className="h-10 w-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            No se encontraron servicios
          </h3>
          <p className="text-xs text-slate-500">
            Intenta con otra palabra clave o selecciona otra categoría de salud ocupacional.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleProducts.map((product) => (
            <MarketplaceProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceCatalog;
