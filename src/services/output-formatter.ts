import chalk from 'chalk';
import type { ScanResult, Endpoint } from '@/models/endpoint';

export class OutputFormatter {
  formatResults(result: ScanResult): string {
    const output: string[] = [];
    
    output.push(chalk.bold.blue('\n📊 Endpoint Scan Results'));
    output.push(chalk.gray('─'.repeat(50)));
    
    output.push(chalk.cyan(`📁 Total files: ${result.totalFiles}`));
    output.push(chalk.cyan(`✅ Scanned files: ${result.scannedFiles}`));
    output.push(chalk.cyan(`🎯 Endpoints found: ${result.endpoints.length}`));
    
    if (result.errors.length > 0) {
      output.push(chalk.red(`❌ Errors: ${result.errors.length}`));
    }
    
    output.push('');

    if (result.endpoints.length > 0) {
      output.push(chalk.bold.green('🚀 Discovered Endpoints:'));
      output.push(chalk.gray('─'.repeat(50)));
      
      const groupedEndpoints = this.groupEndpointsByFile(result.endpoints);
      
      for (const [filePath, endpoints] of Object.entries(groupedEndpoints)) {
        output.push(chalk.bold.white(`\n📄 ${this.getRelativePath(filePath)}`));
        
        for (const endpoint of endpoints) {
          const methodColor = this.getMethodColor(endpoint.method);
          const methodText = chalk.bold[methodColor](endpoint.method.padEnd(6));
          const pathText = chalk.white(endpoint.path);
          const lineText = chalk.gray(`(line ${endpoint.lineNumber})`);
          
          let info = `  ${methodText} ${pathText} ${lineText}`;
          
          if (endpoint.className || endpoint.methodName) {
            const classMethod = [endpoint.className, endpoint.methodName]
              .filter(Boolean)
              .join('.');
            info += chalk.gray(` - ${classMethod}`);
          }
          
          output.push(info);
        }
      }
    } else {
      output.push(chalk.yellow('⚠️  No endpoints found'));
    }

    if (result.errors.length > 0) {
      output.push(chalk.bold.red('\n❌ Errors:'));
      output.push(chalk.gray('─'.repeat(50)));
      
      for (const error of result.errors) {
        output.push(chalk.red(`  • ${error}`));
      }
    }

    output.push('');
    return output.join('\n');
  }

  formatSummary(result: ScanResult): string {
    const methodCounts = this.getMethodCounts(result.endpoints);
    const output: string[] = [];
    
    output.push(chalk.bold.blue('\n📈 Summary by HTTP Method:'));
    output.push(chalk.gray('─'.repeat(30)));
    
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
    
    for (const method of methods) {
      const count = methodCounts[method] || 0;
      if (count > 0) {
        const methodColor = this.getMethodColor(method);
        output.push(`  ${chalk.bold[methodColor](method.padEnd(6))} ${count}`);
      }
    }
    
    return output.join('\n');
  }

  private groupEndpointsByFile(endpoints: Endpoint[]): Record<string, Endpoint[]> {
    return endpoints.reduce((groups, endpoint) => {
      if (!groups[endpoint.filePath]) {
        groups[endpoint.filePath] = [];
      }
      groups[endpoint.filePath].push(endpoint);
      return groups;
    }, {} as Record<string, Endpoint[]>);
  }

  private getMethodCounts(endpoints: Endpoint[]): Record<string, number> {
    return endpoints.reduce((counts, endpoint) => {
      counts[endpoint.method] = (counts[endpoint.method] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private getMethodColor(method: string): 'green' | 'blue' | 'yellow' | 'magenta' | 'red' {
    switch (method) {
      case 'GET': return 'green';
      case 'POST': return 'blue';
      case 'PUT': return 'yellow';
      case 'PATCH': return 'magenta';
      case 'DELETE': return 'red';
      default: return 'green';
    }
  }

  private getRelativePath(fullPath: string): string {
    const parts = fullPath.split('/');
    return parts.length > 3 ? `.../${parts.slice(-3).join('/')}` : fullPath;
  }
}