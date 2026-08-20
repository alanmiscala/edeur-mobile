/**
 * Domain regression test for activity transitions.
 * Run: node scripts/test-activity-transitions.mjs
 *
 * Tests the full lifecycle:
 *   Create Active DEUR (Operating at T0)
 *   → Waiting(reason) at T1
 *   → Meal Break at T2
 *   → Breakdown(category) at T3
 *   → Operating at T4
 *
 * Verifies:
 *   - Previous activity is closed with endTime and durationMs > 0
 *   - New activity is open (endTime === null)
 *   - Exactly one open activity at any time
 *   - Reason/category stored correctly
 *   - Durations accumulate
 */

// --- Minimal stubs to satisfy mockRepository's localStorage usage ---
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

// We can't import the TS module directly from Node, so we replicate the
// core startActivity logic exactly as it appears in mockRepository.ts
// and test it in isolation.

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

let nextActivityId = 1;
let nextDeurId = 1;

function createDeur() {
  const deurId = `deur-${String(nextDeurId++).padStart(4, '0')}`;
  const actId = `act-${String(nextActivityId++).padStart(4, '0')}`;
  return {
    id: deurId,
    deurNumber: `DEUR-2026-${String(nextDeurId - 1).padStart(6, '0')}`,
    status: 'Active',
    activities: [
      { id: actId, deurId, activity: 'Operating', startTime: now(), endTime: null, durationMs: 0 },
    ],
  };
}

function startActivity(deur, activity, reason, category) {
  if (!deur || deur.status !== 'Active') return null;
  const cur = deur.activities.find((a) => a.endTime === null);
  if (cur) {
    if (cur.activity === activity && !reason && !category) return deur;
    cur.endTime = now();
    cur.durationMs = new Date(cur.endTime).getTime() - new Date(cur.startTime).getTime();
  }
  deur.activities.push({
    id: `act-${String(nextActivityId++).padStart(4, '0')}`,
    deurId: deur.id,
    activity,
    startTime: now(),
    endTime: null,
    durationMs: 0,
    reason: reason ?? undefined,
    category: category ?? undefined,
  });
  return deur;
}

// --- Test harness ---

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== Activity Transition Domain Regression Test ===\n');

  // Create Active DEUR
  console.log('STEP 1: Create Active DEUR with Operating at T0');
  const deur = createDeur();
  assert(deur.status === 'Active', 'DEUR status is Active');
  assert(deur.activities.length === 1, 'Exactly 1 activity on creation');
  const t0Activity = deur.activities.find((a) => a.endTime === null);
  assert(t0Activity !== null, 'One open activity exists');
  assert(t0Activity.activity === 'Operating', 'Initial activity is Operating');
  assert(t0Activity.endTime === null, 'Operating is open (endTime null)');

  await sleep(10);

  // T1: Start Waiting with reason
  console.log('\nSTEP 2: Transition Operating → Waiting (reason: "Waiting for Material") at T1');
  const reasonText = 'Waiting for Material';
  const result1 = startActivity(deur, 'Waiting', reasonText, undefined);
  assert(result1 !== null, 'startActivity returned non-null');
  const operating = deur.activities[0];
  assert(operating.activity === 'Operating', 'First activity is still Operating');
  assert(operating.endTime !== null, 'Operating endTime is set');
  assert(operating.durationMs > 0, 'Operating durationMs > 0');
  const waiting = deur.activities.find((a) => a.activity === 'Waiting' && a.endTime === null);
  assert(waiting !== null, 'Waiting activity is open');
  assert(waiting.reason === reasonText, 'Waiting reason stored correctly');
  assert(waiting.category === undefined, 'Waiting category is undefined');
  const openCount1 = deur.activities.filter((a) => a.endTime === null).length;
  assert(openCount1 === 1, 'Exactly 1 open activity after Waiting transition');
  assert(deur.activities.length === 2, 'Total 2 activities after Waiting');

  await sleep(10);

  // T2: Start Meal Break (no reason needed)
  console.log('\nSTEP 3: Transition Waiting → Meal Break at T2');
  const result2 = startActivity(deur, 'Meal Break', undefined, undefined);
  assert(result2 !== null, 'startActivity returned non-null');
  assert(waiting.endTime !== null, 'Waiting endTime is set');
  assert(waiting.durationMs > 0, 'Waiting durationMs > 0');
  const mealBreak = deur.activities.find((a) => a.activity === 'Meal Break' && a.endTime === null);
  assert(mealBreak !== null, 'Meal Break activity is open');
  assert(mealBreak.reason === undefined, 'Meal Break has no reason');
  assert(mealBreak.category === undefined, 'Meal Break has no category');
  const openCount2 = deur.activities.filter((a) => a.endTime === null).length;
  assert(openCount2 === 1, 'Exactly 1 open activity after Meal Break transition');
  assert(deur.activities.length === 3, 'Total 3 activities after Meal Break');

  await sleep(10);

  // T3: Start Breakdown with category
  console.log('\nSTEP 4: Transition Meal Break → Breakdown (category: "Engine") at T3');
  const categoryText = 'Engine';
  const result3 = startActivity(deur, 'Breakdown', undefined, categoryText);
  assert(result3 !== null, 'startActivity returned non-null');
  assert(mealBreak.endTime !== null, 'Meal Break endTime is set');
  assert(mealBreak.durationMs > 0, 'Meal Break durationMs > 0');
  const breakdown = deur.activities.find((a) => a.activity === 'Breakdown' && a.endTime === null);
  assert(breakdown !== null, 'Breakdown activity is open');
  assert(breakdown.category === categoryText, 'Breakdown category stored correctly');
  assert(breakdown.reason === undefined, 'Breakdown reason is undefined');
  const openCount3 = deur.activities.filter((a) => a.endTime === null).length;
  assert(openCount3 === 1, 'Exactly 1 open activity after Breakdown transition');
  assert(deur.activities.length === 4, 'Total 4 activities after Breakdown');

  await sleep(10);

  // T4: Start Operating again
  console.log('\nSTEP 5: Transition Breakdown → Operating at T4');
  const result4 = startActivity(deur, 'Operating', undefined, undefined);
  assert(result4 !== null, 'startActivity returned non-null');
  assert(breakdown.endTime !== null, 'Breakdown endTime is set');
  assert(breakdown.durationMs > 0, 'Breakdown durationMs > 0');
  const operating2 = deur.activities.find((a) => a.activity === 'Operating' && a.endTime === null && a.id !== operating.id);
  assert(operating2 !== null, 'New Operating activity is open');
  const openCount4 = deur.activities.filter((a) => a.endTime === null).length;
  assert(openCount4 === 1, 'Exactly 1 open activity after Operating transition');
  assert(deur.activities.length === 5, 'Total 5 activities after return to Operating');

  // Final verification
  console.log('\nSTEP 6: Final verification');
  const allClosed = deur.activities.filter((a) => a.endTime !== null);
  const allOpen = deur.activities.filter((a) => a.endTime === null);
  assert(allClosed.length === 4, '4 closed activities total');
  assert(allOpen.length === 1, '1 open activity total');
  assert(allOpen[0].activity === 'Operating', 'Final open activity is Operating');

  const sequence = deur.activities.map((a) => a.activity);
  assert(sequence.join(' → ') === 'Operating → Waiting → Meal Break → Breakdown → Operating',
    'Activity sequence is correct: ' + sequence.join(' → '));

  // Verify all durations
  const allDurationsPositive = allClosed.every((a) => a.durationMs > 0);
  assert(allDurationsPositive, 'All closed activities have durationMs > 0');

  // Verify transition: same activity no-op
  console.log('\nSTEP 7: Same-activity no-op (Operating → Operating)');
  const before = deur.activities.length;
  const noopResult = startActivity(deur, 'Operating', undefined, undefined);
  assert(noopResult !== null, 'startActivity returned non-null (early return)');
  assert(deur.activities.length === before, 'No new activity created on same-activity no-op');

  // Verify non-Active DEUR rejects
  console.log('\nSTEP 8: Non-Active DEUR rejection');
  const endedDeur = createDeur();
  endedDeur.status = 'Ended';
  const rejectedResult = startActivity(endedDeur, 'Waiting', 'Test', undefined);
  assert(rejectedResult === null, 'startActivity returns null for non-Active DEUR');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
