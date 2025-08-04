import type { Endpoint, HttpMethod } from '@/models/endpoint';

export class ScalaEndpointExtractor {
  extract(filePath: string, content: string): Endpoint[] {
    const endpoints: Endpoint[] = [];
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

      if (this.isPlayFrameworkRoute(line)) {
        const endpoint = this.extractPlayRoute(line, filePath, lineNumber);
        if (endpoint) {
          endpoints.push(endpoint);
        }
        continue;
      }

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

      if (this.isAkkaHttpRoute(line)) {
        const endpoint = this.extractAkkaRoute(line, filePath, lineNumber, currentClassName);
        if (endpoint) {
          endpoints.push(endpoint);
        }
        continue;
      }
    }

    return endpoints;
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
    return /^\s*(GET|POST|PUT|PATCH|DELETE)\s+/.test(line) && 
           line.includes('controllers.');
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
    return /(get|post|put|patch|delete)\s*\(/.test(line) ||
           /path\s*\(/.test(line) && /(get|post|put|patch|delete)/.test(line);
  }

  private extractAkkaRoute(line: string, filePath: string, lineNumber: number, className?: string): Endpoint | null {
    const methodMatch = line.match(/(get|post|put|patch|delete)\s*\(/i);
    if (!methodMatch) return null;

    const method = methodMatch[1].toUpperCase() as HttpMethod;
    
    const pathMatch = line.match(/path\s*\(\s*"([^"]*)"/);
    const path = pathMatch?.[1] || '';

    return {
      method,
      path: path || '/',
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