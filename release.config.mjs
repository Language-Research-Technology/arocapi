// Prereleases don't commit back, so CI can keep beta fast-forwarded to main.
const prerelease = process.env.GITHUB_REF === 'refs/heads/beta';

/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main', { name: 'beta', prerelease: true }],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
      },
    ],
    !prerelease && '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    !prerelease && [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
      },
    ],
  ].filter(Boolean),
};
