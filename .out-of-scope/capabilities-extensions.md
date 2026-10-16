# Declaring consumer extensions and routes in `/capabilities`

arocapi serves `GET /capabilities` with `extensions: {}` and has no option or hook for consumers to add entries. It
also doesn't declare routes that consumers mount next to it, such as `/admin`, `/dav`, `/version` or an OIDC proxy.

## Why this is out of scope

No consumer declares an extension today, so any API we added would be guesswork. We'd have to choose between a static
`extensions` option and a hook on the query builder, decide whether to check identifiers against the spec's registry
(`segments`, or an `x-` prefix), and decide whether arocapi should support `segments` itself. Once published, whatever
we chose would be public API under semver.

Routes are a separate matter. The spec (v0.4.0) models an extension as a response feature, not a route, and has no
convention for declaring routes specific to one implementation. Routes a consumer adds stay undeclared.

We'll reconsider when a consumer needs a client to detect an extension. That request should name the extension and
the client that needs to detect it. Route declarations need a spec convention in ro-crate-api first.

## Prior requests

- #47: "Discussion: declaring implementation-specific routes in capabilities"
