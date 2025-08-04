import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

export interface InteractiveOptions {
  directory: string;
  summary: boolean;
  quiet: boolean;
  csv: boolean;
  apiSpec: boolean;
}

export class InteractivePrompt {
  async getOptions(): Promise<InteractiveOptions> {
    console.log(chalk.blue.bold('\n🔍 EndpointScraper - Interactive Setup\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter the directory path to scan for endpoints:',
        default: '.',
        validate: (input: string) => {
          const path = resolve(input);
          if (!existsSync(path)) {
            return chalk.red(`Directory does not exist: ${path}`);
          }
          return true;
        },
        filter: (input: string) => resolve(input)
      },
      {
        type: 'confirm',
        name: 'apiSpec',
        message: 'Enable API specification analysis? (Finds OpenAPI/Swagger files and analyzes coverage)',
        default: true
      },
      {
        type: 'confirm',
        name: 'summary',
        message: 'Show summary by HTTP method?',
        default: true
      },
      {
        type: 'list',
        name: 'outputMode',
        message: 'Choose output mode:',
        choices: [
          { name: 'Standard output (detailed endpoint list)', value: 'standard' },
          { name: 'Quiet mode (suppress detailed output)', value: 'quiet' },
          { name: 'Minimal output (errors only)', value: 'minimal' }
        ],
        default: 'standard'
      },
      {
        type: 'confirm',
        name: 'csv',
        message: 'Export results to CSV file?',
        default: true
      }
    ]);

    return {
      directory: answers.directory,
      summary: answers.summary,
      quiet: answers.outputMode === 'quiet' || answers.outputMode === 'minimal',
      csv: answers.csv,
      apiSpec: answers.apiSpec
    };
  }

  async getDirectoryOnly(): Promise<string> {
    console.log(chalk.blue.bold('\n🔍 EndpointScraper - Quick Start\n'));
    
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter the directory path to scan for endpoints:',
        default: '.',
        validate: (input: string) => {
          const path = resolve(input);
          if (!existsSync(path)) {
            return chalk.red(`Directory does not exist: ${path}`);
          }
          return true;
        },
        filter: (input: string) => resolve(input)
      }
    ]);

    return answer.directory;
  }

  async askForApiSpecAnalysis(): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableApiSpec',
        message: 'Would you like to enable API specification analysis? (Recommended for better insights)',
        default: true
      }
    ]);

    return answer.enableApiSpec;
  }

  async askForContinueWithoutSpecs(): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'No API specifications found. Continue with endpoint scanning only?',
        default: true
      }
    ]);

    return answer.continue;
  }

  async askForMoreDetails(): Promise<{ summary: boolean; csv: boolean }> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'summary',
        message: 'Show summary statistics?',
        default: true
      },
      {
        type: 'confirm',
        name: 'csv',
        message: 'Export results to CSV file?',
        default: true
      }
    ]);

    return answers;
  }

  displayWelcome(): void {
    console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('              🔍 EndpointScraper v1.0.0                    ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.white('   Extract REST endpoints from Java & Scala applications     ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  displayStartMessage(directory: string, options: Partial<InteractiveOptions>): void {
    console.log(chalk.green('✨ Starting endpoint scan with the following configuration:'));
    console.log(chalk.gray('┌────────────────────────────────────────────────────────────┐'));
    console.log(chalk.gray('│') + chalk.white(` 📁 Directory: ${this.truncatePath(directory)}`.padEnd(58)) + chalk.gray('│'));
    
    if (options.apiSpec) {
      console.log(chalk.gray('│') + chalk.white(` 📋 API Spec Analysis: ${chalk.green('Enabled')}`.padEnd(67)) + chalk.gray('│'));
    }
    
    if (options.summary) {
      console.log(chalk.gray('│') + chalk.white(` 📊 Summary: ${chalk.green('Enabled')}`.padEnd(67)) + chalk.gray('│'));
    }
    
    if (options.csv) {
      console.log(chalk.gray('│') + chalk.white(` 📄 CSV Export: ${chalk.green('Enabled')}`.padEnd(67)) + chalk.gray('│'));
    }
    
    if (options.quiet) {
      console.log(chalk.gray('│') + chalk.white(` 🔇 Quiet Mode: ${chalk.yellow('Enabled')}`.padEnd(67)) + chalk.gray('│'));
    }
    
    console.log(chalk.gray('└────────────────────────────────────────────────────────────┘'));
    console.log('');
  }

  private truncatePath(path: string): string {
    if (path.length <= 40) return path;
    const parts = path.split('/');
    if (parts.length <= 3) return path;
    return `.../${parts.slice(-2).join('/')}`;
  }
}