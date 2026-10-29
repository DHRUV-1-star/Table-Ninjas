-- =============================================================================
-- Database Management Systems (CS203) - Academic Year 2026-27
-- SVNIT Surat - Department of Computer Science & Engineering
-- Project: Freelance Marketplace (Table Ninjas)
-- File: procedures.sql
-- Purpose: PL/SQL-style stored program library for the MySQL backend.
--          This file loads server-side stored procedures and functions that
--          the Express REST API uses instead of raw ad-hoc SQL.
-- =============================================================================

-- =============================================================================
-- 1. User & Authentication Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_register_user;
DELIMITER $$
CREATE PROCEDURE sp_register_user(
    IN  p_email         VARCHAR(120),
    IN  p_password_hash VARCHAR(255),
    IN  p_first_name    VARCHAR(50),
    IN  p_last_name     VARCHAR(50),
    IN  p_phone         VARCHAR(20),
    IN  p_user_role     VARCHAR(20),
    OUT o_user_id       INT
)
BEGIN
    DECLARE v_email_exists INT DEFAULT 0;

    IF INSTR(p_email, '@') = 0 OR INSTR(p_email, '.') = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid email address syntax.';
    END IF;

    SELECT COUNT(*) INTO v_email_exists
    FROM users
    WHERE LOWER(email) = LOWER(p_email);

    IF v_email_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email already registered in system.';
    END IF;

    INSERT INTO users (
        email, password_hash, first_name, last_name, phone,
        user_role, account_status, created_at
    ) VALUES (
        LOWER(p_email), p_password_hash, p_first_name, p_last_name,
        p_phone, p_user_role, 'ACTIVE', NOW()
    );

    SET o_user_id = LAST_INSERT_ID();
    SELECT CONCAT('SUCCESS: User registered with ID: ', o_user_id) AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_user;
DELIMITER $$
CREATE PROCEDURE sp_update_user(
    IN  p_user_id            INT,
    IN  p_new_password_hash  VARCHAR(255),
    IN  p_new_status         VARCHAR(20),
    IN  p_record_login       TINYINT(1)
)
BEGIN
    DECLARE v_user_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_user_exists
    FROM users
    WHERE user_id = p_user_id;

    IF v_user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: User ID does not exist.';
    END IF;

    UPDATE users
    SET password_hash  = COALESCE(p_new_password_hash, password_hash),
        account_status = COALESCE(p_new_status, account_status),
        last_login     = CASE WHEN p_record_login = 1 THEN NOW() ELSE last_login END
    WHERE user_id = p_user_id;

    SELECT CONCAT('SUCCESS: User ID ', p_user_id, ' updated successfully.') AS status_message;
END$$
DELIMITER ;

-- =============================================================================
-- 2. Job Management Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_insert_job;
DELIMITER $$
CREATE PROCEDURE sp_insert_job(
    IN  p_client_id     INT,
    IN  p_title         VARCHAR(150),
    IN  p_description   TEXT,
    IN  p_category      VARCHAR(60),
    IN  p_payment_type  VARCHAR(20),
    IN  p_budget        DECIMAL(10,2),
    IN  p_experience    VARCHAR(20),
    IN  p_duration_days INT,
    IN  p_deadline      DATE,
    OUT o_job_id        INT
)
BEGIN
    DECLARE v_client_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_client_exists
    FROM clients
    WHERE client_id = p_client_id;

    IF v_client_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Client validation failed: specified client_id does not exist.';
    END IF;

    IF p_budget <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Domain error: budget must be greater than zero.';
    END IF;

    IF p_duration_days <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Domain error: duration_days must be positive.';
    END IF;

    IF p_deadline <= CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Domain error: deadline must be a future date.';
    END IF;

    INSERT INTO jobs (
        client_id, title, description, category, payment_type,
        budget, experience_level, duration_days, deadline, job_status
    ) VALUES (
        p_client_id, p_title, p_description, p_category, p_payment_type,
        p_budget, p_experience, p_duration_days, p_deadline, 'OPEN'
    );

    SET o_job_id = LAST_INSERT_ID();

    UPDATE clients
    SET jobs_posted_count = jobs_posted_count + 1
    WHERE client_id = p_client_id;

    SELECT CONCAT('SUCCESS: Job created with ID: ', o_job_id) AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_job;
DELIMITER $$
CREATE PROCEDURE sp_delete_job(IN p_job_id INT)
BEGIN
    DECLARE v_contract_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_contract_count
    FROM contracts
    WHERE job_id = p_job_id;

    IF v_contract_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete job: an active or completed contract is linked to this job.';
    END IF;

    DELETE FROM jobs WHERE job_id = p_job_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Job not found.';
    END IF;

    SELECT CONCAT('SUCCESS: Job ', p_job_id, ' deleted.') AS status_message;
END$$
DELIMITER ;


-- =============================================================================
-- 3. Proposal / Bidding Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_submit_proposal;
DELIMITER $$
CREATE PROCEDURE sp_submit_proposal(
    IN  p_job_id        INT,
    IN  p_freelancer_id INT,
    IN  p_bid_amount            DECIMAL(10,2),
    IN  p_estimated_days        INT,
    IN  p_cover_letter          TEXT,
    OUT o_proposal_id   INT
)
BEGIN
    DECLARE v_client_id  INT;
    DECLARE v_job_status VARCHAR(20);

    SELECT client_id, job_status
    INTO v_client_id, v_job_status
    FROM jobs
    WHERE job_id = p_job_id;

    IF v_client_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Job not found.';
    END IF;

    IF v_job_status <> 'OPEN' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot submit proposal: job is not OPEN.';
    END IF;

    IF p_freelancer_id = v_client_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Business rule violation: clients cannot bid on their own jobs.';
    END IF;

    IF p_bid_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bid amount must be positive.';
    END IF;

    IF p_estimated_days <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Estimated delivery days must be positive.';
    END IF;

    INSERT INTO proposals (
        job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter, proposal_status
    ) VALUES (
        p_job_id, p_freelancer_id, p_bid_amount, p_estimated_days, p_cover_letter, 'SUBMITTED'
    );

    SET o_proposal_id = LAST_INSERT_ID();
    SELECT CONCAT('SUCCESS: Proposal submitted with ID: ', o_proposal_id) AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_list_proposals;
DELIMITER $$
CREATE PROCEDURE sp_list_proposals(
    IN  p_job_id        INT,
    IN  p_freelancer_id INT
)
BEGIN
    SELECT
        p.*,
        j.title AS job_title,
        j.budget AS job_budget,
        j.job_status,
        c.company_name,
        CONCAT(uc.first_name, ' ', uc.last_name) AS client_name,
        CONCAT(uf.first_name, ' ', uf.last_name) AS freelancer_name,
        f.professional_title,
        f.average_rating
    FROM proposals p
    JOIN jobs j ON p.job_id = j.job_id
    JOIN clients c ON j.client_id = c.client_id
    JOIN users uc ON c.client_id = uc.user_id
    JOIN freelancers f ON p.freelancer_id = f.freelancer_id
    JOIN users uf ON f.freelancer_id = uf.user_id
    WHERE 1=1
      AND (p_job_id IS NULL OR p.job_id = p_job_id)
      AND (p_freelancer_id IS NULL OR p.freelancer_id = p_freelancer_id)
    ORDER BY p.submitted_at DESC;
END$$
DELIMITER ;

DELIMITER ;


-- =============================================================================
-- 4. Contract Management Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_award_contract;
DELIMITER $$
CREATE PROCEDURE sp_award_contract(
    IN  p_proposal_id INT,
    OUT o_contract_id   INT
)
BEGIN
    DECLARE v_proposal_id        INT;
    DECLARE v_job_id             INT;
    DECLARE v_freelancer_id      INT;
    DECLARE v_client_id          INT;
    DECLARE v_bid_amount         DECIMAL(10,2);
    DECLARE v_milestone_one_amt  DECIMAL(10,2);
    DECLARE v_milestone_two_amt  DECIMAL(10,2);

    SELECT p.proposal_id, p.job_id, p.freelancer_id, p.bid_amount, j.client_id
    INTO v_proposal_id, v_job_id, v_freelancer_id, v_bid_amount, v_client_id
    FROM proposals p
    JOIN jobs j ON p.job_id = j.job_id
    WHERE p.proposal_id = p_proposal_id;

    IF v_proposal_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Proposal not found.';
    END IF;

    UPDATE proposals
    SET proposal_status = 'ACCEPTED'
    WHERE proposal_id = p_proposal_id;

    UPDATE proposals
    SET proposal_status = 'REJECTED'
    WHERE job_id = v_job_id
      AND freelancer_id <> v_freelancer_id
      AND proposal_status = 'SUBMITTED';

    UPDATE jobs
    SET job_status = 'IN_PROGRESS'
    WHERE job_id = v_job_id;

    INSERT INTO contracts (
        job_id, proposal_id, client_id, freelancer_id, agreed_amount,
        start_date, contract_status
    ) VALUES (
        v_job_id, p_proposal_id, v_client_id, v_freelancer_id,
        v_bid_amount, CURRENT_DATE, 'ACTIVE'
    );

    SET o_contract_id = LAST_INSERT_ID();

    SET v_milestone_one_amt = ROUND(v_bid_amount / 2, 2);
    SET v_milestone_two_amt = v_bid_amount - v_milestone_one_amt;

    INSERT INTO milestones (
        contract_id, milestone_seq_no, title, deliverable_description,
        amount, due_date, milestone_status
    ) VALUES
    (o_contract_id, 1, 'Phase 1: Initial Architecture & Prototype',
     'Core design, architecture, and preliminary prototype deliverable.',
     v_milestone_one_amt, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'FUNDED'),

    (o_contract_id, 2, 'Phase 2: Final Implementation & QA Testing',
     'Final implementation, test coverage, and deployment verification.',
     v_milestone_two_amt, DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 'PENDING');

    INSERT INTO payments (
        contract_id, milestone_seq_no, sender_id, receiver_id, amount,
        payment_type, payment_status
    ) VALUES (
        o_contract_id, 1, v_client_id, 14, v_milestone_one_amt,
        'ESCROW_LOCK', 'COMPLETED'
    );

    SELECT CONCAT('SUCCESS: Contract awarded with ID: ', o_contract_id) AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_contract_detail;
DELIMITER $$
CREATE PROCEDURE sp_get_contract_detail(IN p_contract_id INT)
BEGIN
    SELECT
        c.*,
        j.title AS job_title,
        j.job_status AS job_status,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        CONCAT(f.first_name, ' ', f.last_name) AS freelancer_name,
        f.professional_title,
        f.hourly_rate,
        f.average_rating,
        f.jobs_completed_count,
        f.total_earnings
    FROM contracts c
    JOIN jobs j ON c.job_id = j.job_id
    JOIN users u ON c.client_id = u.user_id
    JOIN freelancers f ON c.freelancer_id = f.freelancer_id
    LEFT JOIN users u2 ON c.freelancer_id = u2.user_id
    WHERE c.contract_id = p_contract_id;
END$$
DELIMITER ;

DELIMITER ;


-- Milestone procedures
DROP PROCEDURE IF EXISTS sp_submit_milestone;
DELIMITER $$
CREATE PROCEDURE sp_submit_milestone(
    IN  p_contract_id   INT,
    IN  p_seq_no        INT,
    IN  p_submission_notes TEXT
)
BEGIN
    UPDATE milestones
    SET submission_notes  = p_submission_notes,
        submission_date   = NOW(),
        milestone_status  = 'IN_REVIEW'
    WHERE contract_id       = p_contract_id
      AND milestone_seq_no  = p_seq_no
      AND milestone_status IN ('PENDING', 'FUNDED');

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone cannot be submitted (may already be in review or approved).';
    END IF;

    SELECT CONCAT('SUCCESS: Milestone ', p_seq_no, ' submitted for contract ', p_contract_id) AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_approve_milestone;
DELIMITER $$
CREATE PROCEDURE sp_approve_milestone(
    IN  p_contract_id   INT,
    IN  p_seq_no        INT,
    OUT o_next_seq_no   INT
)
BEGIN
    DECLARE v_existing_milestone_count INT;

    SELECT COUNT(*) INTO v_existing_milestone_count
    FROM milestones
    WHERE contract_id = p_contract_id;

    IF v_existing_milestone_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Contract not found.';
    END IF;

    UPDATE milestones
    SET milestone_status = 'APPROVED'
    WHERE contract_id      = p_contract_id
      AND milestone_seq_no = p_seq_no;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone not found or already approved.';
    END IF;

    SET o_next_seq_no = p_seq_no + 1;

    SELECT CONCAT('SUCCESS: Milestone ', p_seq_no, ' approved for contract ', p_contract_id) AS status_message;
END$$
DELIMITER ;

DELIMITER ;


-- =============================================================================
-- 5. Review Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_submit_review;
DELIMITER $$
CREATE PROCEDURE sp_submit_review(
    IN  p_contract_id           INT,
    IN  p_reviewer_id           INT,
    IN  p_reviewee_id           INT,
    IN  p_overall_rating        DECIMAL(3,2),
    IN  p_communication_rating  DECIMAL(3,2),
    IN  p_quality_rating        DECIMAL(3,2),
    IN  p_adherence_rating      DECIMAL(3,2),
    IN  p_feedback_comment      TEXT
)
BEGIN
    DECLARE v_contract_status VARCHAR(20);
    DECLARE v_same_user INT DEFAULT 0;

    SELECT COUNT(*) INTO v_same_user
    FROM users
    WHERE user_id = p_reviewer_id AND user_id = p_reviewee_id;

    IF v_same_user > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reviewer cannot review themselves.';
    END IF;

    SELECT contract_status INTO v_contract_status
    FROM contracts
    WHERE contract_id = p_contract_id;

    IF v_contract_status <> 'COMPLETED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reviews are only allowed on COMPLETED contracts.';
    END IF;

    INSERT INTO reviews (
        contract_id, reviewer_id, reviewee_id,
        overall_rating, communication_rating, quality_rating,
        adherence_rating, feedback_comment
    ) VALUES (
        p_contract_id, p_reviewer_id, p_reviewee_id,
        p_overall_rating, p_communication_rating, p_quality_rating,
        p_adherence_rating, p_feedback_comment
    );

    SELECT LAST_INSERT_ID() AS review_id, CONCAT('SUCCESS: Review submitted with ID: ', LAST_INSERT_ID()) AS status_message;
END$$
DELIMITER ;

-- =============================================================================
-- 6. Dispute Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_resolve_dispute;
DELIMITER $$
CREATE PROCEDURE sp_resolve_dispute(
    IN  p_dispute_id     INT,
    IN  p_resolution_type VARCHAR(30),
    IN  p_admin_id       INT
)
BEGIN
    UPDATE disputes
    SET dispute_status        = 'RESOLVED',
        resolution_type       = p_resolution_type,
        resolved_by_admin_id  = p_admin_id,
        resolved_at           = NOW()
    WHERE dispute_id = p_dispute_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '02000'
        SET MESSAGE_TEXT = 'Dispute not found';
    END IF;

    SELECT CONCAT('SUCCESS: Dispute ', p_dispute_id, ' resolved by admin ', p_admin_id) AS status_message;
END$$
DELIMITER ;

-- =============================================================================
-- 7. Reporting Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_top_freelancers;
DELIMITER $$
CREATE PROCEDURE sp_top_freelancers()
BEGIN
    SELECT
        f.freelancer_id,
        CONCAT(u.first_name, ' ', u.last_name) AS freelancer_name,
        u.email,
        f.professional_title,
        f.hourly_rate,
        f.average_rating,
        f.jobs_completed_count,
        f.total_earnings,
        COUNT(DISTINCT r.review_id) AS reviews_count,
        ROUND(AVG(r.quality_rating), 2) AS avg_quality_rating,
        ROUND(AVG(r.communication_rating), 2) AS avg_comm_rating,
        GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') AS top_skills
    FROM freelancers f
    JOIN users u ON f.freelancer_id = u.user_id
    LEFT JOIN reviews r ON f.freelancer_id = r.reviewee_id
    LEFT JOIN freelancer_skills fs ON f.freelancer_id = fs.freelancer_id
    LEFT JOIN skills s ON fs.skill_id = s.skill_id
    GROUP BY
        f.freelancer_id, u.first_name, u.last_name, u.email,
        f.professional_title, f.hourly_rate, f.average_rating,
        f.jobs_completed_count, f.total_earnings
    ORDER BY f.average_rating DESC, f.total_earnings DESC, f.jobs_completed_count DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_client_summary;
DELIMITER $$
CREATE PROCEDURE sp_client_summary()
BEGIN
    SELECT
        c.client_id,
        c.company_name,
        CONCAT(u.first_name, ' ', u.last_name) AS contact_person,
        c.city,
        c.country,
        c.total_spent,
        c.jobs_posted_count,
        COUNT(DISTINCT ct.contract_id) AS total_contracts_awarded,
        COALESCE(SUM(ct.agreed_amount), 0.00) AS total_contract_commitments,
        COUNT(DISTINCT CASE WHEN ct.contract_status = 'ACTIVE' THEN ct.contract_id END) AS active_contracts
    FROM clients c
    JOIN users u ON c.client_id = u.user_id
    LEFT JOIN contracts ct ON c.client_id = ct.client_id
    GROUP BY
        c.client_id, c.company_name, u.first_name, u.last_name,
        c.city, c.country, c.total_spent, c.jobs_posted_count
    ORDER BY c.total_spent DESC;
END$$
DELIMITER ;

-- =============================================================================
-- 6. Additional Lifecycle Automation Procedures
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_complete_contract;
DELIMITER $$
CREATE PROCEDURE sp_complete_contract(
    IN p_contract_id INT
)
BEGIN
    DECLARE v_unapproved INT DEFAULT 0;

    SELECT COUNT(*) INTO v_unapproved
    FROM milestones
    WHERE contract_id = p_contract_id AND milestone_status <> 'APPROVED';

    IF v_unapproved > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot complete contract: unapproved milestones remain.';
    END IF;

    UPDATE contracts
    SET contract_status = 'COMPLETED', end_date = CURRENT_DATE
    WHERE contract_id = p_contract_id;

    UPDATE jobs
    SET job_status = 'COMPLETED'
    WHERE job_id = (SELECT job_id FROM contracts WHERE contract_id = p_contract_id);

    SELECT CONCAT('SUCCESS: Contract ', p_contract_id, ' completed.') AS status_message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_approve_milestone_and_pay;
DELIMITER $$
CREATE PROCEDURE sp_approve_milestone_and_pay(
    IN p_contract_id INT,
    IN p_seq_no      INT
)
BEGIN
    DECLARE v_client_id     INT;
    DECLARE v_freelancer_id INT;
    DECLARE v_amount        DECIMAL(10,2);
    DECLARE v_status        VARCHAR(20);
    DECLARE v_next_seq      INT;
    DECLARE v_next_amt      DECIMAL(10,2);

    SELECT m.amount, m.milestone_status, c.client_id, c.freelancer_id
    INTO v_amount, v_status, v_client_id, v_freelancer_id
    FROM milestones m
    JOIN contracts c ON m.contract_id = c.contract_id
    WHERE m.contract_id = p_contract_id AND m.milestone_seq_no = p_seq_no;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone not found.';
    END IF;

    IF v_status = 'APPROVED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone is already approved and paid.';
    END IF;

    -- 1. Mark milestone approved
    UPDATE milestones
    SET milestone_status = 'APPROVED'
    WHERE contract_id = p_contract_id AND milestone_seq_no = p_seq_no;

    -- 2. Release Escrow to freelancer (Platform Escrow #14 -> Freelancer)
    INSERT INTO payments (
        contract_id, milestone_seq_no, sender_id, receiver_id,
        amount, payment_type, payment_status
    ) VALUES (
        p_contract_id, p_seq_no, 14, v_freelancer_id,
        v_amount, 'MILESTONE_RELEASE', 'COMPLETED'
    );

    -- 3. Check and fund next milestone if exists
    SET v_next_seq = p_seq_no + 1;
    SELECT amount INTO v_next_amt
    FROM milestones
    WHERE contract_id = p_contract_id AND milestone_seq_no = v_next_seq;

    IF v_next_amt IS NOT NULL THEN
        UPDATE milestones
        SET milestone_status = 'FUNDED'
        WHERE contract_id = p_contract_id AND milestone_seq_no = v_next_seq;

        INSERT INTO payments (
            contract_id, milestone_seq_no, sender_id, receiver_id,
            amount, payment_type, payment_status
        ) VALUES (
            p_contract_id, v_next_seq, v_client_id, 14,
            v_next_amt, 'ESCROW_LOCK', 'COMPLETED'
        );
    END IF;

    SELECT CONCAT('SUCCESS: Milestone ', p_seq_no, ' approved and released payment.') AS status_message;
END$$
DELIMITER ;


