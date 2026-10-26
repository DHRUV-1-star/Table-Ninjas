# Freelance Marketplace — Database Application Prototype

**Course:** Database Management Systems (CS203) — Academic Year 2026–27  
**Department:** Computer Science and Engineering, Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat  
**Team Name:** Table Ninjas (3 Members)  
**Project Title:** Freelance Marketplace (Table Ninjas Database System)  

---

## 1. Project Overview

The **Freelance Marketplace** is a relational database-driven web application designed to connect clients seeking short-term and contract-based talent with qualified freelancers. The system models and manages the full hiring lifecycle:
- Standardized skill cataloging and proficiency mapping
- Job posting, search, and multi-facet filtering (by category, skill, budget)
- Proposal bidding and contract awarding with sequential milestones
- Simulated digital wallet accounting with escrow locking and payout releases
- Verified bidirectional reputation reviews post-contract
- Administrative dispute arbitration and audit trails

The database is built on **MySQL 8.0 (InnoDB Engine)** and is fully normalized up to **3NF/BCNF** with ACID transaction support, foreign key referential integrity, domain check constraints, and automated business triggers.

---

## 2. Directory Structure

```
dbms project/
├── requirements.md            # Phase A: Requirements specification & entity analysis
├── conceptual_design.md        # Phase B: Conceptual ER model & Mermaid diagram
├── logical_design.md           # Phase C: Relational schema mapping & normalization
├── design_justification.md     # Phase D: MySQL engine, indexing, & trigger justifications
├── testing.md                  # Phase E: Test case specification (18 automated tests)
├── README.md                   # Setup instructions & developer guide
├── db/                         # Database scripts directory
│   ├── schema.sql              # MySQL DDL with all 16 tables, constraints & triggers
│   ├── seed_data.sql           # Realistic seed dataset (14 users, 17 jobs, 25 proposals, 11 contracts)
│   ├── indices.sql             # B-tree performance indexes & covering reverse indexes
│   └── crud_examples.sql       # Analytical queries & transaction flows
├── backend/                    # Node.js Express REST API
│   ├── server.js               # REST API endpoints & static SPA server
│   ├── db.js                   # MySQL2 connection pool configuration
│   ├── package.json            # Node.js dependencies
│   ├── test_suite.js           # Automated end-to-end integration test runner
│   └── .env                    # Database environment configuration
└── frontend/                   # Interactive Single-Page Web Prototype
    ├── index.html              # Modern HTML5 layout with Table Ninjas branding
    ├── style.css               # Modern design system & Table Ninjas styling
    └── app.js                  # Frontend controller, state management, & API client
```

---

## 3. Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v18.x, v20.x, or v24.x) and **npm**
2. **MySQL Server 8.0+** (running on port `3306`)

---

## 4. Database Setup & Initialization

### Step 1: Open Terminal in the Project Root
```bash
cd "c:\Users\Admin\Desktop\dbms project"
```

### Step 2: Initialize Database and Seed Data
Execute the SQL scripts in sequence using the `mysql` CLI:

```bash
# 1. Create database schema, tables, constraints, and triggers
mysql -u root -p -e "source db/schema.sql"

# 2. Populate realistic seed data across all entities
mysql -u root -p -e "source db/seed_data.sql"

# 3. Create performance B-tree indexes
mysql -u root -p -e "source db/indices.sql"

# 4. (Optional) Run sample analytical queries and transactions
mysql -u root -p -e "source db/crud_examples.sql"
```

---

## 5. Backend Configuration & Launch

### Step 1: Configure Environment Variables
Verify or edit `backend/.env`:
```ini
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=freelance_marketplace
```

### Step 2: Install Node.js Dependencies
```bash
cd backend
npm install
```

### Step 3: Start the Backend Server
```bash
# Production mode
npm start

# Or development watch mode
npm run dev
```

The server will initialize on **`http://localhost:5000`** with the message:
```
[API Server] Running on http://localhost:5000
[DB] Connected successfully to MySQL database "freelance_marketplace" on 127.0.0.1:3306
```

---

## 6. Accessing the Web Application Prototype

Open your web browser and navigate to:
👉 **`http://localhost:5000/`**

### Key Prototype Features & How to Test:

1. **Active Persona Switcher (Top Right Bar):**
   - Seamlessly switch between different personas:
     - **Alice Johnson / Bob Smith** (Clients)
     - **Faisal Khan / Grace Hopper** (Freelancers)
     - **Admin Super** (System Administrator)
     - **Mona Lisa** (Dual-Role User)

2. **Client Portal:**
   - **Post a Job:** Click `+ Post New Job`, fill in budget, deadline, category, and multi-select required skills.
   - **Inspect Proposals:** On your posted jobs, click `Inspect Bids` to view applicant cover letters and ratings. Click `Award Binding Contract` to award the job (locks Phase 1 into simulated escrow).
   - **Manage Milestones:** Under `My Contracts & Milestone Payouts`, inspect deliverables submitted by the freelancer and click `Approve & Release Payment`.
   - **Leave Reviews:** Once all milestones are approved and the contract is completed, click `⭐ Leave Review`.

3. **Freelancer Hub:**
   - **Search & Multi-Facet Filtering:** Filter open jobs in real time by keyword search, required skill, category, and min/max budget range.
   - **Submit Bid:** Click `Submit Bid` on any open job to enter your bid amount, delivery timeline, and pitch.
   - **Submit Deliverables:** Under `My Active Work`, click `Submit Work` on any active milestone to provide deliverable notes and repository links.
   - **Profile & Reputation:** View your dynamically calculated average rating, verified reviews count, and lifetime earnings.

4. **Admin Console:**
   - Review platform statistics (total users, jobs, active contracts).
   - **Dispute Arbitration Desk:** Inspect flagged dispute tickets and resolve them with binding administrative rulings (`Payout Freelancer` or `Refund Client`).
   - Audit the platform users directory.

5. **SQL Analytics & Reporting:**
   - **Leaderboard:** Ranks top freelancers using multi-table aggregation queries (`JOIN`, `GROUP BY`, `AVG`, `COUNT`).
   - **Enterprise Client Rollup:** Inspects client expenditure, contract awards, and active commitments.

---

## 7. Running the Automated Test Suite

To run all 18 automated integration test cases verifying main workflows and business rule edge cases:

```bash
cd backend
node test_suite.js
```

**Expected Output:**
```
=== STARTING AUTOMATED TEST SUITE ===
[PASS] API Server is healthy and DB is connected
[PASS] Skills catalog returns 18+ standardized skills
[PASS] Main Flow 1: Client posts a new job
[PASS] Read/Search: Filter job by skill and keyword
[PASS] Main Flow 2: Freelancer submits proposal
[PASS] Edge Case 1: Duplicate bid rejected
[PASS] Edge Case 2: Self-bidding strictly prohibited
[PASS] Main Flow 3: Client awards contract and locks escrow
[PASS] Contract verification: Status is ACTIVE with 2 milestones
[PASS] Edge Case 3: Deletion of job with active contract rejected
[PASS] Main Flow 4: Freelancer submits Milestone 1 deliverable
[PASS] Main Flow 5: Client approves Milestone 1 and dispatches payout
[PASS] Main Flow 6: Milestone 2 approved and paid
[PASS] Edge Case 4: Review rejected before contract completion
[PASS] Main Flow 7: Contract marked COMPLETED
[PASS] Main Flow 8: Verified review submitted post-contract
[PASS] Non-trivial SQL Report: Top freelancers leaderboard using JOIN + GROUP BY + AVG
[PASS] Non-trivial SQL Report: Client spending and contract volume rollup

=== TEST RESULTS: 18 PASSED, 0 FAILED ===
```

For full test scenario specifications, see [testing.md](file:///c:/Users/Admin/Desktop/dbms%20project/testing.md).

---

## 8. Academic Evaluation Team
- **Team Name:** Table Ninjas (3 Members)
- **Course:** CS203 Database Management Systems, SVNIT Surat
- **Submission Date:** Academic Year 2026–27
