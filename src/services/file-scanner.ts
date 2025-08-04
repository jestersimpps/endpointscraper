import { readFile } from 'fs/promises';
import glob from 'fast-glob';
import type { Endpoint, ScanResult } from '@/models/endpoint';
import { JavaEndpointExtractor } from './java-extractor';
import { ScalaEndpointExtractor } from './scala-extractor';

export class FileScanner {
  private javaExtractor = new JavaEndpointExtractor();
  private scalaExtractor = new ScalaEndpointExtractor();

  async scanDirectory(directoryPath: string): Promise<ScanResult> {
    const result: ScanResult = {
      totalFiles: 0,
      scannedFiles: 0,
      endpoints: [],
      errors: []
    };

    try {
      const files = await this.findRelevantFiles(directoryPath);
      result.totalFiles = files.length;

      for (const filePath of files) {
        try {
          const content = await readFile(filePath, 'utf-8');
          const endpoints = await this.extractEndpoints(filePath, content);
          result.endpoints.push(...endpoints);
          result.scannedFiles++;
        } catch (error) {
          result.errors.push(`Failed to process ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to scan directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async findRelevantFiles(directoryPath: string): Promise<string[]> {
    const patterns = [
      '**/*.java',
      '**/*.scala'
    ];

    const files = await glob(patterns, {
      cwd: directoryPath,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/target/**',
        '**/build/**',
        '**/.git/**',
        '**/test/**',
        '**/tests/**'
      ]
    });

    return files;
  }

  private async extractEndpoints(filePath: string, content: string): Promise<Endpoint[]> {
    if (filePath.endsWith('.java')) {
      return this.javaExtractor.extract(filePath, content);
    } else if (filePath.endsWith('.scala')) {
      return this.scalaExtractor.extract(filePath, content);
    }
    return [];
  }
}