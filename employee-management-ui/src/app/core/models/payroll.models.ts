export interface Salary {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  gender: string;
  workerType: string;
  wageMonth: number;
  wageYear: number;
  basic: number;
  hra: number;
  fixedPersonalAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  overtimeWages: number;
  netPay: number;
  workingHoursPerDay: number;
  weeklyOff: string;
  dateOfPayment?: string;
  createdAt?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  description: string;
  annualEntitlement: number;
  isCarryForward: boolean;
  isActive: boolean;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  year: number;
  entitled: number;
  taken: number;
  balance: number;
}

export interface LeaveApplication {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
}
