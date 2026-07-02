import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, MailCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { StatusMessage } from '../components/StatusMessage';
import { authApi } from '../services/api';
import { navigate } from '../utils/routing';

interface SignupPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type SignupStep = 'email' | 'otp' | 'details' | 'done';

const steps: { key: SignupStep; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'otp', label: 'OTP' },
  { key: 'details', label: 'Owner' },
];

export function SignupPage({ theme, onToggleTheme }: SignupPageProps) {
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authApi.requestRegistrationOtp(email.trim());
      setMessage('OTP sent to your email address.');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authApi.verifyRegistrationOtp(email.trim(), otp.trim());
      const token = typeof response.data === 'string' ? response.data : '';
      setVerificationToken(token);
      setMessage('Email verified. Complete the owner account.');
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authApi.registerOwner({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        verificationToken,
      });
      setMessage('Owner account created. You can login now.');
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create owner account"
      subtitle="Verify the owner email first, then register the business workspace."
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-6 grid grid-cols-3 gap-2">
        {steps.map((item, index) => {
          const activeIndex = steps.findIndex((candidate) => candidate.key === step);
          const isActive = item.key === step;
          const isComplete = activeIndex > index || step === 'done';

          return (
            <motion.div
              key={item.key}
              className={`rounded-lg border px-3 py-3 text-sm ${
                isActive || isComplete
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                  animate={isComplete ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </motion.span>
                <span className="font-medium">{item.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-5">
        {message && <StatusMessage type="success" message={message} />}
        {error && <StatusMessage type="error" message={error} />}

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.form
              key="email"
              className="space-y-5"
              onSubmit={submitEmail}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <FormField
                id="signup-email"
                label="Owner email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@example.com"
                autoComplete="email"
                required
              />
              <PrimaryButton loading={loading} label="Send OTP" />
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form
              key="otp"
              className="space-y-5"
              onSubmit={submitOtp}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <StatusMessage type="info" message={`Enter the OTP sent to ${email}.`} />
              <FormField
                id="signup-otp"
                label="OTP code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="876237"
                inputMode="numeric"
                required
              />
              <PrimaryButton loading={loading} label="Verify OTP" icon="mail" />
            </motion.form>
          )}

          {step === 'details' && (
            <motion.form
              key="details"
              className="space-y-5"
              onSubmit={submitDetails}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="signup-name"
                  label="Full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Pathum Rathnayaka"
                  autoComplete="name"
                  required
                />
                <FormField
                  id="signup-phone"
                  label="Phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+94771234567"
                  autoComplete="tel"
                  required
                />
              </div>
              <FormField
                id="signup-business"
                label="Business name"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Pathum Supermarket"
                required
              />
              <FormField
                id="signup-password"
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a secure password"
                autoComplete="new-password"
                required
              />
              <PrimaryButton loading={loading} label="Create account" />
            </motion.form>
          )}

          {step === 'done' && (
            <motion.button
              key="done"
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              Go to login
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      </div>
    </AuthShell>
  );
}

function PrimaryButton({
  loading,
  label,
  icon,
}: {
  loading: boolean;
  label: string;
  icon?: 'mail';
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : icon === 'mail' ? (
        <MailCheck className="h-5 w-5" />
      ) : (
        <ArrowRight className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}
