import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/layout/Scroll';
import Index from './pages/Index';

const publicRoutes = [{ path: '/', element: <Index /> }];

const authOnlyRoutes = [];

const protectedRoutes = [];

const adminRoutes: {
  path: string;
  element: React.ReactNode;
  roles: ('admin' | 'author' | 'reader')[];
}[] = [];

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
