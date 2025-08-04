# Data Models

## What it does
Defines the core data structures used throughout the EndpointScraper application for representing discovered endpoints, scan results, API specifications, and coverage analysis information.

## Core Data Types

### HttpMethod
Enumeration of supported HTTP methods:
```
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

**Usage**: Standardizes HTTP method representation across all components
**Validation**: Only these five methods are supported for endpoint extraction

## Primary Data Structures

### Endpoint
Core representation of a discovered API endpoint:
```
interface Endpoint {
  method: HttpMethod           # HTTP method (GET, POST, etc.)
  path: string                # URL path with parameters
  filePath: string            # Absolute path to source file
  lineNumber: number          # Line number where endpoint was found
  className?: string          # Class/object name (optional)
  methodName?: string         # Method/function name (optional)
}
```

**Field Descriptions**:
- **method**: Extracted HTTP method from annotations/patterns
- **path**: Complete URL path including parameters (e.g., "/users/{id}")
- **filePath**: Full filesystem path to source file containing endpoint
- **lineNumber**: Exact line number for source traceability
- **className**: Containing class name for Java/Scala context
- **methodName**: Handler method name for code navigation

### ScanResult
Aggregated results from directory scanning operation:
```
interface ScanResult {
  totalFiles: number          # Total files discovered by pattern matching
  scannedFiles: number        # Successfully processed files
  endpoints: Endpoint[]       # Array of discovered endpoints
  errors: string[]           # Array of processing error messages
}
```

**Metrics Tracking**:
- **totalFiles**: Count of all .java/.scala files found
- **scannedFiles**: Files successfully read and processed
- **endpoints**: All successfully extracted endpoints
- **errors**: File processing failures with descriptive messages

## Coverage-Enhanced Structures

### EndpointWithCoverage
Extended endpoint with API specification coverage information:
```
interface EndpointWithCoverage extends Endpoint {
  apiSpecCoverage: ApiSpecCoverage
}
```

**Enhancement**: Adds coverage analysis to basic endpoint data
**Usage**: When API specification analysis is enabled

### ScanResultWithCoverage
Enhanced scan result including specification information:
```  
interface ScanResultWithCoverage {
  totalFiles: number                    # Same as ScanResult
  scannedFiles: number                  # Same as ScanResult
  endpoints: EndpointWithCoverage[]     # Enhanced endpoints with coverage
  errors: string[]                      # Same as ScanResult
  apiSpecs: ApiSpecInfo[]              # Discovered API specifications
}
```

**Additional Data**:
- **endpoints**: Coverage-enhanced endpoint array
- **apiSpecs**: Summary information about found specifications

### ApiSpecCoverage
Coverage analysis result for individual endpoint:
```
interface ApiSpecCoverage {
  status: 'covered' | 'not-covered' | 'no-spec-found'
  specFile?: string                   # Path to matching specification file
  matchedEndpoint?: {                 # Details of matched specification endpoint
    method: string
    path: string
    operationId?: string
    summary?: string
  }
}
```

**Status Values**:
- **covered**: Endpoint found in API specification
- **not-covered**: Implementation exists but not in specification
- **no-spec-found**: No API specifications discovered in project

**Traceability**:
- **specFile**: Links to source specification file
- **matchedEndpoint**: Provides specification endpoint details

## API Specification Structures

### ApiSpecInfo
Summary information about discovered API specification:
```
interface ApiSpecInfo {
  filePath: string              # Absolute path to specification file
  type: 'openapi' | 'swagger'   # Specification format type
  version: string               # Specification version (e.g., "3.0.0")
  endpointCount: number         # Count of endpoints in specification
}
```

**Metadata**:
- **filePath**: Full path to specification file for reference
- **type**: Format detection (OpenAPI 3.x vs Swagger 2.0)
- **version**: Semantic version from specification
- **endpointCount**: Number of defined endpoints

### ApiSpec (Internal)
Complete parsed API specification (used internally):
```
interface ApiSpec {
  filePath: string              # Same as ApiSpecInfo
  type: 'openapi' | 'swagger'   # Same as ApiSpecInfo
  version: string               # Same as ApiSpecInfo
  endpoints: ApiEndpoint[]      # Full endpoint definitions
}
```

**Extension**: Includes complete endpoint array for matching operations

### ApiEndpoint
Individual endpoint definition from API specification:
```
interface ApiEndpoint {
  method: string                # HTTP method (uppercase)
  path: string                  # URL path with parameters
  operationId?: string          # Unique operation identifier
  summary?: string              # Human-readable description
}
```

**Specification Data**:
- **method**: HTTP method as defined in spec
- **path**: URL path template with parameters
- **operationId**: Unique identifier for operation
- **summary**: Brief description of endpoint purpose

## Data Relationships

### Endpoint to Coverage Flow
```
Endpoint → EndpointWithCoverage → ScanResultWithCoverage
```

1. **Base Endpoint**: Extracted from source code
2. **Coverage Analysis**: Enhanced with specification matching
3. **Result Aggregation**: Collected in coverage-aware result structure

### Specification to Coverage Flow
```
ApiSpec → ApiEndpoint → ApiSpecCoverage → EndpointWithCoverage
```

1. **Specification Discovery**: Find and parse specification files
2. **Endpoint Extraction**: Extract individual endpoint definitions
3. **Coverage Matching**: Match against implementation endpoints
4. **Result Enhancement**: Add coverage data to implementation endpoints

### File Processing Flow
```
File Discovery → Content Reading → Endpoint Extraction → Result Aggregation
```

1. **Pattern Matching**: Find relevant source files
2. **Content Processing**: Read and parse file contents
3. **Framework Detection**: Apply appropriate extraction patterns
4. **Data Collection**: Aggregate all discovered endpoints

## Validation Rules

### Required Fields
- **Endpoint**: method, path, filePath, lineNumber must be present
- **ScanResult**: All fields must be initialized (arrays can be empty)
- **ApiSpecCoverage**: status field is required

### Data Integrity
- **lineNumber**: Must be positive integer
- **filePath**: Must be absolute path
- **method**: Must be valid HttpMethod value
- **endpoints**: Must be valid array (can be empty)

### Coverage Consistency
- **Covered Status**: Must include matchedEndpoint data
- **Spec File Reference**: Must be valid path when present
- **Operation IDs**: Must be unique within specification

## Extension Points

### Adding New Fields
1. **Endpoint Enhancement**: Add framework-specific metadata
2. **Coverage Metrics**: Include detailed matching scores
3. **Performance Data**: Add processing timing information
4. **Quality Metrics**: Include code quality assessments

### Custom Data Types
1. **Framework Types**: Specific data for new frameworks
2. **Language Extensions**: Language-specific metadata
3. **Integration Data**: External tool integration fields
4. **Reporting Fields**: Specialized reporting information

### Validation Extensions
1. **Custom Rules**: Framework-specific validation
2. **Business Logic**: Organization-specific requirements
3. **Quality Gates**: Automated quality assessments
4. **Security Fields**: Security-related metadata