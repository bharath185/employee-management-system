export interface EmployeeAttendance {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  days: { [day: number]: string };
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalHoliday: number;
  totalWeeklyOff: number;
}

export interface MonthlyAttendance {
  year: number;
  month: number;
  daysInMonth: number;
  employees: EmployeeAttendance[];
}

export interface AttendanceRecord {
  employeeId: number;
  date: string;
  status: string;
}
