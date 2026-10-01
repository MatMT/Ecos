import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no web implementation (there is no OS keychain in a browser) — its web
// build is an empty stub that throws if called. `localStorage` is the pragmatic fallback for the
// web target, with the same known XSS trade-off docs/AUTH_INTEGRATION.md calls out for browser
// apps. Native (Expo Go / a real build) always goes through SecureStore.
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
