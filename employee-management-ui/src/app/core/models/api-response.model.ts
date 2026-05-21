export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
  employee: {
    id: number;
    employeeCode: string;
    firstName: string;
    surname: string;
    email: string;
    photoPath: string;
  } | null;
}

export interface MasterDataItem {
  id: number;
  category: string;
  code: string;
  value: string;
  sortOrder: number;
  active: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  exitedEmployees: number;
  maleCount: number;
  femaleCount: number;
  newThisMonth: number;
  exitedThisMonth: number;
  statusDistribution: { [key: string]: number };
  genderDistribution: { [key: string]: number };
  designationDistribution: { designation: string; count: number }[];
  ageBracketDistribution: { bracket: string; count: number }[];
}
