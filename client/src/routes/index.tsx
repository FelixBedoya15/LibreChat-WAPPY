import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@librechat/client';
import {
  Login,
  VerifyEmail,
  Registration,
  ResetPassword,
  ApiErrorWatcher,
  TwoFactorScreen,
  RequestPasswordReset,
} from '~/components/Auth';
import { MarketplaceProvider } from '~/components/Agents/MarketplaceContext';
import { OAuthSuccess, OAuthError } from '~/components/OAuth';
import { AuthContextProvider, useAuthContext } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import RoadmapNotifier from '~/components/Roadmap/RoadmapNotifier';
import { hasActivePlan } from '~/utils/planAccess';
import TenshiStandaloneHost from '~/components/Tenshi/TenshiStandaloneHost';
import TenshiAvatar from '~/components/Tenshi/TenshiAvatar';

// Lazy-loaded secondary dashboards and public pages for fast initial bundle load
const SGSSTDashboard = lazy(() => import('~/components/SGSST/Dashboard'));
const HuellaBiocentricaDashboard = lazy(() => import('~/components/SGSST/HuellaBiocentricaDashboard'));
const VitalPublicPortalGuard = lazy(() => import('~/components/SGSST/VitalPublicPortalGuard'));
const PublicReportView = lazy(() => import('~/components/SGSST/PublicReportView'));
const PublicReporteActos = lazy(() => import('~/components/SGSST/PublicReporteActos'));
const PublicParticipacionIPEVAR = lazy(() => import('~/components/SGSST/PublicParticipacionIPEVAR'));
const PublicAltaDireccion = lazy(() => import('~/components/SGSST/PublicAltaDireccion'));
const PublicAtelTestimonio = lazy(() => import('~/components/SGSST/PublicAtelTestimonio'));
const PublicPerfilUpdate = lazy(() => import('~/components/SGSST/PublicPerfilUpdate'));
const PublicMoodTracker = lazy(() => import('~/components/SGSST/PublicMoodTracker'));
const PublicEstudioPuesto = lazy(() => import('~/components/SGSST/PublicEstudioPuesto'));
const PublicColaboradorHub = lazy(() => import('~/components/SGSST/PublicColaboradorHub'));
const PublicComites = lazy(() => import('~/components/SGSST/PublicComites'));
const PublicConvivencia = lazy(() => import('~/components/SGSST/PublicConvivencia'));
const PublicVotaciones = lazy(() => import('~/components/SGSST/PublicVotaciones'));
const PublicInspeccionesCopasst = lazy(() => import('~/components/SGSST/PublicInspeccionesCopasst'));
const PublicBrigadistas = lazy(() => import('~/components/SGSST/PublicBrigadistas'));
const PublicSolicitudEpp = lazy(() => import('~/components/SGSST/PublicSolicitudEpp'));
const PublicInspeccionVehicular = lazy(() => import('~/components/SGSST/PublicInspeccionVehicular'));
const MoodAnalyticsDashboard = lazy(() => import('~/components/SGSST/MoodAnalyticsDashboard'));
const PrivacyPolicyPage = lazy(() => import('~/components/Auth/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('~/components/Auth/TermsOfServicePage'));
const WappyAboutPage = lazy(() => import('~/components/Auth/WappyAboutPage'));
const ComunidadPage = lazy(() => import('~/components/Marketing/ComunidadPage'));
const MatrizPage = lazy(() => import('~/components/Marketing/MatrizPage'));
const MatrizIpvrPage = lazy(() => import('~/components/Marketing/MatrizIpvrPage'));
const WappyStudioPage = lazy(() => import('~/components/Marketing/WappyStudioPage'));
const QuibiPage = lazy(() => import('~/components/Marketing/QuibiPage'));
const BateriaPsicosocialPage = lazy(() => import('~/components/Marketing/BateriaPsicosocialPage'));
const LandingPage = lazy(() => import('~/components/Marketing/LandingPage'));
const WappyPortalPage = lazy(() => import('~/components/Marketing/WappyPortalPage'));
const AgentMarketplace = lazy(() => import('~/components/Agents/Marketplace'));
const CourseViewer = lazy(() => import('~/components/Training/CourseViewer'));
const TrainingAdminDashboard = lazy(() => import('~/components/Training/TrainingAdminDashboard'));
const CourseEditor = lazy(() => import('~/components/Training/CourseEditor'));
const RutaAprendizajeAdminDashboard = lazy(() => import('~/components/RutaAprendizaje/RutaAprendizajeAdminDashboard'));
const RutaAprendizajeCourseEditor = lazy(() => import('~/components/RutaAprendizaje/RutaAprendizajeCourseEditor'));
const RutaAprendizajeCourseViewer = lazy(() => import('~/components/RutaAprendizaje/RutaAprendizajeCourseViewer'));
const PublicRutaAprendizaje = lazy(() => import('~/components/RutaAprendizaje/PublicRutaAprendizaje'));
const PublicRutaCourseViewer = lazy(() => import('~/components/RutaAprendizaje/PublicRutaCourseViewer'));
const BlogAdminDashboard = lazy(() => import('~/components/Blog/BlogAdminDashboard'));
const BlogPostEditor = lazy(() => import('~/components/Blog/BlogPostEditor'));
const BlogPostViewer = lazy(() => import('~/components/Blog/BlogPostViewer'));
const TenshiAdminPanel = lazy(() => import('~/components/Tenshi/TenshiAdminPanel'));
const ChatSSTView = lazy(() => import('~/components/ChatSST/ChatSSTView'));
const EventsMeetAdminDashboard = lazy(() => import('~/components/EventsMeet/EventsMeetAdminDashboard'));
const AuditoriaDashboard = lazy(() => import('~/components/Auditoria/AuditoriaDashboard'));
const CentroControlSST = lazy(() => import('~/components/SGSST/CentroControlSST'));
const TareasPage = lazy(() => import('~/components/SGSST/TareasPage'));
const WappyAppsPage = lazy(() => import('~/components/WappyApps/WappyAppsPage'));
const WappyStudioDashboard = lazy(() => import('~/components/Studio/WappyStudioDashboard'));
const AcademiaDashboard = lazy(() => import('~/components/Academia/AcademiaDashboard'));
const MarketplaceDashboard = lazy(() => import('~/components/Marketplace/MarketplaceDashboard'));
const PlansPage = lazy(() => import('~/components/Plans/PlansPage'));
const ContactPage = lazy(() => import('~/components/Plans/ContactPage'));
const AmbassadorDashboard = lazy(() => import('~/components/Ambassadors/AmbassadorDashboard'));
const RoadmapPage = lazy(() => import('~/components/Roadmap/RoadmapPage'));
const CursoWappy01Page = lazy(() => import('~/components/Courses/CursoWappy01Page'));
const Clase1Page = lazy(() => import('~/components/Courses/Clase1Page'));

const PageLoader = () => (
  <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4 p-8 text-center">
    <TenshiAvatar
      size={118}
      mood="working"
      showHaloEffect={true}
      showHUD={true}
      interactive={true}
      statusText="Cargando módulo del Ecosistema..."
    />
    <div className="mt-4 max-w-md">
      <h2 className="bg-gradient-to-r from-teal-600 via-emerald-500 to-amber-500 bg-clip-text text-lg font-black tracking-tight text-transparent">
        WAPPY IA
      </h2>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
        Ecosistema de Inteligencia Artificial para Productividad Empresarial y Gestión SG-SST.
      </p>
    </div>
  </div>
);

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>
    {node}
  </Suspense>
);

const EmbajadoresRedirect = () => {
  window.location.replace('/embajadores.html');
  return null;
};

const MatrizIpvrRedirect = () => {
  window.location.replace('/matrizipvr.html');
  return null;
};

const PortafolioRedirect = () => {
  return withSuspense(
    <AuthContextProvider>
      <LandingPage />
      <ApiErrorWatcher />
    </AuthContextProvider>
  );
};

const MauricioPosadaRedirect = () => {
  window.location.replace('/mauricioposada.html');
  return null;
};

const CursoWappy01Route = () => {
  return withSuspense(
    <AuthContextProvider>
      <TenshiStandaloneHost>
        <CursoWappy01Page />
      </TenshiStandaloneHost>
      <ApiErrorWatcher />
    </AuthContextProvider>
  );
};

const Clase1Route = () => {
  window.location.replace('/clase1.html');
  return null;
};

const Clase2Route = () => {
  window.location.replace('/clase2.html');
  return null;
};

/**
 * Índice de wappy.club.
 * - PWA instalada (standalone): se mantiene el acceso directo a la app (/c/new o /login).
 * - Navegador: SIEMPRE muestra la página de inicio (novedades), incluso con sesión activa.
 *   La propia LandingPage ofrece al usuario autenticado un acceso de 1 clic a WAPPY sin /login.
 *   Se usa el AuthContextProvider de AuthLayout (sin anidar otro) para evitar dobles refresh de token.
 */
const RootIndexRedirect = () => {
  const { isAuthenticated, user } = useAuthContext();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      searchParams.get('source') === 'pwa');

  if (isStandalone) {
    if (isAuthenticated) {
      if (user && !hasActivePlan(user)) {
        return <Navigate to={{ pathname: '/planes', search: location.search }} replace={true} />;
      }
      return <Navigate to={{ pathname: '/c/new', search: location.search }} replace={true} />;
    }
    return <Navigate to={{ pathname: '/login', search: location.search }} replace={true} />;
  }

  return withSuspense(<LandingPage />);
};

const BillingRedirect = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: '/planes', search: location.search }} replace={true} />;
};

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
    <ApiErrorWatcher />
    <RoadmapNotifier />
  </AuthContextProvider>
);

const baseEl = document.querySelector('base');
const baseHref = baseEl?.getAttribute('href') || '/';

export const router = createBrowserRouter(
  [
    {
      path: 'share/:shareId',
      element: <ShareRoute />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'report/:id',
      element: withSuspense(<PublicReportView />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/reportar/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicReporteActos />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/animo/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicMoodTracker />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/estudio-puesto/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicEstudioPuesto />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ipevar/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicParticipacionIPEVAR />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/alta-direccion/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicAltaDireccion />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/atel-testimonio/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicAtelTestimonio />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/perfil-update/:companyId/:workerId?',
      element: withSuspense(<PublicPerfilUpdate />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ruta-aprendizaje/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicRutaAprendizaje />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ruta-aprendizaje/:companyId/course/:courseId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicRutaCourseViewer />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/colaborador/:companyId/:cedula?',
      element: withSuspense(<PublicColaboradorHub />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/comites/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicComites />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/convivencia/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicConvivencia />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/votaciones/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicVotaciones />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/copasst-inspecciones/:companyId/:cedula?',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicInspeccionesCopasst />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/brigadista/:companyId/:cedula?',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicBrigadistas />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/solicitud-epp/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicSolicitudEpp />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/inspeccion-vehicular/:companyId',
      element: withSuspense(
        <VitalPublicPortalGuard>
          <PublicInspeccionVehicular />
        </VitalPublicPortalGuard>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'bateria-psicosocial',
      element: withSuspense(
        <AuthContextProvider>
          <BateriaPsicosocialPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'portal',
      element: withSuspense(
        <AuthContextProvider>
          <WappyPortalPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'ingresar',
      element: withSuspense(
        <AuthContextProvider>
          <WappyPortalPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappy-apps',
      element: withSuspense(
        <AuthContextProvider>
          <WappyPortalPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'apps',
      element: withSuspense(
        <AuthContextProvider>
          <WappyPortalPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'matrizipvr',
      element: withSuspense(
        <AuthContextProvider>
          <MatrizIpvrPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'matrizipvr.html',
      element: <MatrizIpvrRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'matriz-ipvr',
      element: <Navigate to="/matrizipvr" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'matriz-ipvr.html',
      element: <MatrizIpvrRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappystudio',
      element: withSuspense(<WappyStudioPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappystudio.html',
      element: withSuspense(<WappyStudioPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappy-studio',
      element: withSuspense(<WappyStudioPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappy-studio.html',
      element: withSuspense(<WappyStudioPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      // Catch-all for UUIDs at the root (solves the 404 without prefix)
      path: ':id',
      element: withSuspense(<PublicReportView />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'oauth',
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'success',
          element: <OAuthSuccess />,
        },
        {
          path: 'error',
          element: <OAuthError />,
        },
      ],
    },
    {
      path: '/',
      element: <StartupLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'register',
          element: <Registration />,
        },
        {
          path: 'signup',
          element: <Navigate to="/register" replace />,
        },
        {
          path: 'forgot-password',
          element: <RequestPasswordReset />,
        },
        {
          path: 'reset-password',
          element: <ResetPassword />,
        },
      ],
    },
    {
      path: 'privacy',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <PrivacyPolicyPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'privacy-policy',
      element: <Navigate to="/privacy" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'terms',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <TermsOfServicePage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'terminos',
      element: <Navigate to="/terms" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'about',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <WappyAboutPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'comunidad',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <ComunidadPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'comunidadmp',
      element: withSuspense(
        <AuthContextProvider>
          <ComunidadPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'wappyvital',
      element: withSuspense(
        <AuthContextProvider>
          <ComunidadPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'matriz',
      element: withSuspense(
        <AuthContextProvider>
          <MatrizPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'quibi',
      element: withSuspense(
        <AuthContextProvider>
          <QuibiPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'qb',
      element: <Navigate to="/quibi" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'landing',
      element: <Navigate to="/" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'inicio',
      element: <Navigate to="/" replace={true} />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'planes',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <PlansPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'dashboard/billing',
      element: <BillingRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'billing',
      element: <BillingRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'hoja-de-ruta',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <RoadmapPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
          <RoadmapNotifier />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'contactanos',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <ContactPage />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
          <RoadmapNotifier />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'embajadores',
      element: <EmbajadoresRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'portafolio',
      element: <PortafolioRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'mauricioposada',
      element: <MauricioPosadaRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'cursowappy01',
      element: <CursoWappy01Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'cursowappy01.html',
      element: <CursoWappy01Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'clase1',
      element: <Clase1Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'clase1.html',
      element: <Clase1Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'clase2',
      element: <Clase2Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'clase2.html',
      element: <Clase2Route />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'blog/:postId/:slug?',
      element: withSuspense(
        <AuthContextProvider>
          <TenshiStandaloneHost>
            <BlogPostViewer />
          </TenshiStandaloneHost>
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'verify',
      element: <VerifyEmail />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      element: <AuthLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: '/',
          element: <LoginLayout />,
          children: [
            {
              path: 'login',
              element: <Login />,
            },
            {
              path: 'login/2fa',
              element: <TwoFactorScreen />,
            },
          ],
        },
        dashboardRoutes,
        {
          path: '/',
          element: <Root />,
          children: [
            {
              index: true,
              element: <RootIndexRedirect />,
            },
            {
              path: 'c/:conversationId?',
              element: <ChatRoute />,
            },
            {
              path: 'live',
              element: <Navigate to="/c/new" replace />,
            },
            {
              path: 'search',
              element: <Search />,
            },
            {
              path: 'chat-sst',
              element: withSuspense(<ChatSSTView />),
            },
            {
              path: 'events-meet/admin',
              element: withSuspense(<EventsMeetAdminDashboard />),
            },

            {
              path: 'sgsst',
              element: withSuspense(<SGSSTDashboard />),
            },
            {
              path: 'huella-biocentrica',
              element: withSuspense(<HuellaBiocentricaDashboard />),
            },
            {
              path: 'sgsst/animo',
              element: withSuspense(<MoodAnalyticsDashboard />),
            },
            {
              /* Antigua ruta de Automatizaciones: ahora es la sección "Tareas" */
              path: 'sgsst/automatizaciones',
              element: <Navigate to="/tareas" replace={true} />,
            },
            {
              /* Redirect old GTC-45 workspace URLs to the equivalent native chat */
              path: 'sgsst/agente-gtc45/:conversationId',
              element: <Navigate to="/c/new" replace={true} />,
            },
            {
              path: 'sgsst/agente-gtc45',
              element: <Navigate to="/c/new" replace={true} />,
            },
            {
              path: 'sgsst/estudio-puesto',
              element: <Navigate to="/sgsst?hito=hito4&module=estudio_puesto" replace={true} />,
            },
            {
              path: 'sgsst/estudio_puesto',
              element: <Navigate to="/sgsst?hito=hito4&module=estudio_puesto" replace={true} />,
            },

            {
              path: 'studio',
              element: withSuspense(<WappyStudioDashboard />),
            },
            {
              path: 'academia',
              element: withSuspense(<AcademiaDashboard />),
            },
            {
              path: 'marketplace',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'marketplace/admin',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'marketplace/pedido/:orderNumber',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'tienda',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'tienda/admin',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'tienda/pedido/:orderNumber',
              element: withSuspense(<MarketplaceDashboard />),
            },
            {
              path: 'training',
              element: withSuspense(<AcademiaDashboard />),
            },
            {
              path: 'training/admin',
              element: withSuspense(<TrainingAdminDashboard />),
            },
            {
              path: 'training/admin/courses/:id',
              element: withSuspense(<CourseEditor />),
            },
            {
              path: 'training/:courseId/:slug?',
              element: withSuspense(<CourseViewer />),
            },
            {
              path: 'ruta-aprendizaje',
              element: withSuspense(<AcademiaDashboard />),
            },
            {
              path: 'ruta-aprendizaje/admin',
              element: withSuspense(<RutaAprendizajeAdminDashboard />),
            },
            {
              path: 'ruta-aprendizaje/admin/courses/:id',
              element: withSuspense(<RutaAprendizajeCourseEditor />),
            },
            {
              path: 'ruta-aprendizaje/:courseId/:slug?',
              element: withSuspense(<RutaAprendizajeCourseViewer />),
            },
            {
              path: 'blog',
              element: withSuspense(<AcademiaDashboard />),
            },
            {
              path: 'events-meet',
              element: withSuspense(<AcademiaDashboard />),
            },
            {
              path: 'blog/admin',
              element: withSuspense(<BlogAdminDashboard />),
            },
            {
              path: 'tenshi/admin',
              element: withSuspense(<TenshiAdminPanel />),
            },
            {
              path: 'blog/admin/posts/:id',
              element: withSuspense(<BlogPostEditor />),
            },
            {
              path: 'auditoria',
              element: withSuspense(<AuditoriaDashboard />),
            },
            {
              path: 'kanban',
              element: withSuspense(<CentroControlSST />),
            },
            {
              path: 'control',
              element: withSuspense(<CentroControlSST />),
            },
            {
              path: 'sgsst/control',
              element: withSuspense(<CentroControlSST />),
            },
            {
              /* Tareas (antes "Automatizaciones IA" del Centro de Control) */
              path: 'tareas',
              element: withSuspense(<TareasPage />),
            },
            {
              /* WAPPY APPs: catálogo interno de aplicaciones para usuarios autenticados */
              path: 'aplicaciones',
              element: withSuspense(<WappyAppsPage />),
            },
            {
              path: 'embajadores/dashboard',
              element: withSuspense(<AmbassadorDashboard />),
            },
            {
              path: 'embajadores',
              element: withSuspense(<AmbassadorDashboard />),
            },
            {
              path: 'agents',
              element: withSuspense(
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
            {
              path: 'agents/:category',
              element: withSuspense(
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
          ],
        },
      ],
    },
  ],
  { basename: baseHref },
);
