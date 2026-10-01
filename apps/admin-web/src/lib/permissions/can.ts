import type { UserRole } from "@/features/auth/types/auth.types"
import {
  rolePermissions,
  routeAccess,
  type Permission,
} from "@/lib/permissions/permissions"

export function can(
  role: UserRole | string | null | undefined,
  permission: Permission,
): boolean {
  if (!isKnownRole(role)) {
    return false
  }

  return rolePermissions[role].includes(permission)
}

export function getRoutePermission(pathname: string): Permission | null {
  const matchingRule = routeAccess
    .filter((rule) => matchesRoute(pathname, rule.path))
    .sort((left, right) => right.path.length - left.path.length)[0]

  return matchingRule?.permission ?? null
}

function isKnownRole(
  role: UserRole | string | null | undefined,
): role is keyof typeof rolePermissions {
  return typeof role === "string" && Object.hasOwn(rolePermissions, role)
}

function matchesRoute(pathname: string, path: string): boolean {
  if (path.includes(":")) {
    const pathnameSegments = pathname.split("/").filter(Boolean)
    const pathSegments = path.split("/").filter(Boolean)

    return (
      pathnameSegments.length === pathSegments.length &&
      pathSegments.every(
        (segment, index) => segment.startsWith(":") || segment === pathnameSegments[index],
      )
    )
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}
