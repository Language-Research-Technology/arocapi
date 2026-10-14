# Glossary

**Visible**: An entity that exists for a given request. Only visible entities
appear in listings, search results, totals and facets, or can be fetched
directly. Decided by the consumer's visibility filters.

**Hidden**: An entity that isn't visible to a given request. Direct requests
for it get a 404, like a missing entity, unless the consumer prompts anonymous
requests to log in, which get a 401. _Avoid_: private, restricted (these
describe why something might be hidden, not the behaviour).

**Anonymous**: A request without valid credentials. Refusing an anonymous
request is a 401, so the client can prompt a login; refusing any other is a
403. In a repository without logins, no request is anonymous.

**Accessible**: What a request may do with a visible entity: read its metadata
and/or its content. Decided by the access transformers, which can also supply
an authorisation URL for requesting access. An entity can be visible but not
accessible.
