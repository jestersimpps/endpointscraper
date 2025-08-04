# CSV Export Functionality

## What it does
Exports discovered endpoints to CSV format with project-based naming, timestamp tracking, and proper CSV escaping. Creates timestamped files in a dedicated output directory for data persistence and external analysis.

## CSV Structure

### Headers
Standard CSV headers for all exports:
- **Method**: HTTP method (GET, POST, PUT, PATCH, DELETE)
- **Path**: URL path with parameters
- **File Path**: Absolute path to source file
- **Line Number**: Line number where endpoint was discovered
- **Class Name**: Class/object name (empty if not available)
- **Method Name**: Method/function name (empty if not available)

### Data Mapping
Each endpoint object maps to one CSV row:
```
Endpoint {
  method: "GET",
  path: "/api/users",
  filePath: "/src/controllers/UserController.java",
  lineNumber: 45,
  className: "UserController",
  methodName: "getUsers"
}
```

**CSV Row**:
```
GET,/api/users,/src/controllers/UserController.java,45,UserController,getUsers
```

## File Naming Convention

### Naming Pattern
`{project-name}-endpoints-{timestamp}.csv`

### Project Name Extraction
**Source**: Last segment of target directory path
**Processing**:
1. Extract final directory name from path
2. Convert to lowercase
3. Replace non-alphanumeric characters with hyphens
4. Remove multiple consecutive hyphens
5. Remove leading/trailing hyphens

**Examples**:
- `/path/to/my-spring-app` → `my-spring-app`
- `/projects/User Management` → `user-management`
- `/code/api_service_v2` → `api-service-v2`

### Timestamp Format
**Source**: Current date/time in ISO format
**Processing**:
1. Generate ISO string: `2025-08-04T11:52:48.123Z`
2. Remove milliseconds and timezone: `2025-08-04T11:52:48`
3. Replace colons and periods with hyphens: `2025-08-04T11-52-48`

### Complete Examples
- `user-service-endpoints-2025-08-04T11-52-48.csv`
- `my-project-endpoints-2025-08-04T15-30-22.csv`

## Output Directory Management

### Directory Location
**Path**: `./output/` relative to current working directory
**Purpose**: Centralized location for all generated CSV files

### Directory Creation
**Behavior**: Automatically create output directory if it doesn't exist
**Method**: Recursive directory creation to handle missing parent directories
**Error Handling**: Directory creation failures should be caught and reported

## CSV Escaping Rules

### Cell Escaping Logic
Apply escaping if cell contains any of:
- Comma (`,`)
- Double quote (`"`)
- Newline (`\n`)

### Escaping Algorithm
1. **Wrap in quotes**: Surround entire cell with double quotes
2. **Escape internal quotes**: Replace each `"` with `""`
3. **Preserve other characters**: Keep commas and newlines as-is within quotes

### Examples
- `Hello, World` → `"Hello, World"`
- `User says "hello"` → `"User says ""hello"""`
- `Normal text` → `Normal text` (no escaping needed)
- `Multi\nline text` → `"Multi\nline text"`

## File Writing Process

### Export Algorithm
1. **Prepare directory**: Ensure output directory exists
2. **Generate content**: Convert endpoints to CSV format
3. **Write file**: Save content to calculated file path
4. **Confirm completion**: Return success status

### Error Handling
**Directory creation failure**: Report error, don't attempt file write
**File writing failure**: Report specific error with file path
**Permission issues**: Handle and report filesystem permission errors

## Integration Points

### CLI Integration
**Default behavior**: Export enabled by default
**Opt-out option**: `--no-csv` flag disables export
**Confirmation message**: Display export path after successful write

### Data Source
**Input**: Complete ScanResult object with endpoints array
**Processing**: Extract only endpoints array for CSV conversion
**Validation**: Handle empty endpoints array gracefully

## Data Integrity

### Field Validation
- **Method**: Always present (required by endpoint interface)
- **Path**: Always present (required by endpoint interface)
- **File Path**: Always present (required by endpoint interface)  
- **Line Number**: Always present as number, converted to string
- **Class Name**: Optional, empty string if undefined
- **Method Name**: Optional, empty string if undefined

### Character Encoding
**Format**: UTF-8 encoding for international character support
**Handling**: Preserve original characters from source files

## Performance Considerations

### Memory Usage
- Process endpoints sequentially rather than building large string in memory
- Stream writing for very large datasets (future enhancement)

### File System
- Single atomic write operation per export
- No temporary files or partial writes
- Clean failure modes (no partial files left behind)

## Export Examples

### Basic Export
**Input Endpoints**:
```
[
  { method: "GET", path: "/users", filePath: "/src/UserController.java", lineNumber: 10, className: "UserController", methodName: "getUsers" },
  { method: "POST", path: "/users", filePath: "/src/UserController.java", lineNumber: 15, className: "UserController", methodName: "createUser" }
]
```

**Generated CSV**:
```
Method,Path,File Path,Line Number,Class Name,Method Name
GET,/users,/src/UserController.java,10,UserController,getUsers
POST,/users,/src/UserController.java,15,UserController,createUser
```

### Export with Escaping
**Input with Special Characters**:
```
[
  { method: "GET", path: "/search?query=\"test\"", filePath: "/src/search/Controller.java", lineNumber: 25, className: "SearchController", methodName: "search" }
]
```

**Generated CSV**:
```
Method,Path,File Path,Line Number,Class Name,Method Name
GET,"/search?query=""test""",/src/search/Controller.java,25,SearchController,search
```

### Export with Missing Optional Fields
**Input with Undefined Fields**:
```
[
  { method: "GET", path: "/health", filePath: "/routes", lineNumber: 1, className: undefined, methodName: "health.check" }
]
```

**Generated CSV**:
```
Method,Path,File Path,Line Number,Class Name,Method Name
GET,/health,/routes,1,,health.check
```