# patient-app — Expo / React Native Guidelines

This file defines how the `patient-app` app (Expo Router + React Native + TypeScript, tested via
Expo Go) must be structured and written. It extends, and does not replace, the root
[AGENTS.md](../../AGENTS.md) directives — English identifiers, strict typing, no `any`, Spanish
end-user text, DRY, no dead code, etc. all still apply here.

## 0. Expo version

Expo HAS CHANGED. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code — do not rely on memorized APIs from older Expo/React Native versions.

## 1. Current state (read before touching navigation or screens)

This codebase is mid-migration from the `create-expo-app` starter template to the real product and
currently mixes both. Concretely, as of this writing:

- `src/app/(protected)/(tabs)/Stats.tsx`, `Chat.tsx`, and `Profile.tsx` are **empty files** wired
  into the tab navigator — opening those tabs renders nothing / breaks. Any work touching navigation
  must not ship a route with no default export.
- The whole starter-template layer is dead code, never imported by a real screen: `app-tabs.tsx` /
  `app-tabs.web.tsx`, `ThemedText` / `ThemedView` / `use-theme` / `use-color-scheme` /
  `constants/theme.ts` (`Colors`/`Fonts`/`Spacing`), `HintRow`, `Collapsible`, `ExternalLink`,
  `WebBadge`, `AnimatedIcon` / `AnimatedSplashOverlay`, and their backing assets (`expo-logo.png`,
  `react-logo*.png`, `expo-badge*.png`, `logo-glow.png`, `tabIcons/*`). Every real screen instead
  hand-rolls its own `StyleSheet.create` with hardcoded hex colors. Do not add new UI on top of the
  unused theme system without first reading section 5 — either the theme system becomes the one
  real design system, or it gets deleted; it must not keep existing unreferenced.
- `useBiometricSimulator` and `ExecuTorchService`/`aiEngine` implement a real (simulated) data +
  inference pipeline but are not consumed by any screen — `Home.tsx`'s "AI status" card and metric
  values are 100% hardcoded JSX, not sourced from either. Treat this as an integration gap, not a
  reason to write a second, competing data path.
- `login.tsx` performs no authentication — `handleLogin` unconditionally calls
  `router.replace('/(protected)/(tabs)/Home')`, the inputs are uncontrolled, and nothing in
  `(auth)` or `(protected)` gates access by session state. Any auth-adjacent work must follow section
  3 and [`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md) — this is not implemented yet,
  it is not a reference for "how it already works" here.

Do not treat any of the above as intentional prior art to copy from. When a task touches one of these
areas, fix it in place per the rules below rather than extending the inconsistency.

## 2. Project structure

Target layout — `src/` is the only source root; nothing app-specific lives outside it:

```text
src/
├── app/                      # expo-router file-based routes ONLY — no business logic here
│   ├── _layout.tsx
│   ├── index.tsx             # splash / session bootstrap redirect
│   ├── (auth)/
│   │   ├── _layout.tsx       # redirects away if already authenticated
│   │   └── login.tsx
│   └── (protected)/
│       ├── _layout.tsx       # redirects to (auth) if NOT authenticated — the actual route guard
│       └── (tabs)/
│           ├── _layout.tsx
│           ├── home.tsx
│           ├── stats.tsx
│           ├── chat.tsx
│           └── profile.tsx
├── components/                # shared, reusable, presentation-only components
│   └── ui/                    # generic primitives (Button, Card, Badge, TextField, MetricCard...)
├── features/                   # OR co-locate per screen — pick one, see below
│   └── <feature>/
│       ├── components/         # feature-specific presentational components
│       ├── hooks/               # feature-specific hooks (data + local state)
│       └── <feature>.types.ts
├── hooks/                      # cross-cutting hooks (useAuth, useSession, useColorScheme...)
├── services/                   # API clients / device / AI integrations, no React imports
│   ├── api/                    # HTTP client(s) talking to `apps/server`
│   └── ai/
├── constants/
└── store/ or context/          # session/auth state, shared app state
```

Rules:

- **`components/` and all app source live under `src/`.** `apps/patient-app/components/
  CustomTopBar.tsx` currently sits outside `src/`, forcing `Home.tsx` to import it via a fragile
  `../../../../components/CustomTopBar` relative path instead of the `@/` alias (which only maps to
  `src/*`). Move any component living outside `src/` into `src/components/` and import it via `@/
  components/...`.
- Never leave an unreferenced file in `src/` "for later" — either wire it up in the same change or
  delete it. `git log`/version control is the place for code you're not currently using, not the
  working tree.
- Pick **one** pattern for feature code and apply it consistently: either co-locate a screen's
  hooks/components next to it under `src/features/<feature>/`, or keep a flat `src/components` +
  `src/hooks` split. Do not grow a third pattern once one is chosen.

## 3. Navigation (Expo Router)

- Every route file registered in a `Tabs`/`Stack` navigator **must** have a working default export
  before it is wired in. Do not add a `Tabs.Screen`/`Stack.Screen` entry for a screen that isn't
  built yet — an empty placeholder screen still needs at least a minimal implemented component.
- **Auth gating belongs in layout files, not in individual screens.** `(auth)/_layout.tsx` and
  `(protected)/_layout.tsx` must exist and implement Expo Router's protected-routes pattern
  (`<Stack.Protected guard={...}>` or an equivalent redirect based on session state read from
  `useAuth`/`useSession`) — see [`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md) for the
  session/token contract. A screen component must never be the thing deciding "am I allowed to be
  here" via an ad hoc `router.replace` in an event handler.
- `app/index.tsx` (the splash/bootstrap screen) must check for an existing valid session before
  deciding whether to redirect to `/login` or straight into `(protected)`. Unconditionally routing to
  `/login` defeats persisted sessions.
- Route file names are lowercase kebab-case, consistent with every other file in `src/`
  (`home.tsx`, `stats.tsx`, `chat.tsx`, `profile.tsx`, `_layout.tsx`) — not `PascalCase` (`Home.tsx`,
  `Stats.tsx`). Expo Router matches on file name, so renaming is a mechanical, low-risk cleanup; do
  it in its own change, not mixed into a feature change.
- Tab icon render props (`tabBarIcon: ({ focused, size }) => ...`) must destructure the same
  arguments identically across tabs; when the design calls for an active/inactive icon state, use
  `focused` the same way in every `Tabs.Screen`, not in only one.
- Only one tab-bar implementation may exist. Delete `app-tabs.tsx`/`app-tabs.web.tsx` once confirmed
  unused, or adopt one of them as *the* tab bar and delete the inline version currently in
  `(tabs)/_layout.tsx` — never keep both.

## 4. Screens vs. business logic (Separation of Concerns)

Per root AGENTS.md: never mix business logic with presentation. Concretely for this app:

- A file under `src/app/**` (a route/screen) may only: read data from hooks/context, render JSX, and
  wire up event handlers that call functions from a hook/service. It must not itself: define
  data-fetching logic, own non-trivial derived-value computations, or reach into a service/AI module
  directly.
- Extract any computed/derived value out of a screen into a hook, even a small one. Don't define a
  helper function (e.g. a date formatter) *inside* a screen component's body — it gets recreated
  every render and invites exactly the kind of confusion seen in the current `Home.tsx` (`GetDate()`
  nested inside `Home`, its own `useState`, PascalCase-named like a component but invoked as a plain
  function). Prefer `useTodayLabel()` (a hook) or a pure utility function in `src/utils` if it truly
  needs no React state.
- Simulated/real sensor or inference data (`useBiometricSimulator`, `ExecuTorchService`) must be
  consumed through a hook the screen calls (`useBiometricSimulator()`), never re-implemented or
  hardcoded inline in the screen that's supposed to display it. If a screen currently shows
  hardcoded placeholder values, either wire it to the real hook/service or explicitly mark it with a
  `// TODO(<ticket/reason>)`-style comment — never leave static production-looking numbers that imply
  a live data path exists when it doesn't.
- Form screens (`login.tsx` and any future form) must use controlled inputs (`useState` +
  `onChangeText`/`value`, or a form library already in the dependency tree) and delegate the actual
  submit action to a hook/service (`useAuth().login(...)`), not perform navigation directly from a
  raw `onPress` with no validation or error handling.
- API/network calls to `apps/server` live in `src/services/api`, never inline in a component or hook
  body beyond calling that service's exported function.

## 5. Components & visual reuse

- **One design system.** Either build on the existing `ThemedText`/`ThemedView`/`constants/theme.ts`
  layer (extending `Colors`/`Spacing` with the real brand palette — the app's actual teal `#47ACA0`
  currently only exists hardcoded inline in `index.tsx`/`login.tsx`, not in `constants/theme.ts`) or
  replace it with a different one — but do not keep shipping new screens with raw, per-screen
  `StyleSheet.create` and hand-picked hex values while an unused theme system sits next to them.
- Extract a component once the same visual shape repeats with only data/color changes. The four
  metric cards in `Home.tsx` (`Ritmo Cardíaco`, `Oxígeno`, `Temperatura`, `Nivel de Estrés`) and their
  three status-color variants (`Elevado`/`Normal`/`Alto`) are exactly this case — one
  `MetricCard({ label, value, unit, status })` component parameterized by status color, not four
  copy-pasted `View`/`Text` blocks plus three copy-pasted style pairs.
- Form fields that share the same look (`login.tsx`'s two `TextInput`s) belong in one
  reusable `TextField`/`AuthInput`, not two near-identical `StyleSheet` blocks under inconsistent
  names (`UserInput` vs `UserPass` — pick one casing convention, and name by what the field is, not
  by a mix of both).
- No placeholder/mock user data hardcoded into a shared component (`CustomTopBar` currently hardcodes
  `"Hola, Laura"` and a random public avatar URL). Source it from the session/profile hook once one
  exists; until then, accept it as props so the component itself stays reusable and testable.
- Every asset under `assets/` must be referenced by at least one non-dead file. Delete an asset in
  the same change that removes its last usage — `assets/icon-navbar/*.png` (chart/house/message/
  user-icon) are currently unreferenced duplicates of the `.svg` icons actually used by the tab bar.
- Run a spell/naming pass on any file you touch: identifiers like `buttom` (→ `button`), invalid
  shorthand colors (`#ffff` is not a valid hex color — use `#fff`/`#ffffff`), and stray unused
  imports (e.g. an unused `Image`/`View` import, or a typo'd `import Ract from "react"`) must not
  survive review.

## 6. TypeScript & tooling

- `declarations.d.ts` must type-check cleanly — module specifiers are string literals
  (`import React from "react"`, not `import React from React`), and an imported type must be
  referenced under the exact name it was imported as (`SVGProps`, not `SvgProps`, or vice versa,
  consistently).
- Every app in this monorepo except `patient-app` ships its own `eslint.config.mjs`. Add one here
  (based on `eslint-config-expo`, already a devDependency) so `pnpm lint`/`expo lint` actually runs
  against a real config instead of failing or falling back silently.
- `README.md` is still the unmodified `create-expo-app` starter template (references an
  `app-example` directory and generic Expo boilerplate that don't reflect this project). Replace it
  with real project docs (how to run against the local `server`/Supabase stack, env vars, how auth
  works) as part of any PR that touches setup/config — same expectation as `apps/server/README.md`.

## 7. Testing

There is currently no test setup in this app (no Jest config, no test files). At minimum, once a
hook or service carries real logic (`useBiometricSimulator`, `ExecuTorchService`, a future
`useAuth`), it should get a unit test using Expo's Jest preset (`jest-expo`) — don't let business
logic accumulate in `src/hooks`/`src/services` with zero coverage while the project is still small
enough to establish the habit early.

## 8. Definition of done for a new screen/feature

- [ ] Route file is lowercase kebab-case and has a real default export before being wired into a
      navigator
- [ ] No business logic in the screen file itself — data/derived values come from a hook, network
      calls go through `src/services`
- [ ] Any repeated visual block (3+ near-identical JSX blocks) extracted into a component under
      `src/components`
- [ ] Uses the project's one design system (theme tokens), not hardcoded hex values
- [ ] No unused imports, no dead files left behind, no placeholder data left hardcoded without a
      tracked follow-up
- [ ] End-user text is formal, impersonal Spanish per root AGENTS.md; identifiers stay in English
- [ ] If it touches auth/session, follows [`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md)
      and stores tokens via `expo-secure-store`, not `AsyncStorage`
- [ ] `pnpm lint` clean
