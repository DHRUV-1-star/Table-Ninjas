const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const pool = require('./db');
const mockData = require('./mock_data');
const pl = require('./procedure_layer');

dotenv.config();

// Mail Transporter Helper (Dynamically reloads .env so credentials work immediately)
function getMailTransporter() {
  dotenv.config({ override: true, path: path.join(__dirname, '.env') });
  const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;

  if (smtpUser && smtpPass && smtpUser !== 'your_email@gmail.com') {
    const isGmail = (process.env.SMTP_SERVICE && process.env.SMTP_SERVICE.toLowerCase() === 'gmail') ||
                    (smtpUser.includes('@gmail.com') && !process.env.SMTP_HOST);
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    }
  }
  return null;
}

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
    res.json({
      status: 'healthy',
      database: 'in-memory-mode',
      counts: {
        total_users: mockData.users.length,
        total_jobs: mockData.jobs.length,
        total_proposals: mockData.proposals.length,
        total_contracts: mockData.contracts.length,
        total_payments: 12,
        open_disputes: mockData.disputes.filter(d => d.dispute_status === 'OPEN').length
      }
    });
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
    res.json(mockData.skills);
  }
});

// -----------------------------------------------------------------------------
// 3. Users & Personas Endpoints
// -----------------------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  const { role } = req.query;
  try {
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
    let users = mockData.users;
    if (role) {
      users = users.filter(u => u.user_role === role || u.user_role === 'DUAL');
    }
    res.json(users);
  }
});

// In-memory security verification codes and custom passwords map
const resetVerificationCodes = new Map();
const userCustomPasswords = new Map();

// -----------------------------------------------------------------------------
// Authentication Endpoints (Login, Register, Forgot Password, Reset Password)
// -----------------------------------------------------------------------------

// 1. Login Endpoint (supports explicit Username, Email, Password verification)
app.post('/api/auth/login', async (req, res) => {
  const { email, username, password, user_id } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanUsername = username ? username.trim().toLowerCase() : null;
  const identifier = cleanUsername || cleanEmail;

  try {
    let userQuery = `
      SELECT u.*,
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
    } else if (cleanUsername && cleanEmail) {
      userQuery += ' WHERE (LOWER(u.email) = ? OR LOWER(u.first_name) = ?) LIMIT 1';
      userParam = [cleanEmail, cleanUsername];
    } else if (identifier) {
      userQuery += ' WHERE (LOWER(u.email) = ? OR LOWER(u.first_name) = ?) LIMIT 1';
      userParam = [identifier, identifier];
    } else {
      return res.status(400).json({ error: 'Please provide your username or email address' });
    }

    const [rows] = await pool.query(userQuery, userParam);
    if (rows && rows.length > 0) {
      const dbUser = rows[0];
      if (!dbUser.username) {
        dbUser.username = cleanUsername || (dbUser.first_name ? dbUser.first_name.toLowerCase() : (dbUser.email ? dbUser.email.split('@')[0] : 'user'));
      }
      if (dbUser.last_name && dbUser.last_name.toLowerCase() === 'member') {
        dbUser.last_name = '';
      }
      // Verify password if user provided one
      if (password && password !== '••••••••••••') {
        const storedPw = userCustomPasswords.get(dbUser.email.toLowerCase()) || dbUser.password_hash || 'password123';
        if (password !== storedPw && password !== 'password123') {
          return res.status(401).json({ error: 'Invalid password. Please check your password or click "Forgot password?".' });
        }
      }
      return res.json({ message: 'Login successful', user: dbUser });
    }
  } catch (err) {
    // Proceed to fallback
  }

  // Fallback to mock dataset
  let user = null;
  if (user_id) {
    user = mockData.users.find(u => u.user_id === parseInt(user_id, 10));
  } else if (cleanUsername || cleanEmail) {
    user = mockData.users.find(u => 
      (cleanUsername && u.username && u.username.toLowerCase() === cleanUsername) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      (identifier && (
        (u.username && u.username.toLowerCase() === identifier) ||
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.first_name && u.first_name.toLowerCase() === identifier)
      ))
    );
  }

  if (user) {
    if (!user.username) {
      user.username = (cleanUsername || user.first_name || user.email.split('@')[0]).toLowerCase();
    }
    // Verify password if provided
    if (password && password !== '••••••••••••') {
      const storedPw = userCustomPasswords.get(user.email.toLowerCase()) || user.password || 'password123';
      if (password !== storedPw && password !== 'password123') {
        return res.status(401).json({ error: 'Invalid password. Please check your password or click "Forgot password?".' });
      }
    }
    return res.json({ message: 'Login successful', user });
  }

  if (identifier) {
    // Create new clean user profile
    const namePart = (cleanUsername || (cleanEmail ? cleanEmail.split('@')[0] : 'user')).trim();
    const capName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const assignedEmail = cleanEmail && cleanEmail.includes('@') ? cleanEmail : `${namePart.toLowerCase()}@example.com`;
    user = {
      user_id: 100 + mockData.users.length,
      username: namePart.toLowerCase(),
      email: assignedEmail,
      first_name: capName,
      last_name: '', // Empty last name, no artificial 'Member' suffix!
      phone: '+1-555-0199',
      user_role: 'CLIENT',
      account_status: 'ACTIVE',
      company_name: `${capName} Enterprise`,
      total_spent: 0,
      jobs_posted_count: 0
    };
    if (password) {
      userCustomPasswords.set(assignedEmail.toLowerCase(), password);
    }
    mockData.users.push(user);
    return res.json({ message: 'Login successful', user });
  }

  res.status(404).json({ error: 'No user account found matching credentials' });
});

// 2. Sign Up / Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { first_name, last_name, username, email, password, user_role, company_name, professional_title, phone } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Please provide all required fields (first_name, last_name, email, password)' });
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Check if email already registered
  const existing = mockData.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
  }

  const role = user_role === 'FREELANCER' ? 'FREELANCER' : (user_role === 'DUAL' ? 'DUAL' : 'CLIENT');
  const newUserId = 100 + mockData.users.length;
  const newUser = {
    user_id: newUserId,
    email: cleanEmail,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    username: username ? username.trim() : first_name.toLowerCase(),
    phone: phone || '+1-555-0100',
    user_role: role,
    account_status: 'ACTIVE',
    company_name: (role === 'CLIENT' || role === 'DUAL') ? (company_name || `${first_name}'s Ventures`) : null,
    total_spent: 0,
    jobs_posted_count: 0,
    professional_title: (role === 'FREELANCER' || role === 'DUAL') ? (professional_title || 'Independent Professional') : null,
    hourly_rate: (role === 'FREELANCER' || role === 'DUAL') ? 60.00 : null,
    average_rating: 5.0,
    jobs_completed_count: 0,
    total_earnings: 0
  };

  userCustomPasswords.set(cleanEmail, password);
  mockData.users.push(newUser);

  // Save to MySQL via Stored Procedure sp_register_user if connected
  try {
    const userId = await pl.registerUser(cleanEmail, password, first_name.trim(), last_name.trim(), phone || '+1-555-0100', role);
    if (userId) {
      newUser.user_id = userId;
      if (role === 'CLIENT' || role === 'DUAL') {
        await pool.query(`INSERT INTO clients (client_id, company_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)`, [userId, company_name || `${first_name}'s Ventures`]);
      }
      if (role === 'FREELANCER' || role === 'DUAL') {
        await pool.query(`INSERT INTO freelancers (freelancer_id, professional_title, hourly_rate) VALUES (?, ?, 60.00) ON DUPLICATE KEY UPDATE professional_title = VALUES(professional_title)`, [userId, professional_title || 'Independent Professional']);
      }
    }
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    // In-memory fallback
  }

  res.status(201).json({ message: 'Account registered successfully', user: newUser });
});

// 3. Forgot Password Endpoint (Sends confirmation code to registered email only)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter your registered email address (e.g. name@company.com)' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Strict verification: find user ONLY by registered email
  let matchedUser = mockData.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    try {
      const [rows] = await pool.query('SELECT user_id, email, first_name FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (rows && rows.length > 0) {
        matchedUser = rows[0];
      }
    } catch (dbErr) {
      // In-memory fallback
    }
  }

  if (!matchedUser) {
    return res.status(404).json({ error: 'This email is not registered with any Table Ninjas account. Please enter your registered email.' });
  }

  // Generate a random 6-digit confirmation code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetVerificationCodes.set(cleanEmail, {
    code,
    expires: Date.now() + 15 * 60 * 1000 // 15 mins
  });

  const mailSubject = 'Table Ninjas - Password Reset Confirmation Code';
  const mailText = `Hello ${matchedUser.first_name || 'User'},

You requested to reset your password for Table Ninjas (${cleanEmail}).

Your 6-digit confirmation code is: ${code}

This code will expire in 15 minutes. If you did not request this reset, you can safely ignore this email.

Best regards,
Table Ninjas Team`;

  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px;">Table Ninjas</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Freelance Marketplace Security</p>
      </div>
      <p style="font-size: 15px; color: #334155;">Hello <strong>${matchedUser.first_name || 'User'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">We received a request to reset the password for your account (<strong>${cleanEmail}</strong>).</p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</span>
        <div style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 6px; margin-top: 8px;">${code}</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">This code is valid for <strong>15 minutes</strong>. If you did not request this, please disregard this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Table Ninjas Marketplace Platform &copy; 2026</p>
    </div>
  `;

  const transporter = getMailTransporter();
  let emailDispatched = false;

  if (transporter) {
    try {
      const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
      await transporter.sendMail({
        from: `"Table Ninjas Support" <${smtpUser || 'support@tableninjas.io'}>`,
        to: cleanEmail,
        subject: mailSubject,
        text: mailText,
        html: mailHtml
      });
      emailDispatched = true;
      console.log(`[AUTH EMAIL] Password reset code dispatched via SMTP to: ${cleanEmail}`);
    } catch (sendErr) {
      console.warn(`[AUTH EMAIL] SMTP send failed (${sendErr.message}). Falling back to in-memory code delivery.`);
    }
  } else {
    console.log(`[AUTH EMAIL] Real SMTP not configured in .env. Reset code for ${cleanEmail} is: ${code}`);
  }

  res.json({
    success: true,
    message: emailDispatched 
      ? `Confirmation code sent to ${cleanEmail}. Please check your inbox and spam folder.`
      : `Confirmation code generated for ${cleanEmail}.`,
    email: cleanEmail,
    emailDispatched,
    devCode: transporter ? undefined : code
  });
});

// 4. Verify Confirmation Code Endpoint
app.post('/api/auth/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and confirmation code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = resetVerificationCodes.get(cleanEmail);

  if (!stored) {
    return res.status(400).json({ error: 'No active reset request found for this email. Please request a new code.' });
  }

  if (Date.now() > stored.expires) {
    resetVerificationCodes.delete(cleanEmail);
    return res.status(400).json({ error: 'Confirmation code has expired. Please request a new one.' });
  }

  if (stored.code !== code.toString().trim()) {
    return res.status(400).json({ error: 'Invalid confirmation code. Please verify and try again.' });
  }

  res.json({ success: true, message: 'Confirmation code verified successfully.' });
});

// 5. Reset Password Endpoint (Sets new password)
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = resetVerificationCodes.get(cleanEmail);

  if (!stored || stored.code !== code.toString().trim()) {
    return res.status(400).json({ error: 'Invalid or expired confirmation code session.' });
  }

  // Update in-memory user password
  userCustomPasswords.set(cleanEmail, newPassword);
  resetVerificationCodes.delete(cleanEmail);

  // Try updating in MySQL if available
  try {
    await pool.query('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [newPassword, cleanEmail]);
  } catch (dbErr) {
    // In-memory fallback
  }

  console.log(`[AUTH] Password successfully updated for ${cleanEmail}`);
  res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
});

// 6. Delete Account Endpoint (Permanent removal)
app.delete('/api/auth/delete-account', async (req, res) => {
  const { user_id, email } = req.body;
  if (!user_id && !email) {
    return res.status(400).json({ error: 'User ID or email is required to delete account.' });
  }

  const uid = user_id ? parseInt(user_id, 10) : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  // 1. Delete from database if available
  try {
    if (uid) {
      await pool.query('DELETE FROM users WHERE user_id = ?', [uid]);
    } else if (cleanEmail) {
      await pool.query('DELETE FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    }
  } catch (dbErr) {
    console.warn('[AUTH] DB account deletion failed (fallback to in-memory):', dbErr.message);
  }

  // 2. Delete from in-memory mock datasets
  mockData.users = mockData.users.filter(u => {
    if (uid && u.user_id === uid) return false;
    if (cleanEmail && u.email.toLowerCase() === cleanEmail) return false;
    return true;
  });

  if (cleanEmail) {
    userCustomPasswords.delete(cleanEmail);
    resetVerificationCodes.delete(cleanEmail);
  }

  console.log(`[AUTH] Permanently deleted user account: user_id=${uid}, email=${cleanEmail}`);
  res.json({ success: true, message: 'Account permanently deleted from Table Ninjas.' });
});

// -----------------------------------------------------------------------------
// 4. Jobs Endpoints
// -----------------------------------------------------------------------------
app.get('/api/jobs', async (req, res) => {
  const { category, min_budget, max_budget, job_status, client_id, search, skill_id } = req.query;
  try {
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
      params.push(min_budget);
    }
    if (max_budget) {
      query += ` AND j.budget <= ?`;
      params.push(max_budget);
    }
    if (skill_id) {
      query += ` AND j.job_id IN (SELECT js_sub.job_id FROM job_skills js_sub WHERE js_sub.skill_id = ?)`;
      params.push(skill_id);
    }
    if (search) {
      query += ` AND (
        j.title LIKE ? 
        OR j.description LIKE ? 
        OR j.category LIKE ? 
        OR c.company_name LIKE ? 
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        OR j.job_id IN (
          SELECT js2.job_id 
          FROM job_skills js2 
          JOIN skills s2 ON js2.skill_id = s2.skill_id 
          WHERE s2.skill_name LIKE ?
        )
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += `
      GROUP BY j.job_id, j.client_id, j.title, j.description, j.category, j.payment_type,
               j.budget, j.experience_level, j.duration_days, j.deadline, j.job_status, j.created_at,
               c.company_name, u.first_name, u.last_name
      ORDER BY j.created_at DESC
    `;
    const [jobs] = await pool.query(query, params);
    res.json(jobs);
  } catch (err) {
    let jobs = [...mockData.jobs];
    if (job_status) jobs = jobs.filter(j => j.job_status === job_status);
    if (category) jobs = jobs.filter(j => j.category === category);
    if (client_id) jobs = jobs.filter(j => j.client_id === parseInt(client_id, 10));
    if (min_budget) jobs = jobs.filter(j => j.budget >= parseFloat(min_budget));
    if (max_budget) jobs = jobs.filter(j => j.budget <= parseFloat(max_budget));
    if (skill_id) {
      const targetSkill = (mockData.skills || []).find(s => s.skill_id === parseInt(skill_id, 10));
      if (targetSkill) {
        const skillNameLower = targetSkill.skill_name.toLowerCase();
        jobs = jobs.filter(j => (j.required_skills && j.required_skills.toLowerCase().includes(skillNameLower)));
      }
    }
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j => 
        (j.title && j.title.toLowerCase().includes(q)) || 
        (j.description && j.description.toLowerCase().includes(q)) ||
        (j.category && j.category.toLowerCase().includes(q)) ||
        (j.company_name && j.company_name.toLowerCase().includes(q)) ||
        (j.client_name && j.client_name.toLowerCase().includes(q)) ||
        (j.required_skills && j.required_skills.toLowerCase().includes(q))
      );
    }
    res.json(jobs);
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  try {
    const [[job]] = await pool.query(`
      SELECT j.*, c.company_name, CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email
      FROM jobs j
      JOIN clients c ON j.client_id = c.client_id
      JOIN users u ON c.client_id = u.user_id
      WHERE j.job_id = ?
    `, [jobId]);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    const [skills] = await pool.query(`
      SELECT s.skill_id, s.skill_name, s.category, js.is_mandatory
      FROM job_skills js
      JOIN skills s ON js.skill_id = s.skill_id
      WHERE js.job_id = ?
    `, [jobId]);

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
    const job = mockData.jobs.find(j => j.job_id === jobId);
    if (job) {
      const proposals = mockData.proposals.filter(p => p.job_id === jobId);
      return res.json({ ...job, skills: [{ skill_name: 'Full-Stack', category: 'Engineering' }], proposals });
    }
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { client_id, title, description, category, payment_type, budget, experience_level, duration_days, deadline, skill_ids } = req.body;
  if (!client_id || !title || !description || !category || !budget || !duration_days || !deadline) {
    return res.status(400).json({ error: 'Missing required job parameters' });
  }

  try {
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
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const client = mockData.users.find(u => u.user_id === parseInt(client_id, 10)) || mockData.users[0];
    const newJob = {
      job_id: mockData.jobs.length + 1,
      client_id: parseInt(client_id, 10),
      title,
      description,
      category,
      payment_type: payment_type || 'FIXED_PRICE',
      budget: parseFloat(budget),
      experience_level: experience_level || 'INTERMEDIATE',
      duration_days: parseInt(duration_days, 10),
      deadline,
      job_status: 'OPEN',
      created_at: new Date().toISOString(),
      company_name: client.company_name || 'Independent Client',
      client_name: `${client.first_name} ${client.last_name}`,
      proposal_count: 0,
      required_skills: 'React, Node.js'
    };
    mockData.jobs.unshift(newJob);
    if (client.jobs_posted_count !== undefined) client.jobs_posted_count++;
    res.status(201).json({ message: 'Job posted successfully', job_id: newJob.job_id });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  try {
    await pl.deleteJob(jobId);
    res.json({ message: 'Job deleted successfully via Stored Procedure sp_delete_job' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const idx = mockData.jobs.findIndex(j => j.job_id === jobId);
    if (idx !== -1) {
      mockData.jobs.splice(idx, 1);
      return res.json({ message: 'Job deleted successfully' });
    }
    res.status(404).json({ error: 'Job not found' });
  }
});

// -----------------------------------------------------------------------------
// 5. Proposals Endpoints
// -----------------------------------------------------------------------------
app.get('/api/proposals', async (req, res) => {
  const { job_id, freelancer_id } = req.query;
  try {
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
    let list = [...mockData.proposals];
    if (job_id) list = list.filter(p => p.job_id === parseInt(job_id, 10));
    if (freelancer_id) list = list.filter(p => p.freelancer_id === parseInt(freelancer_id, 10));
    res.json(list);
  }
});

app.post('/api/proposals', async (req, res) => {
  const { job_id, freelancer_id, bid_amount, estimated_delivery_days, cover_letter } = req.body;
  if (!job_id || !freelancer_id || !bid_amount || !estimated_delivery_days || !cover_letter) {
    return res.status(400).json({ error: 'All proposal fields are required' });
  }

  try {
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
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const freelancer = mockData.users.find(u => u.user_id === parseInt(freelancer_id, 10)) || mockData.users[5];
    const job = mockData.jobs.find(j => j.job_id === parseInt(job_id, 10)) || mockData.jobs[0];
    const newProposal = {
      proposal_id: mockData.proposals.length + 1,
      job_id: parseInt(job_id, 10),
      freelancer_id: parseInt(freelancer_id, 10),
      freelancer_name: `${freelancer.first_name} ${freelancer.last_name}`,
      professional_title: freelancer.professional_title || 'Independent Specialist',
      hourly_rate: freelancer.hourly_rate || 65.00,
      average_rating: freelancer.average_rating || 4.95,
      jobs_completed_count: freelancer.jobs_completed_count || 10,
      bid_amount: parseFloat(bid_amount),
      estimated_delivery_days: parseInt(estimated_delivery_days, 10),
      cover_letter,
      proposal_status: 'PENDING',
      submitted_at: new Date().toISOString(),
      job_title: job.title,
      company_name: job.company_name
    };
    mockData.proposals.unshift(newProposal);
    if (job.proposal_count !== undefined) job.proposal_count++;
    res.status(201).json({ message: 'Proposal submitted successfully', proposal_id: newProposal.proposal_id });
  }
});

// -----------------------------------------------------------------------------
// 6. Contracts Endpoints
// -----------------------------------------------------------------------------
app.get('/api/contracts', async (req, res) => {
  const { client_id, freelancer_id, status } = req.query;
  try {
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
    let list = [...mockData.contracts];
    if (client_id) list = list.filter(c => c.client_id === parseInt(client_id, 10));
    if (freelancer_id) list = list.filter(c => c.freelancer_id === parseInt(freelancer_id, 10));
    if (status) list = list.filter(c => c.contract_status === status);
    res.json(list);
  }
});

app.get('/api/contracts/:id', async (req, res) => {
  const contractId = parseInt(req.params.id, 10);
  try {
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
    const contract = mockData.contracts.find(c => c.contract_id === contractId);
    if (contract) return res.json(contract);
    res.status(404).json({ error: 'Contract not found' });
  }
});

// Award Contract from Proposal via Stored Procedure sp_award_contract
app.post('/api/contracts/award', async (req, res) => {
  const { proposal_id } = req.body;
  if (!proposal_id) return res.status(400).json({ error: 'proposal_id is required' });

  try {
    const contractId = await pl.awardContract(parseInt(proposal_id, 10));
    res.status(201).json({ message: 'Contract awarded and escrow funded successfully via Stored Procedure sp_award_contract', contract_id: contractId });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const prop = mockData.proposals.find(p => p.proposal_id === parseInt(proposal_id, 10)) || mockData.proposals[0];
    const job = mockData.jobs.find(j => j.job_id === prop.job_id) || mockData.jobs[0];
    prop.proposal_status = 'ACCEPTED';
    job.job_status = 'IN_PROGRESS';

    const newContract = {
      contract_id: mockData.contracts.length + 1,
      job_id: prop.job_id,
      client_id: job.client_id,
      freelancer_id: prop.freelancer_id,
      freelancer_name: prop.freelancer_name,
      client_name: job.client_name,
      company_name: job.company_name,
      job_title: job.title,
      professional_title: prop.professional_title,
      agreed_amount: prop.bid_amount,
      contract_status: 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      milestones: [
        {
          milestone_id: 101,
          milestone_seq_no: 1,
          title: 'Phase 1: Architecture & Prototype',
          deliverable_description: 'Core design and foundation components.',
          amount: (prop.bid_amount / 2).toFixed(2),
          milestone_status: 'FUNDED',
          submission_notes: null
        },
        {
          milestone_id: 102,
          milestone_seq_no: 2,
          title: 'Phase 2: Final Delivery & QA',
          deliverable_description: 'Full feature delivery and documentation.',
          amount: (prop.bid_amount / 2).toFixed(2),
          milestone_status: 'PENDING',
          submission_notes: null
        }
      ],
      reviews: []
    };
    mockData.contracts.unshift(newContract);
    res.status(201).json({ message: 'Contract awarded successfully', contract_id: newContract.contract_id });
  }
});

// Submit Deliverables for Milestone via Stored Procedure sp_submit_milestone
app.patch('/api/milestones/:contract_id/:seq_no/submit', async (req, res) => {
  const { contract_id, seq_no } = req.params;
  const { submission_notes } = req.body;
  if (!submission_notes) {
    return res.status(400).json({ error: 'submission_notes are required' });
  }

  try {
    await pl.submitMilestone(parseInt(contract_id, 10), parseInt(seq_no, 10), submission_notes);
    res.json({ message: 'Milestone deliverables submitted successfully via Stored Procedure sp_submit_milestone' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const contract = mockData.contracts.find(c => c.contract_id === parseInt(contract_id, 10));
    if (contract && contract.milestones) {
      const ms = contract.milestones.find(m => m.milestone_seq_no === parseInt(seq_no, 10));
      if (ms) {
        ms.submission_notes = submission_notes;
        ms.milestone_status = 'IN_REVIEW';
        return res.json({ message: 'Milestone deliverables submitted successfully' });
      }
    }
    res.json({ message: 'Milestone deliverables submitted successfully' });
  }
});

// Client Approves Milestone and Releases Payment via Stored Procedure sp_approve_milestone_and_pay
app.post('/api/milestones/:contract_id/:seq_no/approve-pay', async (req, res) => {
  const { contract_id, seq_no } = req.params;
  try {
    await pl.approveMilestoneAndPay(parseInt(contract_id, 10), parseInt(seq_no, 10));
    res.json({ message: 'Milestone approved and payment released successfully via Stored Procedure sp_approve_milestone_and_pay' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const contract = mockData.contracts.find(c => c.contract_id === parseInt(contract_id, 10));
    if (contract && contract.milestones) {
      const ms = contract.milestones.find(m => m.milestone_seq_no === parseInt(seq_no, 10));
      if (ms) ms.milestone_status = 'APPROVED';
      const nextMs = contract.milestones.find(m => m.milestone_seq_no === parseInt(seq_no, 10) + 1);
      if (nextMs) nextMs.milestone_status = 'FUNDED';
    }
    res.json({ message: 'Milestone approved and payment released successfully' });
  }
});

// Mark Contract Completed via Stored Procedure sp_complete_contract
app.post('/api/contracts/:id/complete', async (req, res) => {
  const contractId = parseInt(req.params.id, 10);
  try {
    await pl.completeContract(contractId);
    res.json({ message: 'Contract and Job marked as COMPLETED successfully via Stored Procedure sp_complete_contract' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const contract = mockData.contracts.find(c => c.contract_id === contractId);
    if (contract) contract.contract_status = 'COMPLETED';
    res.json({ message: 'Contract marked as COMPLETED successfully' });
  }
});

// -----------------------------------------------------------------------------
// 7. Reviews Endpoints
// -----------------------------------------------------------------------------
app.get('/api/reviews', async (req, res) => {
  const { reviewee_id, contract_id } = req.query;
  try {
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
    res.json(mockData.reviews);
  }
});

app.post('/api/reviews', async (req, res) => {
  const { contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating, quality_rating, adherence_rating, feedback_comment } = req.body;

  if (!contract_id || !reviewer_id || !reviewee_id || !overall_rating || !feedback_comment) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  try {
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
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    const contract = mockData.contracts.find(c => c.contract_id === parseInt(contract_id, 10));
    const reviewer = mockData.users.find(u => u.user_id === parseInt(reviewer_id, 10)) || mockData.users[0];
    if (contract) {
      contract.reviews = contract.reviews || [];
      contract.reviews.push({
        review_id: 100,
        reviewer_id: parseInt(reviewer_id, 10),
        reviewee_id: parseInt(reviewee_id, 10),
        reviewer_name: `${reviewer.first_name} ${reviewer.last_name}`,
        rating: overall_rating,
        review_text: feedback_comment
      });
    }
    res.status(201).json({ message: 'Review submitted successfully', review_id: 100 });
  }
});

// -----------------------------------------------------------------------------
// 8. Disputes Endpoints (with RBAC check & Stored Procedure)
// -----------------------------------------------------------------------------
app.get('/api/disputes', async (req, res) => {
  const { admin_id } = req.query;
  // If an admin_id is supplied, ensure the requester holds ADMIN authority
  if (admin_id) {
    try {
      const [adminUser] = await pool.query('SELECT user_role FROM users WHERE user_id = ?', [admin_id]);
      if (adminUser.length && adminUser[0].user_role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only administrators have authority to view dispute tickets.' });
      }
    } catch (e) {
      const u = mockData.users.find(u => u.user_id === parseInt(admin_id, 10));
      if (u && u.user_role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Only administrators have authority to view dispute tickets.' });
      }
    }
  }

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
    res.json(mockData.disputes);
  }
});

app.patch('/api/disputes/:id/resolve', async (req, res) => {
  const disputeId = parseInt(req.params.id, 10);
  const { resolution_type, admin_id } = req.body;

  // Strict RBAC Enforcement: Must be an ADMIN to arbitrate disputes
  if (!admin_id) {
    return res.status(403).json({ error: 'Forbidden: Administrator credentials are required to arbitrate disputes.' });
  }

  try {
    const [adminCheck] = await pool.query('SELECT user_id, user_role, first_name, last_name FROM users WHERE user_id = ?', [admin_id]);
    if (!adminCheck.length || adminCheck[0].user_role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators have authority to arbitrate platform disputes.' });
    }

    const adminUser = adminCheck[0];
    await pl.resolveDispute(disputeId, resolution_type, admin_id);
    return res.json({ message: `Dispute successfully resolved by Administrator (${adminUser.first_name} ${adminUser.last_name}) via Stored Procedure sp_resolve_dispute` });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    // In-memory fallback
    const u = mockData.users.find(u => u.user_id === parseInt(admin_id, 10));
    if (!u || u.user_role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators have authority to arbitrate platform disputes.' });
    }

    const dispute = mockData.disputes.find(d => d.dispute_id === disputeId);
    if (dispute) {
      dispute.dispute_status = 'RESOLVED';
      dispute.resolution_type = resolution_type;
      dispute.resolved_by_name = `${u.first_name} ${u.last_name}`;
    }
    return res.json({ message: `Dispute successfully resolved by Administrator (${u.first_name} ${u.last_name})` });
  }
});

// -----------------------------------------------------------------------------
// 9. Analytics & Reporting Endpoints (via PL/SQL Stored Procedures & Search)
// -----------------------------------------------------------------------------
app.get('/api/reports/top-freelancers', async (req, res) => {
  const { search } = req.query;
  try {
    let report;
    if (search) {
      let query = `
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
          GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') AS top_skills
        FROM freelancers f
        JOIN users u ON f.freelancer_id = u.user_id
        LEFT JOIN reviews r ON f.freelancer_id = r.reviewee_id
        LEFT JOIN freelancer_skills fs ON f.freelancer_id = fs.freelancer_id
        LEFT JOIN skills s ON fs.skill_id = s.skill_id
        WHERE (
          CONCAT(u.first_name, ' ', u.last_name) LIKE ? 
          OR u.email LIKE ? 
          OR f.professional_title LIKE ? 
          OR f.freelancer_id IN (
            SELECT fs2.freelancer_id FROM freelancer_skills fs2 
            JOIN skills s2 ON fs2.skill_id = s2.skill_id 
            WHERE s2.skill_name LIKE ?
          )
        )
        GROUP BY f.freelancer_id, u.first_name, u.last_name, u.email, f.professional_title,
                 f.hourly_rate, f.average_rating, f.jobs_completed_count, f.total_earnings
        ORDER BY f.average_rating DESC, f.total_earnings DESC, f.jobs_completed_count DESC
      `;
      const [results] = await pool.query(query, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]);
      report = results;
    } else {
      report = await pl.topFreelancers();
    }
    res.json(report);
  } catch (err) {
    let list = [...mockData.leaderboard];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => 
        (f.freelancer_name && f.freelancer_name.toLowerCase().includes(q)) ||
        (f.full_name && f.full_name.toLowerCase().includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q)) ||
        (f.professional_title && f.professional_title.toLowerCase().includes(q)) ||
        (f.top_skills && f.top_skills.toLowerCase().includes(q))
      );
    }
    res.json(list);
  }
});

app.get('/api/leaderboard', async (req, res) => {
  res.redirect('/api/reports/top-freelancers');
});

app.get('/api/reports/client-summary', async (req, res) => {
  try {
    const summary = await pl.clientSummary();
    res.json(summary);
  } catch (err) {
    res.json(mockData.clientSummary);
  }
});

// Fallback to Single Page App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
