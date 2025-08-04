# Application Architecture

## What it does
EndpointScraper is a static analysis tool that discovers REST API endpoints in Java and Scala applications by parsing source code files. It extracts HTTP method, path, location, and metadata information from various web framework patterns.

## Core Components

### Entry Point (CLI Handler)
**Purpose**: Command-line interface management and orchestration
- Parses command-line arguments and options
- Validates input directory existence
- Coordinates scanning, formatting, and export operations
- Handles error conditions and exit codes

### File Scanner
**Purpose**: Directory traversal and file discovery
- Recursively scans target directory for relevant files
- Applies inclusion patterns (*.java, *.scala, routes files)
- Applies exclusion patterns (test files, build directories)
- Manages file reading and error handling

### Endpoint Extractors
**Purpose**: Framework-specific endpoint detection and parsing
- **Java Extractor**: Parses Spring Boot annotations
- **Scala Extractor**: Parses multiple Scala frameworks (Play, Akka HTTP, http4s)
- Each extractor implements pattern matching for their target framework
- Returns standardized endpoint objects

### Output Formatter
**Purpose**: Result presentation and display
- Formats scan results for console output
- Groups endpoints by source file
- Applies color coding for different HTTP methods
- Generates summary statistics by HTTP method

### CSV Exporter
**Purpose**: Data export and persistence
- Converts endpoint data to CSV format
- Generates timestamped output files
- Applies project-based naming conventions
- Handles CSV escaping and formatting

## Data Models

### Endpoint
Core data structure representing a discovered API endpoint:
- **method**: HTTP method (GET, POST, PUT, PATCH, DELETE)
- **path**: URL path with parameters
- **filePath**: Absolute path to source file
- **lineNumber**: Line number where endpoint was found
- **className**: Class/object name (optional)
- **methodName**: Method/function name (optional)

### ScanResult
Aggregated results from directory scanning:
- **totalFiles**: Total files discovered
- **scannedFiles**: Successfully processed files
- **endpoints**: Array of discovered endpoints
- **errors**: Array of error messages

## Architecture Patterns

### Strategy Pattern
Different extractors for different frameworks, all implementing the same interface:
```
extract(filePath: string, content: string): Endpoint[]
```

### Chain of Responsibility
File processing flows through multiple extractors based on file type and content patterns.

### Factory Pattern
Extractor selection based on file extension and content analysis.

## Design Principles

### Language Agnostic
The specification focuses on algorithms and patterns rather than implementation details, allowing recreation in any programming language.

### Modular Design
Each framework extractor is independent and can be developed/tested separately.

### Pattern-Based Detection
Uses regular expressions and string matching rather than full parsing for performance and simplicity.

### Comprehensive Filtering
Extensive exclusion patterns prevent false positives from test files and generated code.

### Error Resilience
Individual file processing errors don't stop the entire scan operation.

## Processing Flow

1. **Input Validation**: Verify directory exists and is readable
2. **File Discovery**: Scan directory with inclusion/exclusion patterns
3. **Content Analysis**: Read each file and apply appropriate extractor
4. **Result Aggregation**: Collect all endpoints and metadata
5. **Output Generation**: Format results for display and/or export
6. **Persistence**: Save results to CSV file with project-based naming

## Extensibility Points

### Adding New Frameworks
1. Create new extractor class implementing the extract interface
2. Add pattern detection logic to identify framework usage
3. Register extractor with file scanner
4. Add framework-specific extraction patterns

### Adding New Output Formats
1. Create new formatter implementing format interface
2. Add command-line option for new format
3. Integrate with main CLI flow

### Adding New Languages
1. Create language-specific extractor
2. Add file extension patterns
3. Implement framework detection for that language