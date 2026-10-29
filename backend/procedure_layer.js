// =============================================================================
// PL/SQL-Style Procedural Layer for Freelance Marketplace
// Executes stored procedures defined in db/procedures.sql
// =============================================================================

const pool = require('./db');

/**
 * Execute a stored procedure that returns a result set (e.g., SELECT inside procedure)
 */
async function callProc(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [results] = await conn.query(sql, params);
    // MySQL returns procedure SELECT results as the first element in results array
    return Array.isArray(results) && Array.isArray(results[0]) ? results[0] : results;
  } finally {
    conn.release();
  }
}

/**
 * Execute a stored procedure that writes to an OUT parameter
 */
async function callProcWithOut(callSql, outSql, params = []) {
  const conn = await pool.getConnection();
  try {
    await conn.query(callSql, params);
    const [outRows] = await conn.query(outSql);
    return outRows && outRows.length > 0 ? outRows[0] : null;
  } finally {
    conn.release();
  }
}

// -----------------------------------------------------------------------------
// 1. User & Authentication Procedures
// -----------------------------------------------------------------------------
async function registerUser(email, passwordHash, firstName, lastName, phone, userRole) {
  const out = await callProcWithOut(
    'CALL sp_register_user(?, ?, ?, ?, ?, ?, @o_user_id)',
    'SELECT @o_user_id AS user_id',
    [email, passwordHash, firstName, lastName, phone, userRole]
  );
  return out ? out.user_id : null;
}

async function updateUser(userId, newPasswordHash, newStatus, recordLogin) {
  return await callProc('CALL sp_update_user(?, ?, ?, ?)', [
    userId,
    newPasswordHash || null,
    newStatus || null,
    recordLogin ? 1 : 0
  ]);
}

// -----------------------------------------------------------------------------
// 2. Job Management Procedures
// -----------------------------------------------------------------------------
async function insertJob(clientId, title, description, category, paymentType, budget, experience, durationDays, deadline) {
  const out = await callProcWithOut(
    'CALL sp_insert_job(?, ?, ?, ?, ?, ?, ?, ?, ?, @o_job_id)',
    'SELECT @o_job_id AS job_id',
    [clientId, title, description, category, paymentType, budget, experience, durationDays, deadline]
  );
  return out ? out.job_id : null;
}

async function updateJob(jobId, newBudget, newDuration, newDeadline, newStatus) {
  return await callProc('CALL sp_update_job(?, ?, ?, ?, ?)', [
    jobId, newBudget, newDuration, newDeadline, newStatus
  ]);
}

async function deleteJob(jobId) {
  return await callProc('CALL sp_delete_job(?)', [jobId]);
}

// -----------------------------------------------------------------------------
// 3. Proposal / Bidding Procedures
// -----------------------------------------------------------------------------
async function submitProposal(jobId, freelancerId, bidAmount, estimatedDays, coverLetter) {
  const out = await callProcWithOut(
    'CALL sp_submit_proposal(?, ?, ?, ?, ?, @o_proposal_id)',
    'SELECT @o_proposal_id AS proposal_id',
    [jobId, freelancerId, bidAmount, estimatedDays, coverLetter]
  );
  return out ? out.proposal_id : null;
}

async function listProposals(jobId, freelancerId) {
  return await callProc('CALL sp_list_proposals(?, ?)', [
    jobId || null,
    freelancerId || null
  ]);
}

// -----------------------------------------------------------------------------
// 4. Contract & Milestone Procedures
// -----------------------------------------------------------------------------
async function awardContract(proposalId) {
  const out = await callProcWithOut(
    'CALL sp_award_contract(?, @o_contract_id)',
    'SELECT @o_contract_id AS contract_id',
    [proposalId]
  );
  return out ? out.contract_id : null;
}

async function getContractDetail(contractId) {
  const rows = await callProc('CALL sp_get_contract_detail(?)', [contractId]);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function submitMilestone(contractId, seqNo, notes) {
  return await callProc('CALL sp_submit_milestone(?, ?, ?)', [contractId, seqNo, notes]);
}

async function approveMilestoneAndPay(contractId, seqNo) {
  return await callProc('CALL sp_approve_milestone_and_pay(?, ?)', [contractId, seqNo]);
}

async function completeContract(contractId) {
  return await callProc('CALL sp_complete_contract(?)', [contractId]);
}

// -----------------------------------------------------------------------------
// 5. Review & Dispute Procedures
// -----------------------------------------------------------------------------
async function submitReview(contractId, reviewerId, revieweeId, overallRating, communicationRating, qualityRating, adherenceRating, feedbackComment) {
  const rows = await callProc('CALL sp_submit_review(?, ?, ?, ?, ?, ?, ?, ?)', [
    contractId, reviewerId, revieweeId, overallRating,
    communicationRating || 5, qualityRating || 5, adherenceRating || 5,
    feedbackComment
  ]);
  return rows && rows.length > 0 ? rows[0].review_id : null;
}

async function resolveDispute(disputeId, resolutionType, adminId) {
  return await callProc('CALL sp_resolve_dispute(?, ?, ?)', [
    disputeId, resolutionType, adminId || 14
  ]);
}

// -----------------------------------------------------------------------------
// 6. Analytical / Reporting Procedures
// -----------------------------------------------------------------------------
async function topFreelancers() {
  return await callProc('CALL sp_top_freelancers()');
}

async function clientSummary() {
  return await callProc('CALL sp_client_summary()');
}

module.exports = {
  callProc,
  callProcWithOut,
  registerUser,
  updateUser,
  insertJob,
  updateJob,
  deleteJob,
  submitProposal,
  listProposals,
  awardContract,
  getContractDetail,
  submitMilestone,
  approveMilestoneAndPay,
  completeContract,
  submitReview,
  resolveDispute,
  topFreelancers,
  clientSummary
};
