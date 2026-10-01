const EMPTY_INITIALS = "?"

export function getPatientInitials(fullName: string | null | undefined): string {
  const nameParts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []

  if (nameParts.length === 0) {
    return EMPTY_INITIALS
  }

  const firstInitial = getFirstCharacter(nameParts[0])
  const lastInitial =
    nameParts.length > 1 ? getFirstCharacter(nameParts[nameParts.length - 1]) : ""

  return `${firstInitial}${lastInitial}`.toLocaleUpperCase("es")
}

function getFirstCharacter(value: string): string {
  return Array.from(value)[0] ?? EMPTY_INITIALS
}
