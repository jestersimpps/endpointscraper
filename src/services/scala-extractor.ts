import type { Endpoint, HttpMethod } from '@/models/endpoint';

export class ScalaEndpointExtractor {
  extract(filePath: string, content: string): Endpoint[] {
    const endpoints: Endpoint[] = [];
    
    // Skip test files completely
    if (this.isTestFile(filePath)) {
      return endpoints;
    }
    
    const lines = content.split('\n');
    let currentClassName: string | undefined;
    let baseMapping = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (this.isClassDeclaration(line)) {
        currentClassName = this.extractClassName(line);
        continue;
      }

      // Play Framework routes file
      if (this.isPlayFrameworkRoute(line)) {
        const endpoint = this.extractPlayRoute(line, filePath, lineNumber);
        if (endpoint) {
          endpoints.push(endpoint);
        }
        continue;
      }

      // Spring Boot annotations
      if (this.isSpringAnnotation(line)) {
        const method = this.extractHttpMethod(line);
        const path = this.extractPath(line);
        const methodName = this.extractMethodName(lines, i);

        if (method) {
          endpoints.push({
            method,
            path: this.combinePaths(baseMapping, path),
            filePath,
            lineNumber,
            className: currentClassName,
            methodName
          });
        }
        continue;
      }

      // Akka HTTP routes - more precise detection
      if (this.isAkkaHttpRoute(line)) {
        const endpoint = this.extractAkkaRoute(line, filePath, lineNumber, currentClassName);
        if (endpoint) {
          endpoints.push(endpoint);
        }
        continue;
      }

      // http4s routes - case GET -> Root / "path" / "segments"
      if (this.isHttp4sRoute(line)) {
        const endpoint = this.extractHttp4sRoute(line, filePath, lineNumber, currentClassName);
        if (endpoint) {
          endpoints.push(endpoint);
        }
        continue;
      }
    }

    return endpoints;
  }

  private isTestFile(filePath: string): boolean {
    const testPatterns = [
      /Test\.scala$/,
      /Spec\.scala$/,
      /IT\.scala$/,
      /IntegrationTest\.scala$/,
      /TestDsl\.scala$/,
      /\/test\//,
      /\/tests\//
    ];
    
    return testPatterns.some(pattern => pattern.test(filePath));
  }

  private isClassDeclaration(line: string): boolean {
    return /^(class|object|trait)\s+\w+/.test(line) || 
           /@RestController|@Controller/.test(line);
  }

  private extractClassName(line: string): string | undefined {
    const match = line.match(/(class|object|trait)\s+(\w+)/);
    return match?.[2];
  }

  private isPlayFrameworkRoute(line: string): boolean {
    // Match lines like: GET /api/path controllers.Controller.method()
    return /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/.test(line) && 
           /\s+\S+\.\S+/.test(line);
  }

  private extractPlayRoute(line: string, filePath: string, lineNumber: number): Endpoint | null {
    const routeMatch = line.match(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)\s+(.+)/);
    if (!routeMatch) return null;

    const method = routeMatch[1] as HttpMethod;
    const path = routeMatch[2];
    const controller = routeMatch[3];

    return {
      method,
      path,
      filePath,
      lineNumber,
      methodName: controller
    };
  }

  private isSpringAnnotation(line: string): boolean {
    return /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)/.test(line);
  }

  private isAkkaHttpRoute(line: string): boolean {
    // Only match if it's actually an Akka HTTP route definition
    // Look for: path("...") { get { ... } } or pathPrefix("...") { ... }
    // Or: get(path("...")) { ... }
    return (
      // Pattern: path("...") or pathPrefix("...")
      (/path(Prefix)?\s*\(\s*"[^"]*"/.test(line) && /(get|post|put|patch|delete)/i.test(line)) ||
      // Pattern: get(path("...")) or similar
      /(get|post|put|patch|delete)\s*\(\s*path\s*\(/i.test(line) ||
      // Pattern: (get|post|put|patch|delete) { ... } with path context
      (/(get|post|put|patch|delete)\s*\{/i.test(line) && line.includes('path'))
    );
  }

  private extractAkkaRoute(line: string, filePath: string, lineNumber: number, className?: string): Endpoint | null {
    // Extract HTTP method
    const methodMatch = line.match(/(get|post|put|patch|delete)/i);
    if (!methodMatch) return null;

    const method = methodMatch[1].toUpperCase() as HttpMethod;
    
    // Extract path - look for path("...") or pathPrefix("...")
    const pathMatch = line.match(/path(?:Prefix)?\s*\(\s*"([^"]*)"/);
    let path = pathMatch?.[1] || '';
    
    // If no path found, it might be a route without explicit path
    if (!path) {
      // Look for string literals that might be paths
      const stringMatch = line.match(/"([^"]*\/[^"]*)"/);
      path = stringMatch?.[1] || '';
    }

    // Only return endpoint if we have a valid path
    if (!path || path === '/') {
      return null;
    }

    return {
      method,
      path: path.startsWith('/') ? path : `/${path}`,
      filePath,
      lineNumber,
      className
    };
  }

  private extractHttpMethod(line: string): HttpMethod | null {
    if (/@GetMapping/.test(line)) return 'GET';
    if (/@PostMapping/.test(line)) return 'POST';
    if (/@PutMapping/.test(line)) return 'PUT';
    if (/@PatchMapping/.test(line)) return 'PATCH';
    if (/@DeleteMapping/.test(line)) return 'DELETE';
    
    if (/@RequestMapping/.test(line)) {
      const methodMatch = line.match(/method\s*=\s*RequestMethod\.(\w+)/);
      if (methodMatch) {
        const method = methodMatch[1].toUpperCase();
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          return method as HttpMethod;
        }
      }
      return 'GET';
    }
    
    return null;
  }

  private extractPath(line: string): string {
    const valueMatch = line.match(/value\s*=\s*"([^"]*)"/) || 
                      line.match(/@\w+Mapping\("([^"]*)"\)/) ||
                      line.match(/path\s*=\s*"([^"]*)"/);
    
    if (valueMatch) {
      return valueMatch[1];
    }

    return '';
  }

  private extractMethodName(lines: string[], currentIndex: number): string | undefined {
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      const methodMatch = line.match(/def\s+(\w+)\s*[\(\[:]/) ||
                          line.match(/val\s+(\w+)\s*:/);
      if (methodMatch) {
        return methodMatch[1];
      }
    }
    return undefined;
  }

  private isHttp4sRoute(line: string): boolean {
    // Match http4s route patterns: 
    // case GET -> Root / "path" / "segments"
    // case variable @ GET -> Root / "path" / "segments"
    // case Method.GET -> Root / "path" / "segments"
    // case variable @ Method.GET -> Root / "path" / "segments"
    return /case\s+(?:\w+\s*@\s+)?(?:Method\.)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/.test(line);
  }

  private extractHttp4sRoute(line: string, filePath: string, lineNumber: number, className?: string): Endpoint | null {
    // Extract HTTP method from: case GET -> Root, case variable @ GET -> Root, case Method.GET -> Root, etc.
    const methodMatch = line.match(/case\s+(?:\w+\s*@\s+)?(?:Method\.)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/);
    if (!methodMatch) return null;

    const method = methodMatch[1] as HttpMethod;
    
    // Extract path segments from Root / "segment1" / "segment2" / VariableName(param)
    const pathSegments: string[] = [];
    
    // Find all quoted strings and path variables after Root
    const rootIndex = line.indexOf('Root');
    if (rootIndex === -1) return null;
    
    const pathPart = line.substring(rootIndex + 4); // Skip "Root"
    
    // Match quoted strings like "users", "about", "me"
    const quotedMatches = pathPart.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach(match => {
        pathSegments.push(match.slice(1, -1)); // Remove quotes
      });
    }
    
    // Match path variables like BestekId(id), IntVar(num)
    const variableMatches = pathPart.match(/[A-Z]\w*\([^)]*\)/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        // Convert BestekId(id) to :id, IntVar(num) to :num
        const paramMatch = match.match(/\(([^)]*)\)/);
        if (paramMatch && paramMatch[1]) {
          pathSegments.push(`:${paramMatch[1]}`);
        } else {
          // If no parameter name, use generic placeholder
          pathSegments.push(':id');
        }
      });
    }
    
    // Build the final path
    const path = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/';
    
    return {
      method,
      path,
      filePath,
      lineNumber,
      className
    };
  }

  private combinePaths(basePath: string, endpointPath: string): string {
    if (!basePath && !endpointPath) return '/';
    if (!basePath) return endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    if (!endpointPath) return basePath.startsWith('/') ? basePath : `/${basePath}`;
    
    const cleanBase = basePath.startsWith('/') ? basePath : `/${basePath}`;
    const cleanEndpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    
    return cleanBase.endsWith('/') ? 
      `${cleanBase.slice(0, -1)}${cleanEndpoint}` : 
      `${cleanBase}${cleanEndpoint}`;
  }
}