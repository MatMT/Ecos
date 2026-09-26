import { API_URL } from '@/config/env';

export interface ServerHealthStatus {
  isHealthy: boolean;
  checkedAt: number;
  url: string;
  errorMessage?: string;
}

const HEALTH_CHECK_TIMEOUT_MS = 3_500;

export async function checkServerHealth(
  timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS,
): Promise<ServerHealthStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}/`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (res.ok) {
      return {
        isHealthy: true,
        checkedAt: Date.now(),
        url: API_URL,
      };
    }

    return {
      isHealthy: false,
      checkedAt: Date.now(),
      url: API_URL,
      errorMessage: `El servidor respondió con código de estado ${res.status}.`,
    };
  } catch (err: unknown) {
    const detail =
      err instanceof Error && err.name === 'AbortError'
        ? 'Tiempo de espera agotado al conectar con el servidor.'
        : 'No fue posible establecer comunicación con el servidor.';

    return {
      isHealthy: false,
      checkedAt: Date.now(),
      url: API_URL,
      errorMessage: detail,
    };
  } finally {
    clearTimeout(timer);
  }
}
