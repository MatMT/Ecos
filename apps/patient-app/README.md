# patient-app

The ECOS mobile app for patients (students), built with Expo Router + React Native + TypeScript.
Developed and tested against Expo Go.

See [AGENTS.md](./AGENTS.md) for the project's structure, navigation, and coding conventions.

## Prerequisites

- Node.js and `pnpm` (this app is part of the `Ecos` pnpm workspace — run `pnpm install` at the
  repo root first)
- The `server` app running locally (default `http://localhost:6622`) — see
  [`apps/server/README.md`](../server/README.md)
- Expo Go installed on a physical device, or an Android/iOS simulator

## Running the app

```bash
pnpm --filter patient-app start
```

This opens the Expo dev tools; scan the QR code with Expo Go, or press `a`/`i` for an emulator/
simulator, or `w` for the web target (`pnpm --filter patient-app web`).

## Configuration

The app talks to the `server` API — never hardcode its origin. Copy `.env.example` to `.env` and
set `EXPO_PUBLIC_API_URL` there (the `EXPO_PUBLIC_` prefix is required for Expo to expose it to
client code):

```bash
cp .env.example .env
```

Without a `.env`, the app falls back to `http://localhost:6622`, which only works for the web
target or a simulator running on this same machine.

> [!IMPORTANT]
> **Testing on Expo Go on a physical device?** `localhost` there resolves to the *phone*, not your
> computer — you MUST set `EXPO_PUBLIC_API_URL` to your machine's **LAN IP** instead (find it with
> `ipconfig` on Windows / `ifconfig` or `ipconfig getifaddr en0` on macOS), and make sure the phone
> is on the same Wi-Fi network as the machine running `server`. This IP can and will change
> — different Wi-Fi network, a new DHCP lease after a reboot, switching machines — and each time it
> does, login will fail with `"No fue posible conectar con el servidor"` until `.env` is updated to
> match. This is a per-machine value: `.env` is gitignored on purpose, don't try to "fix this
> permanently" by committing a real IP into `.env.example` or the code.

## Auth

Login, session, and token handling follow
[`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md) — the contract shared with
`therapist-web`/`admin-web` for talking to the server's `/auth/*` endpoints. Tokens are persisted
with `expo-secure-store`, never `AsyncStorage`.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router documentation](https://docs.expo.dev/router/introduction)
