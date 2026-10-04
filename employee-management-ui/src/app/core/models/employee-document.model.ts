export interface EmployeeDocument {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName?: string;
  process?: string;
  department?: string;
  documentType: string;
  documentTitle: string;
  pageNumber?: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  contentType: string;
  notes?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface StagedDocumentItem {
  uid: string;
  file: File;
  previewUrl?: string;
  isImage: boolean;
  isPdf: boolean;
  fileSize: number;
  documentType: string;
  documentTitle: string;
  pageNumber: number;
  notes?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export interface DocumentCategoryOption {
  code: string;
  label: string;
  icon: string;
  color: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryOption[] = [
  { code: 'AADHAR_CARD', label: 'Aadhar Card', icon: 'idcard', color: '#1d4ed8' },
  { code: 'PAN_CARD', label: 'PAN Card', icon: 'credit-card', color: '#b45309' },
  { code: 'PASSPORT', label: 'Passport', icon: 'global', color: '#047857' },
  { code: 'VOTER_ID', label: 'Voter ID / Driving License', icon: 'car', color: '#6d28d9' },
  { code: 'DEGREE_CERTIFICATE', label: 'Degree / Higher Education', icon: 'read', color: '#0369a1' },
  { code: '10TH_12TH_MARKSHEET', label: '10th / 12th Marksheet', icon: 'file-text', color: '#4338ca' },
  { code: 'RESUME_CV', label: 'Resume / CV', icon: 'profile', color: '#374151' },
  { code: 'EXPERIENCE_LETTER', label: 'Experience / Relieving Letter', icon: 'trophy', color: '#c2410c' },
  { code: 'BANK_PASSBOOK', label: 'Bank Passbook / Cheque', icon: 'bank', color: '#15803d' },
  { code: 'JOINING_FORM', label: 'Joining Form / Bio-data', icon: 'form', color: '#4f46e5' },
  { code: 'PASSPORT_PHOTO', label: 'Passport Size Photo', icon: 'picture', color: '#db2777' },
  { code: 'MEDICAL_FITNESS', label: 'Medical Fitness Certificate', icon: 'medicine-box', color: '#dc2626' },
  { code: 'SALARY_SLIP_PREVIOUS', label: 'Previous Payslip', icon: 'file-protect', color: '#7c3aed' },
  { code: 'OTHER', label: 'Other Document', icon: 'file', color: '#64748b' }
];
