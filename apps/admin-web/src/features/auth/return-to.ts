export function getSafeReturnTo(returnTo: string | null): string {
  if (
    !returnTo ||
    returnTo === "/" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  ) {
    return "/dashboard"
  }

  return returnTo
}
