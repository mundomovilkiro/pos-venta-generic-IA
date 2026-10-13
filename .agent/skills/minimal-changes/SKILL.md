---
name: minimal-changes
description: Enforces minimal viable code modifications, precise targeted patches, and prevents unnecessary file rewrites.
triggers:
  - refactor
  - fix
  - patch
---
# Minimal Changes Directive
1. Targeted Edits: Never rewrite whole files if a small patch solves the problem.
2. Preserve Architecture: Maintain existing naming conventions and file structures.
3. Surgical Search-and-Replace: Modify only the necessary lines.
