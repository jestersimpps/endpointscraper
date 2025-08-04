import type { Endpoint, HttpMethod } from '@/models/endpoint';

export class JavaEndpointExtractor {
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

      if (this.isRequestMapping(line)) {
        baseMapping = this.extractPath(line);
        continue;
      }

      if (this.isEndpointAnnotation(line)) {
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
      }
    }

    return endpoints;
  }

  private isClassDeclaration(line: string): boolean {
    return /^(@\w+\s+)*public\s+class\s+\w+/.test(line) || 
           /@RestController|@Controller/.test(line);
  }

  private extractClassName(line: string): string | undefined {
    const match = line.match(/class\s+(\w+)/);
    return match?.[1];
  }

  private isRequestMapping(line: string): boolean {
    return /@RequestMapping/.test(line);
  }

  private isEndpointAnnotation(line: string): boolean {
    return /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)/.test(line);
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

    const arrayMatch = line.match(/value\s*=\s*\{\s*"([^"]*)"/);
    if (arrayMatch) {
      return arrayMatch[1];
    }

    return '';
  }

  private extractMethodName(lines: string[], currentIndex: number): string | undefined {
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      const methodMatch = line.match(/public\s+\w+\s+(\w+)\s*\(/);
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