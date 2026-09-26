# Project Requirements Specification: Freelance Marketplace

**Course:** CS203 - Database Management Systems  
**Institution:** Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat  
**Department:** Department of Computer Science and Engineering  
**Academic Year:** 2026–27  
**Team Name:** Table Ninjas (3 Members)  
**Project Title:** Freelance Marketplace (Mini-Upwork / Fiverr Database System)  
**Document Phase:** Phase A — Project Requirements & High-Level Task Analysis  

---

## 1. Problem Statement

In today's digital economy, organizations and individual clients frequently require specialized talent for short-term and contract-based projects, while skilled freelancers seek reputable clients and reliable compensation. However, traditional hiring channels often suffer from opaque bidding, lack of verified skill representation, uncoordinated communication, payment risks, and inadequate dispute settlement mechanisms.

The **Freelance Marketplace** is a centralized relational database-driven platform designed to connect **Clients** with qualified **Freelancers**, systematically managing the entire project lifecycle—from initial job posting, discovery, and proposal submission to contract award, milestone-driven escrow release, direct communication, dispute arbitration, and bidirectional reputation building. The system enforces strict relational data integrity, role-based authorization, and transparent audit trails across every transactional step.

---

## 2. Functional Requirements

The system provides targeted capabilities across three primary roles (**Client**, **Freelancer**, **Admin**) as well as core shared platform capabilities.

### 2.1 User Authentication & Role Management
1. **User Registration & Profile Initialization:** Any user can register an account with a unique email, secure credentials, contact details, and account role (`Client`, `Freelancer`, or dual-role).
2. **Role-Based Access Control (RBAC):** The system strictly restricts dashboard access, job actions, proposal submissions, and administrative controls based on the authenticated user's role.
3. **Session & Security Auditing:** The platform tracks user registration timestamps, last login timestamps, and account status (`Active`, `Suspended`, `Deactivated`).

### 2.2 Freelancer Profile & Portfolio Management
4. **Skill Profile Creation:** Freelancers can configure their professional profiles with professional titles, detailed bios, hourly rates, availability status, and overall experience level.
5. **Skill Catalog Association:** Freelancers can associate multiple standardized skills from the system catalog to their profiles, indicating proficiency level (e.g., `Beginner`, `Intermediate`, `Expert`) and years of experience.
6. **Portfolio Showcases:** Freelancers can manage a portfolio repository with project titles, descriptions, live external URLs, completion dates, and associated skill tags.

### 2.3 Job Posting & Discovery
7. **Job Creation:** Clients can publish job requisitions specifying title, detailed scope/description, category, required skill sets, project duration, deadline, budget model (`Fixed-Price` vs. `Hourly`), and budget amount.
8. **Job Status Lifecycle:** The system transitions job postings through structured states: `Draft`, `Open`, `In-Progress`, `Completed`, and `Cancelled`.
9. **Search & Multi-Facet Filtering:** Freelancers can search and filter open jobs dynamically based on required skills, category, minimum/maximum budget, payment type, client rating, and submission deadline.
10. **Client Job Management:** Clients can view, update, close, or cancel their own job postings prior to contract execution.

### 2.4 Proposals & Bidding
11. **Proposal Submission:** Qualified freelancers can submit one bid/proposal per open job, specifying a cover letter, proposed total bid amount, estimated turnaround time, and proposed milestone breakdown.
12. **Proposal Review & Comparison:** Clients can browse all received proposals for their job postings, review applicant profiles, compare bid amounts, inspect portfolio samples, and filter candidates by rating.
13. **Proposal Status Lifecycle:** Proposals progress through deterministic states: `Submitted`, `Shortlisted`, `Accepted`, `Rejected`, or `Withdrawn`.

### 2.5 Contracting & Milestone-Based Execution
14. **Contract Award:** A client awards a contract to a selected freelancer based on an accepted proposal, fixing agreed payment terms, total budget, start date, and target delivery date.
15. **Milestone Definition:** Contracts can be partitioned into sequential milestones, each with a defined title, deliverable description, due date, allocated amount, and approval status (`Pending`, `Funded`, `In-Review`, `Approved`, `Disputed`).
16. **Milestone Submission & Approval:** Freelancers submit work deliverables against funded milestones. Clients review submissions and either request revisions or grant approval.

### 2.6 Financial Tracking & Simulated Escrow
17. **Simulated Wallet Accounts:** Each client and freelancer maintains an internal platform wallet tracking available balance, held/escrow balance, and lifetime earnings/expenditures.
18. **Escrow Funding:** When a milestone is activated, the required milestone funds are deducted from the client's wallet and locked into a platform-held simulated escrow state.
19. **Milestone Payout Release:** Upon client approval of a milestone, the escrowed funds are automatically credited to the freelancer's wallet balance, logging an immutable transaction record.
20. **Transaction Ledger:** Every financial movement (deposit, escrow lock, milestone release, refund, administrative adjustment) generates a traceable transaction log with timestamps, reference IDs, and balance snapshots.

### 2.7 Communication & Messaging Log
21. **Contextual Messaging:** Clients and freelancers can exchange direct text messages tied to an active proposal or contract.
22. **Communication History:** The platform maintains an immutable audit log of sent messages, including sender ID, recipient ID, message payload, and timestamp.

### 2.8 Reviews & Reputation Management
23. **Bidirectional Feedback:** Upon contract completion, both client and freelancer can submit a review and numerical rating (1 to 5 stars) for each other.
24. **Multi-Criteria Scoring:** Ratings record qualitative textual feedback and specific score components (e.g., communication, quality of work, deadline adherence, payment promptness).
25. **Aggregated Reputation Metric:** The system computes and displays aggregate average ratings and total completed contract counts on user public profiles.

### 2.9 Dispute Handling & Administration
26. **Dispute Inception:** Either party can raise a formal dispute on a contested milestone or contract before payment release, specifying grounds (e.g., non-delivery, scope mismatch, unauthorized delay).
27. **Admin Arbitration Dashboard:** Platform administrators can access disputed contracts, inspect contract terms, review communication logs, and examine submitted deliverables.
28. **Dispute Resolution Execution:** Admins can issue binding resolutions: refunding escrow to the client, releasing funds to the freelancer, or executing a proportional split.
29. **Platform Governance:** Admins have privileges to manage the standardized skills catalog, moderate inappropriate job posts, suspend fraudulent accounts, and inspect platform activity metrics.

---

## 3. Non-Functional Requirements

### 3.1 Data Integrity & Consistency (ACID Properties)
- **Financial Atomicity:** Escrow funding, release, and dispute settlements must execute within strict atomic database transactions (`BEGIN TRANSACTION ... COMMIT/ROLLBACK`) to guarantee that funds are neither created nor lost during mid-query interruptions.
- **Referential Integrity:** Strong foreign key constraints with appropriate cascading rules (`ON DELETE RESTRICT` for financial and contract records; `CASCADE` for transient draft metadata) to eliminate orphaned rows.
- **Domain Constraints & Checks:** Mandatory check constraints enforcing positive currency values (`amount > 0`), valid rating ranges (`1 <= rating <= 5`), valid percentage limits, and strict status enumerations.
- **Traceable Auditability:** Critical state transitions (contracts, financial transactions, dispute resolutions) must retain immutable timestamps and actor user references.

### 3.2 Performance & Scalability
- **Search Latency:** Job search and multi-criteria filtering queries must execute within under 200 ms on datasets scaling to tens of thousands of postings through appropriate B-tree indexes on `(status, category_id)`, `(budget)`, and inverted mappings for skills.
- **Indexing Strategy:** Composite indexes on foreign keys and frequently queried filter predicates (e.g., `JobSkills(skill_id, job_id)`, `Proposals(job_id, status)`, `Contracts(client_id, status)`).
- **Concurrency Control:** Isolation levels configured to prevent dirty reads, non-repeatable reads, and phantom updates during concurrent bidding and wallet deduction operations.

### 3.3 Security & Role-Based Access Control
- **Authentication & Credential Security:** Secure password storage utilizing industry-standard salted hashing algorithms (e.g., bcrypt/Argon2); passwords must never be stored in plaintext.
- **Authorization Enforcement:** Data-access security rules ensure freelancers can only view their own drafts/messages and cannot modify contracts awarded to others; clients can only access proposals submitted to their own jobs.
- **Input Sanitization & Injection Defense:** Parameterized queries and prepared statements across all database access layers to completely prevent SQL injection attacks.

### 3.4 Reliability, Availability & Maintainability
- **Database Normalization:** Relational design structured up to Third Normal Form (3NF) / Boyce-Codd Normal Form (BCNF) to eliminate update, insertion, and deletion anomalies while maintaining query efficiency.
- **Audit Logging:** Administrative overrides, account suspensions, and dispute rulings are recorded in dedicated audit tables.
- **Backup & Recovery Readiness:** Schema and data initialization scripts partitioned for reproducible teardown, migration, and seeding.

---

## 4. Scope and Assumptions

### 4.1 In-Scope
- Complete relational database schema modeling the entire freelance marketplace workflow.
- Relational tables with primary keys, foreign keys, default values, checks, and unique constraints.
- Simulated digital wallet and escrow accounting system enforcing debit/credit balance conservation.
- Bidirectional rating computation and aggregated public reputation scoring.
- Comprehensive SQL scripts for table creation (DDL), sample data population (DML), views, stored procedures/triggers for automated wallet updates, and complex queries.
- Functional web prototype demonstrating user registration, job posting, proposal submission, contract creation, milestone release, and admin dispute handling.

### 4.2 Out-of-Scope
- Integration with external banking networks or third-party payment gateways (e.g., Stripe, PayPal, Razorpay). All financial operations are simulated using internal wallet balance registers.
- Real-time WebRTC audio/video calling or real-time typing indicators (communication is handled via asynchronous relational message logs).
- Automated AI-based skill matching or algorithmic proposal ranking (matching is powered by deterministic relational SQL queries based on skills, budget, and ratings).
- Real-world legal tax document generation, VAT/GST compliance, and physical identity verification (KYC).

### 4.3 Key Assumptions
1. **Currency Standardization:** All monetary amounts are recorded in a single uniform currency unit (e.g., USD or INR) using fixed-point decimal arithmetic (`DECIMAL(10, 2)`).
2. **Actor Roles:** A single account can act as a Client or Freelancer based on configured role attributes, with clear separation of actions per transaction.
3. **Internal Simulated Escrow:** Clients must hold sufficient simulated wallet balance before funding a contract milestone.
4. **Administrative Trust:** Platform administrators are trusted actors authorized to mediate disputes and adjust disputed balances as the final authority.

---

## 5. Core Entities Identified

| # | Entity Name | Description |
|---|-------------|-------------|
| 1 | **User** | Central authentication entity holding login credentials, email, user role, contact info, and account status. |
| 2 | **Client** | Extends User with client-specific profile data, company name, billing address, and hiring history. |
| 3 | **Freelancer** | Extends User with professional headline, bio, hourly rate, availability status, and earnings total. |
| 4 | **Skill** | Standardized master catalog of technical, design, and domain competencies available across the platform. |
| 5 | **FreelancerSkill** | Associative entity mapping freelancers to skills with proficiency ratings and years of experience. |
| 6 | **PortfolioItem** | Showcase records created by freelancers highlighting past projects, descriptions, skill tags, and URLs. |
| 7 | **Job** | Project requisitions published by clients detailing title, description, category, budget model, budget, and deadline. |
| 8 | **JobSkill** | Associative entity defining the set of prerequisite or preferred skills required for a particular job. |
| 9 | **Proposal** | Bid submitted by a freelancer for an open job, containing cover letter, bid amount, delivery timeline, and status. |
| 10 | **Contract** | Legally binding work agreement formed when a client accepts a proposal, setting total agreed price and terms. |
| 11 | **Milestone** | Phased project deliverable under a contract, detailing milestone amount, due date, submission details, and status. |
| 12 | **Wallet** | Financial account ledger per user tracking available balance and locked escrow funds. |
| 13 | **Transaction** | Immutable ledger record capturing all monetary transfers (deposit, escrow hold, milestone payout, refund). |
| 14 | **Message** | Threaded direct communication records exchanged between clients and freelancers regarding proposals or contracts. |
| 15 | **Review** | Quantitative (1–5 scale) and qualitative feedback submitted mutually by clients and freelancers post-contract. |
| 16 | **Dispute** | Formal arbitration ticket raised on a contested milestone or contract, containing evidence and admin ruling details. |
| 17 | **AdminAuditLog** | System audit record logging administrative actions such as dispute resolutions, content moderation, and account status changes. |

---

## 6. High-Level Project Tasks (Phase Alignment)

- **Phase A — Project Requirements:** Requirements analysis, scope boundary definition, user stories, and entity identification *(Current Document)*.
- **Phase B — Conceptual Design:** Entity-Relationship (ER) diagram, cardinality and participation constraints, enhanced ER constructs (specialization/generalization for Users/Clients/Freelancers), and attribute minimal cover.
- **Phase C — Logical Design:** Relational schema mapping, normalization up to 3NF/BCNF, functional dependency analysis, and relational integrity rule specification.
- **Phase D — Physical Design:** MySQL/PostgreSQL physical DDL scripts, foreign keys, CHECK constraints, transaction blocks, triggers for automated balance updates, and query optimization via indexing.
- **Phase E — Prototype, Development & Testing:** Interactive web application demonstrating CRUD operations, search queries, contract milestone flows, and dispute resolution.
- **Phase F — Project Presentation & Demonstration:** Slide deck, comprehensive technical report, and live database demonstration for academic evaluation.
