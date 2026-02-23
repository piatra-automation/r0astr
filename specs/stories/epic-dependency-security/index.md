# Epic 3: Dependency Security Remediation

## Status
Done

## Epic Goal
Remediate all actionable Dependabot/npm-audit vulnerabilities on the default branch -- 5 high, 2 moderate, 1 low across 10 root advisories -- while preserving build and runtime stability.

## Background
GitHub flagged 8 Dependabot alerts (mapped to 10 distinct npm advisories, 35 total transitive occurrences). The vulnerabilities fall into three remediation tiers:

1. **Safe fixes** (4 advisories): `npm audit fix` resolves `brace-expansion`, `axios`, `ajv`, `lodash`, `qs` without semver-major changes
2. **Major upgrade** (5 advisories): `electron-builder` 25.1.8 -> 26.x fixes all `minimatch`, `tar`, `@electron/asar`, `@electron/rebuild` issues -- but is a semver-major bump requiring build validation
3. **No fix available** (1 advisory): `@strudel/csound` -> `@csound/browser` -> `rimraf@3` / `eslint-plugin-n` -- transitive, upstream must patch

## Stories

| # | Title | Dependencies | Complexity |
|---|-------|-------------|------------|
| [3.1](./3.1.safe-audit-fixes.md) | Safe Dependency Audit Fixes | None | Low |
| [3.2](./3.2.electron-builder-major-upgrade.md) | electron-builder Major Version Upgrade (25 -> 26) | 3.1 | Medium |

## Dependency Graph
```
3.1 (safe fixes) --> 3.2 (electron-builder upgrade)
```

Story 3.1 lands first to reduce noise in the audit report before tackling the major upgrade. Story 3.2 depends on 3.1 so the lockfile changes don't conflict.

## Out of Scope
- `@strudel/csound` / `@csound/browser` transitive vulnerabilities (no upstream fix exists; runtime-only risk is negligible since Csound browser integration is optional and not exposed to untrusted input)

## Definition of Done
- `npm audit` reports zero fixable high/critical vulnerabilities
- Electron builds (macOS, Windows, Linux) succeed with updated dependencies
- Application launches and core functionality (panel playback, settings, skins) works
- Unfixable transitive vulnerability documented with risk acceptance
