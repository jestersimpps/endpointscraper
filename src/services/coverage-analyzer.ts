import type { Endpoint, EndpointWithCoverage, ApiSpecCoverage } from '@/models/endpoint';
import type { ApiSpec, ApiEndpoint } from '@/services/api-spec-finder';

export class CoverageAnalyzer {
  analyzeEndpointCoverage(
    endpoints: Endpoint[],
    apiSpecs: ApiSpec[]
  ): EndpointWithCoverage[] {
    if (apiSpecs.length === 0) {
      return endpoints.map(endpoint => ({
        ...endpoint,
        apiSpecCoverage: { status: 'no-spec-found' }
      }));
    }

    return endpoints.map(endpoint => {
      const coverage = this.findEndpointCoverage(endpoint, apiSpecs);
      return {
        ...endpoint,
        apiSpecCoverage: coverage
      };
    });
  }

  private findEndpointCoverage(
    endpoint: Endpoint,
    apiSpecs: ApiSpec[]
  ): ApiSpecCoverage {
    for (const spec of apiSpecs) {
      const matchedEndpoint = this.findMatchingEndpoint(endpoint, spec.endpoints);
      if (matchedEndpoint) {
        return {
          status: 'covered',
          specFile: spec.filePath,
          matchedEndpoint
        };
      }
    }

    return { status: 'not-covered' };
  }

  private findMatchingEndpoint(
    endpoint: Endpoint,
    specEndpoints: ApiEndpoint[]
  ): ApiEndpoint | undefined {
    return specEndpoints.find(specEndpoint => 
      this.methodsMatch(endpoint.method, specEndpoint.method) &&
      this.pathsMatch(endpoint.path, specEndpoint.path)
    );
  }

  private methodsMatch(endpointMethod: string, specMethod: string): boolean {
    return endpointMethod.toUpperCase() === specMethod.toUpperCase();
  }

  private pathsMatch(endpointPath: string, specPath: string): boolean {
    const normalizedEndpointPath = this.normalizePath(endpointPath);
    const normalizedSpecPath = this.normalizePath(specPath);

    if (normalizedEndpointPath === normalizedSpecPath) {
      return true;
    }

    return this.pathsMatchWithParameters(normalizedEndpointPath, normalizedSpecPath);
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  private pathsMatchWithParameters(endpointPath: string, specPath: string): boolean {
    const endpointSegments = endpointPath.split('/');
    const specSegments = specPath.split('/');

    if (endpointSegments.length !== specSegments.length) {
      return false;
    }

    for (let i = 0; i < endpointSegments.length; i++) {
      const endpointSegment = endpointSegments[i];
      const specSegment = specSegments[i];

      if (this.isParameterSegment(endpointSegment) || this.isParameterSegment(specSegment)) {
        continue;
      }

      if (endpointSegment !== specSegment) {
        return false;
      }
    }

    return true;
  }

  private isParameterSegment(segment: string): boolean {
    return segment.startsWith('{') && segment.endsWith('}') ||
           segment.startsWith(':') ||
           segment.includes('*') ||
           /\{[^}]+\}/.test(segment);
  }
}