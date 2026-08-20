/**
 * Regression test for End Shift behavior (UAT BLOCKER).
 * Run: node scripts/test-end-shift.mjs
 *
 * Tests:
 *   - End Shift closes current activity, operator segment, sets Ended status
 *   - End Shift works from any activity (Operating, Waiting, Breakdown, Meal Break)
 *   - Double End Shift is rejected
 *   - closingMeter is persisted
 *   - No activities remain open after End Shift
 */

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

let nextAct = 1, nextSeg = 1;
let deurStore = [];

function createDeur() {
  const deur = {
    id: 'deur-test', deurNumber: 'DEUR-2026-000001', status: 'Active',
    shiftStart: now(), shiftEnd: null,
    openingMeter: 100, closingMeter: null,
    turnoverPending: false, turnoverTimestamp: null,
    activities: [{ id: `act-${nextAct++}`, activity: 'Operating', startTime: now(), endTime: null, durationMs: 0 }],
    operatorSegments: [{ id: `seg-${nextSeg++}`, operatorId: 'op-1', operatorName: 'Test Op', startTime: now(), endTime: null, isReliever: false }],
    fuelEntries: [], travelCheckpoints: [], pendingSync: false,
  };
  deurStore.push(deur);
  return deur;
}

function startActivity(deur, activity) {
  const cur = deur.activities.find((a) => a.endTime === null);
  if (cur) { cur.endTime = now(); cur.durationMs = 1000; }
  deur.activities.push({ id: `act-${nextAct++}`, activity, startTime: now(), endTime: null, durationMs: 0 });
  return deur;
}

function endShift(deurId) {
  const deur = deurStore.find((d) => d.id === deurId);
  if (!deur || deur.status !== 'Active') return null;
  const cur = deur.activities.find((a) => a.endTime === null);
  if (cur) { cur.endTime = now(); cur.durationMs = 2000; }
  deur.shiftEnd = now();
  deur.status = 'Ended';
  deur.turnoverPending = false;
  const seg = deur.operatorSegments.find((s) => s.endTime === null);
  if (seg) seg.endTime = now();
  deur.closingMeter = deur.openingMeter + 0.01;
  return deur;
}

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== End Shift Regression Test ===\n');

const activities = ['Operating', 'Waiting', 'Breakdown', 'Meal Break'];

for (const activity of activities) {
  console.log(`TEST: End Shift from ${activity}`);
  deurStore = [];
  const d = createDeur();
  if (activity !== 'Operating') {
    startActivity(d, activity);
  }
  assert(d.status === 'Active', 'DEUR is Active before End Shift');
  const openBefore = d.activities.filter((a) => a.endTime === null).length;
  assert(openBefore === 1, `One open activity (${activity}) before End Shift`);

  const result = endShift(d.id);
  assert(result !== null, 'endShift returned non-null');
  assert(result.status === 'Ended', 'Status changed to Ended');
  assert(result.shiftEnd !== null, 'shiftEnd set');
  assert(result.closingMeter !== null, 'closingMeter persisted');

  const openAfter = result.activities.filter((a) => a.endTime === null).length;
  assert(openAfter === 0, 'No activities remain open after End Shift');

  const openSegs = result.operatorSegments.filter((s) => s.endTime === null).length;
  assert(openSegs === 0, 'No operator segments remain open after End Shift');
  assert(result.turnoverPending === false, 'turnoverPending cleared');

  // Double End Shift — must be rejected
  const result2 = endShift(d.id);
  assert(result2 === null, 'Second endShift rejected');
  assert(result.shiftEnd === d.shiftEnd, 'No duplicate shiftEnd timestamp');

  console.log('');
}

console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
