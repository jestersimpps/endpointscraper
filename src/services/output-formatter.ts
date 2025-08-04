import chalk from 'chalk';
import type { ScanResult, Endpoint, ScanResultWithCoverage, EndpointWithCoverage, ApiSpecInfo } from '@/models/endpoint';

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

  formatResultsWithCoverage(result: ScanResultWithCoverage): string {
    const output: string[] = [];
    
    output.push(chalk.bold.blue('\n📊 Endpoint Scan Results with API Coverage'));
    output.push(chalk.gray('─'.repeat(50)));
    
    output.push(chalk.cyan(`📁 Total files: ${result.totalFiles}`));
    output.push(chalk.cyan(`✅ Scanned files: ${result.scannedFiles}`));
    output.push(chalk.cyan(`🎯 Endpoints found: ${result.endpoints.length}`));
    
    if (result.apiSpecs.length > 0) {
      output.push(chalk.cyan(`📋 API specs found: ${result.apiSpecs.length}`));
    }
    
    if (result.errors.length > 0) {
      output.push(chalk.red(`❌ Errors: ${result.errors.length}`));
    }
    
    output.push('');

    if (result.endpoints.length > 0) {
      output.push(chalk.bold.green('🚀 Discovered Endpoints with Coverage:'));
      output.push(chalk.gray('─'.repeat(50)));
      
      const groupedEndpoints = this.groupEndpointsByFileWithCoverage(result.endpoints);
      
      for (const [filePath, endpoints] of Object.entries(groupedEndpoints)) {
        output.push(chalk.bold.white(`\n📄 ${this.getRelativePath(filePath)}`));
        
        for (const endpoint of endpoints) {
          const methodColor = this.getMethodColor(endpoint.method);
          const methodText = chalk.bold[methodColor](endpoint.method.padEnd(6));
          const pathText = chalk.white(endpoint.path);
          const lineText = chalk.gray(`(line ${endpoint.lineNumber})`);
          const coverageIcon = this.getCoverageIcon(endpoint.apiSpecCoverage.status);
          const coverageText = this.getCoverageText(endpoint.apiSpecCoverage.status);
          
          let info = `  ${methodText} ${pathText} ${lineText} ${coverageIcon} ${coverageText}`;
          
          if (endpoint.className || endpoint.methodName) {
            const classMethod = [endpoint.className, endpoint.methodName]
              .filter(Boolean)
              .join('.');
            info += chalk.gray(` - ${classMethod}`);
          }
          
          if (endpoint.apiSpecCoverage.matchedEndpoint?.operationId) {
            info += chalk.gray(` (${endpoint.apiSpecCoverage.matchedEndpoint.operationId})`);
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

  formatApiSpecsInfo(apiSpecs: ApiSpecInfo[]): string {
    if (apiSpecs.length === 0) {
      return '';
    }

    const output: string[] = [];
    
    output.push(chalk.bold.blue('\n📋 API Specifications Found:'));
    output.push(chalk.gray('─'.repeat(50)));
    
    for (const spec of apiSpecs) {
      const relativePath = this.getRelativePath(spec.filePath);
      const typeColor = spec.type === 'openapi' ? 'green' : 'blue';
      const typeText = chalk.bold[typeColor](spec.type.toUpperCase());
      const versionText = chalk.gray(`v${spec.version}`);
      const endpointText = chalk.cyan(`${spec.endpointCount} endpoints`);
      
      output.push(`  📄 ${relativePath}`);
      output.push(`     ${typeText} ${versionText} • ${endpointText}`);
      output.push('');
    }
    
    return output.join('\n');
  }

  formatCoverageSummary(endpoints: EndpointWithCoverage[]): string {
    const coverageStats = {
      covered: endpoints.filter(e => e.apiSpecCoverage.status === 'covered').length,
      notCovered: endpoints.filter(e => e.apiSpecCoverage.status === 'not-covered').length,
      noSpec: endpoints.filter(e => e.apiSpecCoverage.status === 'no-spec-found').length
    };

    const output: string[] = [];
    
    output.push(chalk.bold.blue('\n📊 API Spec Coverage Summary:'));
    output.push(chalk.gray('─'.repeat(30)));
    
    if (coverageStats.noSpec === endpoints.length) {
      output.push(chalk.yellow('  ⚠️  No API specifications found'));
    } else {
      output.push(chalk.green(`  ✅ Covered: ${coverageStats.covered}`));
      output.push(chalk.red(`  ❌ Not covered: ${coverageStats.notCovered}`));
      
      if (coverageStats.noSpec > 0) {
        output.push(chalk.yellow(`  ⚠️  No spec found: ${coverageStats.noSpec}`));
      }
      
      const totalWithSpec = coverageStats.covered + coverageStats.notCovered;
      if (totalWithSpec > 0) {
        const coveragePercentage = Math.round((coverageStats.covered / totalWithSpec) * 100);
        const bar = this.createProgressBar(coveragePercentage);
        output.push(chalk.blue(`  📈 Coverage: ${coveragePercentage}% ${bar}`));
      }
    }
    
    return output.join('\n');
  }

  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    if (percentage >= 80) return chalk.green(bar);
    if (percentage >= 60) return chalk.yellow(bar);
    return chalk.red(bar);
  }

  private getCoverageIcon(status: string): string {
    switch (status) {
      case 'covered': return chalk.green('✅');
      case 'not-covered': return chalk.red('❌');
      case 'no-spec-found': return chalk.yellow('⚠️');
      default: return chalk.gray('❓');
    }
  }

  private getCoverageText(status: string): string {
    switch (status) {
      case 'covered': return chalk.green('Covered');
      case 'not-covered': return chalk.red('Not covered');
      case 'no-spec-found': return chalk.yellow('No spec');
      default: return chalk.gray('Unknown');
    }
  }

  private groupEndpointsByFileWithCoverage(endpoints: EndpointWithCoverage[]): Record<string, EndpointWithCoverage[]> {
    return endpoints.reduce((groups, endpoint) => {
      if (!groups[endpoint.filePath]) {
        groups[endpoint.filePath] = [];
      }
      groups[endpoint.filePath].push(endpoint);
      return groups;
    }, {} as Record<string, EndpointWithCoverage[]>);
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