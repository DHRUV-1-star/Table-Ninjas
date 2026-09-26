// =============================================================================
// Automated End-to-End Test Suite for Freelance Marketplace
// =============================================================================

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(title, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${details}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    const health = await request('GET', '/health');
    assert('API Server is healthy and DB is connected', health.status === 200 && health.body.status === 'healthy');

    // Test 2: List skills
    const skills = await request('GET', '/skills');
    assert('Skills catalog returns 18+ standardized skills', skills.status === 200 && skills.body.length >= 15);

    // Test 3: Flow Step 1 - Post New Job
    const newJobPayload = {
      client_id: 1,
      title: 'Automated Test WebSocket Service',
      description: 'End-to-end integration test job for automated verification.',
      category: 'Backend Development',
      payment_type: 'FIXED_PRICE',
      budget: 2500.00,
      experience_level: 'EXPERT',
      duration_days: 15,
      deadline: '2026-06-30',
      skill_ids: [2, 16] // Node.js, Redis
    };
    const postJobRes = await request('POST', '/jobs', newJobPayload);
    assert('Main Flow 1: Client posts a new job', postJobRes.status === 201 && postJobRes.body.job_id > 0);
    const testJobId = postJobRes.body.job_id;

    // Test 4: Search job by skill
    const searchRes = await request('GET', `/jobs?skill_id=2&search=Automated`);
    assert('Read/Search: Filter job by skill and keyword', searchRes.status === 200 && searchRes.body.some(j => j.job_id === testJobId));

    // Test 5: Flow Step 2 - Freelancer Bids on Job
    const bidPayload = {
      job_id: testJobId,
      freelancer_id: 6,
      bid_amount: 2400.00,
      estimated_delivery_days: 12,
      cover_letter: 'Automated test bid with full test coverage and clean code.'
    };
    const bidRes = await request('POST', '/proposals', bidPayload);
    assert('Main Flow 2: Freelancer submits proposal', bidRes.status === 201 && bidRes.body.proposal_id > 0);
    const testProposalId = bidRes.body.proposal_id;

    // Test 6: Edge Case 1 - Duplicate Bidding Prevention
    const dupBidRes = await request('POST', '/proposals', bidPayload);
    assert('Edge Case 1: Duplicate bid rejected', dupBidRes.status === 400 && dupBidRes.body.error.includes('already submitted'));

    // Test 7: Edge Case 2 - Self-Bidding Prevention
    const selfBidRes = await request('POST', '/proposals', {
      job_id: testJobId,
      freelancer_id: 1, // Same as client_id
      bid_amount: 2000.00,
      estimated_delivery_days: 10,
      cover_letter: 'Self bid test'
    });
    assert('Edge Case 2: Self-bidding strictly prohibited', selfBidRes.status === 400);

    // Test 8: Flow Step 3 - Award Contract from Proposal
    const awardRes = await request('POST', '/contracts/award', { proposal_id: testProposalId });
    assert('Main Flow 3: Client awards contract and locks escrow', awardRes.status === 201 && awardRes.body.contract_id > 0);
    const testContractId = awardRes.body.contract_id;

    // Verify contract created and job status set to IN_PROGRESS
    const contractDetail = await request('GET', `/contracts/${testContractId}`);
    assert('Contract verification: Status is ACTIVE with 2 milestones', contractDetail.status === 200 && contractDetail.body.contract_status === 'ACTIVE' && contractDetail.body.milestones.length === 2);

    // Test 9: Edge Case 3 - Cannot delete job with active contract
    const deleteJobRes = await request('DELETE', `/jobs/${testJobId}`);
    assert('Edge Case 3: Deletion of job with active contract rejected', deleteJobRes.status === 400 && deleteJobRes.body.error.includes('Cannot delete'));

    // Test 10: Flow Step 4 - Submit Milestone 1 Deliverables
    const submitM1Res = await request('PATCH', `/milestones/${testContractId}/1/submit`, {
      submission_notes: 'PR #101 merged with 98% test coverage.'
    });
    assert('Main Flow 4: Freelancer submits Milestone 1 deliverable', submitM1Res.status === 200);

    // Test 11: Flow Step 5 - Approve Milestone 1 and Release Payment
    const approveM1Res = await request('POST', `/milestones/${testContractId}/1/approve-pay`);
    assert('Main Flow 5: Client approves Milestone 1 and dispatches payout', approveM1Res.status === 200);

    // Test 12: Flow Step 6 - Submit and Approve Milestone 2
    await request('PATCH', `/milestones/${testContractId}/2/submit`, { submission_notes: 'Phase 2 final QA verification passed.' });
    const approveM2Res = await request('POST', `/milestones/${testContractId}/2/approve-pay`);
    assert('Main Flow 6: Milestone 2 approved and paid', approveM2Res.status === 200);

    // Test 13: Edge Case 4 - Reviews only allowed on COMPLETED contracts
    const earlyReviewRes = await request('POST', '/reviews', {
      contract_id: testContractId,
      reviewer_id: 1,
      reviewee_id: 6,
      overall_rating: 5,
      feedback_comment: 'Early review test'
    });
    assert('Edge Case 4: Review rejected before contract completion', earlyReviewRes.status === 400 && earlyReviewRes.body.error.includes('COMPLETED'));

    // Test 14: Mark contract as completed
    const completeContractRes = await request('POST', `/contracts/${testContractId}/complete`);
    assert('Main Flow 7: Contract marked COMPLETED', completeContractRes.status === 200);

    // Test 15: Flow Step 7 - Client leaves 5-star review
    const reviewRes = await request('POST', '/reviews', {
      contract_id: testContractId,
      reviewer_id: 1,
      reviewee_id: 6,
      overall_rating: 5,
      communication_rating: 5,
      quality_rating: 5,
      adherence_rating: 5,
      feedback_comment: 'Outstanding performance on automated integration tests.'
    });
    assert('Main Flow 8: Verified review submitted post-contract', reviewRes.status === 201 && reviewRes.body.review_id > 0);

    // Test 16: Non-trivial reporting view
    const topFreelancers = await request('GET', '/reports/top-freelancers');
    assert('Non-trivial SQL Report: Top freelancers leaderboard using JOIN + GROUP BY + AVG', topFreelancers.status === 200 && topFreelancers.body.length > 0 && topFreelancers.body[0].average_rating >= 4.5);

    // Test 17: Non-trivial reporting view - Client summary
    const clientSummary = await request('GET', '/reports/client-summary');
    assert('Non-trivial SQL Report: Client spending and contract volume rollup', clientSummary.status === 200 && clientSummary.body.length > 0);

    console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unhandled Test Suite Error:', err);
    process.exit(1);
  }
}

runTests();
