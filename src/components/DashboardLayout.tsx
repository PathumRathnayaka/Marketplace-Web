import {
  BarChart3,
  Boxes,
  CreditCard,
  LogOut,
  Package,
  RotateCcw,
  ScanBarcode,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { Route } from '../utils/routing';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  user: AuthUser;
  route: Route;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
  onNavigate: (route: Route) => void;
  children: React.ReactNode;
}

const navItems = [
  { label: 'Dashboard', route: '/dashboard' as const, icon: BarChart3 },
  { label: 'POS', route: '/pos' as const, icon: ScanBarcode },
  { label: 'Products', route: '/products' as const, icon: Package },
  { label: 'Sales', route: '/sales' as const, icon: ShoppingBag },
  { label: 'Returns', route: '/returns' as const, icon: RotateCcw },
  {
    label: 'GRN',
    icon: Truck,
    subItems: [
      { label: 'GRNs List', route: '/grns' as const },
      { label: 'Create GRN', route: '/grns/create' as const },
      { label: 'Order GRN', route: '/grns/order' as const },
      { label: 'Delivery Status', route: '/grns/delivery' as const },
    ]
  },
  { label: 'Wallets', route: '/wallets' as const, icon: CreditCard },
  { label: 'Inventory', route: '/inventory' as const, icon: Boxes },
  { label: 'Customers', route: '/customers' as const, icon: Users },
  { label: 'Suppliers', route: '/suppliers' as const, icon: UserRoundCheck },
  { label: 'Buy from Suppliers', route: '/supplier-market' as const, icon: ShoppingCart },
  { label: 'Shop Profile', route: '/shop-profile' as const, icon: Store },
  { label: 'Settings', route: '/settings' as const, icon: Settings },
];

export function DashboardLayout({
  user,
  route,
  theme,
  onToggleTheme,
  onLogout,
  onNavigate,
  children,
}: DashboardLayoutProps) {
  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 dark:hidden"
      />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-emerald-100 bg-white/80 px-5 py-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Qal POS</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Owner console</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.subItems) {
                const isActiveGroup = item.subItems.some(sub => sub.route === route);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className={`flex h-11 w-full items-center gap-3 px-3 text-left text-sm font-medium ${isActiveGroup ? 'text-emerald-700 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    <div className="ml-9 space-y-1">
                      {item.subItems.map(subItem => {
                        const active = subItem.route === route;
                        return (
                          <button
                            key={subItem.label}
                            type="button"
                            onClick={() => onNavigate(subItem.route)}
                            className={`flex h-10 w-full items-center rounded-lg px-3 text-left text-sm transition-colors duration-150 ${active
                              ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950 dark:text-emerald-200'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800'
                              }`}
                          >
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const active = item.route === route;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.route!)}
                  className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors duration-150 ${active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back</p>
                <h1 className="truncate text-xl font-semibold">{user.fullName}</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-300 hover:text-red-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;

                if (item.subItems) {
                  return item.subItems.map(subItem => {
                    const active = subItem.route === route;
                    return (
                      <button
                        key={subItem.label}
                        type="button"
                        onClick={() => onNavigate(subItem.route)}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        {subItem.label}
                      </button>
                    )
                  })
                }

                const active = item.route === route;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.route!)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium ${active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}