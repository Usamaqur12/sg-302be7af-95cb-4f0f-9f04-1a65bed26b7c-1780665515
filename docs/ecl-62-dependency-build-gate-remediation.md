# ECL-62 Dependency and Build Gate Remediation

Date: June 16, 2026

## Scope

This heartbeat triaged the current Mercato dependency gate and the launch-relevant build-warning path from ECL-45 Workstream 6.

## Dependency Remediation

The lockfile contained vulnerable `brace-expansion` transitive resolutions:

- `brace-expansion@1.1.11` through `minimatch@3.1.2`
- `brace-expansion@2.0.1` through `minimatch@9.0.5`

The affected package has public denial-of-service advisories across both version lines. The remediation targets the currently patched versions for those dependency ranges:

- `brace-expansion@1.1.13`
- `brace-expansion@2.0.3`

Changes made:

- Added npm `overrides` in `package.json` for `minimatch@3.1.2` and `minimatch@9.0.5`.
- Updated `package-lock.json` package records and root override metadata.

Structured lockfile check result:

```text
package.json overrides:
  minimatch@3.1.2 -> brace-expansion 1.1.13
  minimatch@9.0.5 -> brace-expansion 2.0.3

package-lock.json overrides:
  minimatch@3.1.2 -> brace-expansion 1.1.13
  minimatch@9.0.5 -> brace-expansion 2.0.3

brace-expansion lockfile versions:
  1.1.13: 8 package records
  2.0.3: 1 package record
```

No `brace-expansion@1.1.11` or `brace-expansion@2.0.1` records remain in `package-lock.json`.

## Build Warning Triage

Source/config scanning did not identify a specific Next.js config deprecation warning or launch-critical warning target to fix without running the build. Broad lint cleanup remains out of scope for this heartbeat because the acceptance criteria require verifying behavior with the project toolchain.

## Verification Blocker

The workspace shell cannot execute Node/npm:

```text
npm audit --json
  npm: The term 'npm' is not recognized...

npm run build
  npm: The term 'npm' is not recognized...

node_modules\.bin\next.cmd --version
  "node" is not recognized as an internal or external command...
```

`E:\Nodejs` is on `PATH`, but it currently contains only `node-v22.12.0-x64.msi`, not an executable Node installation. `node_modules` exists, but all local `.cmd` shims depend on `node`.

## Remaining Gate

Unblock owner/action: environment or CI owner must restore a working Node.js 20 or 22 plus npm on PATH, or run these checks in CI:

```text
npm ci
npm audit --omit=dev
npm audit
npm run type-check
npm run lint
npm run build
```

If those commands surface additional runtime advisories or launch-critical warnings, file/fix child defects with command output attached.
