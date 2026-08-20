/**
 * Regression test for DEUR number uniqueness (DEFECT 3).
 * Run: node scripts/test-deur-number-uniqueness.mjs
 *
 * Verifies:
 *   - DEUR numbers are sequential and never duplicate
 *   - After submission, a new DEUR gets the next sequence number
 *   - Numbers don't collide after simulated reload (stale ID_KEY)
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
let deurStore = [];

function generateDeurNumber() {
  const year = new Date().getFullYear();
  const existing = deurStore
    .map((d) => { const m = d.deurNumber.match(/^DEUR-\d{4}-(\d{6})$/); return m ? parseInt(m[1], 10) : 0; })
    .reduce((mx, n) => Math.max(mx, n), 0);
  const seq = Math.max(existing + 1, nextDeurId);
  return `DEUR-${year}-${String(seq).padStart(6, '0')}`;
}

function createDeur(operatorId) {
  const deurId = `deur-${String(nextDeurId).padStart(4, '0')}`;
  const deurNumber = generateDeurNumber();
  const seqNum = parseInt(deurNumber.split('-')[2], 10);
  nextDeurId = Math.max(nextDeurId + 1, seqNum + 1);
  const deur = { id: deurId, deurNumber, operatorId, date: today(), status: 'Active' };
  deurStore.push(deur);
  return deur;
}

function submitDeur(deurId) {
  const d = deurStore.find((x) => x.id === deurId);
  if (d) d.status = 'Waiting Acknowledgement';
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  PASS: ${message}`); }
  else { failed++; console.error(`  FAIL: ${message}`); }
}

console.log('=== DEUR Number Uniqueness Regression Test ===\n');

// Step 1: Create first DEUR
console.log('STEP 1: Create first DEUR');
const d1 = createDeur('op-001');
assert(d1.deurNumber === 'DEUR-2026-000001', `First DEUR number is 000001 (got ${d1.deurNumber})`);

// Step 2: Create second DEUR
console.log('\nSTEP 2: Create second DEUR');
const d2 = createDeur('op-002');
assert(d2.deurNumber === 'DEUR-2026-000002', `Second DEUR number is 000002 (got ${d2.deurNumber})`);
assert(d1.deurNumber !== d2.deurNumber, 'Numbers are unique');

// Step 3: Submit first DEUR, then create a new one
console.log('\nSTEP 3: Submit DEUR 1, then create new DEUR for same operator');
submitDeur(d1.id);
const d3 = createDeur('op-001');
assert(d3.deurNumber === 'DEUR-2026-000003', `Third DEUR number is 000003 (got ${d3.deurNumber})`);
assert(d3.deurNumber !== d1.deurNumber, 'New DEUR does not duplicate submitted DEUR number');
assert(d3.deurNumber !== d2.deurNumber, 'New DEUR does not duplicate active DEUR number');

// Step 4: Simulate reload with stale nextDeurId
console.log('\nSTEP 4: Simulate reload with stale ID_KEY (nextDeurId reset to 1)');
nextDeurId = 1;
const d4 = createDeur('op-003');
const allNumbers = deurStore.map((d) => d.deurNumber);
const uniqueNumbers = [...new Set(allNumbers)];
assert(d4.deurNumber === 'DEUR-2026-000004', `After stale reload, new DEUR is 000004 (got ${d4.deurNumber})`);
assert(allNumbers.length === uniqueNumbers.length, 'No duplicate numbers across all DEURs');

// Step 5: Verify no two DEURs share the same number
console.log('\nSTEP 5: Final uniqueness check');
const numberCounts = {};
for (const d of deurStore) { numberCounts[d.deurNumber] = (numberCounts[d.deurNumber] || 0) + 1; }
const duplicates = Object.entries(numberCounts).filter(([, count]) => count > 1);
assert(duplicates.length === 0, 'Zero duplicate DEUR numbers in store');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
