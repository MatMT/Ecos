import { useCallback, useEffect, useState } from 'react';

import { checkServerHealth, type ServerHealthStatus } from '@/services/api/health-check';

export function useServerHealth(autoCheck = true) {
  const [status, setStatus] = useState<ServerHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkServerHealth();
      setStatus(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    let isCancelled = false;

    void checkServerHealth().then((result) => {
      if (!isCancelled) {
        setStatus(result);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [autoCheck]);

  return { status, isChecking, check };
}
