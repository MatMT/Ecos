import { AsyncLocalStorage } from 'node:async_hooks';

export type PostgresRole = 'anon' | 'authenticated' | 'service_role';

export interface RlsContext {
  userId: string | null;
  role: PostgresRole;
}

export const rlsContextStorage = new AsyncLocalStorage<RlsContext>();

export const ANONYMOUS_CONTEXT: RlsContext = { userId: null, role: 'anon' };
