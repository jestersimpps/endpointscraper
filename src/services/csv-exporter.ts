import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import type { ScanResult, Endpoint, ScanResultWithCoverage, EndpointWithCoverage } from '@/models/endpoint';

export class CsvExporter {
  async exportToCsv(result: ScanResult, outputPath: string): Promise<void> {
    await this.ensureDirectoryExists(outputPath);
    
    const csvContent = this.generateCsvContent(result.endpoints);
    await writeFile(outputPath, csvContent, 'utf-8');
  }

  async exportToCsvWithCoverage(result: ScanResultWithCoverage, outputPath: string): Promise<void> {
    await this.ensureDirectoryExists(outputPath);
    
    const csvContent = this.generateCsvContentWithCoverage(result.endpoints);
    await writeFile(outputPath, csvContent, 'utf-8');
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  private generateCsvContent(endpoints: Endpoint[]): string {
    const headers = [
      'Method',
      'Path',
      'File Path',
      'Line Number',
      'Class Name',
      'Method Name'
    ];

    const rows = endpoints.map(endpoint => [
      endpoint.method,
      endpoint.path,
      endpoint.filePath,
      endpoint.lineNumber.toString(),
      endpoint.className || '',
      endpoint.methodName || ''
    ]);

    const csvRows = [headers, ...rows];
    
    return csvRows
      .map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
      .join('\n');
  }

  private generateCsvContentWithCoverage(endpoints: EndpointWithCoverage[]): string {
    const headers = [
      'Method',
      'Path',
      'File Path',
      'Line Number',
      'Class Name',
      'Method Name',
      'API Spec Coverage',
      'Spec File',
      'Matched Operation'
    ];

    const rows = endpoints.map(endpoint => [
      endpoint.method,
      endpoint.path,
      endpoint.filePath,
      endpoint.lineNumber.toString(),
      endpoint.className || '',
      endpoint.methodName || '',
      endpoint.apiSpecCoverage.status,
      endpoint.apiSpecCoverage.specFile ? this.getRelativeSpecPath(endpoint.apiSpecCoverage.specFile) : '',
      endpoint.apiSpecCoverage.matchedEndpoint?.operationId || endpoint.apiSpecCoverage.matchedEndpoint?.summary || ''
    ]);

    const csvRows = [headers, ...rows];
    
    return csvRows
      .map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
      .join('\n');
  }

  private getRelativeSpecPath(specPath: string): string {
    const cwd = process.cwd();
    return specPath.startsWith(cwd) ? specPath.substring(cwd.length + 1) : specPath;
  }

  private escapeCsvCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }

  generateOutputPath(targetDirectory: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const projectName = this.extractProjectName(targetDirectory);
    const filename = `${projectName}-endpoints-${timestamp}.csv`;
    return join(process.cwd(), 'output', filename);
  }

  private extractProjectName(directoryPath: string): string {
    const pathParts = directoryPath.split('/');
    const projectName = pathParts[pathParts.length - 1];
    
    // Clean the project name to be filesystem-safe
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}