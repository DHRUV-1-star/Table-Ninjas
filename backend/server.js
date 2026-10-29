const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const pool = require('./db');
const pl = require('./procedure_layer');

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

// User Registration via Stored Procedure sp_register_user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, user_role, company_name, professional_title, hourly_rate } = req.body;
    if (!email || !first_name || !last_name || !user_role) {
      return res.status(400).json({ error: 'Missing required registration parameters' });
    }
    const passwordHash = password || 'hashed_default_pwd';
    const userId = await pl.registerUser(email, passwordHash, first_name, last_name, phone || null, user_role);
    if (!userId) {
      return res.status(500).json({ error: 'Registration failed: procedure did not return user ID.' });
    }

    if (user_role === 'CLIENT' || user_role === 'DUAL') {
      await pool.query(`INSERT INTO clients (client_id, company_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)`, [userId, company_name || null]);
    }
    if (user_role === 'FREELANCER' || user_role === 'DUAL') {
      await pool.query(`INSERT INTO freelancers (freelancer_id, professional_title, hourly_rate) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE professional_title = VALUES(professional_title)`, [userId, professional_title || 'Freelancer', hourly_rate || 25.00]);
    }

    res.status(201).json({ message: 'User registered successfully via PL/SQL Stored Procedure sp_register_user', user_id: userId });
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
  try {
    const { client_id, title, description, category, payment_type, budget, experience_level, duration_days, deadline, skill_ids } = req.body;

    if (!client_id || !title || !description || !category || !budget || !duration_days || !deadline) {
      return res.status(400).json({ error: 'Missing required job parameters' });
    }

    const jobId = await pl.insertJob(
      parseInt(client_id, 10),
      title,
      description,
      category,
      payment_type || 'FIXED_PRICE',
      parseFloat(budget),
      experience_level || 'INTERMEDIATE',
      parseInt(duration_days, 10),
      deadline
    );

    if (Array.isArray(skill_ids) && skill_ids.length > 0) {
      const skillValues = skill_ids.map(sid => [jobId, parseInt(sid, 10), true]);
      await pool.query(`INSERT INTO job_skills (job_id, skill_id, is_mandatory) VALUES ?`, [skillValues]);
    }

    res.status(201).json({ message: 'Job posted successfully via Stored Procedure sp_insert_job', job_id: jobId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    await pl.deleteJob(jobId);
    res.json({ message: 'Job deleted successfully via Stored Procedure sp_delete_job' });
  } catch (err) {
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
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

    const proposalId = await pl.submitProposal(
      parseInt(job_id, 10),
      parseInt(freelancer_id, 10),
      parseFloat(bid_amount),
      parseInt(estimated_delivery_days, 10),
      cover_letter
    );

    res.status(201).json({ message: 'Proposal submitted successfully via Stored Procedure sp_submit_proposal', proposal_id: proposalId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already submitted a proposal for this job.' });
    }
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
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

// Award Contract from Proposal via Stored Procedure sp_award_contract
app.post('/api/contracts/award', async (req, res) => {
  try {
    const { proposal_id } = req.body;
    if (!proposal_id) return res.status(400).json({ error: 'proposal_id is required' });

    const contractId = await pl.awardContract(parseInt(proposal_id, 10));
    res.status(201).json({ message: 'Contract awarded and escrow funded successfully via Stored Procedure sp_award_contract', contract_id: contractId });
  } catch (err) {
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Submit Deliverables for Milestone via Stored Procedure sp_submit_milestone
app.patch('/api/milestones/:contract_id/:seq_no/submit', async (req, res) => {
  try {
    const { contract_id, seq_no } = req.params;
    const { submission_notes } = req.body;

    if (!submission_notes) {
      return res.status(400).json({ error: 'submission_notes are required' });
    }

    await pl.submitMilestone(parseInt(contract_id, 10), parseInt(seq_no, 10), submission_notes);
    res.json({ message: 'Milestone deliverables submitted successfully via Stored Procedure sp_submit_milestone' });
  } catch (err) {
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Client Approves Milestone and Releases Payment via Stored Procedure sp_approve_milestone_and_pay
app.post('/api/milestones/:contract_id/:seq_no/approve-pay', async (req, res) => {
  try {
    const { contract_id, seq_no } = req.params;
    await pl.approveMilestoneAndPay(parseInt(contract_id, 10), parseInt(seq_no, 10));
    res.json({ message: 'Milestone approved and payment released successfully via Stored Procedure sp_approve_milestone_and_pay' });
  } catch (err) {
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Mark Contract Completed via Stored Procedure sp_complete_contract
app.post('/api/contracts/:id/complete', async (req, res) => {
  try {
    const contractId = parseInt(req.params.id, 10);
    await pl.completeContract(contractId);
    res.json({ message: 'Contract and Job marked as COMPLETED successfully via Stored Procedure sp_complete_contract' });
  } catch (err) {
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
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

    const reviewId = await pl.submitReview(
      parseInt(contract_id, 10),
      parseInt(reviewer_id, 10),
      parseInt(reviewee_id, 10),
      parseInt(overall_rating, 10),
      parseInt(communication_rating || 5, 10),
      parseInt(quality_rating || 5, 10),
      parseInt(adherence_rating || 5, 10),
      feedback_comment
    );

    res.status(201).json({ message: 'Review submitted successfully via Stored Procedure sp_submit_review', review_id: reviewId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already submitted a review for this contract.' });
    }
    const status = err.sqlState === '45000' ? 400 : 500;
    res.status(status).json({ error: err.message });
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

    await pl.resolveDispute(disputeId, resolution_type, admin_id || 14);
    res.json({ message: 'Dispute successfully resolved by Administrator via Stored Procedure sp_resolve_dispute' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. Analytical Reports via PL/SQL Stored Procedures
// -----------------------------------------------------------------------------
app.get('/api/reports/top-freelancers', async (req, res) => {
  try {
    const report = await pl.topFreelancers();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/client-summary', async (req, res) => {
  try {
    const summary = await pl.clientSummary();
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
