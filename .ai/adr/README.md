# Architectural Decision Records (ADR)

This directory contains Architectural Decision Records for @johnqh/lib, documenting important architectural and design decisions.

## ADR Index

| ADR | Date | Title | Status |
|-----|------|-------|--------|
| [001](001-platform-abstraction-architecture.md) | 2025-01-13 | Platform Abstraction Architecture | Accepted |
| [002](002-interface-first-design.md) | 2025-01-13 | Interface-First Design Pattern | Accepted |
| [003](003-dependency-injection-strategy.md) | 2025-01-13 | Dependency Injection Strategy | Accepted |
| [004](004-indexer-hook-patterns.md) | 2025-01-13 | Indexer Hook Patterns | Accepted |

## ADR Template

When creating new ADRs, use the following template:

```markdown
# ADR-XXX: [Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX  
**Context:** AI-assisted development optimization

## Context

Brief description of the problem or situation that requires a decision.

## Decision

The decision that was made and why.

## Consequences

### Positive
- Benefits of this decision

### Negative  
- Drawbacks or costs

### Neutral
- Other implications

## Implementation

How this decision will be implemented.

## Alternatives Considered

Other options that were evaluated.
```

## Decision Status Definitions

- **Proposed**: Decision is under consideration
- **Accepted**: Decision is approved and being implemented
- **Deprecated**: Decision is no longer recommended but may still be in use
- **Superseded**: Decision has been replaced by a newer ADR