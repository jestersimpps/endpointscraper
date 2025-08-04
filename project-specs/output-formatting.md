# Output Formatting

## What it does
Formats scan results for console display with color coding, grouping, and statistical summaries. Provides both detailed and summary output modes with visual hierarchy and readability features.

## Main Output Format

### Header Section
**Purpose**: Display scan overview and statistics
**Content**:
- Title: "📊 Endpoint Scan Results"
- Horizontal separator line (50 characters)
- Total files discovered count
- Successfully scanned files count  
- Total endpoints found count
- Error count (if any errors occurred)

**Example**:
```
📊 Endpoint Scan Results
──────────────────────────────────────────────────
📁 Total files: 15
✅ Scanned files: 12  
🎯 Endpoints found: 24
❌ Errors: 2
```

### Endpoints Section
**Purpose**: Display discovered endpoints grouped by source file
**Structure**:
- Section header: "🚀 Discovered Endpoints:"
- Horizontal separator
- File-based grouping with relative paths
- Individual endpoint details with formatting

**File Group Format**:
```
📄 .../controllers/UserController.java
  GET    /api/users (line 45) - UserController.getUsers
  POST   /api/users (line 52) - UserController.createUser
```

### Endpoint Detail Format
**Components**:
- HTTP method (6-character padded, color-coded)
- URL path
- Line number in parentheses
- Class and method names (if available)

**Color Coding**:
- GET: Green
- POST: Blue  
- PUT: Yellow
- PATCH: Magenta
- DELETE: Red

### Error Section
**Purpose**: Display file processing errors
**Condition**: Only shown if errors occurred
**Format**:
- Section header: "❌ Errors:"
- Horizontal separator
- Bulleted list of error messages with file paths

## Summary Output Format

### Summary Header
**Purpose**: Statistical overview by HTTP method
**Content**:
- Title: "📈 Summary by HTTP Method:"
- Horizontal separator (30 characters)

### Method Counts
**Display Logic**: Only show methods with count > 0
**Format**: `METHOD_NAME (6-char padded) COUNT`
**Order**: GET, POST, PUT, PATCH, DELETE

**Example**:
```
📈 Summary by HTTP Method:
──────────────────────────
  GET    12
  POST   6
  PUT    4
  PATCH  1
  DELETE 3
```

## Text Formatting Rules

### Color Application
**Method Colors**:
- GET: `chalk.bold.green`
- POST: `chalk.bold.blue`
- PUT: `chalk.bold.yellow`
- PATCH: `chalk.bold.magenta`
- DELETE: `chalk.bold.red`

**Other Elements**:
- Headers: `chalk.bold.blue`
- File paths: `chalk.bold.white`
- Regular text: `chalk.white`
- Secondary info: `chalk.gray`
- Errors: `chalk.red`
- Success messages: `chalk.green`
- Warnings: `chalk.yellow`

### Unicode Symbols
- 📊 Scan results header
- 🚀 Endpoints section header
- 📄 Individual file indicator
- 📁 File count indicator
- ✅ Success indicator
- 🎯 Target/goal indicator
- ❌ Error indicator
- 📈 Summary/statistics indicator
- ⚠️ Warning indicator

### Spacing and Alignment
- HTTP methods padded to 6 characters for alignment
- Consistent indentation (2 spaces) for endpoint details
- Empty lines between major sections
- Horizontal separators using repeated "─" character

## Path Display Logic

### Path Truncation
**Purpose**: Keep file paths readable in console output
**Algorithm**:
1. Split path by "/" separator
2. If more than 3 segments, take last 3 segments
3. Prefix with "..." if truncated
4. Join segments back with "/"

**Examples**:
- `/very/long/path/src/controllers/UserController.java` → `.../controllers/UserController.java`
- `/short/path.java` → `/short/path.java`

## Grouping Logic

### Endpoint Grouping
**Method**: Group endpoints by source file path
**Purpose**: Organize output for readability
**Implementation**:
1. Create map with file path as key
2. Array of endpoints as value
3. Iterate through grouped results for display

### Empty State Handling
**No Endpoints Found**: Display "⚠️ No endpoints found" message
**No Files Found**: Handled at CLI level with appropriate warning

## Output Modes

### Normal Mode
- Show header section
- Show detailed endpoints section  
- Show error section (if errors exist)
- Show summary section (if --summary flag)

### Quiet Mode
- Show header section only
- Skip detailed endpoints section
- Show error section (if errors exist)
- Show summary section (if --summary flag)

## Data Processing

### Endpoint Sorting
**File Level**: Endpoints within each file maintain discovery order
**File Order**: Files processed in filesystem order (typically alphabetical)

### Count Calculations
**Method Counts**: Aggregate all endpoints by HTTP method
**File Counts**: Track total discovered vs successfully processed
**Error Counts**: Count of files that failed processing

## Visual Hierarchy

### Section Priority
1. **Header**: Most prominent with title and key statistics
2. **Endpoints**: Main content area with detailed listings
3. **Summary**: Secondary statistical view  
4. **Errors**: Important but visually separated

### Information Density
- High-level stats in header for quick overview
- Detailed information grouped and indented for scanning
- Secondary information (line numbers, class names) in muted colors

## Accessibility Considerations

### Color Fallback
- All color coding has textual alternatives (method names)
- Unicode symbols provide visual distinction without relying solely on color
- Consistent formatting allows parsing even without color support

### Screen Reader Compatibility
- Logical information hierarchy
- Clear textual indicators
- No essential information conveyed only through color or symbols