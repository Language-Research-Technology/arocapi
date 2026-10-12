# 1. Entity visibility is a query filter, separate from access

Date: 2026-10-12

## Status

Accepted

## Context

Consumers need to hide some entities from some users entirely: drafts and
private crates seen only by admins, or only entities a user is entitled to,
whether decided by their groups or by an external arbiter such as REMS. How
visibility is decided is up to the consumer. The access transformer can only redact an entity
after it has been fetched. It can't remove it, and removing rows after the
query would break totals, `limit`/`offset` pagination and search facet counts,
which come from Prisma and OpenSearch.

## Decision

- **Visibility** (does this entity exist for this request?) and **access**
  (what can this request do with a visible entity?) are separate layers.
  Visibility runs first; the access and entity transformer pipeline runs
  unchanged on visible entities.
- Visibility is applied inside the queries. Consumers supply two required
  filters: `entityVisibilityFilter` returns a Prisma `where` condition, and
  `searchVisibilityFilter` returns an OpenSearch query. They are deliberately
  separate, with no shared rule language: consumers own both the database and
  the search index, and keeping the filters in agreement is their
  responsibility.
- The search route adds the search filter as a `bool` filter around the query
  builder's output, so custom query builders can't skip it and aggregations
  only count visible entities. Loading hits from the database applies the
  entity filter too, so a mismatch gives a short page rather than a leak.
- Both filters are required, with no default. Public repositories opt in
  explicitly with `AllVisibleEntityFilter` and `AllVisibleSearchFilter`.
- Direct requests for a hidden entity get the consumer's `hiddenResponse`
  (`notFound`, `authenticationRequired` or `forbidden`), chosen per request,
  defaulting to `notFound`. Missing entities always get 404.
- Visibility never cascades from collections; consumers who want that filter
  on `rootCollection`.

## Consequences

- Introducing the filters was a breaking change.
- Visibility rules must be expressible as database and search queries. Rules
  that can only be checked per entity after fetching belong in the access
  layer instead.
- Consumers must index into OpenSearch any field their visibility rules use.
- The search filter is expected to move into a future search-handling class
  alongside the query builder.
