# patient-app — Expo / React Native Guidelines

This file defines how the `patient-app` app (Expo Router + React Native + TypeScript, tested via
Expo Go) must be structured and written. It extends, and does not replace, the root
[AGENTS.md](../../AGENTS.md) directives — English identifiers, strict typing, no `any`, Spanish
end-user text, DRY, no dead code, etc. all still apply here.

## 0. Expo version

Expo HAS CHANGED. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code — do not rely on memorized APIs from older Expo/React Native versions.

## 1. Known gaps — not yet solved

- **No automated tests exist** (see section 7) — this is the main outstanding gap from the last
  structural pass.
- `expo-secure-store` has no web implementation (it's an empty stub on `web` — there's no OS
  keychain in a browser). `src/services/api/secure-session-storage.ts` falls back to
  `localStorage` on `Platform.OS === 'web'` only; native (Expo Go / a real build) always uses
  SecureStore. This is the same known XSS trade-off `docs/AUTH_INTEGRATION.md` calls out for
  browser apps — acceptable for now since web is a secondary preview target for this app, not
  where it primarily ships, but don't treat it as solved.
- `Home` (`src/app/(protected)/(tabs)/home.tsx`)'s oxygen and temperature metrics are still
  hardcoded (`95%`, `37.2°C`) — there is no sensor/data source for them yet, unlike heart rate and
  stress which are wired to `useBiometricMonitor`. Marked with a `TODO` in place; wire them up
  the same way once a real data source exists, don't silently make them look live before that.
- The "Iniciar Respiración" button and the panic button on `Home` are inert UI (no screen/flow
  wired up yet).
- `stats.tsx` and `chat.tsx` are intentionally minimal placeholders (`ScreenPlaceholder`) — no
  design or backend contract exists yet for either. Build them out against a real API contract
  when one exists; don't invent one client-side.

Do not treat any of the above as something to silently build around — if a task touches one of
these areas, close the gap for real rather than adding another layer on top of the placeholder.

## 2. Project structure

`src/` is the only source root — nothing app-specific lives outside it (a past inconsistency had a
component living at the repo-level `components/`, forcing a `../../../../` relative import instead
of the `@/` alias; don't reintroduce that).

```text
src/
├── app/                      # expo-router file-based routes ONLY — no business logic here
│   ├── _layout.tsx           # wraps everything in AuthProvider
│   ├── index.tsx             # splash screen; redirects based on session state
│   ├── (auth)/
│   │   ├── _layout.tsx       # redirects to (protected) if already authenticated
│   │   └── login.tsx
│   └── (protected)/
│       ├── _layout.tsx       # redirects to /login if NOT authenticated — the actual route guard
│       └── (tabs)/
│           ├── _layout.tsx
│           ├── home.tsx
│           ├── stats.tsx
│           ├── chat.tsx
│           └── profile.tsx
├── components/                # shared, reusable, presentation-only components
│   └── ui/                    # generic primitives (Button, TextField, MetricCard, ScreenPlaceholder...)
├── config/                    # env.ts — read config from here, never inline `process.env` at call sites
├── constants/                  # theme.ts — Colors/Spacing/Radius design tokens (see section 5)
├── hooks/                      # cross-cutting hooks (useAuth, useBiometricMonitor, ...)
├── services/
│   ├── api/                    # auth-client.ts and any future HTTP client for `apps/server`
│   └── ai/                     # on-device inference (ExecuTorch)
```

Rules:

- Never leave an unreferenced file in `src/` "for later" — either wire it up in the same change or
  delete it. Version control is the place for code you're not currently using, not the working
  tree. (The app previously carried a full unused starter-template layer — theming components,
  animated splash, an alternate tab bar — that nothing imported; it was removed. Don't rebuild that
  situation by scaffolding a component/hook before it has a caller.)
- Feature-specific hooks/components can be co-located under a `src/features/<feature>/` folder once
  a feature grows past a couple of files. Until then, the flat `src/components` + `src/hooks` split
  above is the convention — don't introduce a third pattern.

## 3. Navigation (Expo Router)

- Every route file registered in a `Tabs`/`Stack` navigator **must** have a working default export
  before it is wired in — never register a placeholder route with no export.
- **Auth gating lives in layout files, not in individual screens.** `(auth)/_layout.tsx` and
  `(protected)/_layout.tsx` each read `useAuth()` and render a `<Redirect>` when the session state
  doesn't match where the user is trying to go (see `src/hooks/use-auth.tsx`). A screen component
  must never decide "am I allowed to be here" itself via an ad hoc `router.replace` in an event
  handler — `login.tsx`, for example, only calls `login()` and lets `(auth)/_layout.tsx`'s guard
  redirect once `isAuthenticated` flips true.
- `app/index.tsx` (the splash screen) waits for `useAuth()`'s `isLoading` to resolve, then routes to
  `(protected)/(tabs)/home` or `/login` depending on `isAuthenticated` — never route unconditionally
  to `/login` and skip checking for a persisted session.
- Route file names are lowercase kebab-case, consistent with every other file in `src/` (`home.tsx`,
  `stats.tsx`, `chat.tsx`, `profile.tsx`, `_layout.tsx`) — not `PascalCase`.
- Only one tab-bar implementation may exist (currently the `Tabs`/`Tabs.Screen` setup in
  `(tabs)/_layout.tsx`). Don't add a second, parallel tab-bar component.
- If a design introduces a focused/unfocused icon state, apply it identically across every
  `Tabs.Screen`'s `tabBarIcon`, not just one.

## 4. Screens vs. business logic (Separation of Concerns)

Per root AGENTS.md: never mix business logic with presentation. Concretely for this app:

- A file under `src/app/**` (a route/screen) may only: read data from hooks/context, render JSX, and
  wire up event handlers that call functions from a hook/service. It must not itself: define
  data-fetching logic, own non-trivial derived-value computations, or reach into a service/AI module
  directly.
- Extract any computed/derived value out of a screen into a hook, even a small one, rather than
  defining a helper function inside a screen component's body (it gets recreated every render) —
  see `useTodayLabel()` for the pattern.
- Sensor/inference data must be consumed through a hook the screen calls
  (`useBiometricMonitor()`, which wraps `useBiometricSimulator` + `ExecuTorchService`'s `aiEngine`)
  — never re-implemented or hardcoded inline in the screen that displays it. If a value truly has no
  backing data source yet, mark it with a `// TODO(...)` comment explaining what's missing (see
  section 1) — never let it silently look like it comes from a live path.
- Form screens (`login.tsx` and any future form) use controlled inputs (`useState` +
  `onChangeText`/`value`) and delegate the actual submit action to a hook (`useAuth().login(...)`),
  never perform navigation directly from a raw `onPress` with no validation or error handling.
- API/network calls to `apps/server` live in `src/services/api` (see `auth-client.ts`, which
  implements the shared `apiFetch`/refresh pattern from
  [`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md)) — never inline a `fetch()` call in a
  component or hook body.

## 5. Components & visual reuse

- **One design system**: `src/constants/theme.ts` exports `Colors`, `Spacing`, and `Radius` — the
  single source of truth for the app's actual brand palette (`Colors.brand`, status colors, etc.).
  Screens reference these tokens in their `StyleSheet.create`, never fresh hardcoded hex values.
  (An earlier, unrelated light/dark theming layer inherited from the Expo starter template was
  removed — it modeled a generic light/dark toggle this app's actual design doesn't use, and nothing
  referenced it. Don't reintroduce a second, competing design system; extend `theme.ts` instead.)
- Reusable primitives live in `src/components/ui`: `Button`, `TextField`, `MetricCard`,
  `ScreenPlaceholder`. Extract a new one here as soon as the same visual shape repeats with only
  data/color changes (`MetricCard` exists because `Home`'s four metric cards were four near-identical
  copy-pasted blocks) — don't let a third copy of a shape appear inline in a screen.
- No placeholder/mock user data hardcoded into a shared component. `CustomTopBar` takes `name` as a
  prop (sourced from the session in `Home`) instead of hardcoding a name — keep that pattern for any
  component that used to assume a single fake user.
- Every asset under `assets/` must be referenced by at least one non-dead file. Delete an asset in
  the same change that removes its last usage.

## 6. TypeScript & tooling

- `declarations.d.ts` must type-check cleanly — module specifiers are string literals, and an
  imported type must be referenced under the exact name it was imported as. It also declares
  `NodeJS.ProcessEnv.EXPO_PUBLIC_API_URL` — extend this block, don't add untyped `process.env`
  reads, whenever a new `EXPO_PUBLIC_*` var is introduced.
- `eslint.config.mjs` (flat config, based on `eslint-config-expo/flat`) is the lint config — run
  `pnpm lint` (`expo lint`) before committing.
- `README.md` documents how to actually run this app against the local `server`/Supabase stack —
  keep it current when setup steps change, the same expectation as every other app's README in this
  monorepo.

## 7. Testing

There is currently no test setup in this app (no Jest config, no test files) — this is the main
open gap (see section 1). At minimum, once a hook or service accumulates more logic
(`useBiometricMonitor`, `auth-client.ts`, `use-auth.tsx`), it should get a unit test using Expo's
Jest preset (`jest-expo`). Don't let business logic grow further in `src/hooks`/`src/services` with
zero coverage.

## 8. Definition of done for a new screen/feature

- [ ] Route file is lowercase kebab-case and has a real default export before being wired into a
      navigator
- [ ] No business logic in the screen file itself — data/derived values come from a hook, network
      calls go through `src/services`
- [ ] Any repeated visual block (3+ near-identical JSX blocks) extracted into a component under
      `src/components`
- [ ] Uses the project's one design system (`src/constants/theme.ts` tokens), not hardcoded hex
      values
- [ ] No unused imports, no dead files left behind, no placeholder data left hardcoded without a
      tracked follow-up (`// TODO(...)`, and listed in section 1 if it's a standing gap)
- [ ] End-user text is formal, impersonal Spanish per root AGENTS.md; identifiers stay in English
- [ ] If it touches auth/session, follows [`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md)
      and stores tokens via `secure-session-storage.ts` (SecureStore on native), not `AsyncStorage`
- [ ] `pnpm lint` clean
