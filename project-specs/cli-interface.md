# CLI Interface

## What it does
Provides a command-line interface for the endpointscraper tool with options for scanning directories, controlling output verbosity, generating summaries, and exporting results to CSV format.

## Command Structure
```
endpointscraper <directory> [options]
```

## Arguments

### Required Arguments
- **directory**: Target directory path to scan for Java/Scala files
  - Must be a valid, existing directory
  - Can be absolute or relative path
  - Automatically resolved to absolute path internally

## Command Options

### Summary Option
**Flag**: `-s, --summary`
**Purpose**: Display summary statistics by HTTP method
**Behavior**: Shows count of endpoints grouped by GET, POST, PUT, PATCH, DELETE
**Output**: Additional summary section after main results

### Quiet Option  
**Flag**: `-q, --quiet`
**Purpose**: Suppress detailed endpoint listing
**Behavior**: Hides individual endpoint details, shows only high-level statistics
**Use Case**: When only interested in counts or CSV export without console output

### CSV Export Option
**Flag**: `--no-csv`
**Purpose**: Skip CSV file export (exports by default)
**Default Behavior**: Always exports to CSV unless explicitly disabled
**Output Location**: `./output/` directory with timestamped filename

## Option Combinations

### Valid Combinations
- `--summary --quiet`: Show only summary statistics
- `--summary --no-csv`: Show detailed output plus summary, no CSV export
- `--quiet --no-csv`: Minimal output, no file export
- All options together: Minimal console output with summary and no CSV

## Exit Codes

### Success Cases
- **0**: Successful execution with endpoints found
- **0**: Successful execution with no endpoints found (not an error)

### Error Cases
- **1**: Directory not found
- **1**: All files had processing errors (no successful scans)
- **1**: Unexpected runtime error

## Input Validation

### Directory Validation
1. **Existence Check**: Verify directory exists using filesystem
2. **Path Resolution**: Convert relative paths to absolute paths
3. **Error Handling**: Display error message and exit if invalid

### Option Validation
- All options have default values (no validation needed)
- Boolean flags automatically handled by command parser

## Output Behavior

### Normal Mode (default)
- Display scan statistics (files found, processed, endpoints discovered)
- Show detailed endpoint listing grouped by source file
- Include file paths, line numbers, HTTP methods, and paths
- Use color coding for different HTTP methods

### Quiet Mode (--quiet)
- Suppress detailed endpoint listings
- Still show high-level statistics
- Still show error messages if any occur
- Summary still displayed if --summary flag used

### Summary Mode (--summary)
- Additional section showing endpoint counts by HTTP method
- Displayed after main output (or after quiet output)
- Shows only methods that have at least one endpoint

## Error Handling

### File Processing Errors
- Individual file errors don't stop execution
- Errors collected and displayed at end of output
- Error section only shown if errors occurred
- Each error includes file path and error description

### Critical Errors
- Directory not found: Immediate exit with error message
- Runtime exceptions: Caught and displayed with generic error message
- Process exits with code 1 for any critical error

## User Experience Features

### Progress Indication
- Initial message showing target directory being scanned
- Real-time feedback during processing

### Color Coding
- **Blue**: Informational messages and headers
- **Green**: Success messages and GET methods
- **Red**: Error messages and DELETE methods
- **Yellow**: Warning messages and PUT methods
- **Magenta**: PATCH methods
- **Gray**: Secondary information (line numbers, separators)

### File Path Display
- Long paths truncated to last 3 segments with "..." prefix
- Example: `.../src/controllers/UserController.java`

## CSV Export Integration

### Default Behavior
- Exports to CSV by default (opt-out with --no-csv)
- Shows export confirmation message with file path
- Creates output directory if it doesn't exist

### Filename Convention
- Pattern: `{project-name}-endpoints-{timestamp}.csv`
- Project name extracted from target directory name
- Timestamp format: ISO string with special characters replaced
- Example: `my-project-endpoints-2025-08-04T11-52-48.csv`

## Command Examples

### Basic Usage
```bash
endpointscraper /path/to/project
```
- Scans project directory
- Shows detailed output
- Exports to CSV
- No summary

### Summary Only
```bash
endpointscraper /path/to/project --summary --quiet
```
- Scans project directory
- Shows only summary statistics
- Exports to CSV
- No detailed listing

### No Export
```bash
endpointscraper /path/to/project --no-csv
```
- Scans project directory
- Shows detailed output
- No CSV export
- No summary

### All Options
```bash
endpointscraper /path/to/project --summary --quiet --no-csv
```
- Scans project directory
- Shows only summary statistics
- No CSV export
- Minimal output

## Implementation Requirements

### Command Parser
- Use commander.js or equivalent command-line parsing library
- Support both short and long flag formats
- Automatic help generation
- Version display capability

### Path Handling
- Cross-platform path resolution
- Handle spaces in directory names
- Support both relative and absolute paths

### Output Formatting
- Consistent spacing and alignment
- Unicode symbols for visual appeal
- Color support detection and fallback

### Error Recovery
- Graceful handling of individual file errors  
- Continue processing after non-critical errors
- Clear error messages for user troubleshooting