#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { FileScanner } from '@/services/file-scanner';
import { OutputFormatter } from '@/services/output-formatter';
import { CsvExporter } from '@/services/csv-exporter';
import { ApiSpecFinder } from '@/services/api-spec-finder';
import { CoverageAnalyzer } from '@/services/coverage-analyzer';
import { InteractivePrompt, type InteractiveOptions } from '@/services/interactive-prompt';
import type { ScanResultWithCoverage, ApiSpecInfo, EndpointWithCoverage } from '@/models/endpoint';

async function runEndpointScan(options: InteractiveOptions): Promise<void> {
  const { directory, summary, quiet, csv, apiSpec } = options;
  
  
  try {
    const targetPath = resolve(directory);
    
    if (!existsSync(targetPath)) {
      console.error(chalk.red(`❌ Directory not found: ${targetPath}`));
      process.exit(1);
    }

    console.log(chalk.blue(`🔍 Scanning directory: ${targetPath}`));
    
    const scanner = new FileScanner();
    const formatter = new OutputFormatter();
    const csvExporter = new CsvExporter();
    
    const result = await scanner.scanDirectory(targetPath);
    
    if (apiSpec) {
      console.log(chalk.blue('🔍 Looking for API specifications...'));
      
      const specFinder = new ApiSpecFinder();
      const coverageAnalyzer = new CoverageAnalyzer();
      
      const apiSpecs = await specFinder.findApiSpecs(targetPath);
      const endpointsWithCoverage = coverageAnalyzer.analyzeEndpointCoverage(result.endpoints, apiSpecs);
      
      const resultWithCoverage: ScanResultWithCoverage = {
        ...result,
        endpoints: endpointsWithCoverage,
        apiSpecs: apiSpecs.map(spec => ({
          filePath: spec.filePath,
          type: spec.type,
          version: spec.version,
          endpointCount: spec.endpoints.length
        }))
      };

      if (apiSpecs.length > 0) {
        console.log(formatter.formatApiSpecsInfo(resultWithCoverage.apiSpecs));
      } else {
        console.log(chalk.yellow('⚠️  No API specifications found'));
      }

      if (!quiet) {
        console.log(formatter.formatResultsWithCoverage(resultWithCoverage));
      }
      
      if (summary) {
        console.log(formatter.formatSummary(result));
        console.log(formatter.formatCoverageSummary(endpointsWithCoverage));
      }

      if (csv) {
        const csvPath = csvExporter.generateOutputPath(targetPath);
        await csvExporter.exportToCsvWithCoverage(resultWithCoverage, csvPath);
        console.log(chalk.green(`📄 CSV with coverage exported to: ${csvPath}`));
      }
    } else {
      if (!quiet) {
        console.log(formatter.formatResults(result));
      }
      
      if (summary) {
        console.log(formatter.formatSummary(result));
      }

      if (csv) {
        const csvPath = csvExporter.generateOutputPath(targetPath);
        await csvExporter.exportToCsv(result, csvPath);
        console.log(chalk.green(`📄 CSV exported to: ${csvPath}`));
      }
    }
    
    if (result.endpoints.length === 0 && result.errors.length === 0) {
      console.log(chalk.yellow('⚠️  No Java or Scala files found in the specified directory'));
      process.exit(0);
    }
    
    if (result.errors.length > 0 && result.endpoints.length === 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

// Main CLI logic
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('endpointscraper')
    .description('Extract REST endpoints from Java/Scala applications')
    .version('1.0.0');

  // Interactive mode (default)
  program
    .command('interactive', { isDefault: true })
    .alias('i')
    .description('Run in interactive mode (default)')
    .action(async () => {
      const prompt = new InteractivePrompt();
      prompt.displayWelcome();
      
      const options = await prompt.getOptions();
      prompt.displayStartMessage(options.directory, options);
      
      await runEndpointScan(options);
    });

  // Command-line mode for backward compatibility
  program
    .command('scan')
    .description('Run with command-line arguments (legacy mode)')
    .argument('<directory>', 'Directory path to scan for endpoints')
    .option('-s, --summary', 'Show summary by HTTP method')
    .option('-q, --quiet', 'Suppress detailed output')
    .option('--no-csv', 'Skip CSV export (exports by default)')
    .option('--api-spec', 'Look for API specifications and analyze coverage')
    .action(async (directory: string, options) => {
      const targetPath = resolve(directory);
      
      if (!existsSync(targetPath)) {
        console.error(chalk.red(`❌ Directory not found: ${targetPath}`));
        process.exit(1);
      }

      const scanOptions: InteractiveOptions = {
        directory: targetPath,
        summary: options.summary || false,
        quiet: options.quiet || false,
        csv: options.csv !== false,
        apiSpec: options.apiSpec || false
      };

      await runEndpointScan(scanOptions);
    });

  // Quick mode - just ask for directory
  program
    .command('quick')
    .alias('q')
    .description('Quick scan mode (only asks for directory)')
    .action(async () => {
      const prompt = new InteractivePrompt();
      prompt.displayWelcome();
      
      const directory = await prompt.getDirectoryOnly();
      
      // Default options for quick mode
      const options: InteractiveOptions = {
        directory,
        summary: true,
        quiet: false,
        csv: true,
        apiSpec: true
      };

      prompt.displayStartMessage(directory, options);
      await runEndpointScan(options);
    });

  // Handle no arguments (default to interactive)
  if (process.argv.length === 2) {
    const prompt = new InteractivePrompt();
    prompt.displayWelcome();
    
    const options = await prompt.getOptions();
    prompt.displayStartMessage(options.directory, options);
    
    await runEndpointScan(options);
    return;
  }

  program.parse();
}

// Run the CLI
main().catch((error) => {
  console.error(chalk.red(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`));
  process.exit(1);
});