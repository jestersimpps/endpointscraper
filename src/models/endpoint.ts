export interface Endpoint {
  method: HttpMethod;
  path: string;
  filePath: string;
  lineNumber: number;
  className?: string;
  methodName?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ScanResult {
  totalFiles: number;
  scannedFiles: number;
  endpoints: Endpoint[];
  errors: string[];
}