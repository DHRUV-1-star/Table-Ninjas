# Physical Database Design & Implementation Justification: Freelance Marketplace

**Course:** CS203 - Database Management Systems  
**Institution:** Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat  
**Department:** Department of Computer Science and Engineering  
**Academic Year:** 2026–27  
**Team Name:** Table Ninjas (3 Members)  
**Project Title:** Freelance Marketplace (Mini-Upwork / Fiverr Database System)  
**Document Phase:** Phase D — Physical Database Design & Engine Rationale  
**Associated Scripts:** [schema.sql](file:///c:/Users/Admin/Desktop/dbms%20project/schema.sql) | [seed_data.sql](file:///c:/Users/Admin/Desktop/dbms%20project/seed_data.sql) | [indices.sql](file:///c:/Users/Admin/Desktop/dbms%20project/indices.sql) | [crud_examples.sql](file:///c:/Users/Admin/Desktop/dbms%20project/crud_examples.sql)

---

## 1. Choice of Database Management System: MySQL 8.0 (InnoDB Engine)

The physical database for the Freelance Marketplace was implemented on **MySQL 8.0 Community Server** utilizing the **InnoDB Storage Engine**. This choice was guided by core database requirements:

### 1.1 ACID Transaction Compliance & Row-Level Locking
- In a marketplace managing simulated escrow and milestone disbursements, partial write failures can corrupt account balances. InnoDB provides strict **ACID compliance** through write-ahead logging (Redo Log) and Rollback Segments (Undo Log).
- InnoDB enforces **Row-Level Locking** (`SELECT ... FOR UPDATE` and next-key locking) rather than table-level locks, allowing multiple freelancers to submit proposals and clients to fund milestones concurrently without contention.

### 1.2 Declarative Referential Integrity
- InnoDB natively supports full declarative Foreign Key constraints with configurable referential actions (`ON DELETE`, `ON UPDATE`), ensuring orphaned child records are impossible.

### 1.3 Native Data Typing & Modern CHECK Constraints
- **Native `ENUM` Support:** Allows compact, single-byte internal representations for state machine columns (`job_status`, `proposal_status`, `contract_status`, `milestone_status`, `payment_type`) while enforcing domain validation at the database layer.
- **Enforced `CHECK` Constraints:** Unlike legacy MySQL versions (pre-8.0.16) which merely parsed but ignored `CHECK` clauses, MySQL 8.0 actively evaluates and validates all `CHECK` constraints on `INSERT` and `UPDATE`.

---

## 2. Indexing Strategy & Performance Optimization

All indexes in [indices.sql](file:///c:/Users/Admin/Desktop/dbms%20project/indices.sql) were designed using MySQL's B-Tree indexing architecture and the **Leftmost Prefix Rule**:

```
+------------------------------------+-----------------------------+-------------------------------------------------------+
| Table                              | Index Columns               | Query Patterns Accelerated                            |
+------------------------------------+-----------------------------+-------------------------------------------------------+
| jobs                               | (job_status, category)      | WHERE job_status = 'OPEN' AND category = ?            |
| jobs                               | (budget)                    | WHERE budget BETWEEN min AND max                      |
| job_skills                         | (skill_id, job_id)          | Covering index: "Find all jobs requiring Skill X"     |
| freelancer_skills                  | (skill_id, proficiency)     | Covering index: "Find EXPERT freelancers in Skill X"  |
| proposals                          | (job_id, proposal_status)   | Client proposal review feed                           |
| contracts                          | (client_id, contract_status)| Client active contract dashboard                      |
| contracts                          | (freelancer_id, status)     | Freelancer active project view                        |
| milestones                         | (due_date, milestone_status)| Background cron alerts for overdue deliverables       |
| payments                           | (contract_id, payment_type) | Financial reconciliation and escrow auditing          |
| payments                           | (sender_id) / (receiver_id) | User transaction histories and wallet ledgers         |
| reviews                            | (reviewee_id, overall_rating| Public profile loading & review sorting               |
| messages                           | (contract_id, sent_at)      | In-order chat thread rendering without filesort       |
+------------------------------------+-----------------------------+-------------------------------------------------------+
```

### 2.1 The "Reverse Index" Strategy on Junction Tables
- The primary key on `job_skills` is composite: `PRIMARY KEY (job_id, skill_id)`.
- According to the B-tree leftmost prefix principle, queries filtering by `job_id` use this primary key index efficiently.
- However, when a freelancer searches for open jobs requiring a specific skill (`WHERE skill_id = 1`), the primary key **cannot be used**, forcing a full table scan.
- To resolve this, we introduced the reverse composite index:
  ```sql
  CREATE INDEX idx_job_skills_skill_job ON job_skills (skill_id, job_id);
  ```
- This index covers the lookup entirely within index leaf nodes without touching data pages (**Index-Only Covering Scan**).

### 2.2 Eliminating Filesort on Chat Logs
- When rendering direct messages between contracting parties, messages must be ordered chronologically:
  ```sql
  SELECT * FROM messages WHERE contract_id = ? ORDER BY sent_at ASC;
  ```
- By indexing `(contract_id, sent_at)`, the storage engine traverses leaf pages in pre-sorted order, completely eliminating the in-memory or on-disk `Using filesort` overhead.

---

## 3. Database Triggers & Automated Invariant Enforcement

To eliminate update anomalies on controlled denormalization columns, [schema.sql](file:///c:/Users/Admin/Desktop/dbms%20project/schema.sql) defines automated database triggers:

### 3.1 Self-Bidding Prevention (`trg_prevent_self_bidding`)
- **Event:** `BEFORE INSERT ON proposals`
- **Logic:** Queries `jobs.client_id` for the target `job_id`. If `client_id == NEW.freelancer_id`, the trigger raises an unhandled SQLSTATE exception:
  ```sql
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Business Rule Violation: Clients cannot submit proposals to their own jobs.';
  ```
- **Guarantee:** Enforces at the database layer that no user can award contracts to themselves.

### 3.2 Dynamic Rating Synchronization (`trg_after_review_insert`)
- **Event:** `AFTER INSERT ON reviews`
- **Logic:** Queries `AVG(overall_rating)` for `NEW.reviewee_id` across the `reviews` table and writes the computed average to `freelancers.average_rating`.
- **Guarantee:** Eliminates multi-table aggregation scans during freelancer search while maintaining mathematical consistency with the reviews ledger.

### 3.3 Financial Ledger Synchronization (`trg_after_payment_complete`)
- **Event:** `AFTER INSERT ON payments`
- **Logic:** When `payment_type = 'MILESTONE_RELEASE'` and `payment_status = 'COMPLETED'`, the trigger atomically executes:
  - `UPDATE freelancers SET total_earnings = total_earnings + NEW.amount WHERE freelancer_id = NEW.receiver_id;`
  - `UPDATE clients SET total_spent = total_spent + NEW.amount WHERE client_id = NEW.sender_id;`
- **Guarantee:** Guarantees double-entry conservation between transaction ledger rows and profile balance counters.

---

## 4. Enforcement of Phase B Business Rules via Constraints

| Business Rule | Relational Constraint Implementation | Mechanism |
|---|---|---|
| **One bid per freelancer per job** | `CONSTRAINT uq_proposals_job_freelancer UNIQUE (job_id, freelancer_id)` | Unique B-Tree constraint rejecting duplicate tuples. |
| **Only one contract awarded per job** | `CONSTRAINT uq_contracts_job UNIQUE (job_id)` | Enforces $1:1$ cardinality between `jobs` and `contracts`. |
| **Only one contract awarded per proposal** | `CONSTRAINT uq_contracts_proposal UNIQUE (proposal_id)` | Prevents multiple contracts originating from the same proposal bid. |
| **Positive currency amounts** | `CONSTRAINT chk_proposals_bid CHECK (bid_amount > 0.00)`<br>`CONSTRAINT chk_milestones_amount CHECK (amount > 0.00)`<br>`CONSTRAINT chk_payments_amount CHECK (amount > 0.00)` | Immediate rejection of non-positive financial values. |
| **Review rating boundaries** | `CONSTRAINT chk_reviews_overall CHECK (overall_rating BETWEEN 1 AND 5)` | Domain check restricting scores strictly to $[1, 5]$. |
| **Single review per party per contract** | `CONSTRAINT uq_reviews_contract_reviewer UNIQUE (contract_id, reviewer_id)` | Prevents duplicate or spam reviews on the same engagement. |
| **Non-Self-Review Rule** | `CONSTRAINT chk_reviews_distinct CHECK (reviewer_id <> reviewee_id)` | Enforces that a reviewer cannot review themselves. |
| **Valid Messaging Context** | `CONSTRAINT chk_messages_context CHECK (contract_id IS NOT NULL OR proposal_id IS NOT NULL)` | Prohibits unlinked floating messages outside business contexts. |
| **Cascade Archiving** | `ON DELETE CASCADE` on `milestones(contract_id)`, `proposals(job_id)`, `portfolio_items(freelancer_id)` | Automatically cleans up child records when master entity is removed. |
| **Financial Ledger Immutability** | `ON DELETE RESTRICT` on `payments(contract_id)`, `payments(sender_id)`, `contracts(job_id)` | Prevents accidental deletion of users or contracts with active financial records. |

---

## 5. End-to-End CLI Verification Summary

All four SQL scripts were executed sequentially and verified on the local MySQL 8.0 server:
1. `schema.sql`: Dropped and recreated database `freelance_marketplace`, successfully building all 15 InnoDB tables, primary keys, foreign keys, check constraints, and triggers.
2. `seed_data.sql`: Seeded 14 users, 18 skills, 24 freelancer skills, 8 portfolio items, 16 jobs, 28 job skills, 24 proposals, 10 contracts, 20 milestones, 34 payments, 12 reviews, 8 messages, and 1 dispute.
3. `indices.sql`: Built all 14 targeted performance B-tree indexes without warnings.
4. `crud_examples.sql`: Ran 6 analytical business queries and 5 multi-statement ACID transactions end-to-end, validating proposal submission, contract award, milestone escrow release, review insertion, and clean entity deletion.
