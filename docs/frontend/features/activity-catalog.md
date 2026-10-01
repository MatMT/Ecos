# Institutional Activity Catalog

## Scope

The Admin Web route `/activities` is an administrator-only institutional
catalog. It lets an administrator create, edit, activate, and deactivate
activities owned by the caller's institution. It is deliberately separate from
Patient Workspace and introduces no assignment, mobile, notification, or AI
workflow.

## Access and ownership

The route requires `activities.catalog.manage`. Psychologists do not receive
the module in Phase 7.1, even though the server can later expose active catalog
entries to their assignment workflow.

The API returns institution-owned entries plus ECOS-global entries
(`institutionId = null`). Global rows are marked **Global** and have no edit,
activation, or deactivation controls. The server and database RLS remain the
authority for the caller's institution scope; the client never submits an
`institutionId`.

## Catalog API

`GET /api/v1/activities` accepts `search`, `active`, `skip`, and `take`.
Search matches the title case-insensitively. Responses use:

```ts
{
  data: Activity[],
  meta: { skip, take, total, totalPages }
}
```

The list URL carries `page`, `take`, `search`, and `active` (`all`, `active`,
or `inactive`). Text search updates the URL after 300 ms. Search, filter, and
page-size changes reset pagination to the first page.

`POST /api/v1/activities` and `PATCH /api/v1/activities/:id` accept only real
catalog fields: `title`, optional `description`, optional `instructions`, and
for updates the reversible `active` flag. There is no delete endpoint.

## Audit and history

Create, content update, activation, and deactivation create append-only audit
events. Audit metadata contains changed field names only; therapeutic title,
description, and instruction text is never stored in the audit metadata.

`StudentActivity` stores an `activityId`, not a content snapshot. Therefore a
later catalog edit changes the content displayed through prior assignments.
This behavior is an acknowledged historical-risk tradeoff and is not changed
by Phase 7.1.
