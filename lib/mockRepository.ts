import type {
  Assignment, Deur, Equipment, FuelTransaction, FuelGaugeLevel, FuelObservation,
  Operator, Project, Rental, User, ActivityEvent, ActivityType, OperatorSegment,
  WaitingReasonEntry, BreakdownCategoryEntry, TravelCheckpoint, GPSCoordinates,
  LocationSource, LoginRecord, OperatorType,
} from './types';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

const STORAGE_KEY = 'erms_deur_store_v6';
const ID_KEY = 'erms_deur_ids_v6';
const LOGIN_RECORDS_KEY = 'erms_login_records_v1';
const ADHOC_KEY = 'erms_adhoc_relievers_v1';
const DEFAULT_RELIEVER_PIN = '1234';

// All known historical storage keys that must be purged on UAT reset
const LEGACY_KEYS = [
  'erms_deur_store_v1', 'erms_deur_store_v2', 'erms_deur_store_v3',
  'erms_deur_store_v4', 'erms_deur_store_v5',
  'erms_deur_ids_v1', 'erms_deur_ids_v2', 'erms_deur_ids_v3',
  'erms_deur_ids_v4', 'erms_deur_ids_v5',
  'erms_operator_session_v1', 'erms_pending_deur_v1',
  'erms_login_records_v1', 'erms_adhoc_relievers_v1',
];

export const sampleUsers: User[] = [
  { id: 'usr-001', loginName: 'jcruz', password: 'operator123', operatorId: 'op-001', pin: '1234' },
  { id: 'usr-002', loginName: 'rgomez', password: 'operator123', operatorId: 'op-002', pin: '5678' },
  { id: 'usr-003', loginName: 'preyes', password: 'operator123', operatorId: 'op-003', pin: '9999' },
];

export const sampleOperators: Operator[] = [
  { id: 'op-001', name: 'Juan Dela Cruz', loginName: 'jcruz', initials: 'JD', pin: '1234', isReliever: false },
  { id: 'op-002', name: 'Richard Gomez', loginName: 'rgomez', initials: 'RG', pin: '5678', isReliever: false },
  { id: 'op-003', name: 'Pedro Reyes', loginName: 'preyes', initials: 'PR', pin: '9999', isReliever: true },
];

export const sampleEquipment: Equipment[] = [
  { id: 'eqp-023', name: 'CAT 320 Excavator', assetNumber: 'EQP-000023', category: 'Excavator', status: 'Active', hourMeter: 4520, hasOdometer: true },
  { id: 'eqp-012', name: 'Hamm HD 12 VV Roller', assetNumber: 'EQP-000012', category: 'Roller', status: 'Active', hourMeter: 2890, hasOdometer: false },
  { id: 'eqp-045', name: 'Isuzu FVR Truck', assetNumber: 'EQP-000045', category: 'Truck', status: 'Active', hourMeter: 120300, hasOdometer: true },
];

export const sampleProjects: Project[] = [
  { id: 'prj-001', name: 'Cebu Warehouse Expansion', location: 'Cebu, PH' },
  { id: 'prj-002', name: 'Davao Port Rehabilitation', location: 'Davao, PH' },
];

export const sampleAssignments: Assignment[] = [
  { id: 'asg-001', operatorId: 'op-001', equipmentId: 'eqp-023', projectId: 'prj-001', status: 'Active', assignedDate: '2026-01-10' },
  { id: 'asg-002', operatorId: 'op-002', equipmentId: 'eqp-012', projectId: 'prj-002', status: 'Active', assignedDate: '2026-01-15' },
];

export const sampleRentals: Rental[] = [
  { id: 'rnt-001', rentalNumber: 'RNT-2026-0041', assignmentId: 'asg-001', equipmentId: 'eqp-023', projectId: 'prj-001', operatorId: 'op-001', customerName: 'Cebu Construction Corp.', status: 'Active', startDate: '2026-01-10', endDate: '2026-02-10', billingMethod: 'Per Day', dailyRate: 12500 },
  { id: 'rnt-002', rentalNumber: 'RNT-2026-0038', assignmentId: 'asg-002', equipmentId: 'eqp-012', projectId: 'prj-002', operatorId: 'op-002', customerName: 'Davao Logistics Inc.', status: 'Active', startDate: '2026-01-15', endDate: '2026-02-15', billingMethod: 'Per Day', dailyRate: 9800 },
];

export const sampleWaitingReasons: WaitingReasonEntry[] = [
  { id: 'wr-001', label: 'Waiting for Material', active: true },
  { id: 'wr-002', label: 'Waiting for Truck', active: true },
  { id: 'wr-003', label: 'Waiting for Instruction', active: true },
  { id: 'wr-004', label: 'Waiting for Customer', active: true },
  { id: 'wr-005', label: 'Waiting for Access', active: true },
  { id: 'wr-006', label: 'Traffic Clearance', active: true },
  { id: 'wr-007', label: 'Weather', active: true },
  { id: 'wr-008', label: 'Site Preparation', active: true },
  { id: 'wr-009', label: 'Other', active: true },
];

export const sampleBreakdownCategories: BreakdownCategoryEntry[] = [
  { id: 'bc-001', label: 'Engine', active: true },
  { id: 'bc-002', label: 'Hydraulic', active: true },
  { id: 'bc-003', label: 'Electrical', active: true },
  { id: 'bc-004', label: 'Tire', active: true },
  { id: 'bc-005', label: 'Fuel', active: true },
  { id: 'bc-006', label: 'Other', active: true },
];

// --- Storage helpers ---
function loadLoginRecords(): LoginRecord[] {
  try { if (typeof localStorage !== 'undefined') { const raw = localStorage.getItem(LOGIN_RECORDS_KEY); if (raw) return JSON.parse(raw) as LoginRecord[]; } } catch { /* ignore */ }
  return [];
}
function saveLoginRecords(records: LoginRecord[]): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}
let loginRecords: LoginRecord[] = loadLoginRecords();
let nextLoginRecordId = loginRecords.length + 1;

function loadFromStorage(): Deur[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return (JSON.parse(raw) as Deur[]).map(migrateDeur);
    }
  } catch { /* ignore */ }
  return [];
}

function migrateDeur(d: Deur): Deur {
  const fuelEntries: FuelTransaction[] = (d.fuelEntries as unknown[]).map((f) => {
    const fe = f as Record<string, unknown>;
    if (fe && typeof fe === 'object' && 'fuelAdded' in fe) return fe as unknown as FuelTransaction;
    return {
      id: fe.id as string, deurId: fe.deurId as string, timestamp: fe.timestamp as string,
      operatorId: '', operatorName: '', fuelAdded: (fe.quantity as number) ?? 0,
      gaugeBefore: typeof fe.gaugeLevel === 'number' ? fe.gaugeLevel : undefined, gaugeAfter: undefined,
      remarks: fe.remarks as string | undefined, fuelSlipNumber: undefined,
      hourMeter: undefined, odometer: undefined,
    } as FuelTransaction;
  });
  return {
    ...d, deurNumber: d.deurNumber ?? `DEUR-${new Date().getFullYear()}-${String(1).padStart(6, '0')}`,
    submittedAt: d.submittedAt, openingOdometer: d.openingOdometer ?? null, closingOdometer: d.closingOdometer ?? null,
    operatorSegments: d.operatorSegments ?? [], travelCheckpoints: d.travelCheckpoints ?? [],
    fuelEntries, fuelObservation: d.fuelObservation, travelLocation: d.travelLocation,
    pendingSync: d.pendingSync ?? false, activities: d.activities.map((a) => ({ ...a })),
  };
}

function saveToStorage(store: Deur[]): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

function loadIds(): { deur: number; activity: number; fuel: number; segment: number; checkpoint: number } {
  try { if (typeof localStorage !== 'undefined') { const raw = localStorage.getItem(ID_KEY); if (raw) return { deur: 1, activity: 1, fuel: 1, segment: 1, checkpoint: 1, ...JSON.parse(raw) }; } } catch { /* ignore */ }
  return { deur: 1, activity: 1, fuel: 1, segment: 1, checkpoint: 1 };
}
function saveIds(ids: { deur: number; activity: number; fuel: number; segment: number; checkpoint: number }): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(ID_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

let deurStore: Deur[] = loadFromStorage();
let ids = loadIds();
let nextDeurId = ids.deur;
let nextActivityId = ids.activity;
let nextFuelId = ids.fuel;
let nextSegmentId = ids.segment;
let nextCheckpointId = ids.checkpoint;

function persist(): void {
  saveToStorage(deurStore);
  saveIds({ deur: nextDeurId, activity: nextActivityId, fuel: nextFuelId, segment: nextSegmentId, checkpoint: nextCheckpointId });
}

function generateDeurNumber(): string {
  const year = new Date().getFullYear();
  const existing = deurStore
    .map((d) => { const m = d.deurNumber.match(/^DEUR-\d{4}-(\d{6})$/); return m ? parseInt(m[1], 10) : 0; })
    .reduce((mx, n) => Math.max(mx, n), 0);
  const seq = Math.max(existing + 1, nextDeurId);
  return `DEUR-${year}-${String(seq).padStart(6, '0')}`;
}

// --- Ad-hoc reliever registry ---
interface AdHocReliever { id: string; name: string; pin: string; isReliever: true; }
let adHocRelievers: AdHocReliever[] = [];
let nextAdHocId = 1;
function loadAdHoc(): void {
  try { if (typeof localStorage !== 'undefined') { const raw = localStorage.getItem(ADHOC_KEY); if (raw) { adHocRelievers = JSON.parse(raw) as AdHocReliever[]; nextAdHocId = adHocRelievers.reduce((m, r) => { const mm = r.id.match(/rel-(\d+)/); return mm ? Math.max(m, parseInt(mm[1], 10) + 1) : m; }, 1); } } } catch { /* ignore */ }
}
function saveAdHoc(): void { try { if (typeof localStorage !== 'undefined') localStorage.setItem(ADHOC_KEY, JSON.stringify(adHocRelievers)); } catch { /* ignore */ } }
loadAdHoc();

function makeOp(r: AdHocReliever): Operator {
  return { id: r.id, name: r.name, loginName: '', pin: r.pin, isReliever: true, initials: r.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() };
}
function recordLogin(deurId: string | null, name: string, type: OperatorType, deurNum: string | null): void {
  loginRecords.push({ id: `lr-${String(nextLoginRecordId++).padStart(4, '0')}`, deurId, operatorName: name, operatorType: type, loginTime: now(), logoutTime: null, deurNumber: deurNum });
  saveLoginRecords(loginRecords);
}
function recordLogout(deurId: string | null): void {
  const a = [...loginRecords].reverse().find((r) => r.deurId === deurId && r.logoutTime === null);
  if (a) { a.logoutTime = now(); saveLoginRecords(loginRecords); }
}

export const mockRepository = {
  getDefaultRelieverPin(): string { return DEFAULT_RELIEVER_PIN; },

  authenticateByPin(pin: string): Operator | null { return sampleOperators.find((o) => o.pin === pin) ?? null; },

  authenticateReliever(name: string, pin: string): Operator | null {
    const t = name.trim();
    const reg = sampleOperators.find((o) => o.pin === pin && o.isReliever && o.name.toLowerCase() === t.toLowerCase());
    if (reg) return reg;
    const ah = adHocRelievers.find((r) => r.pin === pin && r.name.toLowerCase() === t.toLowerCase());
    if (ah) return makeOp(ah);
    if (pin === DEFAULT_RELIEVER_PIN && t.length >= 3) {
      const ex = adHocRelievers.find((r) => r.name.toLowerCase() === t.toLowerCase());
      if (ex) return makeOp(ex);
      const id = `rel-${String(nextAdHocId++).padStart(4, '0')}`;
      adHocRelievers.push({ id, name: t, pin, isReliever: true }); saveAdHoc();
      return makeOp({ id, name: t, pin, isReliever: true });
    }
    return null;
  },

  getOperator(operatorId: string): Operator | null {
    const reg = sampleOperators.find((o) => o.id === operatorId);
    if (reg) return reg;
    const ah = adHocRelievers.find((r) => r.id === operatorId);
    if (ah) return makeOp(ah);
    return null;
  },
  getOperatorAssignment(operatorId: string): Assignment | null { return sampleAssignments.find((a) => a.operatorId === operatorId) ?? null; },
  getAssignmentForDeur(deurId: string): Assignment | null { const d = deurStore.find((x) => x.id === deurId); return d ? sampleAssignments.find((a) => a.id === d.assignmentId) ?? null : null; },
  getEquipment(equipmentId: string): Equipment | null { return sampleEquipment.find((e) => e.id === equipmentId) ?? null; },
  getProject(projectId: string): Project | null { return sampleProjects.find((p) => p.id === projectId) ?? null; },
  getRental(rentalId: string): Rental | null { return sampleRentals.find((r) => r.id === rentalId) ?? null; },
  getRentalForOperator(operatorId: string): Rental | null { return sampleRentals.find((r) => r.operatorId === operatorId) ?? null; },
  getRentalForDeur(deurId: string): Rental | null { const d = deurStore.find((x) => x.id === deurId); return d ? sampleRentals.find((r) => r.id === d.rentalId) ?? null : null; },
  getWaitingReasons(): WaitingReasonEntry[] { return sampleWaitingReasons.filter((r) => r.active); },
  getBreakdownCategories(): BreakdownCategoryEntry[] { return sampleBreakdownCategories.filter((c) => c.active); },
  getDeurForToday(operatorId: string, rentalId: string): Deur | null { return deurStore.find((d) => d.operatorId === operatorId && d.rentalId === rentalId && d.date === today()) ?? null; },

  // --- Explicit active/submitted/ended lookups ---
  getActiveDeurForRental(rentalId: string): Deur | null { return deurStore.find((d) => d.rentalId === rentalId && d.date === today() && d.status === 'Active') ?? null; },
  getActiveDeurForEquipmentRental(equipmentId: string, rentalId: string): Deur | null { return deurStore.find((d) => d.equipmentId === equipmentId && d.rentalId === rentalId && d.date === today() && d.status === 'Active') ?? null; },
  getActiveDeurForAssignment(assignmentId: string): Deur | null { return deurStore.find((d) => d.assignmentId === assignmentId && d.date === today() && d.status === 'Active') ?? null; },
  getActiveDeurForOperator(operatorId: string): Deur | null { return deurStore.find((d) => d.date === today() && d.status === 'Active' && d.operatorSegments.some((s) => s.operatorId === operatorId && s.endTime === null)) ?? null; },
  getActiveDeurWithTurnoverPending(): Deur | null { return deurStore.find((d) => d.status === 'Active' && d.turnoverPending) ?? null; },
  getTodayDeurForOperator(operatorId: string): Deur | null { return deurStore.find((d) => d.date === today() && d.operatorSegments.some((s) => s.operatorId === operatorId)) ?? null; },
  getSubmittedDeurById(id: string): Deur | null { const d = deurStore.find((x) => x.id === id); return d && (d.status === 'Submitted' || d.status === 'Waiting Acknowledgement' || d.status === 'Acknowledged' || d.status === 'Rejected') ? d : null; },
  getLatestSubmittedDeur(operatorId: string): Deur | null { return deurStore.filter((d) => (d.status === 'Submitted' || d.status === 'Waiting Acknowledgement' || d.status === 'Acknowledged' || d.status === 'Rejected') && d.operatorSegments.some((s) => s.operatorId === operatorId)).sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))[0] ?? null; },
  getEndedDeurForOperator(operatorId: string): Deur | null { return deurStore.find((d) => d.date === today() && d.status === 'Ended' && d.operatorSegments.some((s) => s.operatorId === operatorId)) ?? null; },
  canStartNewDeur(operatorId: string): boolean {
    const assignment = sampleAssignments.find((a) => a.operatorId === operatorId);
    if (!assignment) return false;
    const rental = sampleRentals.find((r) => r.assignmentId === assignment.id);
    if (!rental) return false;
    const active = deurStore.find((d) => d.equipmentId === assignment.equipmentId && d.rentalId === rental.id && d.date === today() && d.status === 'Active');
    return !active;
  },

  getDeurById(id: string): Deur | null { return deurStore.find((d) => d.id === id) ?? null; },
  getDeurByNumber(deurNumber: string): Deur | null { return deurStore.find((d) => d.deurNumber === deurNumber) ?? null; },
  getDeurHistory(operatorId: string): Deur[] { return deurStore.filter((d) => d.operatorSegments.some((s) => s.operatorId === operatorId) || d.operatorId === operatorId).sort((a, b) => b.date.localeCompare(a.date)); },
  getLoginRecords(): LoginRecord[] { return [...loginRecords].reverse(); },

  // --- Find active DEUR by equipment/rental, not by operator ---
  getResumableDeurForOperator(operatorId: string): Deur | null {
    // First check if operator has an open segment on an active DEUR
    const bySeg = deurStore.find((d) => d.date === today() && d.status === 'Active' && d.operatorSegments.some((s) => s.operatorId === operatorId && s.endTime === null));
    if (bySeg) return bySeg;
    // Check if there's a turnover-pending DEUR this operator can resume
    const pending = deurStore.find((d) => d.status === 'Active' && d.turnoverPending);
    if (pending) return pending;
    // Check by operator's assignment/equipment/rental
    const assignment = sampleAssignments.find((a) => a.operatorId === operatorId);
    if (assignment) {
      const rental = sampleRentals.find((r) => r.assignmentId === assignment.id);
      if (rental) {
        const active = deurStore.find((d) => d.equipmentId === assignment.equipmentId && d.rentalId === rental.id && d.date === today() && d.status === 'Active');
        if (active) return active;
      }
    }
    // Check any DEUR the operator participated in today
    return deurStore.find((d) => d.date === today() && d.operatorSegments.some((s) => s.operatorId === operatorId)) ?? null;
  },

  createDeur(params: { operatorId: string; operatorName: string; equipmentId: string; assignmentId: string; rentalId: string; projectId: string; openingMeter: number | null; openingOdometer?: number | null; isReliever?: boolean; }): Deur {
    // Guard: if an Active DEUR already exists for this equipment/rental, return it (do not create duplicate)
    const ex = deurStore.find((d) => d.equipmentId === params.equipmentId && d.rentalId === params.rentalId && d.date === today() && d.status === 'Active');
    if (ex) return ex;
    const deurId = `deur-${String(nextDeurId).padStart(4, '0')}`;
    const deurNumber = generateDeurNumber();
    const seqNum = parseInt(deurNumber.split('-')[2], 10);
    nextDeurId = Math.max(nextDeurId + 1, seqNum + 1);
    const segId = `seg-${String(nextSegmentId++).padStart(4, '0')}`;
    const actId = `act-${String(nextActivityId++).padStart(4, '0')}`;
    const segment: OperatorSegment = { id: segId, deurId, operatorId: params.operatorId, operatorName: params.operatorName, startTime: now(), endTime: null, isReliever: params.isReliever ?? false };
    const deur: Deur = {
      id: deurId, deurNumber, operatorId: params.operatorId, equipmentId: params.equipmentId,
      assignmentId: params.assignmentId, rentalId: params.rentalId, projectId: params.projectId,
      date: today(), shiftStart: now(), shiftEnd: null, status: 'Active',
      openingMeter: params.openingMeter, closingMeter: null,
      openingOdometer: params.openingOdometer ?? null, closingOdometer: null,
      remarks: '', breakdownRemarks: '',
      activities: [{ id: actId, deurId, activity: 'Operating', startTime: now(), endTime: null, durationMs: 0 }],
      fuelEntries: [], operatorSegments: [segment], travelCheckpoints: [], pendingSync: false,
    };
    deurStore.push(deur); persist();
    recordLogin(deurId, params.operatorName, params.isReliever ? 'Reliever Operator' : 'Main Operator', deurNumber);
    return { ...deur, activities: [...deur.activities], operatorSegments: [...deur.operatorSegments] };
  },

  startActivity(deurId: string, activity: ActivityType, reason?: string, category?: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;
    const cur = deur.activities.find((a) => a.endTime === null) ?? null;
    if (cur) {
      if (cur.activity === activity && !reason && !category) return deur;
      cur.endTime = now();
      cur.durationMs = new Date(cur.endTime).getTime() - new Date(cur.startTime).getTime();
    }
    deur.activities.push({ id: `act-${String(nextActivityId++).padStart(4, '0')}`, deurId, activity, startTime: now(), endTime: null, durationMs: 0, reason: reason ?? undefined, category: category ?? undefined });
    deur.pendingSync = true; persist();
    return { ...deur, activities: deur.activities.map((a) => ({ ...a })), fuelEntries: [...deur.fuelEntries], operatorSegments: [...deur.operatorSegments], travelCheckpoints: [...deur.travelCheckpoints] };
  },

  endShift(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;
    const cur = deur.activities.find((a) => a.endTime === null);
    if (cur) { cur.endTime = now(); cur.durationMs = new Date(cur.endTime).getTime() - new Date(cur.startTime).getTime(); }
    deur.shiftEnd = now(); deur.status = 'Ended'; deur.turnoverPending = false;
    const seg = deur.operatorSegments.find((s) => s.endTime === null); if (seg) seg.endTime = now();
    deur.closingMeter = this.getCalculatedClosingMeter(deurId);
    recordLogout(deurId); deur.pendingSync = true; persist();
    return { ...deur, activities: deur.activities.map((a) => ({ ...a })), fuelEntries: [...deur.fuelEntries], operatorSegments: deur.operatorSegments.map((s) => ({ ...s })), travelCheckpoints: [...deur.travelCheckpoints] };
  },

  // Mark DEUR as pending turnover — closes current activity + segment, does NOT create new segment
  markTurnoverPending(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;
    const cur = deur.activities.find((a) => a.endTime === null);
    if (cur) { cur.endTime = now(); cur.durationMs = new Date(cur.endTime).getTime() - new Date(cur.startTime).getTime(); }
    const seg = deur.operatorSegments.find((s) => s.endTime === null); if (seg) seg.endTime = now();
    deur.turnoverPending = true; deur.turnoverTimestamp = now();
    recordLogout(deurId);
    deur.pendingSync = true; persist();
    return { ...deur, activities: [...deur.activities], operatorSegments: [...deur.operatorSegments] };
  },

  // Resume operation on a turnover-pending DEUR — creates new operator segment, does NOT auto-start activity
  resumeOperation(deurId: string, operatorId: string, operatorName: string, isReliever: boolean): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;
    deur.turnoverPending = false;
    deur.operatorSegments.push({ id: `seg-${String(nextSegmentId++).padStart(4, '0')}`, deurId, operatorId, operatorName, startTime: now(), endTime: null, isReliever });
    recordLogin(deurId, operatorName, isReliever ? 'Reliever Operator' : 'Main Operator', deur.deurNumber);
    deur.pendingSync = true; persist();
    return { ...deur, activities: [...deur.activities], operatorSegments: [...deur.operatorSegments], fuelEntries: [...deur.fuelEntries], travelCheckpoints: [...deur.travelCheckpoints] };
  },

  updateMeter(deurId: string, openingMeter: number | null, _closing?: number | null): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.status === 'Submitted' || deur.status === 'Waiting Acknowledgement' || deur.status === 'Acknowledged') return null;
    deur.openingMeter = openingMeter; deur.closingMeter = this.getCalculatedClosingMeter(deurId);
    deur.pendingSync = true; persist(); return deur;
  },
  updateOdometer(deurId: string, openingOdometer: number | null, _closing?: number | null): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.status === 'Submitted' || deur.status === 'Waiting Acknowledgement' || deur.status === 'Acknowledged') return null;
    deur.openingOdometer = openingOdometer; deur.pendingSync = true; persist(); return deur;
  },

  addTravelCheckpoint(params: { deurId: string; type: 'Initial' | 'Arrival'; locationName: string; gps?: GPSCoordinates; locationSource: LocationSource; odometer?: number | null; odometerExceptionReason?: string; odometerExceptionRemarks?: string; operatorId: string; operatorName: string; operatorIsReliever: boolean; }): Deur | null {
    const deur = deurStore.find((d) => d.id === params.deurId); if (!deur || deur.status !== 'Active') return null;
    const seg = deur.operatorSegments.find((s) => s.operatorId === params.operatorId && s.endTime === null);
    const segId = seg?.id ?? deur.operatorSegments[deur.operatorSegments.length - 1]?.id ?? '';
    deur.travelCheckpoints.push({
      id: `chk-${String(nextCheckpointId++).padStart(4, '0')}`, deurId: params.deurId,
      seq: deur.travelCheckpoints.length + 1, type: params.type, locationName: params.locationName,
      timestamp: now(), gps: params.gps, locationSource: params.locationSource,
      odometer: params.odometer ?? null, odometerExceptionReason: params.odometerExceptionReason,
      odometerExceptionRemarks: params.odometerExceptionRemarks, operatorSegmentId: segId,
      operatorDisplayName: params.operatorName, operatorIsReliever: params.operatorIsReliever,
    });
    deur.pendingSync = true; persist(); return deur;
  },

  addFuelTransaction(params: { deurId: string; operatorId: string; operatorName: string; fuelAdded: number; gaugeBefore?: FuelGaugeLevel; gaugeAfter?: FuelGaugeLevel; remarks?: string; fuelSlipNumber?: string; location?: string; hourMeter?: number | null; odometer?: number | null; odometerExceptionReason?: string; odometerExceptionRemarks?: string; }): Deur | null {
    const deur = deurStore.find((d) => d.id === params.deurId); if (!deur || deur.status !== 'Active') return null;
    const seg = deur.operatorSegments.find((s) => s.operatorId === params.operatorId && s.endTime === null);
    deur.fuelEntries.push({
      id: `fuel-${String(nextFuelId++).padStart(4, '0')}`, deurId: params.deurId, timestamp: now(),
      operatorId: params.operatorId, operatorName: params.operatorName, fuelAdded: params.fuelAdded,
      gaugeBefore: params.gaugeBefore, gaugeAfter: params.gaugeAfter, remarks: params.remarks,
      fuelSlipNumber: params.fuelSlipNumber, location: params.location, hourMeter: params.hourMeter,
      odometer: params.odometer, odometerExceptionReason: params.odometerExceptionReason,
      odometerExceptionRemarks: params.odometerExceptionRemarks, operatorSegmentId: seg?.id,
    });
    deur.pendingSync = true; persist(); return deur;
  },

  updateFuelObservation(deurId: string, observation: FuelObservation): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return null;
    deur.fuelObservation = observation; deur.pendingSync = true; persist(); return deur;
  },

  updateRemarks(deurId: string, remarks: string, breakdownRemarks: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.status === 'Submitted' || deur.status === 'Waiting Acknowledgement' || deur.status === 'Acknowledged') return null;
    deur.remarks = remarks; deur.breakdownRemarks = breakdownRemarks; deur.pendingSync = true; persist(); return deur;
  },

  submitDeur(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.status !== 'Ended') return null;
    deur.status = 'Waiting Acknowledgement'; deur.submittedAt = now();
    deur.closingMeter = this.getCalculatedClosingMeter(deurId);
    deur.pendingSync = true; persist(); return deur;
  },
  reopenDeur(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.status !== 'Ended') return null;
    deur.status = 'Active'; deur.shiftEnd = null; deur.pendingSync = true; persist(); return deur;
  },

  getNetOperatingHours(deurId: string): number {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return 0;
    return deur.activities.filter((a) => a.activity === 'Operating').reduce((s, a) => s + (a.endTime !== null ? a.durationMs : Date.now() - new Date(a.startTime).getTime()), 0);
  },
  getCalculatedClosingMeter(deurId: string): number | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur || deur.openingMeter == null) return null;
    return Math.round((deur.openingMeter + this.getNetOperatingHours(deurId) / 3600000) * 100) / 100;
  },
  getSuggestedClosingMeter(deurId: string): number | null { return this.getCalculatedClosingMeter(deurId); },

  getGrossTime(deurId: string): number {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return 0;
    return deur.activities.reduce((s, a) => s + (a.endTime !== null ? a.durationMs : Date.now() - new Date(a.startTime).getTime()), 0);
  },
  getTravelDistance(deurId: string): number | null {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return null;
    const cps = deur.travelCheckpoints; if (cps.length < 2) return null;
    let total = 0; let hasGap = false;
    for (let i = 1; i < cps.length; i++) {
      if (cps[i - 1].odometer != null && cps[i].odometer != null) total += cps[i].odometer! - cps[i - 1].odometer!;
      else hasGap = true;
    }
    return hasGap && total === 0 ? null : total;
  },
  hasOdometerGaps(deurId: string): boolean {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return false;
    return deur.travelCheckpoints.some((cp) => cp.odometer == null);
  },
  getTravelLegs(deurId: string): { from: TravelCheckpoint; to: TravelCheckpoint; distance: number | null; durationMs: number }[] {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return [];
    const cps = deur.travelCheckpoints; const legs: { from: TravelCheckpoint; to: TravelCheckpoint; distance: number | null; durationMs: number }[] = [];
    for (let i = 1; i < cps.length; i++) {
      const distance = (cps[i - 1].odometer != null && cps[i].odometer != null) ? cps[i].odometer! - cps[i - 1].odometer! : null;
      legs.push({ from: cps[i - 1], to: cps[i], distance, durationMs: new Date(cps[i].timestamp).getTime() - new Date(cps[i - 1].timestamp).getTime() });
    }
    return legs;
  },
  getTotalFuelIssued(deurId: string): number {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return 0;
    return deur.fuelEntries.reduce((s, f) => s + f.fuelAdded, 0);
  },
  getFuelEfficiencyEntries(deurId: string): { fuelEntry: FuelTransaction; distance: number | null; efficiency: number | null; warning: string | null }[] {
    const deur = deurStore.find((d) => d.id === deurId); if (!deur) return [];
    const entries = deur.fuelEntries.filter((f) => f.odometer != null && !f.odometerExceptionReason);
    const result: { fuelEntry: FuelTransaction; distance: number | null; efficiency: number | null; warning: string | null }[] = [];
    for (let i = 0; i < entries.length; i++) {
      const cur = entries[i];
      if (i === 0) { result.push({ fuelEntry: cur, distance: null, efficiency: null, warning: 'No prior valid odometer reading' }); continue; }
      const prev = entries[i - 1];
      if (prev.odometer == null || cur.odometer == null) { result.push({ fuelEntry: cur, distance: null, efficiency: null, warning: 'Insufficient odometer data' }); continue; }
      const distance = cur.odometer - prev.odometer;
      if (distance < 0) { result.push({ fuelEntry: cur, distance, efficiency: null, warning: 'Negative distance — odometer may have been reset' }); continue; }
      if (cur.fuelAdded <= 0) { result.push({ fuelEntry: cur, distance, efficiency: null, warning: 'Invalid fuel quantity' }); continue; }
      const efficiency = Math.round((distance / cur.fuelAdded) * 100) / 100;
      if (efficiency > 50) { result.push({ fuelEntry: cur, distance, efficiency, warning: 'Efficiency unusually high — verify readings' }); continue; }
      result.push({ fuelEntry: cur, distance, efficiency, warning: null });
    }
    return result;
  },
};

// --- Development-only UAT reset ---
// Purges ALL erms_* storage keys (current + legacy) and resets in-memory state.
// Does NOT clear theme preference. Intended for development/UAT only.
export function resetUatData(): void {
  if (typeof localStorage === 'undefined') return;
  const allKeys = Object.keys(localStorage);
  const keysToRemove = allKeys.filter((k) => k.startsWith('erms_'));
  for (const k of keysToRemove) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
  deurStore = [];
  ids = { deur: 1, activity: 1, fuel: 1, segment: 1, checkpoint: 1 };
  nextDeurId = 1; nextActivityId = 1; nextFuelId = 1; nextSegmentId = 1; nextCheckpointId = 1;
  loginRecords = []; nextLoginRecordId = 1;
  adHocRelievers = []; nextAdHocId = 1;
  saveToStorage(deurStore);
  saveIds(ids);
}
