import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { PayrollProcess, Payslip, EmailConfig, PayrollInput } from '../models/payroll.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  // ===================== Process =====================
  processPayroll(year: number, month: number): Observable<APIResponse<PayrollProcess>> {
    return this.http.post<APIResponse<PayrollProcess>>(`${this.apiUrl}/process`, { year, month });
  }

  getProcessStatus(year: number, month: number): Observable<APIResponse<PayrollProcess>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<PayrollProcess>>(`${this.apiUrl}/process/status`, { params });
  }

  getProcessHistory(year?: number, month?: number): Observable<APIResponse<PayrollProcess[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<APIResponse<PayrollProcess[]>>(`${this.apiUrl}/process/history`, { params });
  }

  // ===================== Payslips =====================
  getPayslips(year: number, month: number): Observable<APIResponse<Payslip[]>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<Payslip[]>>(`${this.apiUrl}/payslips`, { params });
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
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/payslips/send-all`, { year, month });
  }

  // ===================== Email Config =====================
  getEmailConfig(): Observable<APIResponse<EmailConfig>> {
    return this.http.get<APIResponse<EmailConfig>>(`${this.apiUrl}/email-config`);
  }

  saveEmailConfig(config: EmailConfig): Observable<APIResponse<EmailConfig>> {
    return this.http.post<APIResponse<EmailConfig>>(`${this.apiUrl}/email-config`, config);
  }

  testEmailConfig(): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/email-config/test`, {});
  }

  // ===================== Payroll Inputs =====================
  batchUpsertInputs(inputs: PayrollInput[]): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/inputs/batch`, inputs);
  }

  // ===================== Exports =====================
  downloadBankFile(year: number, month: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get(`${this.apiUrl}/export/bank-file`, {
      params,
      responseType: 'blob'
    });
  }

  downloadPayrollReport(year: number, month: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get(`${this.apiUrl}/export/report`, {
      params,
      responseType: 'blob'
    });
  }

  // ===================== Stats =====================
  getPayslipStats(year: number, month: number): Observable<APIResponse<any>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<any>>(`${this.apiUrl}/payslips/stats`, { params });
  }
}
