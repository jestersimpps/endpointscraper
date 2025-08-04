# Coverage Analysis

## What it does
Compares discovered implementation endpoints against API specification endpoints to determine documentation coverage. Matches endpoints by HTTP method and path patterns, providing detailed coverage status and traceability.

## Analysis Algorithm

### Step 1: Coverage Status Assignment
For each implementation endpoint, determine coverage status:
- **covered**: Endpoint found in API specification
- **not-covered**: Implementation exists but not documented in spec
- **no-spec-found**: No API specifications discovered in project

### Step 2: Endpoint Matching Process
For endpoints with available specifications:
1. **Iterate through specifications**: Check each API spec file
2. **Method Matching**: Compare HTTP methods (case-insensitive)
3. **Path Matching**: Compare URL paths with parameter normalization
4. **First Match Wins**: Use first matching specification endpoint

## Path Matching Algorithm

### Normalization Process
Before comparison, both paths are normalized:
1. **Multiple Slashes**: Replace `/+` with single `/`
2. **Trailing Slashes**: Remove trailing `/` unless root path
3. **Empty Paths**: Convert empty strings to `/`

Example transformations:
- `//api///users/` → `/api/users`
- `/users//` → `/users`
- `""` → `/`

### Exact Match Check
First attempt exact string comparison after normalization:
```
if (normalizedImplementationPath === normalizedSpecPath) {
    return MATCH
}
```

### Parameter-Aware Matching
If exact match fails, perform segment-by-segment comparison:

1. **Split into Segments**: Split paths by `/` separator
2. **Length Validation**: Segments must have same count
3. **Segment Comparison**: For each segment pair:
   - Skip if either segment is a parameter
   - Exact match required for literal segments
4. **Result**: All literal segments must match

### Parameter Detection Patterns
A segment is considered a parameter if it matches any pattern:
- **OpenAPI/Swagger**: `{paramName}` (curly braces)
- **Express-style**: `:paramName` (colon prefix)  
- **Wildcard**: Contains `*` character
- **Complex Parameters**: `/\{[^}]+\}/` regex pattern

Examples:
- `{id}` → parameter
- `:userId` → parameter
- `*` → parameter
- `users` → literal

## Method Matching

### Case Normalization
- Convert both methods to uppercase before comparison
- Standard HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS

### Direct Comparison
```
implementationMethod.toUpperCase() === specMethod.toUpperCase()
```

## Coverage Result Structure

### EndpointWithCoverage
Each implementation endpoint gets enhanced with coverage information:
```
// Original endpoint fields
method: HttpMethod
path: string
filePath: string
lineNumber: number
className?: string
methodName?: string

// Coverage enhancement
apiSpecCoverage: ApiSpecCoverage
```

### ApiSpecCoverage Structure
```
status: 'covered' | 'not-covered' | 'no-spec-found'
specFile?: string                    # Path to matching spec file
matchedEndpoint?: {                  # Details of matched spec endpoint
    method: string
    path: string
    operationId?: string
    summary?: string
}
```

## Matching Examples

### Successful Matches
| Implementation | Specification | Result |
|----------------|---------------|--------|
| `GET /users` | `GET /users` | ✅ Exact match |
| `GET /users/123` | `GET /users/{id}` | ✅ Parameter match |
| `POST /api/posts` | `POST /api/posts` | ✅ Exact match |
| `PUT /users/456/profile` | `PUT /users/{userId}/profile` | ✅ Parameter match |

### Failed Matches
| Implementation | Specification | Reason |
|----------------|---------------|---------|
| `GET /users` | `POST /users` | Method mismatch |
| `GET /users/profile` | `GET /users/{id}/settings` | Path structure differs |
| `GET /v1/users` | `GET /v2/users` | Version differs |
| `DELETE /admin/users/123` | `DELETE /users/{id}` | Different path length |

## Coverage Statistics

### Calculation Methods

**Coverage Percentage**: For projects with specifications
```
covered_count / (covered_count + not_covered_count) * 100
```

**Total Coverage**: Including unspecified endpoints
```
covered_count / total_endpoints * 100
```

### Status Counts
- **Covered**: Endpoints with specification matches
- **Not Covered**: Endpoints without specification matches  
- **No Spec Found**: All endpoints when no specifications exist

## Error Handling

### Specification Processing Errors
- **Invalid Spec Format**: Treat as no specification available
- **Missing Paths**: Skip specification entirely
- **Malformed Endpoints**: Skip individual endpoint

### Path Matching Errors
- **Null/Undefined Paths**: Treat as no match
- **Invalid Segments**: Skip problematic segments
- **Regex Errors**: Fall back to exact string comparison

## Integration Points

### With API Spec Discovery
- Receives parsed API specifications
- Uses specification endpoints for matching
- Handles cases with no specifications found

### With Output Formatting  
- Provides coverage icons and status text
- Enables coverage-aware endpoint display
- Supplies coverage statistics for summary

### With CSV Export
- Adds coverage columns to export
- Links endpoints to specification files
- Includes matched operation details

## Performance Considerations

### Optimization Strategies
- **Early Termination**: Stop at first match per endpoint
- **Method Pre-filtering**: Filter by method before path comparison
- **Batch Processing**: Process all endpoints in single pass

### Memory Management
- **Streaming**: Process endpoints individually
- **Caching**: Cache normalized paths during comparison
- **Cleanup**: Release specification data after analysis

## Validation Rules

### Input Validation
- Implementation endpoints must have method and path
- Specifications must contain valid endpoints array
- Paths must be non-empty strings

### Output Validation
- Every endpoint must have coverage status
- Covered endpoints must include specification reference
- Matched endpoints must include operation details

## Extension Points

### Custom Matching Logic
1. **Path Templates**: Support additional parameter patterns
2. **Version Matching**: Handle API versioning schemes
3. **Namespace Matching**: Support API prefixes and namespaces
4. **Fuzzy Matching**: Implement similarity-based matching

### Enhanced Coverage Metrics
1. **Response Coverage**: Match response codes and schemas
2. **Parameter Coverage**: Validate parameter definitions
3. **Security Coverage**: Check authentication requirements
4. **Documentation Quality**: Assess description completeness

### Advanced Analysis
1. **Missing Implementations**: Find spec endpoints without implementation
2. **Version Drift**: Detect specification vs implementation differences  
3. **Breaking Changes**: Identify potentially breaking modifications
4. **Coverage Trends**: Track coverage changes over time