export interface PendingRegistration {
  id: number;
  registrationCode: string;
  firstName: string;
  middleName?: string;
  surname: string;
  mobile: string;
  email?: string;
  dob?: string;
  gender?: string;
  presentAddress?: string;
  aadharNumber?: string;
  panNumber?: string;
  highestQualification?: string;
  designation?: string;
  photoUrl?: string;
  aadharDocUrl?: string;
  panDocUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}
