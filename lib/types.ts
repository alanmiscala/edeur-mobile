export type DeurStatus =
  | 'Draft'
  | 'Active'
  | 'Ended'
  | 'Submitted'
  | 'Waiting Acknowledgement'
  | 'Acknowledged'
  | 'Rejected';

export type ActivityType = 'Operating' | 'Waiting' | 'Breakdown' | 'Meal Break';

export type BillingMethod =
  | 'Per Hour'
  | 'Per Day'
  | 'Per Week'
  | 'Per Month'
  | 'Per Trip'
  | 'Per SQM'
  | 'One Lot';

export type FuelGaugeLevel = number; // 0-100 percentage

export type LocationSource = 'GPS' | 'Manual';

export type OperatorType = 'Main Operator' | 'Reliever Operator';

export interface User {
  id: string;
  loginName: string;
  password: string;
  operatorId: string;
  pin?: string;
}

export interface Operator {
  id: string;
  name: string;
  loginName: string;
  initials: string;
  pin?: string;
  isReliever?: boolean;
}

export interface LoginRecord {
  id: string;
  deurId: string | null;
  operatorName: string;
  operatorType: OperatorType;
  loginTime: string;
  logoutTime: string | null;
  deurNumber: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  assetNumber: string;
  category: string;
  status: string;
  hourMeter: number;
  hasOdometer?: boolean;
}

export interface Project {
  id: string;
  name: string;
  location: string;
}

export interface Assignment {
  id: string;
  operatorId: string;
  equipmentId: string;
  projectId: string;
  status: 'Active' | 'Pending' | 'Completed';
  assignedDate: string;
}

export interface Rental {
  id: string;
  rentalNumber: string;
  assignmentId: string;
  equipmentId: string;
  projectId: string;
  operatorId: string;
  customerName: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Overdue';
  startDate: string;
  endDate: string;
  billingMethod: BillingMethod;
  dailyRate: number;
}

export interface FuelTransaction {
  id: string;
  deurId: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  fuelAdded: number;
  gaugeBefore?: FuelGaugeLevel;
  gaugeAfter?: FuelGaugeLevel;
  remarks?: string;
  fuelSlipNumber?: string;
  location?: string;
  hourMeter?: number | null;
  odometer?: number | null;
  odometerExceptionReason?: string;
  odometerExceptionRemarks?: string;
  operatorSegmentId?: string;
}

export interface FuelObservation {
  openingGauge?: FuelGaugeLevel;
  closingGauge?: FuelGaugeLevel;
}

export interface TravelCheckpoint {
  id: string;
  deurId: string;
  seq: number;
  type: 'Initial' | 'Arrival';
  locationName: string;
  timestamp: string;
  gps?: GPSCoordinates;
  locationSource: LocationSource;
  odometer?: number | null;
  odometerExceptionReason?: string;
  odometerExceptionRemarks?: string;
  operatorSegmentId: string;
  operatorDisplayName: string;
  operatorIsReliever: boolean;
}

export interface WaitingReasonEntry {
  id: string;
  label: string;
  active: boolean;
}

export interface BreakdownCategoryEntry {
  id: string;
  label: string;
  active: boolean;
}

export interface ActivityEvent {
  id: string;
  deurId: string;
  activity: ActivityType;
  startTime: string;
  endTime: string | null;
  durationMs: number;
  reason?: string;
  category?: string;
  remarks?: string;
}

export interface OperatorSegment {
  id: string;
  deurId: string;
  operatorId: string;
  operatorName: string;
  startTime: string;
  endTime: string | null;
  isReliever: boolean;
}

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export type OdometerExceptionReason =
  | 'Odometer Gauge Broken'
  | 'Odometer Gauge Malfunction'
  | 'Odometer Not Readable'
  | 'Instrument Panel Failure'
  | 'Other';

export const ODOMETER_EXCEPTION_REASONS: OdometerExceptionReason[] = [
  'Odometer Gauge Broken',
  'Odometer Gauge Malfunction',
  'Odometer Not Readable',
  'Instrument Panel Failure',
  'Other',
];

export interface FuelEfficiencyResult {
  fuelEntry: FuelTransaction;
  distance: number | null;
  efficiency: number | null;
  warning: string | null;
}

export interface EquipmentMeterState {
  equipmentId: string;
  currentHourMeter: number | null;
  lastUpdatedDeurId: string | null;
  lastUpdatedTimestamp: string | null;
}

export interface TravelLocation {
  pointA: string;
  pointB: string;
  source: LocationSource;
  gpsA?: GPSCoordinates;
  gpsB?: GPSCoordinates;
  startTime?: string;
  endTime?: string;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  distance?: number | null;
}

export interface Deur {
  id: string;
  deurNumber: string;
  operatorId: string;
  equipmentId: string;
  assignmentId: string;
  rentalId: string;
  projectId: string;
  date: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  status: DeurStatus;
  openingMeter: number | null;
  closingMeter: number | null;
  openingOdometer: number | null;
  closingOdometer: number | null;
  remarks: string;
  breakdownRemarks: string;
  rejectionReason?: string;
  submittedAt?: string;
  activities: ActivityEvent[];
  fuelEntries: FuelTransaction[];
  fuelObservation?: FuelObservation;
  operatorSegments: OperatorSegment[];
  travelCheckpoints: TravelCheckpoint[];
  travelLocation?: TravelLocation;
  pendingSync: boolean;
  turnoverPending?: boolean;
  turnoverTimestamp?: string;
}
