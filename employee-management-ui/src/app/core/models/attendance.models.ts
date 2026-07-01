export interface DayColumn {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
}

export interface SummaryRow {
  label: string;
  dailyCounts: number[];
  total: number;
}

export interface EmployeeAttendance {
  serialNo: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  gender: string;
  department: string;
  designation: string;
  doj: string;
  vintage: number;
  days: string[];
  totalPresent: number;
  totalLeave: number;
  totalML: number;
  totalResign: number;
}

export interface MonthlyAttendance {
  year: number;
  month: number;
  monthLabel: string;
  totalEmployees: number;
  page: number;
  size: number;
  dayColumns: DayColumn[];
  summaryRows: SummaryRow[];
  employees: EmployeeAttendance[];
}

export interface AttendanceRecord {
  employeeId: number;
  date: string;
  status: string;
}
