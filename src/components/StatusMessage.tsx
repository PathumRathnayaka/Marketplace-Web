interface StatusMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

const styles = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  info:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
};

export function StatusMessage({ type, message }: StatusMessageProps) {
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>{message}</div>;
}
