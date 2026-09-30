# ECOS Admin Web — Dashboard Shell

## 1. Purpose

`(dashboard)` provides the protected common structure for portal pages. A new
page automatically receives authentication, route access validation, navigation,
header, breadcrumbs, theme, responsive spacing and the shared content area.

## 2. Layout structure

`src/app/(dashboard)/layout.tsx` remains a Server Component. It composes
`AuthBoundary`, `RouteAccessBoundary` and the client `DashboardShell`.
`DashboardShell` is responsible only for interactive shell state and consumes the
existing `useSession` query; it does not fetch clinical resources.

## 3. Desktop sidebar

At `lg` and above, the sidebar is fixed, expanded and labelled. It uses the ECOS
text identity and Lucide icons. Desktop collapse and preference persistence are
intentionally not implemented.

## 4. Mobile navigation

Below `lg`, the desktop sidebar is replaced by an accessible Radix dialog drawer.
It opens from the header, closes on Escape, overlay interaction, close control or
navigation, and retains keyboard focus management from the dialog primitive.

## 5. Header

The sticky header contains the mobile navigation trigger, route breadcrumbs, the
existing theme toggle and the account menu. It does not own page titles or
page-specific actions.

## 6. User menu

The menu displays the session's name (or email fallback), localized role and
email when available. It deliberately omits a profile item because no profile
route exists. Logout always uses `useLogout`.

## 7. Theme

The shell uses the existing root theme initialization and `ThemeToggle`. New
shell surfaces use semantic tokens such as `background`, `card`, `border` and
`foreground` so they work in both modes.

## 8. Navigation configuration

`src/lib/navigation/dashboard-navigation.ts` is the single typed navigation
source. Each item defines `label`, `href`, Lucide `icon`, `permission`, and
optional `activeMatch` (`exact` or `prefix`).

## 9. Permission filtering

`getNavigationForRole(role)` filters the configuration through the existing
fail-closed `can()` helper. This only controls visible navigation;
`RouteAccessBoundary` continues to validate direct route access independently.

## 10. Active navigation

Exact items match only their own path. Prefix items remain active for nested
paths, so `/patients/123` keeps **Pacientes** selected.

## 11. Breadcrumbs

Breadcrumbs derive from the central route metadata. Dynamic patient routes use
the `Detalle` fallback and do not fetch a name. A client feature that already
knows a resource name can call `useDashboardBreadcrumbLabel(name)` to replace the
current path's fallback while mounted.

`PatientWorkspace` calls that hook from the patient context already loaded by
the active query. Its contextual navigation is feature-owned, horizontal and
does not duplicate the global sidebar. Only **Resumen** is visible today;
future patient sections remain unavailable until their routes and modules exist.

## 12. Content container

The shell owns responsive page spacing: `p-4 sm:p-6 lg:p-8`. It is full width so
tables, schedules and biometric views are not constrained. Individual forms may
set a narrower width inside their own page.

## 13. How to add a navigation item

1. Implement the real dashboard route and register its access rule in
   `src/lib/permissions`.
2. Add one item to `dashboardNavigation` with its Spanish label, href, Lucide
   icon, required permission and active-match strategy.
3. Do not edit sidebar JSX or duplicate filtering logic.

## 14. How to add a dashboard page

1. Create the route under `src/app/(dashboard)`.
2. Build the domain UI in its owning `src/features/<domain>` directory when it
   has real domain behavior.
3. Add a route-access rule and, only when a real destination exists, a navigation
   item.
4. Do not change the dashboard layout to receive the shell.

## 15. Accessibility

The shell uses semantic `aside`, `nav`, `header` and `main` landmarks, real
Next.js links for navigation, visible keyboard focus, accessible menu and drawer
controls, labelled navigation and an Escape-close mobile drawer.
