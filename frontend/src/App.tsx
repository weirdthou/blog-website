import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/layout/Scroll';
import AboutUsPage from './pages/AboutUsPage';
import AuthorProfilePage from './pages/AuthorProfilePage';
import AuthorsPage from './pages/AuthorsPage';
import BlogsPage from './pages/BlogsPage';
import CategoryPage from './pages/CategoryPage';
import ContactUsPage from './pages/ContactUsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import MyProfilePage from './pages/MyProfilePage';
import NotFound from './pages/NotFound';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SingleBlogPage from './pages/SingleBlogPage';
import TermsPage from './pages/TermsPage';
import WriteBlogPageEnhanced from './pages/WriteBlogPageEnhanced';
import BlogPostsPage from './pages/admin/BlogPostsPage';
import ContactMessagesPage from './pages/admin/ContactMessagesPage';
import DashboardPage from './pages/admin/DashboardPage';
import SubscribersPage from './pages/admin/SubscribersPage';
import TaxonomyPage from './pages/admin/TaxonomyPage';
import UsersPage from './pages/admin/UsersPage';

const publicRoutes = [
  { path: '/', element: <Index /> },
  { path: '/blogs', element: <BlogsPage /> },
  { path: '/blog/:slug', element: <SingleBlogPage /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/author/:id', element: <AuthorProfilePage /> },
  { path: '/authors', element: <AuthorsPage /> },
  { path: '/about', element: <AboutUsPage /> },
  { path: '/contact', element: <ContactUsPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '*', element: <NotFound /> },
];

const authOnlyRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/admin/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
];

const protectedRoutes = [
  { path: '/write', element: <WriteBlogPageEnhanced /> },
  { path: '/profile', element: <MyProfilePage /> },
];

const adminRoutes: {
  path: string;
  element: React.ReactNode;
  roles: ('admin' | 'author' | 'reader')[];
}[] = [
  { path: '/admin', element: <DashboardPage />, roles: ['admin'] },
  { path: '/admin/dashboard', element: <DashboardPage />, roles: ['admin'] },
  { path: '/admin/users', element: <UsersPage />, roles: ['admin'] },
  { path: '/admin/posts', element: <BlogPostsPage />, roles: ['admin'] },
  { path: '/admin/taxonomy', element: <TaxonomyPage />, roles: ['admin'] },
  {
    path: '/admin/messages',
    element: <ContactMessagesPage />,
    roles: ['admin'],
  },
  {
    path: '/admin/subscribers',
    element: <SubscribersPage />,
    roles: ['admin'],
  },
];

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Toaster />
          <Routes>
            {publicRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
            {authOnlyRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<PublicOnlyRoute>{route.element}</PublicOnlyRoute>}
              />
            ))}
            {protectedRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute>{route.element}</ProtectedRoute>}
              />
            ))}
            {adminRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute roles={route.roles}>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
