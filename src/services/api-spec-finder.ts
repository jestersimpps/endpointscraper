import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import glob from 'fast-glob';

export interface ApiSpec {
  filePath: string;
  type: 'openapi' | 'swagger';
  version: string;
  endpoints: ApiEndpoint[];
}

export interface ApiEndpoint {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
}

export class ApiSpecFinder {
  private readonly filePatterns = [
    '**/*.yaml',
    '**/*.yml', 
    '**/*.json'
  ];

  async findApiSpecs(projectPath: string): Promise<ApiSpec[]> {
    const potentialFiles = await this.findPotentialSpecFiles(projectPath);
    const specs: ApiSpec[] = [];

    console.log(`🔍 Scanning ${potentialFiles.length} YAML/JSON files for API specifications...`);
    console.log(`🐛 DEBUG: Project path: ${projectPath}`);
    console.log(`🐛 DEBUG: Current working directory: ${process.cwd()}`);
    
    if (potentialFiles.length > 0) {
      console.log(`🐛 DEBUG: First few files found:`, potentialFiles.slice(0, 5));
    }

    for (const filePath of potentialFiles) {
      try {
        const spec = await this.parseAndValidateSpecFile(filePath);
        if (spec) {
          specs.push(spec);
        }
      } catch (error) {
        // Silently skip files that aren't valid specs - this is expected
        // Only log if it's a parsing error on what looks like a spec file
        if (this.looksLikeSpecFile(filePath)) {
          console.warn(`⚠️  Could not parse potential spec file ${filePath}:`, error instanceof Error ? error.message : error);
        }
      }
    }

    return specs;
  }

  private async findPotentialSpecFiles(projectPath: string): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.filePatterns) {
      const files = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: [
          '**/node_modules/**', 
          '**/target/**', 
          '**/build/**', 
          '**/dist/**',
          '**/.git/**',
          '**/coverage/**',
          '**/test/**',
          '**/tests/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/package*.json',
          '**/tsconfig*.json',
          '**/jest*.json',
          '**/eslint*.json'
        ]
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  private looksLikeSpecFile(filePath: string): boolean {
    const fileName = filePath.toLowerCase();
    const specIndicators = [
      'swagger', 'openapi', 'api-spec', 'api.', 'spec.', 
      '/docs/', '/api/', '/swagger/', '/openapi/',
      'management.', 'actuator.'
    ];
    return specIndicators.some(indicator => fileName.includes(indicator));
  }

  private async parseAndValidateSpecFile(filePath: string): Promise<ApiSpec | null> {
    const content = await readFile(filePath, 'utf-8');
    let specData: any;

    try {
      if (filePath.endsWith('.json')) {
        specData = JSON.parse(content);
      } else {
        const yaml = await import('yaml');
        specData = yaml.parse(content);
      }
    } catch (error) {
      return null;
    }

    if (!this.isValidApiSpec(specData)) {
      return null;
    }

    const type = specData.openapi ? 'openapi' : 'swagger';
    const version = specData.openapi || specData.swagger || '2.0';
    const endpoints = this.extractEndpoints(specData);

    return {
      filePath,
      type,
      version,
      endpoints
    };
  }

  private isValidApiSpec(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for OpenAPI/Swagger identifier
    const hasApiIdentifier = data.openapi || data.swagger;
    if (!hasApiIdentifier) {
      return false;
    }

    // Check for paths object (core requirement)
    if (!data.paths || typeof data.paths !== 'object') {
      return false;
    }

    // Additional validation for common API spec properties
    const hasInfo = data.info && typeof data.info === 'object';
    if (!hasInfo) {
      return false;
    }

    // Validate version format
    if (data.openapi) {
      // OpenAPI version should be 3.x.x
      const versionMatch = /^3\.\d+\.\d+/.test(data.openapi);
      if (!versionMatch) {
        return false;
      }
    } else if (data.swagger) {
      // Swagger version should be 2.0
      if (data.swagger !== '2.0') {
        return false;
      }
    }

    return true;
  }

  private extractEndpoints(specData: any): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const paths = specData.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      if (typeof pathItem !== 'object' || pathItem === null) continue;

      const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
      
      for (const method of methods) {
        const operation = (pathItem as any)[method];
        if (operation) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            operationId: operation.operationId,
            summary: operation.summary
          });
        }
      }
    }

    return endpoints;
  }
}