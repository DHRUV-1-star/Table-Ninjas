-- =============================================================================
-- Database Management Systems (CS203) - Academic Year 2026-27
-- SVNIT Surat - Department of Computer Science & Engineering
-- Project: Freelance Marketplace (Phase D: Physical Database Implementation)
-- Team: Table Ninjas
-- File: schema.sql
-- =============================================================================

DROP DATABASE IF EXISTS freelance_marketplace;
CREATE DATABASE freelance_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE freelance_marketplace;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Base Entity: users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id          INT AUTO_INCREMENT,
    email            VARCHAR(120) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    first_name       VARCHAR(50)  NOT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    phone            VARCHAR(20)  NULL,
    user_role        ENUM('CLIENT', 'FREELANCER', 'ADMIN', 'DUAL') NOT NULL,
    account_status   ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login       TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Specialized Subclass: clients
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
    client_id         INT NOT NULL,
    company_name      VARCHAR(100) NULL,
    company_website   VARCHAR(255) NULL,
    street_address    VARCHAR(150) NULL,
    city              VARCHAR(60)  NULL,
    state             VARCHAR(60)  NULL,
    country           VARCHAR(60)  NULL,
    postal_code       VARCHAR(20)  NULL,
    total_spent       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    jobs_posted_count INT           NOT NULL DEFAULT 0,

    CONSTRAINT pk_clients PRIMARY KEY (client_id),
    CONSTRAINT fk_clients_user FOREIGN KEY (client_id)
        REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_clients_total_spent CHECK (total_spent >= 0.00),
    CONSTRAINT chk_clients_jobs_count CHECK (jobs_posted_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Specialized Subclass: freelancers
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS freelancers;
CREATE TABLE freelancers (
    freelancer_id        INT NOT NULL,
    professional_title   VARCHAR(100) NOT NULL,
    bio_overview         TEXT         NULL,
    hourly_rate          DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    availability_status  ENUM('AVAILABLE', 'BUSY', 'NOT_TAKING_WORK') NOT NULL DEFAULT 'AVAILABLE',
    years_of_experience  DECIMAL(4,1) NOT NULL DEFAULT 0.0,
    total_earnings       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    jobs_completed_count INT           NOT NULL DEFAULT 0,
    average_rating       DECIMAL(3,2)  NOT NULL DEFAULT 0.00,

    CONSTRAINT pk_freelancers PRIMARY KEY (freelancer_id),
    CONSTRAINT fk_freelancers_user FOREIGN KEY (freelancer_id)
        REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_freelancers_rate CHECK (hourly_rate >= 0.00),
    CONSTRAINT chk_freelancers_exp CHECK (years_of_experience >= 0.0),
    CONSTRAINT chk_freelancers_earnings CHECK (total_earnings >= 0.00),
    CONSTRAINT chk_freelancers_jobs CHECK (jobs_completed_count >= 0),
    CONSTRAINT chk_freelancers_rating CHECK (average_rating BETWEEN 0.00 AND 5.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Master Catalog: skills
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS skills;
CREATE TABLE skills (
    skill_id    INT AUTO_INCREMENT,
    skill_name  VARCHAR(60) NOT NULL,
    category    VARCHAR(60) NOT NULL,
    description TEXT        NULL,

    CONSTRAINT pk_skills PRIMARY KEY (skill_id),
    CONSTRAINT uq_skills_name UNIQUE (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Junction Entity: freelancer_skills
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS freelancer_skills;
CREATE TABLE freelancer_skills (
    freelancer_id     INT NOT NULL,
    skill_id          INT NOT NULL,
    proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'EXPERT') NOT NULL DEFAULT 'INTERMEDIATE',
    years_experience  DECIMAL(3,1) NOT NULL DEFAULT 1.0,

    CONSTRAINT pk_freelancer_skills PRIMARY KEY (freelancer_id, skill_id),
    CONSTRAINT fk_fskills_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES freelancers (freelancer_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fskills_skill FOREIGN KEY (skill_id)
        REFERENCES skills (skill_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_fskills_years CHECK (years_experience >= 0.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Dependent Entity: portfolio_items
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS portfolio_items;
CREATE TABLE portfolio_items (
    portfolio_id    INT AUTO_INCREMENT,
    freelancer_id   INT NOT NULL,
    title           VARCHAR(120) NOT NULL,
    description     TEXT         NULL,
    project_url     VARCHAR(255) NULL,
    completion_date DATE         NULL,

    CONSTRAINT pk_portfolio_items PRIMARY KEY (portfolio_id),
    CONSTRAINT fk_portfolio_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES freelancers (freelancer_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Core Entity: jobs
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS jobs;
CREATE TABLE jobs (
    job_id           INT AUTO_INCREMENT,
    client_id        INT          NOT NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT         NOT NULL,
    category         VARCHAR(60)  NOT NULL,
    payment_type     ENUM('FIXED_PRICE', 'HOURLY') NOT NULL DEFAULT 'FIXED_PRICE',
    budget           DECIMAL(10,2) NOT NULL,
    experience_level ENUM('ENTRY', 'INTERMEDIATE', 'EXPERT') NOT NULL DEFAULT 'INTERMEDIATE',
    duration_days    INT          NOT NULL,
    deadline         DATE         NOT NULL,
    job_status       ENUM('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_jobs PRIMARY KEY (job_id),
    CONSTRAINT fk_jobs_client FOREIGN KEY (client_id)
        REFERENCES clients (client_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_jobs_budget CHECK (budget > 0.00),
    CONSTRAINT chk_jobs_duration CHECK (duration_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Junction Entity: job_skills
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS job_skills;
CREATE TABLE job_skills (
    job_id       INT NOT NULL,
    skill_id     INT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_job_skills PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_jskills_job FOREIGN KEY (job_id)
        REFERENCES jobs (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_jskills_skill FOREIGN KEY (skill_id)
        REFERENCES skills (skill_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Associative Entity: proposals
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS proposals;
CREATE TABLE proposals (
    proposal_id              INT AUTO_INCREMENT,
    job_id                   INT          NOT NULL,
    freelancer_id            INT          NOT NULL,
    bid_amount               DECIMAL(10,2) NOT NULL,
    estimated_delivery_days  INT          NOT NULL,
    cover_letter             TEXT         NOT NULL,
    proposal_status          ENUM('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    submitted_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_proposals PRIMARY KEY (proposal_id),
    CONSTRAINT uq_proposals_job_freelancer UNIQUE (job_id, freelancer_id),
    CONSTRAINT fk_proposals_job FOREIGN KEY (job_id)
        REFERENCES jobs (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_proposals_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES freelancers (freelancer_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_proposals_bid CHECK (bid_amount > 0.00),
    CONSTRAINT chk_proposals_days CHECK (estimated_delivery_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Core Entity: contracts
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS contracts;
CREATE TABLE contracts (
    contract_id     INT AUTO_INCREMENT,
    job_id          INT          NOT NULL,
    proposal_id     INT          NOT NULL,
    client_id       INT          NOT NULL,
    freelancer_id   INT          NOT NULL,
    agreed_amount   DECIMAL(10,2) NOT NULL,
    start_date      DATE         NOT NULL,
    end_date        DATE         NULL,
    contract_status ENUM('ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED') NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_contracts PRIMARY KEY (contract_id),
    CONSTRAINT uq_contracts_job UNIQUE (job_id),
    CONSTRAINT uq_contracts_proposal UNIQUE (proposal_id),
    CONSTRAINT fk_contracts_job FOREIGN KEY (job_id)
        REFERENCES jobs (job_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contracts_proposal FOREIGN KEY (proposal_id)
        REFERENCES proposals (proposal_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contracts_client FOREIGN KEY (client_id)
        REFERENCES clients (client_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contracts_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES freelancers (freelancer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_contracts_amount CHECK (agreed_amount > 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Weak Entity: milestones
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS milestones;
CREATE TABLE milestones (
    contract_id             INT          NOT NULL,
    milestone_seq_no        INT          NOT NULL,
    title                   VARCHAR(100) NOT NULL,
    deliverable_description TEXT         NOT NULL,
    amount                  DECIMAL(10,2) NOT NULL,
    due_date                DATE         NOT NULL,
    submission_notes        TEXT         NULL,
    submission_date         TIMESTAMP    NULL DEFAULT NULL,
    milestone_status        ENUM('PENDING', 'FUNDED', 'IN_REVIEW', 'APPROVED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',

    CONSTRAINT pk_milestones PRIMARY KEY (contract_id, milestone_seq_no),
    CONSTRAINT fk_milestones_contract FOREIGN KEY (contract_id)
        REFERENCES contracts (contract_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_milestones_seq CHECK (milestone_seq_no > 0),
    CONSTRAINT chk_milestones_amount CHECK (amount > 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Transaction Entity: payments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    payment_id       INT AUTO_INCREMENT,
    contract_id      INT          NOT NULL,
    milestone_seq_no INT          NULL,
    sender_id        INT          NOT NULL,
    receiver_id      INT          NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    payment_type     ENUM('ESCROW_LOCK', 'MILESTONE_RELEASE', 'REFUND', 'WALLET_DEPOSIT') NOT NULL,
    payment_status   ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'COMPLETED',
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_payments PRIMARY KEY (payment_id),
    CONSTRAINT fk_payments_contract FOREIGN KEY (contract_id)
        REFERENCES contracts (contract_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_milestone FOREIGN KEY (contract_id, milestone_seq_no)
        REFERENCES milestones (contract_id, milestone_seq_no) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_sender FOREIGN KEY (sender_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_receiver FOREIGN KEY (receiver_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_payments_amount CHECK (amount > 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Associative Entity: reviews
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    review_id            INT AUTO_INCREMENT,
    contract_id          INT       NOT NULL,
    reviewer_id          INT       NOT NULL,
    reviewee_id          INT       NOT NULL,
    overall_rating       INT       NOT NULL,
    communication_rating INT       NOT NULL,
    quality_rating       INT       NOT NULL,
    adherence_rating     INT       NOT NULL,
    feedback_comment     TEXT      NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_reviews PRIMARY KEY (review_id),
    CONSTRAINT uq_reviews_contract_reviewer UNIQUE (contract_id, reviewer_id),
    CONSTRAINT fk_reviews_contract FOREIGN KEY (contract_id)
        REFERENCES contracts (contract_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_reviews_distinct CHECK (reviewer_id <> reviewee_id),
    CONSTRAINT chk_reviews_overall CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_comm CHECK (communication_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_qual CHECK (quality_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_adh CHECK (adherence_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Communication Entity: messages
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
    message_id   INT AUTO_INCREMENT,
    contract_id  INT       NULL,
    proposal_id  INT       NULL,
    sender_id    INT       NOT NULL,
    receiver_id  INT       NOT NULL,
    message_body TEXT      NOT NULL,
    sent_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read      BOOLEAN   NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_messages PRIMARY KEY (message_id),
    CONSTRAINT fk_messages_contract FOREIGN KEY (contract_id)
        REFERENCES contracts (contract_id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_messages_proposal FOREIGN KEY (proposal_id)
        REFERENCES proposals (proposal_id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_messages_context CHECK (contract_id IS NOT NULL OR proposal_id IS NOT NULL),
    CONSTRAINT chk_messages_distinct CHECK (sender_id <> receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Arbitration Entity: disputes
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS disputes;
CREATE TABLE disputes (
    dispute_id           INT AUTO_INCREMENT,
    contract_id          INT         NOT NULL,
    milestone_seq_no     INT         NULL,
    raised_by_user_id    INT         NOT NULL,
    reason               TEXT        NOT NULL,
    dispute_status       ENUM('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    resolution_type      ENUM('REFUND_CLIENT', 'PAYOUT_FREELANCER', 'SPLIT_PROPORTIONAL') NULL DEFAULT NULL,
    resolved_by_admin_id INT         NULL DEFAULT NULL,
    resolved_at          TIMESTAMP   NULL DEFAULT NULL,

    CONSTRAINT pk_disputes PRIMARY KEY (dispute_id),
    CONSTRAINT fk_disputes_contract FOREIGN KEY (contract_id)
        REFERENCES contracts (contract_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_milestone FOREIGN KEY (contract_id, milestone_seq_no)
        REFERENCES milestones (contract_id, milestone_seq_no) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_raised_by FOREIGN KEY (raised_by_user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_admin FOREIGN KEY (resolved_by_admin_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Triggers for Business Rule Automation & Denormalized Data Consistency
-- -----------------------------------------------------------------------------

DELIMITER $$

-- Trigger 1: Prevent Self-Bidding (A client cannot submit a proposal to their own job)
DROP TRIGGER IF EXISTS trg_prevent_self_bidding$$
CREATE TRIGGER trg_prevent_self_bidding
BEFORE INSERT ON proposals
FOR EACH ROW
BEGIN
    DECLARE v_client_id INT;
    SELECT client_id INTO v_client_id FROM jobs WHERE job_id = NEW.job_id;
    IF v_client_id = NEW.freelancer_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Business Rule Violation: Clients cannot submit proposals to their own jobs.';
    END IF;
END$$

-- Trigger 2: Automatically update Freelancer Average Rating upon New Review
DROP TRIGGER IF EXISTS trg_after_review_insert$$
CREATE TRIGGER trg_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    DECLARE v_new_avg DECIMAL(3,2);
    
    -- Check if the reviewee is a registered freelancer
    IF EXISTS (SELECT 1 FROM freelancers WHERE freelancer_id = NEW.reviewee_id) THEN
        SELECT ROUND(AVG(overall_rating), 2)
        INTO v_new_avg
        FROM reviews
        WHERE reviewee_id = NEW.reviewee_id;

        UPDATE freelancers
        SET average_rating = COALESCE(v_new_avg, 0.00)
        WHERE freelancer_id = NEW.reviewee_id;
    END IF;
END$$

-- Trigger 3: Automatically update Freelancer Completed Jobs Count upon Contract Completion
DROP TRIGGER IF EXISTS trg_after_contract_complete$$
CREATE TRIGGER trg_after_contract_complete
AFTER UPDATE ON contracts
FOR EACH ROW
BEGIN
    IF OLD.contract_status <> 'COMPLETED' AND NEW.contract_status = 'COMPLETED' THEN
        UPDATE freelancers
        SET jobs_completed_count = jobs_completed_count + 1
        WHERE freelancer_id = NEW.freelancer_id;
    END IF;
END$$

-- Trigger 4: Update Cumulative Financials (Client Total Spent & Freelancer Total Earnings) on Completed Milestone Release
DROP TRIGGER IF EXISTS trg_after_payment_complete$$
CREATE TRIGGER trg_after_payment_complete
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    IF NEW.payment_type = 'MILESTONE_RELEASE' AND NEW.payment_status = 'COMPLETED' THEN
        -- Increment freelancer lifetime earnings
        UPDATE freelancers
        SET total_earnings = total_earnings + NEW.amount
        WHERE freelancer_id = NEW.receiver_id;

        -- Increment client lifetime expenditure
        UPDATE clients
        SET total_spent = total_spent + NEW.amount
        WHERE client_id = NEW.sender_id;
    END IF;
END$$

DELIMITER ;
