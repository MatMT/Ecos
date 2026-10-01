export const activityCatalogRoutes = {
  create: () => "/activities/new",
  edit: (id: number) => `/activities/${id}/edit`,
  list: () => "/activities",
};
