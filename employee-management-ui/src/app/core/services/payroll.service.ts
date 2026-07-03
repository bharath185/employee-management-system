import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { PayrollProcess, Payslip, EmailConfig, PayrollInput, SalaryMasterDTO } from '../models/payroll.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  // ===================== Process =====================
  processPayroll(year: number, month: number): Observable<APIResponse<PayrollProcess>> {
    return this.http.post<APIResponse<PayrollProcess>>(`${this.apiUrl}/process/${year}/${month}`, {});
  }

  getProcessStatus(year: number, month: number): Observable<APIResponse<PayrollProcess>> {
    return this.http.get<APIResponse<PayrollProcess>>(`${this.apiUrl}/process/status/${year}/${month}`);
  }

  getProcessHistory(year?: number, month?: number): Observable<APIResponse<PayrollProcess[]>> {
    let params = '';
    if (year) params = `?year=${year}&month=${month || ''}`;
    return this.http.get<APIResponse<PayrollProcess[]>>(`${this.apiUrl}/process/history${params}`);
  }

  // ===================== Payslips =====================
  getPayslips(year: number, month: number): Observable<APIResponse<Payslip[]>> {
    return this.http.get<APIResponse<Payslip[]>>(`${this.apiUrl}/payslips/${year}/${month}`);
  }

  getPayslipById(id: number): Observable<APIResponse<Payslip>> {
    return this.http.get<APIResponse<Payslip>>(`${this.apiUrl}/payslips/${id}`);
  }

  getPayslipHtml(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/payslips/${id}/html`, { responseType: 'text' });
  }

  getEmployeePayslips(employeeId: number): Observable<APIResponse<Payslip[]>> {
    return this.http.get<APIResponse<Payslip[]>>(`${this.apiUrl}/payslips/employee/${employeeId}`);
  }

  sendPayslipsByEmail(year: number, month: number): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/send-payslips/${year}/${month}`, {});
  }

  // ===================== Email Config =====================
  getEmailConfig(): Observable<APIResponse<EmailConfig>> {
    return this.http.get<APIResponse<EmailConfig>>(`${this.apiUrl}/email-config`);
  }

  saveEmailConfig(config: EmailConfig): Observable<APIResponse<EmailConfig>> {
    return this.http.put<APIResponse<EmailConfig>>(`${this.apiUrl}/email-config`, config);
  }

  testEmailConfig(): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/email-config/test`, {});
  }

  // ===================== Payroll Inputs =====================
  batchUpsertInputs(inputs: PayrollInput[]): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/inputs/batch`, { inputs });
  }

  // ===================== Exports =====================
  downloadBankFile(year: number, month: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/bank-file/${year}/${month}`, { responseType: 'blob' });
  }

  downloadPayrollReport(year: number, month: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/report/${year}/${month}`, { responseType: 'blob' });
  }

  // ===================== Stats =====================
  getPayslipStats(year: number, month: number): Observable<APIResponse<any>> {
    return this.http.get<APIResponse<any>>(`${this.apiUrl}/stats/${year}/${month}`);
  }

  // ===================== Salary Master =====================
  getSalaryMaster(): Observable<APIResponse<SalaryMasterDTO[]>> {
    return this.http.get<APIResponse<SalaryMasterDTO[]>>(`${this.apiUrl}/salary-master`);
  }

  getSalaryMasterByEmployee(employeeId: number): Observable<APIResponse<SalaryMasterDTO>> {
    return this.http.get<APIResponse<SalaryMasterDTO>>(`${this.apiUrl}/salary-master/employee/${employeeId}`);
  }

  saveSalaryMaster(dto: SalaryMasterDTO): Observable<APIResponse<SalaryMasterDTO>> {
    return this.http.post<APIResponse<SalaryMasterDTO>>(`${this.apiUrl}/salary-master`, dto);
  }

  initSalaryMaster(employeeId: number): Observable<APIResponse<SalaryMasterDTO>> {
    return this.http.post<APIResponse<SalaryMasterDTO>>(`${this.apiUrl}/salary-master/init/${employeeId}`, {});
  }

  getSalaryMasterHistory(employeeId: number): Observable<APIResponse<any[]>> {
    return this.http.get<APIResponse<any[]>>(`${this.apiUrl}/salary-master/history/${employeeId}`);
  }

  getSalaryMasterSnapshots(employeeId: number): Observable<APIResponse<any[]>> {
    return this.http.get<APIResponse<any[]>>(`${this.apiUrl}/salary-master/snapshots/${employeeId}`);
  }
}
