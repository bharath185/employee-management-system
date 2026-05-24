export interface DocumentTemplate {
  id?: number;
  templateName: string;
  templateType: string;
  description?: string;
  content: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DownloadLog {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  templateId: number;
  templateName?: string;
  templateType?: string;
  format: string;
  downloadedAt: string;
  financialYear: string;
  downloadCount?: number;
}

export interface DownloadStats {
  totalDownloadsThisFY: number;
  mostDownloadedTemplate: string;
  mostDownloadedEmployee: string;
  monthlyDownloads: { month: string; count: number }[];
}

export const TEMPLATE_PLACEHOLDERS = {
  employee: [
    { key: '{{employee_name}}', desc: 'Employee Full Name' },
    { key: '{{employee_code}}', desc: 'Employee Code' },
    { key: '{{designation}}', desc: 'Designation' },
    { key: '{{doj}}', desc: 'Date of Joining' },
    { key: '{{doe}}', desc: 'Date of Exit' },
    { key: '{{gender}}', desc: 'Gender' },
    { key: '{{address}}', desc: 'Present Address' },
    { key: '{{mobile}}', desc: 'Mobile Number' },
    { key: '{{email}}', desc: 'Email Address' }
  ],
  company: [
    { key: '{{company_name}}', desc: 'Company Name' },
    { key: '{{company_address}}', desc: 'Company Address' },
    { key: '{{company_logo}}', desc: 'Company Logo URL' },
    { key: '{{company_gst}}', desc: 'GST Number' },
    { key: '{{company_pan}}', desc: 'PAN Number' },
    { key: '{{company_cin}}', desc: 'CIN Number' }
  ],
  system: [
    { key: '{{current_date}}', desc: 'Current Date' },
    { key: '{{financial_year}}', desc: 'Financial Year' },
    { key: '{{authorized_signatory}}', desc: 'Authorized Signatory Name' }
  ]
};
