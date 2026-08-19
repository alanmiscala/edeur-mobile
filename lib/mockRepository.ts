import type {
  Assignment,
  Deur,
  Equipment,
  FuelEntry,
  FuelGaugeLevel,
  Operator,
  Project,
  Rental,
  User,
  ActivityEvent,
  ActivityType,
  OperatorSegment,
  WaitingReasonEntry,
  BreakdownCategoryEntry,
  BillingMethod,
  TravelLocation,
} from './types';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

const STORAGE_KEY = 'erms_deur_store_v2';
const ID_KEY = 'erms_deur_ids_v2';

export const sampleUsers: User[] = [
  {
    id: 'usr-001',
    loginName: 'jcruz',
    password: 'operator123',
    operatorId: 'op-001',
    pin: '1234',
  },
  {
    id: 'usr-002',
    loginName: 'rgomez',
    password: 'operator123',
    operatorId: 'op-002',
    pin: '5678',
  },
  {
    id: 'usr-003',
    loginName: 'preyes',
    password: 'operator123',
    operatorId: 'op-003',
    pin: '9999',
  },
];

export const sampleOperators: Operator[] = [
  {
    id: 'op-001',
    name: 'Juan Dela Cruz',
    loginName: 'jcruz',
    initials: 'JD',
    pin: '1234',
    isReliever: false,
  },
  {
    id: 'op-002',
    name: 'Richard Gomez',
    loginName: 'rgomez',
    initials: 'RG',
    pin: '5678',
    isReliever: false,
  },
  {
    id: 'op-003',
    name: 'Pedro Reyes',
    loginName: 'preyes',
    initials: 'PR',
    pin: '9999',
    isReliever: true,
  },
];

export const sampleEquipment: Equipment[] = [
  {
    id: 'eqp-023',
    name: 'CAT 320 Excavator',
    assetNumber: 'EQP-000023',
    category: 'Excavator',
    status: 'Active',
    hourMeter: 4520,
    hasOdometer: false,
  },
  {
    id: 'eqp-012',
    name: 'Hamm HD 12 VV Roller',
    assetNumber: 'EQP-000012',
    category: 'Roller',
    status: 'Active',
    hourMeter: 2890,
    hasOdometer: false,
  },
  {
    id: 'eqp-045',
    name: 'Isuzu FVR Truck',
    assetNumber: 'EQP-000045',
    category: 'Truck',
    status: 'Active',
    hourMeter: 120300,
    hasOdometer: true,
  },
];

export const sampleProjects: Project[] = [
  {
    id: 'prj-001',
    name: 'Cebu Warehouse Expansion',
    location: 'Cebu, PH',
  },
  {
    id: 'prj-002',
    name: 'Davao Port Rehabilitation',
    location: 'Davao, PH',
  },
];

export const sampleAssignments: Assignment[] = [
  {
    id: 'asg-001',
    operatorId: 'op-001',
    equipmentId: 'eqp-023',
    projectId: 'prj-001',
    status: 'Active',
    assignedDate: '2026-01-10',
  },
  {
    id: 'asg-002',
    operatorId: 'op-002',
    equipmentId: 'eqp-012',
    projectId: 'prj-002',
    status: 'Active',
    assignedDate: '2026-01-15',
  },
];

export const sampleRentals: Rental[] = [
  {
    id: 'rnt-001',
    rentalNumber: 'RNT-2026-0041',
    assignmentId: 'asg-001',
    equipmentId: 'eqp-023',
    projectId: 'prj-001',
    operatorId: 'op-001',
    customerName: 'Cebu Construction Corp.',
    status: 'Active',
    startDate: '2026-01-10',
    endDate: '2026-02-10',
    billingMethod: 'Per Day',
    dailyRate: 12500,
  },
  {
    id: 'rnt-002',
    rentalNumber: 'RNT-2026-0038',
    assignmentId: 'asg-002',
    equipmentId: 'eqp-012',
    projectId: 'prj-002',
    operatorId: 'op-002',
    customerName: 'Davao Logistics Inc.',
    status: 'Active',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    billingMethod: 'Per Day',
    dailyRate: 9800,
  },
];

export const sampleWaitingReasons: WaitingReasonEntry[] = [
  { id: 'wr-001', label: 'No Material', active: true },
  { id: 'wr-002', label: 'Waiting for Truck', active: true },
  { id: 'wr-003', label: 'Waiting for Instructions', active: true },
  { id: 'wr-004', label: 'Site Preparation', active: true },
  { id: 'wr-005', label: 'Traffic', active: true },
  { id: 'wr-006', label: 'Weather', active: true },
  { id: 'wr-007', label: 'Fueling', active: true },
  { id: 'wr-008', label: 'Lunch Break', active: true },
  { id: 'wr-009', label: 'Operator Rest', active: true },
  { id: 'wr-010', label: 'Others', active: true },
];

export const sampleBreakdownCategories: BreakdownCategoryEntry[] = [
  { id: 'bc-001', label: 'Hydraulic', active: true },
  { id: 'bc-002', label: 'Engine', active: true },
  { id: 'bc-003', label: 'Electrical', active: true },
  { id: 'bc-004', label: 'Undercarriage', active: true },
  { id: 'bc-005', label: 'Tire', active: true },
  { id: 'bc-006', label: 'Attachment', active: true },
  { id: 'bc-007', label: 'Others', active: true },
];

function loadFromStorage(): Deur[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Deur[];
        return parsed.map(migrateDeur);
      }
    }
  } catch {
    // storage unavailable or corrupt — start fresh
  }
  return [];
}

function migrateDeur(d: Deur): Deur {
  return {
    ...d,
    openingOdometer: d.openingOdometer ?? null,
    closingOdometer: d.closingOdometer ?? null,
    operatorSegments: d.operatorSegments ?? [],
    travelLocation: d.travelLocation,
    pendingSync: d.pendingSync ?? false,
    activities: d.activities.map((a) => ({
      ...a,
      reason: a.reason,
      category: a.category,
      remarks: a.remarks,
    })),
    fuelEntries: d.fuelEntries.map((f) => ({
      ...f,
      gaugeLevel: f.gaugeLevel,
    })),
  };
}

function saveToStorage(store: Deur[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // storage unavailable — data stays in memory for this session
  }
}

function loadIds(): { deur: number; activity: number; fuel: number; segment: number } {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ID_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { deur: 1, activity: 1, fuel: 1, segment: 1 };
}

function saveIds(ids: { deur: number; activity: number; fuel: number; segment: number }): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ID_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

let deurStore: Deur[] = loadFromStorage();
let ids = loadIds();
let nextDeurId = ids.deur;
let nextActivityId = ids.activity;
let nextFuelId = ids.fuel;
let nextSegmentId = ids.segment;

function persist(): void {
  saveToStorage(deurStore);
  saveIds({ deur: nextDeurId, activity: nextActivityId, fuel: nextFuelId, segment: nextSegmentId });
}

export const mockRepository = {
  authenticateByPin(pin: string): Operator | null {
    return sampleOperators.find((o) => o.pin === pin) ?? null;
  },

  authenticateReliever(name: string, pin: string): Operator | null {
    const op = sampleOperators.find(
      (o) =>
        o.pin === pin &&
        o.isReliever &&
        o.name.toLowerCase() === name.trim().toLowerCase(),
    );
    return op ?? null;
  },

  getOperator(operatorId: string): Operator | null {
    return sampleOperators.find((o) => o.id === operatorId) ?? null;
  },

  getOperatorAssignment(operatorId: string): Assignment | null {
    return sampleAssignments.find((a) => a.operatorId === operatorId) ?? null;
  },

  getEquipment(equipmentId: string): Equipment | null {
    return sampleEquipment.find((e) => e.id === equipmentId) ?? null;
  },

  getProject(projectId: string): Project | null {
    return sampleProjects.find((p) => p.id === projectId) ?? null;
  },

  getRental(rentalId: string): Rental | null {
    return sampleRentals.find((r) => r.id === rentalId) ?? null;
  },

  getRentalForOperator(operatorId: string): Rental | null {
    return sampleRentals.find((r) => r.operatorId === operatorId) ?? null;
  },

  getWaitingReasons(): WaitingReasonEntry[] {
    return sampleWaitingReasons.filter((r) => r.active);
  },

  getBreakdownCategories(): BreakdownCategoryEntry[] {
    return sampleBreakdownCategories.filter((c) => c.active);
  },

  getDeurForToday(operatorId: string, rentalId: string): Deur | null {
    return (
      deurStore.find(
        (d) =>
          d.operatorId === operatorId &&
          d.rentalId === rentalId &&
          d.date === today(),
      ) ?? null
    );
  },

  getActiveDeurForRental(rentalId: string): Deur | null {
    return (
      deurStore.find(
        (d) => d.rentalId === rentalId && d.date === today() && d.status === 'Active',
      ) ?? null
    );
  },

  getActiveDeurForOperator(operatorId: string): Deur | null {
    return (
      deurStore.find(
        (d) =>
          d.date === today() &&
          d.status === 'Active' &&
          d.operatorSegments.some((s) => s.operatorId === operatorId && s.endTime === null),
      ) ?? null
    );
  },

  getSubmittedDeurForRentalToday(rentalId: string): Deur | null {
    return (
      deurStore.find(
        (d) =>
          d.rentalId === rentalId &&
          d.date === today() &&
          (d.status === 'Submitted' || d.status === 'Acknowledged'),
      ) ?? null
    );
  },

  getDeurById(id: string): Deur | null {
    return deurStore.find((d) => d.id === id) ?? null;
  },

  getDeurHistory(operatorId: string): Deur[] {
    return deurStore
      .filter((d) =>
        d.operatorSegments.some((s) => s.operatorId === operatorId) ||
        d.operatorId === operatorId
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  createDeur(params: {
    operatorId: string;
    operatorName: string;
    equipmentId: string;
    assignmentId: string;
    rentalId: string;
    projectId: string;
    openingMeter: number | null;
    openingOdometer?: number | null;
    isReliever?: boolean;
  }): Deur {
    const existing = deurStore.find(
      (d) =>
        d.operatorId === params.operatorId &&
        d.rentalId === params.rentalId &&
        d.date === today() &&
        d.status !== 'Submitted' &&
        d.status !== 'Acknowledged',
    );
    if (existing) return existing;

    const deurId = `deur-${String(nextDeurId++).padStart(4, '0')}`;
    const segmentId = `seg-${String(nextSegmentId++).padStart(4, '0')}`;
    const activityId = `act-${String(nextActivityId++).padStart(4, '0')}`;

    const segment: OperatorSegment = {
      id: segmentId,
      deurId,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      startTime: now(),
      endTime: null,
      isReliever: params.isReliever ?? false,
    };

    const deur: Deur = {
      id: deurId,
      operatorId: params.operatorId,
      equipmentId: params.equipmentId,
      assignmentId: params.assignmentId,
      rentalId: params.rentalId,
      projectId: params.projectId,
      date: today(),
      shiftStart: now(),
      shiftEnd: null,
      status: 'Active',
      openingMeter: params.openingMeter,
      closingMeter: null,
      openingOdometer: params.openingOdometer ?? null,
      closingOdometer: null,
      remarks: '',
      breakdownRemarks: '',
      activities: [
        {
          id: activityId,
          deurId,
          activity: 'Operating',
          startTime: now(),
          endTime: null,
          durationMs: 0,
        },
      ],
      fuelEntries: [],
      operatorSegments: [segment],
      pendingSync: false,
    };
    deurStore.push(deur);
    persist();
    return deur;
  },

  startActivity(
    deurId: string,
    activity: ActivityType,
    reason?: string,
    category?: string,
  ): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;

    const currentEvent = deur.activities.find((a) => a.endTime === null);
    if (currentEvent) {
      if (currentEvent.activity === activity && !reason && !category) return deur;
      currentEvent.endTime = now();
      currentEvent.durationMs =
        new Date(currentEvent.endTime).getTime() -
        new Date(currentEvent.startTime).getTime();
    }

    const newEvent: ActivityEvent = {
      id: `act-${String(nextActivityId++).padStart(4, '0')}`,
      deurId: deur.id,
      activity,
      startTime: now(),
      endTime: null,
      durationMs: 0,
      reason: reason ?? undefined,
      category: category ?? undefined,
    };
    deur.activities.push(newEvent);
    deur.pendingSync = true;
    persist();
    return deur;
  },

  endShift(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;

    const currentEvent = deur.activities.find((a) => a.endTime === null);
    if (currentEvent) {
      currentEvent.endTime = now();
      currentEvent.durationMs =
        new Date(currentEvent.endTime).getTime() -
        new Date(currentEvent.startTime).getTime();
    }
    deur.shiftEnd = now();
    deur.status = 'Ended';

    const activeSegment = deur.operatorSegments.find((s) => s.endTime === null);
    if (activeSegment) {
      activeSegment.endTime = now();
    }

    deur.pendingSync = true;
    persist();
    return deur;
  },

  turnOverToReliever(deurId: string, relieverOperatorId: string, relieverName: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Active') return null;

    const currentEvent = deur.activities.find((a) => a.endTime === null);
    if (currentEvent) {
      currentEvent.endTime = now();
      currentEvent.durationMs =
        new Date(currentEvent.endTime).getTime() -
        new Date(currentEvent.startTime).getTime();
    }

    const activeSegment = deur.operatorSegments.find((s) => s.endTime === null);
    if (activeSegment) {
      activeSegment.endTime = now();
    }

    const newSegment: OperatorSegment = {
      id: `seg-${String(nextSegmentId++).padStart(4, '0')}`,
      deurId: deur.id,
      operatorId: relieverOperatorId,
      operatorName: relieverName,
      startTime: now(),
      endTime: null,
      isReliever: true,
    };
    deur.operatorSegments.push(newSegment);

    const newEvent: ActivityEvent = {
      id: `act-${String(nextActivityId++).padStart(4, '0')}`,
      deurId: deur.id,
      activity: 'Operating',
      startTime: now(),
      endTime: null,
      durationMs: 0,
    };
    deur.activities.push(newEvent);

    deur.pendingSync = true;
    persist();
    return deur;
  },

  updateMeter(
    deurId: string,
    openingMeter: number | null,
    closingMeter: number | null,
  ): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return null;
    deur.openingMeter = openingMeter;
    deur.closingMeter = closingMeter;
    deur.pendingSync = true;
    persist();
    return deur;
  },

  updateOdometer(
    deurId: string,
    openingOdometer: number | null,
    closingOdometer: number | null,
  ): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return null;
    deur.openingOdometer = openingOdometer;
    deur.closingOdometer = closingOdometer;
    deur.pendingSync = true;
    persist();
    return deur;
  },

  updateTravelLocation(deurId: string, location: TravelLocation): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return null;
    deur.travelLocation = location;
    deur.pendingSync = true;
    persist();
    return deur;
  },

  addFuelEntry(
    deurId: string,
    quantity: number,
    gaugeLevel?: FuelGaugeLevel,
    remarks?: string,
  ): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return null;
    const entry: FuelEntry = {
      id: `fuel-${String(nextFuelId++).padStart(4, '0')}`,
      deurId,
      quantity,
      gaugeLevel,
      remarks,
      timestamp: now(),
    };
    deur.fuelEntries.push(entry);
    deur.pendingSync = true;
    persist();
    return deur;
  },

  updateRemarks(
    deurId: string,
    remarks: string,
    breakdownRemarks: string,
  ): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return null;
    deur.remarks = remarks;
    deur.breakdownRemarks = breakdownRemarks;
    deur.pendingSync = true;
    persist();
    return deur;
  },

  submitDeur(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Ended') return null;
    deur.status = 'Submitted';
    deur.pendingSync = true;
    persist();
    return deur;
  },

  reopenDeur(deurId: string): Deur | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.status !== 'Ended') return null;
    deur.status = 'Active';
    deur.shiftEnd = null;
    deur.pendingSync = true;
    persist();
    return deur;
  },

  getNetOperatingHours(deurId: string): number {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur) return 0;
    return deur.activities
      .filter((a) => a.activity === 'Operating')
      .reduce((sum, a) => {
        const dur = a.endTime !== null
          ? a.durationMs
          : Date.now() - new Date(a.startTime).getTime();
        return sum + dur;
      }, 0);
  },

  getSuggestedClosingMeter(deurId: string): number | null {
    const deur = deurStore.find((d) => d.id === deurId);
    if (!deur || deur.openingMeter == null) return null;
    const netHours = this.getNetOperatingHours(deurId);
    const netHoursRounded = Math.round(netHours / 3600000 * 10) / 10;
    return Math.round((deur.openingMeter + netHoursRounded) * 10) / 10;
  },
};
