/**
 * Regression tests for DEUR lifecycle identity, turnover/resume, and duplicate prevention.
 * Run: node scripts/test-deur-lifecycle.mjs
 *
 * Tests:
 *   1. Main starts DEUR 000003. Turnover. Reliever finds DEUR 000003.
 *   2. Reliever resumes. Same assignmentId, rentalId, equipmentId, deurNumber.
 *   3. Active DEUR exists. Attempt Start New DEUR. Rejected.
 *   4. Submit DEUR 000003. Start new DEUR. Assert 000004.
 *   5. All deurNumber values are unique.
 *   6. Submitted DEUR ID navigation resolves submitted record.
 *   7. Active DEUR ID navigation resolves active record.
 *   8. Reliever → Main turnover keeps same DEUR ID and number.
 */

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

let nextDeurId = 1;
let nextSegmentId = 1;
let nextActivityId = 1;
let deurStore = [];

function generateDeurNumber() {
  const year = new Date().getFullYear();
  const existing = deurStore
    .map((d) => { const m = d.deurNumber.match(/^DEUR-\d{4}-(\d{6})$/); return m ? parseInt(m[1], 10) : 0; })
    .reduce((mx, n) => Math.max(mx, n), 0);
  const seq = Math.max(existing + 1, nextDeurId);
  return `DEUR-${year}-${String(seq).padStart(6, '0')}`;
}

function createDeur(params) {
  const ex = deurStore.find((d) => d.equipmentId === params.equipmentId && d.rentalId === params.rentalId && d.date === today() && d.status === 'Active');
  if (ex) return ex;
  const deurId = `deur-${String(nextDeurId).padStart(4, '0')}`;
  const deurNumber = generateDeurNumber();
  const seqNum = parseInt(deurNumber.split('-')[2], 10);
  nextDeurId = Math.max(nextDeurId + 1, seqNum + 1);
  const segId = `seg-${String(nextSegmentId++).padStart(4, '0')}`;
  const actId = `act-${String(nextActivityId++).padStart(4, '0')}`;
  const deur = {
    id: deurId, deurNumber, operatorId: params.operatorId, equipmentId: params.equipmentId,
    assignmentId: params.assignmentId, rentalId: params.rentalId, projectId: params.projectId,
    date: today(), shiftStart: now(), shiftEnd: null, status: 'Active',
    openingMeter: params.openingMeter ?? null, closingMeter: null,
    openingOdometer: null, closingOdometer: null,
    remarks: '', breakdownRemarks: '', turnoverPending: false, turnoverTimestamp: null,
    activities: [{ id: actId, deurId, activity: 'Operating', startTime: now(), endTime: null, durationMs: 0 }],
    fuelEntries: [], operatorSegments: [{ id: segId, deurId, operatorId: params.operatorId, operatorName: params.operatorName, startTime: now(), endTime: null, isReliever: params.isReliever ?? false }], travelCheckpoints: [], pendingSync: false,
  };
  deurStore.push(deur);
  return deur;
}

function markTurnoverPending(deurId) {
  const deur = deurStore.find((d) => d.id === deurId);
  if (!deur || deur.status !== 'Active') return null;
  const cur = deur.activities.find((a) => a.endTime === null);
  if (cur) { cur.endTime = now(); cur.durationMs = 1; }
  const seg = deur.operatorSegments.find((s) => s.endTime === null);
  if (seg) seg.endTime = now();
  deur.turnoverPending = true;
  deur.turnoverTimestamp = now();
  return deur;
}

function resumeOperation(deurId, operatorId, operatorName, isReliever) {
  const deur = deurStore.find((d) => d.id === deurId);
  if (!deur || deur.status !== 'Active') return null;
  deur.turnoverPending = false;
  deur.operatorSegments.push({ id: `seg-${String(nextSegmentId++).padStart(4, '0')}`, deurId, operatorId, operatorName, startTime: now(), endTime: null, isReliever });
  return deur;
}

function endShift(deurId) {
  const deur = deurStore.find((d) => d.id === deurId);
  if (!deur || deur.status !== 'Active') return null;
  const cur = deur.activities.find((a) => a.endTime === null);
  if (cur) { cur.endTime = now(); cur.durationMs = 1; }
  deur.shiftEnd = now();
  deur.status = 'Ended';
  const seg = deur.operatorSegments.find((s) => s.endTime === null);
  if (seg) seg.endTime = now();
  return deur;
}

function submitDeur(deurId) {
  const deur = deurStore.find((d) => d.id === deurId);
  if (!deur || deur.status !== 'Ended') return null;
  deur.status = 'Waiting Acknowledgement';
  deur.submittedAt = now();
  return deur;
}

function getActiveDeurWithTurnoverPending() { return deurStore.find((d) => d.status === 'Active' && d.turnoverPending) ?? null; }
function getResumableDeurForOperator(operatorId, operatorAssignmentId, operatorRentalId) {
  const bySeg = deurStore.find((d) => d.date === today() && d.status === 'Active' && d.operatorSegments.some((s) => s.operatorId === operatorId && s.endTime === null));
  if (bySeg) return bySeg;
  const pending = deurStore.find((d) => d.status === 'Active' && d.turnoverPending);
  if (pending) return pending;
  if (operatorAssignmentId && operatorRentalId) {
    const active = deurStore.find((d) => d.assignmentId === operatorAssignmentId && d.rentalId === operatorRentalId && d.date === today() && d.status === 'Active');
    if (active) return active;
  }
  return deurStore.find((d) => d.date === today() && d.operatorSegments.some((s) => s.operatorId === operatorId)) ?? null;
}
function canStartNewDeur(assignmentId, rentalId, equipmentId) {
  const active = deurStore.find((d) => d.equipmentId === equipmentId && d.rentalId === rentalId && d.date === today() && d.status === 'Active');
  return !active;
}
function getSubmittedDeurById(id) { const d = deurStore.find((x) => x.id === id); return d && (d.status === 'Submitted' || d.status === 'Waiting Acknowledgement' || d.status === 'Acknowledged' || d.status === 'Rejected') ? d : null; }

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { passed++; console.log(`  PASS: ${message}`); }
  else { failed++; console.error(`  FAIL: ${message}`); }
}

// Simulated operators and assignment
const MAIN_ID = 'op-main-001';
const MAIN_NAME = 'Juan Dela Cruz';
const RELIEVER_ID = 'op-reliever-001';
const RELIEVER_NAME = 'Pedro Santos';
const EQUIPMENT_ID = 'eq-001';
const ASSIGNMENT_ID = 'asg-001';
const RENTAL_ID = 'rnt-001';
const PROJECT_ID = 'prj-001';

console.log('=== DEUR Lifecycle Identity Regression Tests ===\n');

// TEST 1: Main starts DEUR, turnover, reliever finds it
console.log('TEST 1: Main starts DEUR. Turnover. Reliever finds same DEUR.');
// Simulate prior DEURs 000001 and 000002 already submitted
const d0a = createDeur({ operatorId: 'op-prev-1', operatorName: 'Prev Op 1', equipmentId: 'eq-prev', assignmentId: 'asg-prev', rentalId: 'rnt-prev', projectId: 'prj-prev' });
endShift(d0a.id); submitDeur(d0a.id);
const d0b = createDeur({ operatorId: 'op-prev-2', operatorName: 'Prev Op 2', equipmentId: 'eq-prev2', assignmentId: 'asg-prev2', rentalId: 'rnt-prev2', projectId: 'prj-prev2' });
endShift(d0b.id); submitDeur(d0b.id);

const d1 = createDeur({ operatorId: MAIN_ID, operatorName: MAIN_NAME, equipmentId: EQUIPMENT_ID, assignmentId: ASSIGNMENT_ID, rentalId: RENTAL_ID, projectId: PROJECT_ID });
const test1Number = d1.deurNumber;
console.log(`  Main started DEUR: ${test1Number}`);
markTurnoverPending(d1.id);
const relieverFinds = getActiveDeurWithTurnoverPending();
assert(relieverFinds !== null, 'Reliever found turnover-pending DEUR');
assert(relieverFinds?.id === d1.id, 'Reliever found the SAME DEUR ID');
assert(relieverFinds?.deurNumber === test1Number, 'Reliever found the SAME DEUR number');

// TEST 2: Reliever resumes, same IDs
console.log('\nTEST 2: Reliever resumes. Same assignment/rental/equipment/deurNumber.');
const resumed = resumeOperation(d1.id, RELIEVER_ID, RELIEVER_NAME, true);
assert(resumed !== null, 'Resume succeeded');
assert(resumed?.assignmentId === ASSIGNMENT_ID, 'Same assignmentId');
assert(resumed?.rentalId === RENTAL_ID, 'Same rentalId');
assert(resumed?.equipmentId === EQUIPMENT_ID, 'Same equipmentId');
assert(resumed?.deurNumber === test1Number, 'Same deurNumber');
assert(resumed?.id === d1.id, 'Same deurId');
assert(resumed?.turnoverPending === false, 'turnoverPending cleared');
const relieverSeg = resumed?.operatorSegments.find((s) => s.operatorId === RELIEVER_ID && s.endTime === null);
assert(relieverSeg !== undefined, 'Reliever has open segment');
assert(relieverSeg?.isReliever === true, 'Reliever segment marked isReliever');

// TEST 3: Active DEUR exists, start new rejected
console.log('\nTEST 3: Active DEUR exists. Attempt Start New DEUR.');
const canStart = canStartNewDeur(ASSIGNMENT_ID, RENTAL_ID, EQUIPMENT_ID);
assert(canStart === false, 'Start New DEUR is blocked (active DEUR exists)');
// createDeur guard: returns existing instead of creating new
const d3 = createDeur({ operatorId: RELIEVER_ID, operatorName: RELIEVER_NAME, equipmentId: EQUIPMENT_ID, assignmentId: ASSIGNMENT_ID, rentalId: RENTAL_ID, projectId: PROJECT_ID });
assert(d3.id === d1.id, 'createDeur returned existing DEUR, not a new one');

// TEST 4: Submit DEUR, start new, assert next number
console.log('\nTEST 4: Submit DEUR. Start new DEUR. Assert next number.');
endShift(d1.id);
const submitted = submitDeur(d1.id);
assert(submitted?.status === 'Waiting Acknowledgement', 'DEUR submitted');
const canStartAfter = canStartNewDeur(ASSIGNMENT_ID, RENTAL_ID, EQUIPMENT_ID);
assert(canStartAfter === true, 'Start New DEUR allowed after submission');
const d4 = createDeur({ operatorId: MAIN_ID, operatorName: MAIN_NAME, equipmentId: EQUIPMENT_ID, assignmentId: ASSIGNMENT_ID, rentalId: RENTAL_ID, projectId: PROJECT_ID });
console.log(`  Previous: ${test1Number}, New: ${d4.deurNumber}`);
assert(d4.id !== d1.id, 'New DEUR has different ID');
assert(d4.deurNumber !== test1Number, 'New DEUR has different number');
const prevSeq = parseInt(test1Number.split('-')[2], 10);
const newSeq = parseInt(d4.deurNumber.split('-')[2], 10);
assert(newSeq === prevSeq + 1, `New DEUR is next sequence (${prevSeq + 1}, got ${newSeq})`);

// TEST 5: All deurNumber values are unique
console.log('\nTEST 5: All deurNumber values are unique.');
const allNumbers = deurStore.map((d) => d.deurNumber);
const uniqueNumbers = [...new Set(allNumbers)];
assert(allNumbers.length === uniqueNumbers.length, `No duplicate numbers (${allNumbers.length} total, ${uniqueNumbers.length} unique)`);
const numberCounts = {};
for (const n of allNumbers) { numberCounts[n] = (numberCounts[n] || 0) + 1; }
const dups = Object.entries(numberCounts).filter(([, c]) => c > 1);
assert(dups.length === 0, 'Zero duplicate DEUR numbers');

// TEST 6: Submitted DEUR ID resolves submitted record
console.log('\nTEST 6: Submitted DEUR ID navigation resolves submitted record.');
const submittedLookup = getSubmittedDeurById(d1.id);
assert(submittedLookup !== null, 'Submitted DEUR found by ID');
assert(submittedLookup?.status === 'Waiting Acknowledgement', 'Resolved record is submitted');
assert(submittedLookup?.id === d1.id, 'Resolved record has correct ID');

// TEST 7: Active DEUR ID resolves active record
console.log('\nTEST 7: Active DEUR ID navigation resolves active record.');
const activeLookup = deurStore.find((d) => d.id === d4.id && d.status === 'Active');
assert(activeLookup !== null, 'Active DEUR found by ID');
assert(activeLookup?.status === 'Active', 'Resolved record is Active');
assert(activeLookup?.id === d4.id, 'Resolved record has correct ID');

// TEST 8: Reliever → Main turnover keeps same DEUR
console.log('\nTEST 8: Reliever → Main turnover keeps same DEUR ID and number.');
markTurnoverPending(d4.id);
const mainFinds = getActiveDeurWithTurnoverPending();
assert(mainFinds !== null, 'Main operator found turnover-pending DEUR');
assert(mainFinds?.id === d4.id, 'Main found same DEUR ID');
assert(mainFinds?.deurNumber === d4.deurNumber, 'Main found same DEUR number');
const mainResumed = resumeOperation(d4.id, MAIN_ID, MAIN_NAME, false);
assert(mainResumed !== null, 'Main resume succeeded');
assert(mainResumed?.id === d4.id, 'Main resumed same DEUR ID');
assert(mainResumed?.deurNumber === d4.deurNumber, 'Main resumed same DEUR number');
const mainSeg = mainResumed?.operatorSegments.find((s) => s.operatorId === MAIN_ID && s.endTime === null);
assert(mainSeg !== undefined, 'Main has open segment');
assert(mainSeg?.isReliever === false, 'Main segment not marked as reliever');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
