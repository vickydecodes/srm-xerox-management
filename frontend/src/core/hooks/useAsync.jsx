import { useState, useCallback } from 'react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

export function useAsync(actionFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setError(null);
      setLoading(true);

      try {
        const res = await actionFn(...args);
        return res;
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || DEFAULT_ERROR;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [actionFn]
  );

 const ErrorAlert = error ? (
  <Alert
    variant="destructive"
    className="flex items-center gap-2 bg-destructive/10 border border-destructive/30"
  >
    <AlertCircleIcon className="h-4 w-4 shrink-0" />
    <AlertTitle className="m-0 line-clamp-none text-sm font-medium leading-snug">
      {error}
    </AlertTitle>
  </Alert>
) : null;

  return {
    run,
    loading,
    error,
    hasError: !!error,
    ErrorAlert,
    clearError: () => setError(null),
  };
}
