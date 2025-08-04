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

export interface ScanResultWithCoverage {
  totalFiles: number;
  scannedFiles: number;
  endpoints: EndpointWithCoverage[];
  errors: string[];
  apiSpecs: ApiSpecInfo[];
}

export interface EndpointWithCoverage extends Endpoint {
  apiSpecCoverage: ApiSpecCoverage;
}

export interface ApiSpecCoverage {
  status: 'covered' | 'not-covered' | 'no-spec-found';
  specFile?: string;
  matchedEndpoint?: {
    method: string;
    path: string;
    operationId?: string;
    summary?: string;
  };
}

export interface ApiSpecInfo {
  filePath: string;
  type: 'openapi' | 'swagger';
  version: string;
  endpointCount: number;
}