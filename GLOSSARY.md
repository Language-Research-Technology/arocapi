# Glossary

**Visible**: An entity that exists for a given request. Only visible entities
appear in listings, search results, totals and facets, or can be fetched
directly. Decided by the consumer's visibility filters.

**Hidden**: An entity that isn't visible to a given request. Direct requests
for it get the configured hidden response (404, 401 or 403). _Avoid_: private,
restricted (these describe why something might be hidden, not the behaviour).

**Accessible**: What a request may do with a visible entity: read its metadata
and/or its content. Decided by the access transformers, which can also supply
an authorisation URL for requesting access. An entity can be visible but not
accessible.
