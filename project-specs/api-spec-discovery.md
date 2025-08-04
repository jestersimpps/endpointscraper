# API Spec Discovery

## What it does
Automatically discovers and parses OpenAPI/Swagger specification files within a project directory to enable API coverage analysis. Supports both YAML and JSON formats, multiple specification versions, and various naming conventions.

## Discovery Algorithm

### Step 1: File Pattern Matching
The system searches for specification files using multiple glob patterns:
- `**/*swagger*.{yaml,yml,json}` - Swagger-named files
- `**/*openapi*.{yaml,yml,json}` - OpenAPI-named files  
- `**/*api-spec*.{yaml,yml,json}` - Generic API spec files
- `**/spec*.{yaml,yml,json}` - Short spec files
- `**/docs/**/*.{yaml,yml,json}` - Documentation directory specs
- `**/api/**/*.{yaml,yml,json}` - API directory specs

**Exclusion Patterns**:
- `**/node_modules/**` - Package dependencies
- `**/target/**` - Maven build output
- `**/build/**` - Gradle build output
- `**/dist/**` - Distribution files

### Step 2: File Validation
For each discovered file:
1. **Content Reading**: Read file as UTF-8 text
2. **Format Detection**: 
   - JSON files: Parse with JSON.parse()
   - YAML/YML files: Parse with YAML parser
3. **Schema Validation**: Verify required fields exist:
   - Must have `openapi` OR `swagger` field
   - Must have `paths` object

### Step 3: Specification Parsing
Extract key information from valid specification files:
- **Type Detection**: "openapi" if `openapi` field present, "swagger" otherwise
- **Version**: Value of `openapi` or `swagger` field
- **Endpoint Extraction**: Parse all endpoints from `paths` object

## Endpoint Extraction from Specs

### Path Processing
For each path in the `paths` object:
1. **Path Key**: Use as-is (e.g., "/users/{id}")
2. **HTTP Methods**: Check for standard methods:
   - get, post, put, patch, delete, head, options
3. **Operation Details**: Extract metadata:
   - `operationId`: Unique operation identifier
   - `summary`: Human-readable description

### Data Structure Creation
Create ApiEndpoint objects with:
- **method**: HTTP method (uppercase)
- **path**: URL path with parameters
- **operationId**: Operation identifier (optional)
- **summary**: Description (optional)

## Error Handling

### File Processing Errors
- **Parse Errors**: Log warning and skip file
- **Read Errors**: Log warning and continue with other files
- **Invalid Schema**: Skip file silently (not a spec file)

### Graceful Degradation
- No specifications found: Continue with endpoint-only analysis
- Partial specification parsing: Use successfully parsed endpoints
- Mixed valid/invalid specs: Use only valid specifications

## Output Format

### ApiSpec Structure
```
filePath: string           # Absolute path to specification file
type: 'openapi' | 'swagger' # Specification type
version: string            # Specification version (e.g., "3.0.0", "2.0")
endpoints: ApiEndpoint[]   # Array of discovered endpoints
```

### ApiEndpoint Structure
```
method: string      # HTTP method (uppercase)
path: string        # URL path with parameters
operationId?: string # Unique operation identifier
summary?: string    # Human-readable description
```

## Integration Points

### With Coverage Analyzer
- Provides specification endpoints for coverage comparison
- Enables matching of implementation vs specification
- Supports endpoint-to-spec traceability

### With CLI Interface
- Optional feature controlled by --api-spec flag
- Results displayed in separate API specs section
- Coverage metrics included in summary output

### With CSV Export
- Adds coverage columns to CSV output
- Includes specification file references
- Links endpoints to matched operations

## Performance Considerations

### File Discovery Optimization
- Use fast-glob for efficient pattern matching
- Parallel file reading where possible
- Early termination on parse errors

### Memory Management
- Stream large specification files
- Process specifications individually
- Cache parsed results during session

## Validation Rules

### Specification File Requirements
1. **Format**: Valid JSON or YAML syntax
2. **Schema**: Contains required OpenAPI/Swagger fields
3. **Structure**: Has navigable paths object
4. **Operations**: Contains at least one HTTP method

### Path Validation
- Paths must be strings
- Operations must be objects
- Method names must be standard HTTP methods
- OperationId must be string if present

## Common Patterns

### File Locations
Most common specification file locations:
- `./docs/api.yaml` - Documentation directory
- `./api/openapi.yaml` - API directory
- `./swagger.json` - Root level
- `./src/main/resources/api-spec.yaml` - Java resources
- `./openapi/spec.yaml` - Dedicated OpenAPI directory

### Naming Conventions
Standard naming patterns:
- `openapi.yaml` - OpenAPI 3.x files
- `swagger.yaml` - Swagger 2.0 files
- `api-spec.yaml` - Generic API specifications
- `spec.yaml` - Short form specifications

## Extension Points

### Adding New Specification Types
1. Add new file patterns to discovery list
2. Implement parser for new format
3. Update validation logic for new schema
4. Add type detection logic

### Custom Validation Rules
1. Extend isValidApiSpec method
2. Add format-specific validation
3. Include custom field requirements
4. Support organization-specific schemas

### Enhanced Metadata Extraction
1. Extract additional operation fields
2. Parse parameter definitions
3. Include response information
4. Support custom extensions