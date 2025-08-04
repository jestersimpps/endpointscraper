#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { FileScanner } from '@/services/file-scanner';
import { OutputFormatter } from '@/services/output-formatter';
import { CsvExporter } from '@/services/csv-exporter';

const program = new Command();

program
  .name('endpointscraper')
  .description('Extract REST endpoints from Java/Scala applications')
  .version('1.0.0')
  .argument('<directory>', 'Directory path to scan for endpoints')
  .option('-s, --summary', 'Show summary by HTTP method')
  .option('-q, --quiet', 'Suppress detailed output')
  .option('--no-csv', 'Skip CSV export (exports by default)')
  .action(async (directory: string, options) => {
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
      
      if (!options.quiet) {
        console.log(formatter.formatResults(result));
      }
      
      if (options.summary) {
        console.log(formatter.formatSummary(result));
      }

      if (options.csv !== false) {
        const csvPath = csvExporter.generateOutputPath(targetPath);
        await csvExporter.exportToCsv(result, csvPath);
        console.log(chalk.green(`📄 CSV exported to: ${csvPath}`));
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
  });

program.parse();