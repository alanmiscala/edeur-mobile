export type DeurStatus =
  | 'Draft'
  | 'Active'
  | 'Ended'
  | 'Submitted'
  | 'Acknowledged'
  | 'Rejected';

export type ActivityType = 'Operating' | 'Waiting' | 'Breakdown';

export type BillingMethod =
  | 'Per Hour'
  | 'Per Day'
  | 'Per Week'
  | 'Per Month'
  | 'Per Trip'
  | 'Per SQM'
  | 'One Lot';

export type FuelGaugeLevel = 'Empty' | '25%' | '50%' | '75%' | 'Full';

export type LocationSource = 'GPS' | 'Manual';

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

export interface FuelEntry {
  id: string;
  deurId: string;
  quantity: number;
  gaugeLevel?: FuelGaugeLevel;
  remarks?: string;
  timestamp: string;
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

export interface TravelLocation {
  pointA: string;
  pointB: string;
  source: LocationSource;
  gpsA?: GPSCoordinates;
  gpsB?: GPSCoordinates;
}

export interface Deur {
  id: string;
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
  activities: ActivityEvent[];
  fuelEntries: FuelEntry[];
  operatorSegments: OperatorSegment[];
  travelLocation?: TravelLocation;
  pendingSync: boolean;
}
