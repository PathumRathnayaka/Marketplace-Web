import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { authApi, storeAuth } from '../services/api';
import { LoginData } from '../types/auth';
import { navigate } from '../utils/routing';

interface LoginPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogin: (data: LoginData) => void;
}

export function LoginPage({ theme, onToggleTheme, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email.trim(), password);
      storeAuth(response.data);
      onLogin(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Login to your POS"
      subtitle="Use the owner account created after email OTP verification."
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleSubmit}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {error && <StatusMessage type="error" message={error} />}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        >
          <FormField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@example.com"
            autoComplete="email"
            required
          />
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        >
          <FormField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          Login
        </motion.button>
      </motion.form>

      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        New owner account?{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Create account
        </button>
      </div>
    </AuthShell>
  );
}
