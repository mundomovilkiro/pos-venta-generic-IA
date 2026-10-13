---
name: db-data-integrity
description: Standards and guidelines for database data integrity, safe transactions, foreign key relationships, indexes, and parameterized queries.
triggers:
  - database
  - sql
  - query
  - schema
  - migration
  - transaction
---
# Database Data Integrity Standards

1. Parameterized Queries & Injection Prevention:
   - Always use parameterized queries, prepared statements, or ORM/query builder parameter bindings. Never concatenate or interpolate raw user inputs into SQL strings.

2. Atomic Transactions & Rollbacks:
   - Wrap multi-table operations and state transitions in explicit ACID transactions.
   - Always ensure rollback on error and proper release/closure of connections.

3. Foreign Keys & Cascading Rules:
   - Enforce referential integrity using explicit foreign keys at the database schema level.
   - Define deliberate cascading or restrict behaviors (`ON DELETE RESTRICT`, `ON DELETE CASCADE`) to avoid orphaned records.

4. Strategic Indexing:
   - Ensure foreign keys, unique columns, and frequently filtered or joined columns are properly indexed.
   - Avoid redundant indexes and evaluate write overhead.

5. Migrations & Schema Changes:
   - Implement reversible, idempotent migrations.
   - Never perform destructive changes (e.g., column drops) without verification and safe deprecation paths.
