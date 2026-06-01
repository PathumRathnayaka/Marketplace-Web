import { ReactNode } from 'react';
import { BadgeCheck, Building2, ShoppingCart } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function AuthShell({ children, title, subtitle, theme, onToggleTheme }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_1.05fr]">
        <section className="hidden bg-emerald-700 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between dark:bg-emerald-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Qal POS</p>
              <p className="text-sm text-emerald-50/80">Multi-tenant retail control</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-emerald-100">
              Owner workspace
            </p>
            <h1 className="text-5xl font-bold leading-tight">
              Run each business account in its own secure tenant.
            </h1>
            <p className="mt-6 text-lg leading-8 text-emerald-50/85">
              Register owners with verified email access, keep authentication tokens local to the
              browser, and open the dashboard ready for POS modules.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
              <BadgeCheck className="mb-3 h-5 w-5" />
              <p className="font-semibold">OTP first</p>
              <p className="mt-1 text-sm text-emerald-50/75">Email verification before signup.</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
              <Building2 className="mb-3 h-5 w-5" />
              <p className="font-semibold">Tenant aware</p>
              <p className="mt-1 text-sm text-emerald-50/75">Dashboard reads tenant user data.</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <p className="font-semibold">Qal POS</p>
            </div>
            <div className="ml-auto">
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl">
              <div className="mb-7">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {subtitle}
                </p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
