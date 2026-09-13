# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Auth Integration

Any login/session/token work in this app MUST follow
[`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md) at the repo root — it's the
authoritative contract for talking to the `server` app's auth endpoints. Store tokens
with `expo-secure-store`, not plain `AsyncStorage`.
