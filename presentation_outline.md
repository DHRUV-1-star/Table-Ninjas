---
marp: true
theme: default
paginate: true
header: 'CS203 DBMS Project — Freelance Marketplace (Table Ninjas)'
footer: 'SVNIT Surat | Department of Computer Science & Engineering | 2026–27'
style: |
  section {
    background-color: #0b0f19;
    color: #e2e8f0;
    font-family: 'Inter', -apple-system, sans-serif;
    padding: 40px;
  }
  h1, h2, h3 {
    font-family: 'Outfit', sans-serif;
    color: #ffffff;
  }
  h1 { color: #818cf8; }
  h2 { color: #a5b4fc; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
  strong { color: #38bdf8; }
  code {
    background: #1e293b;
    color: #f472b6;
    padding: 2px 6px;
    border-radius: 4px;
  }
  table {
    font-size: 14px;
    width: 100%;
    border-collapse: collapse;
  }
  th {
    background: #1e1b4b;
    color: #c7d2fe;
    padding: 8px;
  }
  td {
    border-bottom: 1px solid #334155;
    padding: 8px;
  }
  blockquote {
    border-left: 4px solid #6366f1;
    padding-left: 12px;
    color: #94a3b8;
    background: #111827;
  }
---

# Freelance Marketplace Database System
### A Production-Grade Relational Platform for Project Hiring & Escrow Settlement

**Team:** Table Ninjas (3 Members)  
**Course:** CS203 — Database Management Systems  
**Institution:** Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat  
**Department:** Department of Computer Science & Engineering  
**Academic Year:** 2026–27  

---

## 2. Problem Statement & Motivation

### The Challenge in Modern Contract Labor
* **Fragmented Platforms:** Traditional hiring channels lack verifiable skill taxonomy, resulting in mismatched talent and unverified proposals.
* **Payment Insecurity:** Freelancers fear wage default; clients fear incomplete or substandard work.
* **Arbitration Deficits:** Lack of transparent communication logging and milestone tracking creates unresolved financial disputes.

### Project Objective & Scope
* Design a centralized **relational database application** (Table Ninjas freelance marketplace architecture) connecting **Clients** and **Freelancers**.
* Manage the complete hiring lifecycle: Job Posting $\rightarrow$ Proposal Bidding $\rightarrow$ Contract Award $\rightarrow$ Milestone Escrow Funding $\rightarrow$ Delivery Sign-off $\rightarrow$ Payout Release $\rightarrow$ Verified Bidirectional Reviews.
* Enforce strict **ACID compliance**, declarative referential integrity, and automated trigger-based data consistency.

---

## 3. Requirements Overview & Role Capabilities

| Role | Key Functional Capabilities | Core Relational Interactions |
|---|---|---|
| **Client** | • Publish job requisitions (budget, deadline, category)<br>• Review and filter candidate proposals<br>• Award contracts & fund sequential milestones<br>• Approve deliverables and disburse escrow<br>• Submit post-contract ratings | • `INSERT/UPDATE jobs`<br>• `UPDATE proposals`<br>• `INSERT contracts`<br>• `INSERT payments` (`ESCROW_LOCK`)<br>• `INSERT reviews` |
| **Freelancer** | • Configure profile & link standardized skills<br>• Multi-facet job search (skill, category, budget range)<br>• Submit proposals with cover letter & delivery timelines<br>• Submit milestone deliverables for review<br>• View live computed reputation metrics | • `INSERT freelancer_skills`<br>• `SELECT jobs` (indexed joins)<br>• `INSERT proposals`<br>• `UPDATE milestones`<br>• `SELECT reviews` |
| **Admin** | • Oversee platform user directory & contract health<br>• Manage standardized skill catalog<br>• Arbitrate contested milestones with binding payouts/refunds | • `SELECT/UPDATE disputes`<br>• `INSERT admin_audit_log` |

---

## 4. Conceptual ER Model Highlights

### 1. User Specialization (Generalization Hierarchy)
* **Superclass:** `USER` (authentication, credentials, email, contact).
* **Subclasses:** `CLIENT` and `FREELANCER` mapped using **Class Table Inheritance (Table-per-Type)**.
* **Why?** Eliminates sparse tables with massive `NULL` columns while cleanly supporting **dual-role accounts** (`user_role = 'DUAL'`).

### 2. Proposal as an Associative Entity ($M:N$)
* Bidding resolves the $M:N$ relationship between `JOB` and `FREELANCER`.
* Cannot be a simple link table: carries rich business payload (`bid_amount`, `estimated_delivery_days`, `cover_letter`, `proposal_status`).
* Acts as a foreign key target for `CONTRACT` ($1:1$) and pre-contract `MESSAGE` threads.

### 3. Milestone as a Weak Entity
* **Owner:** `CONTRACT`. Composite PK: `(contract_id, milestone_seq_no)`.
* Dependent on contract existence; enforces cascading lifecycle semantics.

---

## 5. Conceptual ER Diagram (Entity Relationships)

```
   +-------------------+              +-----------------------+
   |      CLIENT       |              |      FREELANCER       |
   +-------------------+              +-----------------------+
             | 1                                  | 1
             | posts                              | submits
             v N                                  v N
       +-----------+         1       N      +------------+
       |    JOB    |<-----------------------|  PROPOSAL  |
       +-----------+   (Associative Entity) +------------+
             | 1                                  | 1
             |                                    | awarded into
             +------------------+-----------------+
                                |
                                v 1
                         +--------------+
                         |   CONTRACT   |
                         +--------------+
                                | 1
                                | contains (Weak Entity)
                                v N
                         +--------------+
                         |  MILESTONE   |
                         +--------------+
                                | 1
                                | triggers release
                                v N
                         +--------------+
                         |   PAYMENT    | (Simulated Escrow Ledger)
                         +--------------+
```

---

## 6. Relational Schema & Normalization Walkthrough

### Progression from UNF to 3NF / BCNF

* **1NF (Eliminate Multi-Valued Attributes & Composites):**
  * *Before:* `JOB(job_id, {skills}, {bids}, billing_address)`
  * *After:* Split `billing_address` into `(street, city, state, postal_code)`; extracted repeating skills and proposals into `job_skills` and `proposals`.
* **2NF (Eliminate Partial Dependencies on Composite Keys):**
  * *Before:* `JOB_PROPOSALS(job_id, freelancer_id, bid_amount, freelancer_title, hourly_rate)`
  * *Violation:* `freelancer_id -> (freelancer_title, hourly_rate)` depends on part of candidate key.
  * *After:* Extracted `freelancers(freelancer_id, professional_title, hourly_rate)`.
* **3NF / BCNF (Eliminate Transitive Dependencies):**
  * *Before:* `JOB_FLAT(job_id, title, budget, client_id, company_name, client_city)`
  * *Violation:* `job_id -> client_id -> (company_name, client_city)`.
  * *After:* Decomposed into `jobs` and `clients`. All determinants are superkeys.

---

## 7. Key Database Design Decisions & Justifications

### 1. Storage Engine: MySQL 8.0 InnoDB
* Mandatory for **ACID transaction guarantees** during escrow reservation and disbursement.
* Enforces row-level locking to prevent race conditions during concurrent bidding.

### 2. Strategic B-Tree Indexing
* **Reverse Index on Junction Tables:** `idx_job_skills_skill_job ON job_skills(skill_id, job_id)` enables index-only covering scans when searching jobs by prerequisite skill.
* **Composite Filtering Indexes:** `jobs(job_status, category)` and `proposals(job_id, proposal_status)` avoid full table scans on high-traffic feeds.

### 3. Automated Invariant Enforcement via Triggers
* `trg_prevent_self_bidding`: Raises SQLSTATE exception if a client bids on their own job.
* `trg_after_review_insert`: Dynamically recalculates `freelancers.average_rating` upon review submission, keeping cached metrics strictly consistent.
* `trg_after_payment_complete`: Automatically synchronizes `total_earnings` and `total_spent`.

---

## 8. Relational Integrity Rules & Constraints

```
+------------------------------------+---------------------------------------------------------------+
| Business Invariant                 | Relational Enforcement                                        |
+------------------------------------+---------------------------------------------------------------+
| One proposal per freelancer per job| CONSTRAINT uq_proposals_job_freelancer UNIQUE (job_id, f_id)  |
| Exactly one contract per job       | CONSTRAINT uq_contracts_job UNIQUE (job_id)                   |
| Strictly positive financial values | CONSTRAINT chk_proposals_bid CHECK (bid_amount > 0.00)        |
| Valid 5-star scoring bounds        | CONSTRAINT chk_reviews_overall CHECK (rating BETWEEN 1 AND 5) |
| Non-self review guarantee          | CONSTRAINT chk_reviews_distinct CHECK (reviewer <> reviewee)  |
| Verified-contract prerequisite     | Reviews table requires valid foreign key to completed contract|
| Messaging business context         | CHECK (contract_id IS NOT NULL OR proposal_id IS NOT NULL)    |
| Cascade cleanup vs Audit retention | ON DELETE CASCADE for transient drafts; RESTRICT for payments |
+------------------------------------+---------------------------------------------------------------+
```

---

## 9. Live Demonstration Script (Step-by-Step Flow)

### 8-Step Verification of Full Application Lifecycle

1. **Role Switcher:** Select persona **Alice Johnson** (`Client #1`, TechCorp Solutions).
2. **Post Job:** Click `+ Post New Job`, publish *"High-Throughput WebSocket Server"*, budget `$2,800`, select skills `Node.js` and `Redis`.
3. **Switch Persona:** Switch to **Faisal Khan** (`Freelancer #6`, Full-Stack Architect).
4. **Search & Bid:** Filter open jobs by skill `Node.js`, locate Alice's job, submit a proposal ($`$2,600`, 14 days, cover letter).
5. **Award Contract:** Switch back to Alice, inspect submitted bids, click `Award Binding Contract`. Observe Phase 1 escrow ($`$1,300`) atomically locked.
6. **Submit Milestone:** Switch to Faisal, open *My Active Work*, click `Submit Work` on Milestone 1 with GitHub commit notes.
7. **Approve Payout:** Switch to Alice, click `Approve & Release Payment`. Payout disbursed; Milestone 2 auto-funded. Complete Milestone 2 & mark contract complete.
8. **Leave Review & Show Report:** Submit 5-star review. Open **SQL Analytics** tab to verify Faisal's rating and earnings dynamically updated in the **Top Freelancers Leaderboard**.

---

## 10. Non-Trivial SQL Analytics: Leaderboard Query

```sql
SELECT 
    f.freelancer_id,
    CONCAT(u.first_name, ' ', u.last_name) AS freelancer_name,
    f.professional_title,
    f.average_rating,
    f.jobs_completed_count,
    f.total_earnings,
    COUNT(DISTINCT r.review_id) AS reviews_count,
    ROUND(AVG(r.quality_rating), 2) AS avg_quality,
    ROUND(AVG(r.communication_rating), 2) AS avg_communication,
    GROUP_CONCAT(DISTINCT s.skill_name SEPARATOR ', ') AS primary_skills
FROM freelancers f
JOIN users u ON f.freelancer_id = u.user_id
LEFT JOIN reviews r ON f.freelancer_id = r.reviewee_id
LEFT JOIN freelancer_skills fs ON f.freelancer_id = fs.freelancer_id
LEFT JOIN skills s ON fs.skill_id = s.skill_id
GROUP BY f.freelancer_id, u.first_name, u.last_name, f.professional_title,
         f.average_rating, f.jobs_completed_count, f.total_earnings
ORDER BY f.average_rating DESC, f.total_earnings DESC;
```

---

## 11. Engineering Challenges & Lessons Learned

### Challenges Faced
* **MySQL 8.0 Error 3823 on Check Constraints:** Discovered that MySQL 8.0 prohibits multi-column `CHECK` constraints on columns involved in foreign keys with `ON UPDATE CASCADE`. Resolved by adopting `ON UPDATE RESTRICT` for immutable surrogate primary keys.
* **Dual-Role User Modeling:** Representing individuals who both hire and provide freelance services without duplicating authentication credentials. Solved cleanly with Class Table Inheritance.
* **Atomic Financial Invariants:** Preventing race conditions during escrow allocation was achieved using database transaction blocks (`START TRANSACTION ... COMMIT`) and database triggers.

### What We Would Do Differently
* Introduce automated database migration tooling (e.g. Flyway / Prisma migrations) for schema versioning.
* Implement optimistic concurrency locking (`version` column) on milestone rows to handle concurrent web sessions.

---

## 12. Conclusion & Future Roadmap

### Summary of Achievements
* Delivered complete relational DBMS project following academic guidelines (Phases A through E).
* Implemented 15 normalized tables, 14 performance indexes, 4 triggers, and 18 automated integration tests (100% pass rate).
* Built a high-aesthetic, fully functional web prototype with interactive Client, Freelancer, and Admin portals.

### Future Scope
* **Real Payment Gateway Integration:** Connecting Stripe/Razorpay webhooks to transition from simulated to live digital banking.
* **Real-time WebSockets:** Upgrading asynchronous relational message logging to real-time chat with typing indicators.
* **Machine Learning Matching:** Vector embeddings on job scopes and freelancer profiles for automated proposal recommendations.

---

# Thank You!
### Questions & Technical Discussion

**Project Repository:** `c:\Users\Admin\Desktop\dbms project`  
**Database:** `MySQL 8.0 (InnoDB) — freelance_marketplace`  
**Web Server:** `Node.js / Express — http://localhost:5000`  
**Team Table Ninjas:** SVNIT CSE B.Tech II (Semester III)
