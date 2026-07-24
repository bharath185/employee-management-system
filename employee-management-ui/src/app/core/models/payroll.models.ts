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
  healthInsurance: number;
  overtimeWages: number;
  netPay: number;
  workingHoursPerDay: number;
  weeklyOff: string;
  dateOfPayment?: string;
  createdAt?: string;
}

export interface PayrollProcess {
  id: number;
  processYear: number;
  processMonth: number;
  totalEmployees: number;
  processedCount: number;
  status: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface Payslip {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  wageMonth: number;
  wageYear: number;
  basic: number;
  hra: number;
  fixedPersonalAllowance: number;
  otherAllowance: number;
  bonus: number;
  appraisalAmount: number;
  lateSittingAmount: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  healthInsurance: number;
  overtimeWages: number;
  totalDeductions: number;
  netPay: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkingDays: number;
  lopDays: number;
  effectiveWorkdays: number;
  status: string;
  generatedAt?: string;
  sentAt?: string;
}

export interface EmailConfig {
  id?: number;
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  useTls: boolean;
  useSsl: boolean;
  isActive: boolean;
}

export interface PayrollInput {
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  basic?: number;
  hra?: number;
  fixedPersonalAllowance?: number;
  otherAllowance?: number;
  pfDeduction?: number;
  esiDeduction?: number;
  ptDeduction?: number;
  overtimeWages?: number;
  bonus?: number;
  appraisalAmount?: number;
  lateSittingAmount?: number;
  workingHoursPerDay?: number;
  workerType?: string;
}

export interface SalaryMasterDTO {
  id?: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  basic: number;
  hra: number;
  fixedPersonalAllowance: number;
  otherAllowance: number;
  bonus: number;
  appraisalAmount: number;
  lateSittingAmount: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  overtimeWages: number;
  workingHoursPerDay: number;
  weeklyOff: string;
  workerType: string;
  effectiveFrom?: string;
  updatedAt?: string;
  updatedBy?: string;
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
  encashed: number;
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

export interface Holiday {
  id: number;
  name: string;
  date: string;
  year: number;
  isOptional: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompOff {
  id: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  earnedDate: string;
  expiryDate: string;
  status: string;
  availedDate?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveEncashment {
  id: number;
  employeeId: number;
  employee?: any;
  employeeCode?: string;
  employeeName?: string;
  leaveTypeId: number;
  leaveType?: any;
  leaveTypeName?: string;
  encashedDays: number;
  encashmentAmount: number;
  month: number;
  year: number;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string;
  createdAt?: string;
}
