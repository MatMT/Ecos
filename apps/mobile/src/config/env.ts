// Never hardcode the API origin at call sites — read it from here, which reads from env.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:6622';
