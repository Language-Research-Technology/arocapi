# Releasing

Releases are published to npm by [semantic-release](https://semantic-release.gitbook.io/) from the
[Publish Package](.github/workflows/publish.yml) workflow. The version is derived from the
[Conventional Commits](https://www.conventionalcommits.org/) since the last release, so commit
messages matter: `fix:` is a patch, `feat:` a minor, and `!` or a `BREAKING CHANGE:` footer a major.

| Channel | npm dist-tag | Versions       | Published                             |
| ------- | ------------ | -------------- | ------------------------------------- |
| Beta    | `beta`       | `5.0.0-beta.1` | Automatically on every push to `main` |
| Stable  | `latest`     | `5.0.0`        | Manually, from `main`                 |

Every run executes the full test suite (lint, types, knip and tests) first. If anything fails,
nothing is published. npm only accepts publishes from this workflow, so there is no way to release
around it.

## Stable releases

1. Go to **Actions → Publish Package → Run workflow** and leave the branch as `main` (runs from
   anything other than `main` or `beta` are skipped).
2. Leave **Dry run** ticked and run it. Check the logs for the version and release notes.
3. Run it again with **Dry run** unticked.

semantic-release tags the release, publishes to npm under `latest`, creates a GitHub release and
commits the updated `CHANGELOG.md` and `package.json` back to `main`.

## Prereleases

Every push to `main` that passes the tests publishes a prerelease under the `beta` dist-tag, as long
as it contains a releasable commit (`fix:`, `feat:` or a breaking change) since the last release.
Consumers install it with `pnpm add arocapi@beta`; `latest` is untouched.

CI fast-forwards the `beta` branch to the tested commit, then dispatches Publish Package on `beta`,
which runs the tests again and publishes. It has to run on `beta` itself: semantic-release only cuts
prereleases from a prerelease branch, and npm rejects provenance from a run on a different branch.
Prereleases get a GitHub release
marked as a prerelease but aren't added to `CHANGELOG.md`, and nothing is committed back, which
keeps `beta` a fast-forward of `main`.

- **Don't push to `beta`.** CI owns it. If it gains commits that aren't on `main`, the fast-forward
  fails and no prereleases are published until it's reset to `main`.
- Stable releases need no `beta` housekeeping: the next releasable push to `main` starts the next
  prerelease line (e.g. `5.1.0-beta.1` after `5.0.0`).
