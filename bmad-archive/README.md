# BMAD Archive

**Archive Date:** 2026-01-10
**Migration Tool:** migrate-bmad.cjs
**Status:** Historical Reference Only

## Overview

This directory contains the original BMAD (Brownfield-Managed Agile Development) documentation that was used during the initial development of r0astr. The BMAD system has been migrated to the Automaker feature management system.

## Migration Summary

- **Total Stories Migrated:** 52
- **Epics Covered:** 10 (Epic 1-10)
- **Completed Features:** 46
- **In Progress:** 1
- **Backlog:** 5

See `.automaker/bmad-migration-log.json` for detailed migration mapping.

## BMAD Structure

The BMAD system organized work into:

1. **Epics** (Product Requirements Documents in `bmad/prd/`)
   - Epic 1: Dynamic Panel Management
   - Epic 2: Enhanced Panel UI
   - Epic 3: Splash/Hero Screen
   - Epic 4: Settings System
   - Epic 5: Server Endpoints
   - Epic 6: Staleness Detection
   - Epic 7: Text Panel Improvements
   - Epic 8: Remote Control Synchronization
   - Epic 9: Code Architecture Refactor
   - Epic 10: UI Module Extraction

2. **Stories** (Detailed implementation specs in `bmad/stories/`)
   - Format: `{epic}.{story}.{slug}.md`
   - Example: `1.1.add-new-panel-button.md`
   - Contains: User stories, acceptance criteria, tasks, dev notes, QA results

3. **Architecture Docs** (`bmad/architecture/`)
   - Brownfield analysis
   - Frontend architecture decisions
   - Tech stack documentation

## Automaker Migration

All BMAD stories have been converted to Automaker features:

**BMAD Format:**
```
bmad/stories/1.1.add-new-panel-button.md
```

**Automaker Format:**
```
.automaker/features/epic-1-story-1-add-new-panel-button/feature.json
```

Each feature includes:
- `id`: Unique identifier (e.g., `epic-1-story-1-add-new-panel-button`)
- `category`: Epic-based category (e.g., `Dynamic Panel Management`)
- `title`: Feature title
- `description`: Extracted from user story
- `status`: Mapped from BMAD status (`completed`, `in_progress`, `backlog`)
- `priority`: Based on epic number
- `complexity`: Estimated from tasks and acceptance criteria
- `dependencies`: Extracted from story dependencies
- `metadata`: Original BMAD references

## Why Archive?

1. **Detailed Documentation:** BMAD stories contain extensive QA reports, test results, and implementation notes that provide historical context
2. **Brownfield Analysis:** Architecture documentation captures important decisions made during the initial refactor
3. **Reference Material:** Useful for understanding the evolution of features
4. **Compliance:** Some stories contain completion evidence for auditing

## Active Development

**All new work should use Automaker.**

The Automaker system provides:
- Simpler feature format
- Better tooling integration
- Unified feature backlog
- Status tracking
- Dependency management

## Accessing BMAD Content

To reference BMAD stories:

1. Check `.automaker/bmad-migration-log.json` for feature mapping
2. Find original story file in this archive
3. Read detailed acceptance criteria, QA notes, and implementation details

## BMAD Skills (Archived)

The following Claude Code skills were part of BMAD but are now archived:

- `/bmad-master` - BMAD orchestration
- `/bmad-orchestrator` - Story coordination
- `/analyst` - Requirements analysis
- `/architect` - Architecture decisions
- `/po` - Product owner role
- `/pm` - Project management
- `/sm` - Scrum master
- `/dev` - Development agent
- `/qa` - Quality assurance
- `/ux-expert` - UX review

**Note:** Some skills may still exist in `.claude/settings.json` but should be considered deprecated.

## Migration Log

See `.automaker/bmad-migration-log.json` for complete mapping:

```json
{
  "bmad": "1.1.add-new-panel-button.md",
  "automaker": "epic-1-story-1-add-new-panel-button",
  "status": "completed",
  "category": "Dynamic Panel Management"
}
```

## Contact

For questions about migrated features or to access specific BMAD documentation, contact the project maintainer.

---

**Archive maintained for historical reference only. Do not modify.**
