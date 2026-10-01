export const dashboardKeys = {
  all: ['dashboard'] as const,
  psychologist: () => [...dashboardKeys.all, 'psychologist'] as const,
  administrator: () => [...dashboardKeys.all, 'administrator'] as const,
}
