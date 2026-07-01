import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalesPage } from './pages/SalesPage';
import { GrnsPage } from './pages/GrnsPage';
import { CreateGrnPage } from './pages/CreateGrnPage';
import { GrnDetailPage } from './pages/GrnDetailPage';
import { WalletsPage } from './pages/WalletsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { DashboardLayout } from './components/DashboardLayout';
import { clearStoredAuth, getStoredAuth } from './services/api';
import { LoginData } from './types/auth';
import { readRoute, Route, navigate } from './utils/routing';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [route, setRoute] = useState<Route>(readRoute);
  const [auth, setAuth] = useState<LoginData | null>(getStoredAuth);

  useEffect(() => {
    function handleRouteChange() {
      setRoute(readRoute());
    }

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    if (!auth && route !== '/login' && route !== '/signup') {
      navigate('/login');
    }

    if (auth && (route === '/login' || route === '/signup')) {
      navigate('/dashboard');
    }
  }, [auth, route]);

  if (route === '/signup') {
    return <SignupPage theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (auth && route === '/pos') {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <POSPage />
      </main>
    );
  }

  if (auth && route !== '/login') {
    return (
      <DashboardLayout
        user={auth.user}
        route={route}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={navigate}
        onLogout={() => {
          clearStoredAuth();
          setAuth(null);
          navigate('/login');
        }}
      >
        {renderProtectedPage(route, auth)}
      </DashboardLayout>
    );
  }

  return <LoginPage theme={theme} onToggleTheme={toggleTheme} onLogin={setAuth} />;
}

function renderProtectedPage(route: Route, auth: LoginData) {
  switch (route) {
    case '/products':
      return <ProductsPage />;
    case '/sales':
      return <SalesPage />;
    case '/grns':
      return <GrnsPage />;
    case '/grns/create':
      return <CreateGrnPage />;
    case '/grns/detail':
      return <GrnDetailPage />;
    case '/wallets':
      return <WalletsPage />;
    case '/inventory':
      return <InventoryPage />;
    case '/customers':
      return <CustomersPage />;
    case '/suppliers':
      return <SuppliersPage />;
    case '/dashboard':
    default:
      return <DashboardPage auth={auth} />;
  }
}

export default App;
