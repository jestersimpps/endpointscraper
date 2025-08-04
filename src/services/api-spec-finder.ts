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
  private readonly specPatterns = [
    '**/*swagger*.{yaml,yml,json}',
    '**/*openapi*.{yaml,yml,json}',
    '**/*api-spec*.{yaml,yml,json}',
    '**/spec*.{yaml,yml,json}',
    '**/docs/**/*.{yaml,yml,json}',
    '**/api/**/*.{yaml,yml,json}'
  ];

  async findApiSpecs(projectPath: string): Promise<ApiSpec[]> {
    const specFiles = await this.findSpecFiles(projectPath);
    const specs: ApiSpec[] = [];

    for (const filePath of specFiles) {
      try {
        const spec = await this.parseSpecFile(filePath);
        if (spec) {
          specs.push(spec);
        }
      } catch (error) {
        console.warn(`Failed to parse spec file ${filePath}:`, error);
      }
    }

    return specs;
  }

  private async findSpecFiles(projectPath: string): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.specPatterns) {
      const files = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/target/**', '**/build/**', '**/dist/**']
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  private async parseSpecFile(filePath: string): Promise<ApiSpec | null> {
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
    return data && (data.openapi || data.swagger) && data.paths;
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