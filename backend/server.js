const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const pool = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// -----------------------------------------------------------------------------
// 1. Health & Meta Endpoints
// -----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM jobs) AS total_jobs,
        (SELECT COUNT(*) FROM proposals) AS total_proposals,
        (SELECT COUNT(*) FROM contracts) AS total_contracts,
        (SELECT COUNT(*) FROM payments) AS total_payments,
        (SELECT COUNT(*) FROM disputes WHERE dispute_status = 'OPEN') AS open_disputes
    `);
    res.json({ status: 'healthy', database: 'connected', counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. Skills Endpoints
// -----------------------------------------------------------------------------
app.get('/api/skills', async (req, res) => {
  try {
    const [skills] = await pool.query('SELECT * FROM skills ORDER BY category, skill_name');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Users & Personas Endpoints
// -----------------------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = `
      SELECT u.user_id, u.email, u.first_name, u.last_name, u.phone, u.user_role, u.account_status,
             c.company_name, c.total_spent, c.jobs_posted_count,
             f.professional_title, f.hourly_rate, f.average_rating, f.jobs_completed_count, f.total_earnings
      FROM users u
      LEFT JOIN clients c ON u.user_id = c.client_id
      LEFT JOIN freelancers f ON u.user_id = f.freelancer_id
    `;
    const params = [];
    if (role) {
      query += ` WHERE u.user_role = ? OR u.user_role = 'DUAL'`;
      params.push(role);
    }
    query += ' ORDER BY u.user_id ASC';
    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authentication & Persona Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, user_id } = req.body;
    let userQuery = `
      SELECT u.user_id, u.email, u.first_name, u.last_name, u.phone, u.user_role, u.account_status,
             c.company_name, c.total_spent, c.jobs_posted_count,
             f.professional_title, f.hourly_rate, f.average_rating, f.jobs_completed_count, f.total_earnings
      FROM users u
      LEFT JOIN clients c ON u.user_id = c.client_id
      LEFT JOIN freelancers f ON u.user_id = f.freelancer_id
    `;
    let userParam = [];
    if (user_id) {
      userQuery += ' WHERE u.user_id = ? LIMIT 1';
      userParam = [parseInt(user_id, 10)];
    } else if (email) {
      userQuery += ' WHERE LOWER(u.email) = LOWER(?) LIMIT 1';
      userParam = [email.trim()];
    } else {
      return res.status(400).json({ error: 'Please provide email or user_id' });
    }

    const [rows] = await pool.query(userQuery, userParam);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No user account found matching provided credentials' });
    }

    const user = rows[0];
    res.json({
      message: 'Login successful',
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------------------------------------------------------
// 4. Jobs Endpoints (Create, Search/Filter, Read Details, Delete)
// -----------------------------------------------------------------------------
app.get('/api/jobs', async (req, res) => {
  try {
    const { skill_id, category, min_budget, max_budget, job_status, client_id, search } = req.query;
    let query = `
      SELECT j.job_id, j.client_id, j.title, j.description, j.category, j.payment_type, j.budget,
             j.experience_level, j.duration_days, j.deadline, j.job_status, j.created_at,
             c.company_name, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
             COUNT(DISTINCT p.proposal_id) AS proposal_count,
             GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') AS required_skills
      FROM jobs j
      JOIN clients c ON j.client_id = c.client_id
      JOIN users u ON c.client_id = u.user_id
      LEFT JOIN job_skills js ON j.job_id = js.job_id
      LEFT JOIN skills s ON js.skill_id = s.skill_id
      LEFT JOIN proposals p ON j.job_id = p.job_id
      WHERE 1=1
    `;
    const params = [];

    if (job_status) {
      query += ` AND j.job_status = ?`;
      params.push(job_status);
    }
    if (category) {
      query += ` AND j.category = ?`;
      params.push(category);
    }
    if (client_id) {
      query += ` AND j.client_id = ?`;
      params.push(client_id);
    }
    if (min_budget) {
      query += ` AND j.budget >= ?`;
      params.push(parseFloat(min_budget));
    }
    if (max_budget) {
      query += ` AND j.budget <= ?`;
      params.push(parseFloat(max_budget));
    }
    if (skill_id) {
      query += ` AND j.job_id IN (SELECT job_id FROM job_skills WHERE skill_id = ?)`;
      params.push(parseInt(skill_id, 10));
    }
    if (search) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY j.job_id, j.client_id, j.title, j.description, j.category, j.payment_type, j.budget,
               j.experience_level, j.duration_days, j.deadline, j.job_status, j.created_at,
               c.company_name, u.first_name, u.last_name
      ORDER BY j.created_at DESC
    `;

    const [jobs] = await pool.query(query, params);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const [[job]] = await pool.query(`
      SELECT j.*, c.company_name, c.company_website, c.city, c.country,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email
      FROM jobs j
      JOIN clients c ON j.client_id = c.client_id
      JOIN users u ON c.client_id = u.user_id
      WHERE j.job_id = ?
    `, [jobId]);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Fetch skills
    const [skills] = await pool.query(`
      SELECT s.skill_id, s.skill_name, s.category, js.is_mandatory
      FROM job_skills js
      JOIN skills s ON js.skill_id = s.skill_id
      WHERE js.job_id = ?
    `, [jobId]);

    // Fetch proposals
    const [proposals] = await pool.query(`
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS freelancer_name,
             f.professional_title, f.hourly_rate, f.average_rating, f.jobs_completed_count
      FROM proposals p
      JOIN freelancers f ON p.freelancer_id = f.freelancer_id
      JOIN users u ON f.freelancer_id = u.user_id
      WHERE p.job_id = ?
      ORDER BY p.submitted_at DESC
    `, [jobId]);

    res.json({ ...job, skills, proposals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { client_id, title, description, category, payment_type, budget, experience_level, duration_days, deadline, skill_ids } = req.body;

    if (!client_id || !title || !description || !category || !budget || !duration_days || !deadline) {
      return res.status(400).json({ error: 'Missing required job parameters' });
    }

    if (parseFloat(budget) <= 0) {
      return res.status(400).json({ error: 'Budget must be greater than zero' });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO jobs (client_id, title, description, category, payment_type, budget, experience_level, duration_days, deadline, job_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `, [client_id, title, description, category, payment_type || 'FIXED_PRICE', budget, experience_level || 'INTERMEDIATE', duration_days, deadline]);

    const jobId = result.insertId;

    if (Array.isArray(skill_ids) && skill_ids.length > 0) {
      const skillValues = skill_ids.map(sid => [jobId, parseInt(sid, 10), true]);
      await conn.query(`INSERT INTO job_skills (job_id, skill_id, is_mandatory) VALUES ?`, [skillValues]);
    }

    await conn.query(`UPDATE clients SET jobs_posted_count = jobs_posted_count + 1 WHERE client_id = ?`, [client_id]);

    await conn.commit();
    res.status(201).json({ message: 'Job posted successfully', job_id: jobId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    // Check if job is in active contract
    const [[contract]] = await pool.query('SELECT contract_id FROM contracts WHERE job_id = ?', [jobId]);
    if (contract) {
      return res.status(400).json({ error: 'Cannot delete job: an active or completed contract is linked to this job.' });
    }

    const [result] = await pool.query('DELETE FROM jobs WHERE job_id = ?', [jobId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. Proposals Endpoints (Submit Bid, List Bids)
// -----------------------------------------------------------------------------
app.get('/api/proposals', async (req, res) => {
  try {
    const { job_id, freelancer_id } = req.query;
    let query = `
      SELECT p.*, j.title AS job_title, j.budget AS job_budget, j.job_status,
             c.company_name, CONCAT(uc.first_name, ' ', uc.last_name) AS client_name,
             CONCAT(uf.first_name, ' ', uf.last_name) AS freelancer_name,
             f.professional_title, f.average_rating
      FROM proposals p
      JOIN jobs j ON p.job_id = j.job_id
      JOIN clients c ON j.client_id = c.client_id
      JOIN users uc ON c.client_id = uc.user_id
      JOIN freelancers f ON p.freelancer_id = f.freelancer_id
      JOIN users uf ON f.freelancer_id = uf.user_id
      WHERE 1=1
    `;
    const params = [];
    if (job_id) {
      query += ' AND p.job_id = ?';
      params.push(job_id);
    }
    if (freelancer_id) {
      query += ' AND p.freelancer_id = ?';
      params.push(freelancer_id);
    }
    query += ' ORDER BY p.submitted_at DESC';
    const [proposals] = await pool.query(query, params);
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/proposals', async (req, res) => {
  try {
    const { job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter } = req.body;

    if (!job_id || !freelancer_id || !bid_amount || !estimated_delivery_days || !cover_letter) {
      return res.status(400).json({ error: 'All proposal fields are required' });
    }

    if (parseFloat(bid_amount) <= 0) {
      return res.status(400).json({ error: 'Bid amount must be positive' });
    }

    // Check job status
    const [[job]] = await pool.query('SELECT job_status, client_id, deadline FROM jobs WHERE job_id = ?', [job_id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.job_status !== 'OPEN') {
      return res.status(400).json({ error: `Cannot submit proposal: Job is ${job.job_status}, not OPEN.` });
    }
    if (job.client_id === parseInt(freelancer_id, 10)) {
      return res.status(400).json({ error: 'Business Rule Violation: Clients cannot bid on their own jobs.' });
    }

    const [result] = await pool.query(`
      INSERT INTO proposals (job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter, proposal_status)
      VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
    `, [job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter]);

    res.status(201).json({ message: 'Proposal submitted successfully', proposal_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already submitted a proposal for this job.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. Contracts & Milestone Lifecycle Endpoints
// -----------------------------------------------------------------------------
app.get('/api/contracts', async (req, res) => {
  try {
    const { client_id, freelancer_id, status } = req.query;
    let query = `
      SELECT c.*, j.title AS job_title, j.category,
             cl.company_name, CONCAT(uc.first_name, ' ', uc.last_name) AS client_name,
             CONCAT(uf.first_name, ' ', uf.last_name) AS freelancer_name,
             f.professional_title, f.average_rating,
             COUNT(m.milestone_seq_no) AS total_milestones,
             SUM(CASE WHEN m.milestone_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_milestones
      FROM contracts c
      JOIN jobs j ON c.job_id = j.job_id
      JOIN clients cl ON c.client_id = cl.client_id
      JOIN users uc ON cl.client_id = uc.user_id
      JOIN freelancers f ON c.freelancer_id = f.freelancer_id
      JOIN users uf ON f.freelancer_id = uf.user_id
      LEFT JOIN milestones m ON c.contract_id = m.contract_id
      WHERE 1=1
    `;
    const params = [];
    if (client_id) {
      query += ' AND c.client_id = ?';
      params.push(client_id);
    }
    if (freelancer_id) {
      query += ' AND c.freelancer_id = ?';
      params.push(freelancer_id);
    }
    if (status) {
      query += ' AND c.contract_status = ?';
      params.push(status);
    }
    query += `
      GROUP BY c.contract_id, j.title, j.category, cl.company_name,
               uc.first_name, uc.last_name, uf.first_name, uf.last_name,
               f.professional_title, f.average_rating
      ORDER BY c.created_at DESC
    `;
    const [contracts] = await pool.query(query, params);
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contracts/:id', async (req, res) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    const [[contract]] = await pool.query(`
      SELECT c.*, j.title AS job_title, j.description AS job_description,
             cl.company_name, CONCAT(uc.first_name, ' ', uc.last_name) AS client_name, uc.email AS client_email,
             CONCAT(uf.first_name, ' ', uf.last_name) AS freelancer_name, uf.email AS freelancer_email,
             f.professional_title, f.average_rating
      FROM contracts c
      JOIN jobs j ON c.job_id = j.job_id
      JOIN clients cl ON c.client_id = cl.client_id
      JOIN users uc ON cl.client_id = uc.user_id
      JOIN freelancers f ON c.freelancer_id = f.freelancer_id
      JOIN users uf ON f.freelancer_id = uf.user_id
      WHERE c.contract_id = ?
    `, [contractId]);

    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const [milestones] = await pool.query(`
      SELECT * FROM milestones WHERE contract_id = ? ORDER BY milestone_seq_no ASC
    `, [contractId]);

    const [payments] = await pool.query(`
      SELECT * FROM payments WHERE contract_id = ? ORDER BY created_at DESC
    `, [contractId]);

    const [reviews] = await pool.query(`
      SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.user_id
      WHERE r.contract_id = ?
    `, [contractId]);

    res.json({ ...contract, milestones, payments, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Award Contract from Proposal
app.post('/api/contracts/award', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { proposal_id } = req.body;
    if (!proposal_id) return res.status(400).json({ error: 'proposal_id is required' });

    await conn.beginTransaction();

    const [[proposal]] = await conn.query(`
      SELECT p.*, j.client_id, j.title, j.job_status
      FROM proposals p
      JOIN jobs j ON p.job_id = j.job_id
      WHERE p.proposal_id = ?
    `, [proposal_id]);

    if (!proposal) {
      await conn.rollback();
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.job_status !== 'OPEN') {
      await conn.rollback();
      return res.status(400).json({ error: `Job status is ${proposal.job_status}. Only OPEN jobs can be awarded.` });
    }

    // 1. Mark proposal as ACCEPTED
    await conn.query(`UPDATE proposals SET proposal_status = 'ACCEPTED' WHERE proposal_id = ?`, [proposal_id]);

    // 2. Reject other proposals for the same job
    await conn.query(`UPDATE proposals SET proposal_status = 'REJECTED' WHERE job_id = ? AND proposal_id <> ?`, [proposal.job_id, proposal_id]);

    // 3. Update job status to IN_PROGRESS
    await conn.query(`UPDATE jobs SET job_status = 'IN_PROGRESS' WHERE job_id = ?`, [proposal.job_id]);

    // 4. Create contract
    const [contractResult] = await conn.query(`
      INSERT INTO contracts (job_id, proposal_id, client_id, freelancer_id, agreed_amount, start_date, contract_status)
      VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 'ACTIVE')
    `, [proposal.job_id, proposal_id, proposal.client_id, proposal.freelancer_id, proposal.bid_amount]);

    const contractId = contractResult.insertId;

    // 5. Partition into 2 equal milestones
    const halfAmount = (proposal.bid_amount / 2).toFixed(2);
    const restAmount = (proposal.bid_amount - halfAmount).toFixed(2);

    await conn.query(`
      INSERT INTO milestones (contract_id, milestone_seq_no, title, deliverable_description, amount, due_date, milestone_status)
      VALUES 
      (?, 1, 'Phase 1: Initial Architecture & Prototype', 'Core design, architecture, and preliminary prototype deliverable.', ?, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'FUNDED'),
      (?, 2, 'Phase 2: Final Implementation & QA Testing', 'Final implementation, test coverage, and deployment verification.', ?, DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 'PENDING')
    `, [contractId, halfAmount, contractId, restAmount]);

    // 6. Simulate Escrow Lock for Milestone 1 (from Client to Platform Escrow user #14)
    await conn.query(`
      INSERT INTO payments (contract_id, milestone_seq_no, sender_id, receiver_id, amount, payment_type, payment_status)
      VALUES (?, 1, ?, 14, ?, 'ESCROW_LOCK', 'COMPLETED')
    `, [contractId, proposal.client_id, halfAmount]);

    await conn.commit();
    res.status(201).json({ message: 'Contract awarded successfully', contract_id: contractId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Submit Deliverables for Milestone
app.patch('/api/milestones/:contract_id/:seq_no/submit', async (req, res) => {
  try {
    const { contract_id, seq_no } = req.params;
    const { submission_notes } = req.body;

    if (!submission_notes) {
      return res.status(400).json({ error: 'submission_notes are required' });
    }

    const [result] = await pool.query(`
      UPDATE milestones 
      SET submission_notes = ?, submission_date = NOW(), milestone_status = 'IN_REVIEW'
      WHERE contract_id = ? AND milestone_seq_no = ? AND milestone_status IN ('PENDING', 'FUNDED')
    `, [submission_notes, contract_id, seq_no]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Milestone cannot be submitted (may already be in review or approved)' });
    }

    res.json({ message: 'Milestone deliverables submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client Approves Milestone and Releases Payment
app.post('/api/milestones/:contract_id/:seq_no/approve-pay', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { contract_id, seq_no } = req.params;

    await conn.beginTransaction();

    const [[milestone]] = await conn.query(`
      SELECT m.*, c.client_id, c.freelancer_id
      FROM milestones m
      JOIN contracts c ON m.contract_id = c.contract_id
      WHERE m.contract_id = ? AND m.milestone_seq_no = ?
    `, [contract_id, seq_no]);

    if (!milestone) {
      await conn.rollback();
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.milestone_status === 'APPROVED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Milestone is already approved and paid.' });
    }

    // 1. Update milestone to APPROVED
    await conn.query(`
      UPDATE milestones SET milestone_status = 'APPROVED' WHERE contract_id = ? AND milestone_seq_no = ?
    `, [contract_id, seq_no]);

    // 2. Insert MILESTONE_RELEASE payment (Platform Escrow #14 -> Freelancer)
    // Automated trigger trg_after_payment_complete updates total_earnings and total_spent
    await conn.query(`
      INSERT INTO payments (contract_id, milestone_seq_no, sender_id, receiver_id, amount, payment_type, payment_status)
      VALUES (?, ?, 14, ?, ?, 'MILESTONE_RELEASE', 'COMPLETED')
    `, [contract_id, seq_no, milestone.freelancer_id, milestone.amount]);

    // Check if next milestone exists and fund it
    const nextSeq = parseInt(seq_no, 10) + 1;
    const [[nextMilestone]] = await conn.query(`
      SELECT * FROM milestones WHERE contract_id = ? AND milestone_seq_no = ?
    `, [contract_id, nextSeq]);

    if (nextMilestone) {
      await conn.query(`UPDATE milestones SET milestone_status = 'FUNDED' WHERE contract_id = ? AND milestone_seq_no = ?`, [contract_id, nextSeq]);
      await conn.query(`
        INSERT INTO payments (contract_id, milestone_seq_no, sender_id, receiver_id, amount, payment_type, payment_status)
        VALUES (?, ?, ?, 14, ?, 'ESCROW_LOCK', 'COMPLETED')
      `, [contract_id, nextSeq, milestone.client_id, nextMilestone.amount]);
    }

    await conn.commit();
    res.json({ message: 'Milestone approved and payment released successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Mark Contract Completed
app.post('/api/contracts/:id/complete', async (req, res) => {
  try {
    const contractId = parseInt(req.params.id, 10);

    // Verify all milestones are approved
    const [milestones] = await pool.query('SELECT milestone_status FROM milestones WHERE contract_id = ?', [contractId]);
    const unapproved = milestones.filter(m => m.milestone_status !== 'APPROVED');
    if (unapproved.length > 0) {
      return res.status(400).json({ error: `Cannot complete contract: ${unapproved.length} milestone(s) are not yet approved.` });
    }

    await pool.query(`
      UPDATE contracts 
      SET contract_status = 'COMPLETED', end_date = CURRENT_DATE 
      WHERE contract_id = ?
    `, [contractId]);

    // Also mark job as COMPLETED
    await pool.query(`
      UPDATE jobs SET job_status = 'COMPLETED' WHERE job_id = (SELECT job_id FROM contracts WHERE contract_id = ?)
    `, [contractId]);

    res.json({ message: 'Contract and Job marked as COMPLETED successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. Reviews Endpoints
// -----------------------------------------------------------------------------
app.get('/api/reviews', async (req, res) => {
  try {
    const { reviewee_id, contract_id } = req.query;
    let query = `
      SELECT r.*, 
             CONCAT(ur.first_name, ' ', ur.last_name) AS reviewer_name,
             CONCAT(ue.first_name, ' ', ue.last_name) AS reviewee_name,
             j.title AS job_title
      FROM reviews r
      JOIN users ur ON r.reviewer_id = ur.user_id
      JOIN users ue ON r.reviewee_id = ue.user_id
      JOIN contracts c ON r.contract_id = c.contract_id
      JOIN jobs j ON c.job_id = j.job_id
      WHERE 1=1
    `;
    const params = [];
    if (reviewee_id) {
      query += ' AND r.reviewee_id = ?';
      params.push(reviewee_id);
    }
    if (contract_id) {
      query += ' AND r.contract_id = ?';
      params.push(contract_id);
    }
    query += ' ORDER BY r.created_at DESC';
    const [reviews] = await pool.query(query, params);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating, quality_rating, adherence_rating, feedback_comment } = req.body;

    if (!contract_id || !reviewer_id || !reviewee_id || !overall_rating || !feedback_comment) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    if (reviewer_id === reviewee_id) {
      return res.status(400).json({ error: 'Reviewer cannot review themselves' });
    }

    // Verify contract is COMPLETED
    const [[contract]] = await pool.query('SELECT contract_status FROM contracts WHERE contract_id = ?', [contract_id]);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    if (contract.contract_status !== 'COMPLETED') {
      return res.status(400).json({ error: `Cannot submit review: Contract is ${contract.contract_status}. Reviews are only allowed on COMPLETED contracts.` });
    }

    const [result] = await pool.query(`
      INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating, quality_rating, adherence_rating, feedback_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating || 5, quality_rating || 5, adherence_rating || 5, feedback_comment]);

    res.status(201).json({ message: 'Review submitted successfully', review_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already submitted a review for this contract.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. Admin & Dispute Management Endpoints
// -----------------------------------------------------------------------------
app.get('/api/disputes', async (req, res) => {
  try {
    const [disputes] = await pool.query(`
      SELECT d.*, c.job_id, j.title AS job_title, c.agreed_amount,
             CONCAT(ur.first_name, ' ', ur.last_name) AS raised_by_name, ur.email AS raised_by_email,
             CONCAT(ua.first_name, ' ', ua.last_name) AS resolved_by_name
      FROM disputes d
      JOIN contracts c ON d.contract_id = c.contract_id
      JOIN jobs j ON c.job_id = j.job_id
      JOIN users ur ON d.raised_by_user_id = ur.user_id
      LEFT JOIN users ua ON d.resolved_by_admin_id = ua.user_id
      ORDER BY d.dispute_id DESC
    `);
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/disputes/:id/resolve', async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id, 10);
    const { resolution_type, admin_id } = req.body;

    if (!resolution_type) {
      return res.status(400).json({ error: 'resolution_type is required (REFUND_CLIENT, PAYOUT_FREELANCER, SPLIT_PROPORTIONAL)' });
    }

    const [result] = await pool.query(`
      UPDATE disputes 
      SET dispute_status = 'RESOLVED', resolution_type = ?, resolved_by_admin_id = ?, resolved_at = NOW()
      WHERE dispute_id = ?
    `, [resolution_type, admin_id || 14, disputeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    res.json({ message: 'Dispute successfully resolved by Administrator' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. Analytical Reports (JOIN + GROUP BY + Aggregate Metrics)
// -----------------------------------------------------------------------------
app.get('/api/reports/top-freelancers', async (req, res) => {
  try {
    const [report] = await pool.query(`
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
      GROUP BY f.freelancer_id, u.first_name, u.last_name, u.email, f.professional_title,
               f.hourly_rate, f.average_rating, f.jobs_completed_count, f.total_earnings
      ORDER BY f.average_rating DESC, f.total_earnings DESC, f.jobs_completed_count DESC
    `);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/client-summary', async (req, res) => {
  try {
    const [summary] = await pool.query(`
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
      GROUP BY c.client_id, c.company_name, u.first_name, u.last_name, c.city, c.country, c.total_spent, c.jobs_posted_count
      ORDER BY c.total_spent DESC
    `);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
