import SGSSTDashboard from '~/components/SGSST/Dashboard';
import PrivacyPolicyPage from '~/components/Auth/PrivacyPolicyPage';
import TermsOfServicePage from '~/components/Auth/TermsOfServicePage';
import WappyAboutPage from '~/components/Auth/WappyAboutPage';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
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
import AgentMarketplace from '~/components/Agents/Marketplace';
import { OAuthSuccess, OAuthError } from '~/components/OAuth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import LivePage from '~/components/Liva/LivePage';
import TrainingDashboard from '~/components/Training/TrainingDashboard';
import CourseViewer from '~/components/Training/CourseViewer';
import TrainingAdminDashboard from '~/components/Training/TrainingAdminDashboard';
import CourseEditor from '~/components/Training/CourseEditor';
import BlogDashboard from '~/components/Blog/BlogDashboard';
import BlogAdminDashboard from '~/components/Blog/BlogAdminDashboard';
import BlogPostEditor from '~/components/Blog/BlogPostEditor';
import BlogPostViewer from '~/components/Blog/BlogPostViewer';
import PlansPage from '~/components/Plans/PlansPage';
import Search from './Search';
import Root from './Root';

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
    <ApiErrorWatcher />
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
      element: <PrivacyPolicyPage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'terms',
      element: <TermsOfServicePage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'about',
      element: <WappyAboutPage />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'planes',
      element: <PlansPage />,
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
              element: <Navigate to="/c/new" replace={true} />,
            },
            {
              path: 'c/:conversationId?',
              element: <ChatRoute />,
            },
            {
              path: 'live',
              element: <LivePage />,
            },
            {
              path: 'search',
              element: <Search />,
            },
            {
              path: 'sgsst',
              element: <SGSSTDashboard />,
            },
            {
              path: 'training',
              element: <TrainingDashboard />,
            },
            {
              path: 'training/admin',
              element: <TrainingAdminDashboard />,
            },
            {
              path: 'training/admin/courses/:id',
              element: <CourseEditor />,
            },
            {
              path: 'training/:courseId',
              element: <CourseViewer />,
            },
            {
              path: 'blog',
              element: <BlogDashboard />,
            },
            {
              path: 'blog/admin',
              element: <BlogAdminDashboard />,
            },
            {
              path: 'blog/admin/posts/:id',
              element: <BlogPostEditor />,
            },
            {
              path: 'blog/:postId',
              element: <BlogPostViewer />,
            },
            {
              path: 'agents',
              element: (
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
            {
              path: 'agents/:category',
              element: (
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
