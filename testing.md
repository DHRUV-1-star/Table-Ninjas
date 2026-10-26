# Test Case Specification & End-to-End Verification Report

**Course:** CS203 - Database Management Systems  
**Institution:** Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat  
**Department:** Department of Computer Science and Engineering  
**Academic Year:** 2026–27  
**Team Name:** Table Ninjas (3 Members)  
**Project Title:** Freelance Marketplace (Table Ninjas Database System)  
**Document Phase:** Phase E — Prototype Testing & Verification  
**Automated Test Script:** `backend/test_suite.js`

---

## 1. Test Environment Summary
- **Operating System:** Windows 11
- **Database Engine:** MySQL Server 8.0.46 (InnoDB Engine, UTF-8 Unicode)
- **Application Server:** Node.js v24.19.0, Express.js 4.19.2, `mysql2` 3.9.7
- **Test Protocol:** 18 automated integration and edge-case tests executed sequentially via `node backend/test_suite.js`.

---

## 2. Test Cases: Main Business Flows

| Test ID | Test Scenario | Input Data / Endpoint | Expected Behavior | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | **Server & Database Health** | `GET /api/health` | HTTP 200, status `'healthy'`, counts returned from all core tables. | HTTP 200, DB connected, 14 users, 16 jobs, 25 proposals. | **PASS** |
| **TC-02** | **Catalog Retrieval** | `GET /api/skills` | HTTP 200, array of at least 15 standardized skills with categories. | HTTP 200, 18 standardized skills returned. | **PASS** |
| **TC-03** | **Client Posts Job** | `POST /api/jobs`<br>Payload: `client_id=1`, `title='Automated Test WebSocket Service'`, `budget=2500.00`, `duration_days=15`, `deadline='2026-06-30'`, `skill_ids=[2, 16]` | HTTP 201 Created, returns generated `job_id`, inserts into `jobs` and `job_skills`. | HTTP 201 Created, `job_id=17` generated, skills linked. | **PASS** |
| **TC-04** | **Job Search & Filtering** | `GET /api/jobs?skill_id=2&search=Automated` | HTTP 200, returns job matching skill #2 (Node.js) and keyword 'Automated'. | HTTP 200, job #17 retrieved with matched required skills. | **PASS** |
| **TC-05** | **Freelancer Submits Proposal** | `POST /api/proposals`<br>Payload: `job_id=17`, `freelancer_id=6`, `bid_amount=2400.00`, `estimated_delivery_days=12` | HTTP 201 Created, returns `proposal_id`, records bid in `proposals`. | HTTP 201 Created, `proposal_id=26` created with status `SUBMITTED`. | **PASS** |
| **TC-06** | **Award Contract from Proposal** | `POST /api/contracts/award`<br>Payload: `proposal_id=26` | HTTP 201 Created; atomically: marks proposal `ACCEPTED`, rival bids `REJECTED`, job `IN_PROGRESS`, creates `contracts`, creates 2 milestones, creates `ESCROW_LOCK` payment. | HTTP 201 Created, `contract_id=12` generated, 2 milestones funded/pending, escrow locked. | **PASS** |
| **TC-07** | **Contract State Verification** | `GET /api/contracts/12` | HTTP 200, returns contract with status `ACTIVE`, 2 child milestones, and 1 payment record. | HTTP 200, contract verified with 2 milestones. | **PASS** |
| **TC-08** | **Submit Milestone 1 Deliverable** | `PATCH /api/milestones/12/1/submit`<br>Payload: `submission_notes='PR #101 merged with 98% test coverage'` | HTTP 200, updates `milestone_status` to `'IN_REVIEW'`, records submission timestamp. | HTTP 200, milestone transitioned to `IN_REVIEW`. | **PASS** |
| **TC-09** | **Approve Milestone 1 & Escrow Release** | `POST /api/milestones/12/1/approve-pay` | HTTP 200, milestone marked `'APPROVED'`, `MILESTONE_RELEASE` payment created, milestone 2 auto-funded. | HTTP 200, milestone approved, payout logged, trigger updated freelancer earnings. | **PASS** |
| **TC-10** | **Milestone 2 Approval** | `POST /api/milestones/12/2/approve-pay` | HTTP 200, milestone 2 marked `'APPROVED'`, final payout logged. | HTTP 200, all milestones marked `APPROVED`. | **PASS** |
| **TC-11** | **Contract Completion** | `POST /api/contracts/12/complete` | HTTP 200, sets contract and job to `'COMPLETED'`, trigger increments freelancer completed jobs count. | HTTP 200, contract and job marked `COMPLETED`. | **PASS** |
| **TC-12** | **Submit Verified Review** | `POST /api/reviews`<br>Payload: `contract_id=12`, `reviewer_id=1`, `reviewee_id=6`, `overall_rating=5`, `feedback_comment='Outstanding performance...'` | HTTP 201 Created, saves review in `reviews`, trigger recalculates `freelancers.average_rating`. | HTTP 201 Created, `review_id=13` created, rating recalculated. | **PASS** |

---

## 3. Test Cases: Edge Cases & Business Constraint Enforcement

| Test ID | Edge Case Scenario | Test Input / Action | Expected Behavior | Actual Result | Status |
|---|---|---|---|---|---|
| **EC-01** | **Duplicate Bidding Invariant** | Freelancer #6 attempts to submit a second proposal to Job #17. | HTTP 400 Bad Request, rejected by `UNIQUE(job_id, freelancer_id)` constraint. | HTTP 400 Bad Request: *"You have already submitted a proposal for this job."* | **PASS** |
| **EC-02** | **Self-Bidding Prohibition** | Client #1 (Alice) attempts to submit a proposal to her own posted Job #17. | HTTP 400 Bad Request, caught by `trg_prevent_self_bidding` trigger. | HTTP 400 Bad Request: *"Business Rule Violation: Clients cannot bid on their own jobs."* | **PASS** |
| **EC-03** | **Deletion Restriction on Contracted Jobs** | Client attempts `DELETE /api/jobs/17` while Job #17 has an active/completed contract. | HTTP 400 Bad Request, foreign key & relational integrity check prevents deletion. | HTTP 400 Bad Request: *"Cannot delete job: an active or completed contract is linked to this job."* | **PASS** |
| **EC-04** | **Unverified Review Rejection** | Attempting to submit a review on a contract whose status is `ACTIVE` (not yet completed). | HTTP 400 Bad Request: *"Reviews are only allowed on COMPLETED contracts."* | HTTP 400 Bad Request rejected with descriptive error message. | **PASS** |
| **EC-05** | **Self-Review Rejection** | A user attempts to submit a review where `reviewer_id == reviewee_id`. | HTTP 400 Bad Request, rejected by `chk_reviews_distinct` constraint. | HTTP 400 Bad Request: *"Reviewer cannot review themselves."* | **PASS** |
| **EC-06** | **Negative / Zero Bid Amount** | Submitting a proposal with `bid_amount = -50.00` or `0.00`. | HTTP 400 Bad Request, rejected by `chk_proposals_bid` constraint. | HTTP 400 Bad Request: *"Bid amount must be positive."* | **PASS** |

---

## 4. Test Cases: Non-Trivial Analytical Reports

| Test ID | Report Scenario | SQL Mechanics Tested | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **AN-01** | **Leaderboard: Top Freelancers by Rating** | `GET /api/reports/top-freelancers`<br>Query uses: `JOIN freelancers f JOIN users u LEFT JOIN reviews r GROUP BY f.freelancer_id ORDER BY average_rating DESC, total_earnings DESC` | Correctly ranks freelancers by rating, computes live review counts and sub-criteria averages. | Returns 8 freelancers; top ranked: Faisal Khan (⭐ 5.00, $8,700 earned), Liam Chen (⭐ 5.00), Grace Hopper (⭐ 5.00). | **PASS** |
| **AN-02** | **Enterprise Client Summary Rollup** | `GET /api/reports/client-summary`<br>Query uses: `JOIN clients c JOIN users u LEFT JOIN contracts ct GROUP BY c.client_id ORDER BY total_spent DESC` | Aggregates total spent, jobs posted count, active contracts, and total contract commitments per client. | Returns 6 clients; FinStart Capital ($7,850 spent) and TechCorp Solutions ($5,550 spent) rolled up accurately. | **PASS** |

---

## 5. Summary & Academic Conformance
- **Total Test Cases Executed:** 18
- **Tests Passed:** 18 (100% Pass Rate)
- **Tests Failed:** 0
- **Verification Verdict:** All Phase B conceptual constraints and Phase D relational triggers were successfully tested and verified against the running MySQL 8.0 server and Express REST API.
