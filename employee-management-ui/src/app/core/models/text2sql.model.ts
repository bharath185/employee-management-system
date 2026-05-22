export interface Text2SqlRequest {
  question: string;
}

export interface Text2SqlResponse {
  question: string;
  sql: string;
  columns: string[];
  rows: { [key: string]: any }[];
  rowCount: number;
  explanation: string;
  success: boolean;
  errorMessage: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'error' | 'sql';
  content: string;
  timestamp: Date;
  data?: Text2SqlResponse;
}
