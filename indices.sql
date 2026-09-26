-- =============================================================================
-- Database Management Systems (CS203) - Academic Year 2026-27
-- SVNIT Surat - Department of Computer Science & Engineering
-- Project: Freelance Marketplace (Phase D: Physical Database Implementation)
-- Team: Table Ninjas
-- File: indices.sql
-- =============================================================================

USE freelance_marketplace;

-- -----------------------------------------------------------------------------
-- 1. Index on jobs (job_status, category)
-- Rationale: In a marketplace, the most frequent read query is browsing open
-- jobs within a specific category (e.g., WHERE job_status = 'OPEN' AND category = '...').
-- A composite B-tree index allows MySQL to satisfy both equality filters in a
-- single index scan, avoiding full table scans over thousands of job requisitions.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_jobs_status_category ON jobs (job_status, category);

-- -----------------------------------------------------------------------------
-- 2. Index on jobs (budget)
-- Rationale: Supports fast multi-facet range filtering (e.g., WHERE budget BETWEEN 2000 AND 5000).
-- Combined with status filters, this drastically speeds up marketplace search feeds.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_jobs_budget ON jobs (budget);

-- -----------------------------------------------------------------------------
-- 3. Reverse Index on job_skills (skill_id, job_id)
-- Rationale: While the primary key covers (job_id, skill_id), searching for all
-- jobs that require a specific skill (e.g., "Find all jobs needing React") filters
-- by skill_id first. Under the B-tree leftmost prefix rule, the composite PK cannot
-- accelerate this query. This reverse composite index provides index-only (covering)
-- candidate job matching.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_job_skills_skill_job ON job_skills (skill_id, job_id);

-- -----------------------------------------------------------------------------
-- 4. Reverse Index on freelancer_skills (skill_id, proficiency_level)
-- Rationale: Accelerates recruiter queries searching for freelancers possessing
-- a specific skill at an 'EXPERT' tier.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_fskills_skill_prof ON freelancer_skills (skill_id, proficiency_level);

-- -----------------------------------------------------------------------------
-- 5. Index on proposals (job_id, proposal_status)
-- Rationale: When a client opens their job dashboard, the system fetches all
-- submitted proposals for that job (WHERE job_id = ? AND proposal_status = 'SUBMITTED').
-- This composite index makes proposal list retrieval instant (O(log N)).
-- -----------------------------------------------------------------------------
CREATE INDEX idx_proposals_job_status ON proposals (job_id, proposal_status);

-- -----------------------------------------------------------------------------
-- 6. Index on contracts (client_id, contract_status) & (freelancer_id, contract_status)
-- Rationale: Powers the primary dashboard views for both clients ("My Active Contracts")
-- and freelancers ("My Ongoing Work").
-- -----------------------------------------------------------------------------
CREATE INDEX idx_contracts_client_status ON contracts (client_id, contract_status);
CREATE INDEX idx_contracts_freelancer_status ON contracts (freelancer_id, contract_status);

-- -----------------------------------------------------------------------------
-- 7. Index on milestones (due_date, milestone_status)
-- Rationale: Used by automated background cron jobs and audit monitoring queries
-- to identify overdue or approaching milestones (WHERE due_date < NOW() AND milestone_status != 'APPROVED').
-- -----------------------------------------------------------------------------
CREATE INDEX idx_milestones_due_status ON milestones (due_date, milestone_status);

-- -----------------------------------------------------------------------------
-- 8. Index on payments (contract_id, payment_type)
-- Rationale: Accelerates financial reconciliation queries calculating total escrow
-- vs released payouts for any specific contract.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_payments_contract_type ON payments (contract_id, payment_type);

-- -----------------------------------------------------------------------------
-- 9. Index on payments (sender_id) and (receiver_id)
-- Rationale: Essential for generating personal financial statements and transaction
-- history logs for individual client and freelancer wallet dashboards.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_payments_sender ON payments (sender_id);
CREATE INDEX idx_payments_receiver ON payments (receiver_id);

-- -----------------------------------------------------------------------------
-- 10. Index on reviews (reviewee_id, overall_rating)
-- Rationale: Accelerates public profile loading by allowing index-based retrieval
-- and sorting of all reviews received by a particular freelancer or client.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id, overall_rating);

-- -----------------------------------------------------------------------------
-- 11. Index on messages (contract_id, sent_at) & (proposal_id, sent_at)
-- Rationale: When opening a message thread, direct messages are filtered by
-- conversation context and sorted chronologically (ORDER BY sent_at ASC).
-- This composite index satisfies both filtering and ordering without a filesort.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_messages_contract_sent ON messages (contract_id, sent_at);
CREATE INDEX idx_messages_proposal_sent ON messages (proposal_id, sent_at);
