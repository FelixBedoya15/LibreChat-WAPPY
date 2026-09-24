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
import { AuthContextProvider } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import RoadmapNotifier from '~/components/Roadmap/RoadmapNotifier';

// Lazy-loaded secondary dashboards and public pages for fast initial bundle load
const SGSSTDashboard = lazy(() => import('~/components/SGSST/Dashboard'));
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
const MoodAnalyticsDashboard = lazy(() => import('~/components/SGSST/MoodAnalyticsDashboard'));
const PrivacyPolicyPage = lazy(() => import('~/components/Auth/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('~/components/Auth/TermsOfServicePage'));
const WappyAboutPage = lazy(() => import('~/components/Auth/WappyAboutPage'));
const ComunidadPage = lazy(() => import('~/components/Marketing/ComunidadPage'));
const MatrizPage = lazy(() => import('~/components/Marketing/MatrizPage'));
const LandingPage = lazy(() => import('~/components/Marketing/LandingPage'));
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
const AcademiaDashboard = lazy(() => import('~/components/Academia/AcademiaDashboard'));
const PlansPage = lazy(() => import('~/components/Plans/PlansPage'));
const ContactPage = lazy(() => import('~/components/Plans/ContactPage'));
const AmbassadorDashboard = lazy(() => import('~/components/Ambassadors/AmbassadorDashboard'));
const RoadmapPage = lazy(() => import('~/components/Roadmap/RoadmapPage'));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center p-8 min-h-[50vh]">
    <Spinner className="h-8 w-8 text-teal-600 dark:text-teal-400" />
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

const PortafolioRedirect = () => {
  window.location.replace('/portafolio.html');
  return null;
};

const MauricioPosadaRedirect = () => {
  window.location.replace('/mauricioposada.html');
  return null;
};

const RootIndexRedirect = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: '/c/new', search: location.search }} replace={true} />;
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
      element: withSuspense(<PublicReporteActos />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/animo/:companyId',
      element: withSuspense(<PublicMoodTracker />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/estudio-puesto/:companyId',
      element: withSuspense(<PublicEstudioPuesto />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ipevar/:companyId',
      element: withSuspense(<PublicParticipacionIPEVAR />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/alta-direccion/:companyId',
      element: withSuspense(<PublicAltaDireccion />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/atel-testimonio/:companyId',
      element: withSuspense(<PublicAtelTestimonio />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/perfil-update/:companyId/:workerId?',
      element: withSuspense(<PublicPerfilUpdate />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ruta-aprendizaje/:companyId',
      element: withSuspense(<PublicRutaAprendizaje />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/ruta-aprendizaje/:companyId/course/:courseId',
      element: withSuspense(<PublicRutaCourseViewer />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/colaborador/:companyId/:cedula?',
      element: withSuspense(<PublicColaboradorHub />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/comites/:companyId',
      element: withSuspense(<PublicComites />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'sgsst-public/convivencia/:companyId',
      element: withSuspense(<PublicConvivencia />),
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
      element: withSuspense(<PrivacyPolicyPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'terms',
      element: withSuspense(<TermsOfServicePage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'about',
      element: withSuspense(<WappyAboutPage />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'comunidad',
      element: withSuspense(
        <AuthContextProvider>
          <ComunidadPage />
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
      path: 'landing',
      element: withSuspense(
        <AuthContextProvider>
          <LandingPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'inicio',
      element: withSuspense(
        <AuthContextProvider>
          <LandingPage />
          <ApiErrorWatcher />
        </AuthContextProvider>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'planes',
      element: withSuspense(
        <AuthContextProvider>
          <PlansPage />
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
          <RoadmapPage />
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
          <ContactPage />
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
      path: 'blog/:postId/:slug?',
      element: withSuspense(
        <AuthContextProvider>
          <BlogPostViewer />
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
              path: 'sgsst/animo',
              element: withSuspense(<MoodAnalyticsDashboard />),
            },
            {
              path: 'sgsst/automatizaciones',
              element: withSuspense(<CentroControlSST />),
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
              path: 'academia',
              element: withSuspense(<AcademiaDashboard />),
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
