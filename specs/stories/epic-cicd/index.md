# Epic 1: CI/CD Pipeline Ground-Up Rebuild

## Status
Approved

## Epic Goal
Replace the fragile, ad-hoc GitHub Actions setup with a reliable, modular pipeline that handles version detection from `^^^ vX.Y.Z` commit messages, multi-arch Electron releases (macOS/Windows/Linux), and GitHub Pages deployment (MkDocs + lite app) -- all orchestrated from a single top-level workflow.

## Background
The current CI/CD consists of two independent workflows (`release.yml` and `deploy-pages.yml`) with duplicated logic, fragile workarounds (destructive `rm -rf node_modules` before install, Python 3.11 pinning), and no shared components. A release commit triggers both workflows independently with no coordination. This epic rebuilds everything from scratch using reusable workflows.

## Stories

| # | Title | Dependencies | Complexity |
|---|-------|-------------|------------|
| [1.1](./1.1.reusable-version-detection.md) | Reusable Version Detection Workflow | None | Medium |
| [1.2](./1.2.multi-arch-electron-build.md) | Multi-Arch Electron Build Matrix | None | High |
| [1.3](./1.3.github-release-creation.md) | GitHub Release Creation | 1.2 | Low |
| [1.4](./1.4.github-pages-deployment.md) | GitHub Pages Deployment (MkDocs + Lite) | None | Medium |
| [1.5](./1.5.orchestrator-workflow.md) | Orchestrator Workflow | 1.1, 1.2, 1.3, 1.4 | Medium |
| [1.6](./1.6.pipeline-validation.md) | Pipeline Validation | 1.5 | Low |

## Dependency Graph
```
1.1 (detect-version) ---+
                        |
1.2 (build-electron) ---+--> 1.5 (orchestrator) --> 1.6 (validation)
  |                     |
  +--> 1.3 (release) --+
                        |
1.4 (deploy-pages) ----+
```

Stories 1.1, 1.2, and 1.4 can be developed in parallel. Story 1.3 depends on 1.2's artifact format. Story 1.5 wires everything together. Story 1.6 validates end-to-end.

## Definition of Done
- All old workflow files replaced with new modular pipeline
- A `^^^ vX.Y.Z` commit to `main` triggers: tag creation, 3-platform Electron build, GitHub Release with artifacts, and pages deployment
- A non-release commit to `main` triggers only pages deployment
- Manual `workflow_dispatch` can trigger a release build
- Release process documented in README
