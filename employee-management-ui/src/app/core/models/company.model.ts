export interface Company {
  id?: number;
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  cinNumber?: string;
  incorporatedDate?: string;
  authorizedSignatory?: string;
  logoPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyDocument {
  id: number;
  fileName: string;
  filePath: string;
  documentType: string;
  uploadedAt: string;
  fileSize?: number;
}
