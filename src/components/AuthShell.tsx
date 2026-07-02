import { ReactNode } from 'react';
import { motion } from 'framer-motion';
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
      <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.05fr]">
        <section className="hidden bg-emerald-700 px-10 py-12 text-white lg:flex lg:flex-col dark:bg-emerald-900">
  {/* Top */}
  <motion.div
    className="flex items-center gap-3"
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
      <ShoppingCart className="h-6 w-6" />
    </div>
    <div>
      <p className="text-lg font-semibold">Qal POS</p>
      <p className="text-sm text-emerald-50/80">
        Online point of sale system for your business.
      </p>
    </div>
  </motion.div>

  {/* Center */}
  <div className="flex flex-1 flex-col items-center justify-center text-center">
    <motion.p
      className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-emerald-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      Market chain Workspace
    </motion.p>

    <motion.img
      src="/images/logo.png"
      alt="Qal POS"
      className="mb-8 h-32 w-auto object-contain"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
    />

    <motion.p
      className="max-w-xl text-lg leading-8 text-emerald-50/85"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      Manage your business from the palm of your hand.
    </motion.p>
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
            <motion.div
              className="w-full max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="mb-7">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {subtitle}
                </p>
              </div>
              {children}
            </motion.div>
          </div>
          {/* Bottom */}
  <motion.div
    className="flex flex-col items-center justify-center gap-1"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <h6 className="text-xs text-gray-500 dark:text-gray-400">Power by</h6>
    <img
      src="/images/brandLogo.png"
      alt="Qaldrin"
      className="h-10 w-auto object-contain"
    />
  </motion.div>
        </section>
      </div>
    </main>
  );
}
