export interface Bill {
  id: number;
  vendorName: string;
  billType: string;
  amount: number;
  billDate: string;
  dueDate: string;
  month: number;
  year: number;
  isProcessed: boolean;
  description: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
