-- =============================================================================
-- Database Management Systems (CS203) - Academic Year 2026-27
-- SVNIT Surat - Department of Computer Science & Engineering
-- Project: Freelance Marketplace (Phase D: Physical Database Implementation)
-- Team: Table Ninjas
-- File: crud_examples.sql
-- =============================================================================

USE freelance_marketplace;

-- =============================================================================
-- SECTION 1: CORE SELECT QUERIES (BUSINESS ANALYTICS & MARKETPLACE RETRIEVAL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Query 1: Search Open Jobs by Skill (e.g., Finding all open jobs requiring 'React')
-- Uses: Reverse index on job_skills(skill_id, job_id) and jobs(job_status)
-- -----------------------------------------------------------------------------
SELECT 
    j.job_id,
    j.title AS job_title,
    c.company_name,
    j.category,
    j.payment_type,
    j.budget,
    j.duration_days,
    j.deadline,
    s.skill_name AS matched_skill,
    js.is_mandatory
FROM jobs j
JOIN clients c ON j.client_id = c.client_id
JOIN job_skills js ON j.job_id = js.job_id
JOIN skills s ON js.skill_id = s.skill_id
WHERE s.skill_name = 'React' 
  AND j.job_status = 'OPEN'
ORDER BY j.budget DESC;

-- -----------------------------------------------------------------------------
-- Query 2: Multi-Facet Search by Category, Budget Range, and Experience Tier
-- Uses: idx_jobs_status_category and idx_jobs_budget
-- -----------------------------------------------------------------------------
SELECT 
    j.job_id,
    j.title,
    j.category,
    j.budget,
    j.experience_level,
    j.deadline,
    COUNT(p.proposal_id) AS total_proposals_received
FROM jobs j
LEFT JOIN proposals p ON j.job_id = p.job_id
WHERE j.job_status = 'OPEN'
  AND j.budget BETWEEN 1500.00 AND 5000.00
GROUP BY j.job_id, j.title, j.category, j.budget, j.experience_level, j.deadline
ORDER BY j.budget DESC;

-- -----------------------------------------------------------------------------
-- Query 3: List a Freelancer's Active Contracts with Client Details & Pending Milestones
-- Example: Active contracts for Freelancer #6 (Faisal Khan)
-- -----------------------------------------------------------------------------
SELECT 
    c.contract_id,
    j.title AS job_title,
    CONCAT(u_client.first_name, ' ', u_client.last_name) AS client_name,
    cl.company_name,
    c.agreed_amount,
    c.start_date,
    c.contract_status,
    m.milestone_seq_no,
    m.title AS milestone_title,
    m.amount AS milestone_amount,
    m.due_date,
    m.milestone_status
FROM contracts c
JOIN jobs j ON c.job_id = j.job_id
JOIN clients cl ON c.client_id = cl.client_id
JOIN users u_client ON cl.client_id = u_client.user_id
JOIN milestones m ON c.contract_id = m.contract_id
WHERE c.freelancer_id = 6 
  AND c.contract_status = 'ACTIVE'
ORDER BY m.due_date ASC;

-- -----------------------------------------------------------------------------
-- Query 4: Compute a Freelancer's Average Rating Dynamically vs. Denormalized Column
-- Compares live computed aggregate from reviews table against cached column in freelancers table.
-- -----------------------------------------------------------------------------
SELECT 
    f.freelancer_id,
    CONCAT(u.first_name, ' ', u.last_name) AS freelancer_name,
    f.average_rating AS cached_average_rating,
    ROUND(AVG(r.overall_rating), 2) AS dynamically_computed_average,
    ROUND(AVG(r.communication_rating), 2) AS avg_communication,
    ROUND(AVG(r.quality_rating), 2) AS avg_quality,
    ROUND(AVG(r.adherence_rating), 2) AS avg_punctuality,
    COUNT(r.review_id) AS total_reviews_received
FROM freelancers f
JOIN users u ON f.freelancer_id = u.user_id
LEFT JOIN reviews r ON f.freelancer_id = r.reviewee_id
GROUP BY f.freelancer_id, u.first_name, u.last_name, f.average_rating;

-- -----------------------------------------------------------------------------
-- Query 5: Identify Overdue or Imminently Pending Milestones
-- Identifies deliverables past due date where work has not been finalized.
-- -----------------------------------------------------------------------------
SELECT 
    m.contract_id,
    m.milestone_seq_no,
    m.title AS milestone_name,
    m.amount,
    m.due_date,
    DATEDIFF(CURRENT_DATE, m.due_date) AS days_overdue,
    m.milestone_status,
    CONCAT(uf.first_name, ' ', uf.last_name) AS assigned_freelancer,
    uf.email AS freelancer_email,
    CONCAT(uc.first_name, ' ', uc.last_name) AS client_name
FROM milestones m
JOIN contracts c ON m.contract_id = c.contract_id
JOIN users uf ON c.freelancer_id = uf.user_id
JOIN users uc ON c.client_id = uc.user_id
WHERE m.milestone_status IN ('PENDING', 'FUNDED', 'IN_REVIEW')
  AND m.due_date <= CURRENT_DATE
ORDER BY days_overdue DESC;

-- -----------------------------------------------------------------------------
-- Query 6: Total Financial Volume per Client (Escrow Locked vs Released vs Net)
-- Comprehensive ledger rollup of financial transactions.
-- -----------------------------------------------------------------------------
SELECT 
    cl.client_id,
    cl.company_name,
    CONCAT(u.first_name, ' ', u.last_name) AS client_rep,
    cl.total_spent AS cached_total_spent,
    COALESCE(SUM(CASE WHEN p.payment_type = 'ESCROW_LOCK' THEN p.amount ELSE 0 END), 0.00) AS total_escrow_deposited,
    COALESCE(SUM(CASE WHEN p.payment_type = 'MILESTONE_RELEASE' THEN p.amount ELSE 0 END), 0.00) AS total_milestones_released,
    COALESCE(SUM(CASE WHEN p.payment_type = 'REFUND' THEN p.amount ELSE 0 END), 0.00) AS total_refunded
FROM clients cl
JOIN users u ON cl.client_id = u.user_id
LEFT JOIN contracts c ON cl.client_id = c.client_id
LEFT JOIN payments p ON c.contract_id = p.contract_id
GROUP BY cl.client_id, cl.company_name, u.first_name, u.last_name, cl.total_spent
ORDER BY total_milestones_released DESC;


-- =============================================================================
-- SECTION 2: TRANSACTIONAL CRUD OPERATIONS (SIMULATING PRODUCTION LIFECYCLE)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transaction 1: Freelancer Submits a New Bid on an Open Job (INSERT)
-- Freelancer #10 (Jack Ryan) bids on Job #11 ('GraphQL Gateway Implementation')
-- -----------------------------------------------------------------------------
START TRANSACTION;

INSERT INTO proposals (
    job_id,
    freelancer_id,
    bid_amount,
    estimated_delivery_days,
    cover_letter,
    proposal_status,
    submitted_at
) VALUES (
    11,
    10,
    2550.00,
    22,
    'I have built high-concurrency GraphQL gateways using Go and Node.js. Can deliver schema stitching and DataLoader caching.',
    'SUBMITTED',
    NOW()
);

-- Send an initial inquiry message attached to the proposal
INSERT INTO messages (
    contract_id,
    proposal_id,
    sender_id,
    receiver_id,
    message_body,
    sent_at,
    is_read
) VALUES (
    NULL,
    LAST_INSERT_ID(),
    10,
    1,
    'Hello Alice, I have submitted a proposal for the GraphQL gateway and am available for a brief scoping call.',
    NOW(),
    FALSE
);

COMMIT;

-- Verify the new proposal
SELECT * FROM proposals WHERE job_id = 11 AND freelancer_id = 10;

-- -----------------------------------------------------------------------------
-- Transaction 2: Client Reviews and Accepts Proposal -> Contract Award (UPDATE & INSERT)
-- Client #1 accepts Proposal #19 (from Freelancer #6 for Job #11)
-- -----------------------------------------------------------------------------
START TRANSACTION;

-- 1. Mark accepted proposal
UPDATE proposals 
SET proposal_status = 'ACCEPTED' 
WHERE proposal_id = 19;

-- 2. Reject rival proposals for the same job
UPDATE proposals 
SET proposal_status = 'REJECTED' 
WHERE job_id = 11 AND proposal_id <> 19;

-- 3. Update job status to IN_PROGRESS
UPDATE jobs 
SET job_status = 'IN_PROGRESS' 
WHERE job_id = 11;

-- 4. Create binding contract
INSERT INTO contracts (
    contract_id,
    job_id,
    proposal_id,
    client_id,
    freelancer_id,
    agreed_amount,
    start_date,
    end_date,
    contract_status,
    created_at
) VALUES (
    11,
    11,
    19,
    1,
    6,
    2500.00,
    CURRENT_DATE,
    NULL,
    'ACTIVE',
    NOW()
);

-- 5. Define two sequential milestones under the contract
INSERT INTO milestones (contract_id, milestone_seq_no, title, deliverable_description, amount, due_date, milestone_status) VALUES
(11, 1, 'Federated Schema & Apollo Core', 'Core schema stitched across services with JWT authentication.', 1200.00, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'FUNDED'),
(11, 2, 'DataLoader Caching & QA Testing', 'N+1 query resolution with DataLoader and stress tests.',          1300.00, DATE_ADD(CURRENT_DATE, INTERVAL 22 DAY), 'PENDING');

-- 6. Lock Milestone 1 funds into Escrow (Client #1 to Admin Escrow #14)
INSERT INTO payments (
    contract_id,
    milestone_seq_no,
    sender_id,
    receiver_id,
    amount,
    payment_type,
    payment_status,
    created_at
) VALUES (
    11,
    1,
    1,
    14,
    1200.00,
    'ESCROW_LOCK',
    'COMPLETED',
    NOW()
);

COMMIT;

-- Verify the new active contract and its milestones
SELECT * FROM contracts WHERE contract_id = 11;
SELECT * FROM milestones WHERE contract_id = 11;

-- -----------------------------------------------------------------------------
-- Transaction 3: Freelancer Submits Deliverable & Client Approves Payout (UPDATE & INSERT)
-- Freelancer #6 submits Milestone 1 of Contract #11, client approves and releases escrow
-- -----------------------------------------------------------------------------
START TRANSACTION;

-- Step A: Freelancer submits deliverable
UPDATE milestones 
SET submission_notes = 'PR #42 merged: github.com/techcorp/graphql-gw/pull/42',
    submission_date = NOW(),
    milestone_status = 'IN_REVIEW'
WHERE contract_id = 11 AND milestone_seq_no = 1;

-- Step B: Client reviews and approves milestone
UPDATE milestones 
SET milestone_status = 'APPROVED'
WHERE contract_id = 11 AND milestone_seq_no = 1;

-- Step C: Release Escrow to Freelancer (Platform Escrow #14 -> Freelancer #6)
-- Note: Trigger trg_after_payment_complete will automatically increment Freelancer earnings and Client total_spent!
INSERT INTO payments (
    contract_id,
    milestone_seq_no,
    sender_id,
    receiver_id,
    amount,
    payment_type,
    payment_status,
    created_at
) VALUES (
    11,
    1,
    14,
    6,
    1200.00,
    'MILESTONE_RELEASE',
    'COMPLETED',
    NOW()
);

COMMIT;

-- Verify payment execution and automated trigger update
SELECT * FROM payments WHERE contract_id = 11;
SELECT freelancer_id, total_earnings FROM freelancers WHERE freelancer_id = 6;

-- -----------------------------------------------------------------------------
-- Transaction 4: Submitting a Review Post-Contract (INSERT)
-- Client leaves rating for completed work
-- -----------------------------------------------------------------------------
START TRANSACTION;

INSERT INTO reviews (
    contract_id,
    reviewer_id,
    reviewee_id,
    overall_rating,
    communication_rating,
    quality_rating,
    adherence_rating,
    feedback_comment,
    created_at
) VALUES (
    8,
    11,
    3,
    5,
    5,
    5,
    5,
    'Carol and CloudScale were phenomenal clients. Clear scopes and fast verification of penetration tests.',
    NOW()
);

COMMIT;

-- -----------------------------------------------------------------------------
-- Transaction 5: Deleting an Unused Draft or Portfolio Item (DELETE)
-- Clean deletion of a freelancer portfolio entry
-- -----------------------------------------------------------------------------
START TRANSACTION;

-- Insert temporary portfolio showcase
INSERT INTO portfolio_items (freelancer_id, title, description, project_url, completion_date)
VALUES (6, 'Temporary Concept Project', 'Obsolete work sample', 'https://example.com/draft', CURRENT_DATE);

-- Retrieve ID
SET @temp_item_id = LAST_INSERT_ID();

-- Delete the record
DELETE FROM portfolio_items WHERE portfolio_id = @temp_item_id;

COMMIT;

-- Confirm deletion
SELECT COUNT(*) AS should_be_zero FROM portfolio_items WHERE portfolio_id = @temp_item_id;
