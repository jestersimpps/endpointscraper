# Scala Endpoint Extraction

## What it does
Extracts REST API endpoints from Scala source files supporting multiple web frameworks: Spring Boot annotations, Play Framework routes, Akka HTTP routes, and http4s routes. Each framework has distinct patterns and parsing requirements.

## Framework Detection and Processing

### Test File Exclusion
**Priority Check**: Before any extraction, verify file is not a test file
**Test Patterns**:
- Files ending with `Test.scala`, `Spec.scala`, `IT.scala`, `IntegrationTest.scala`
- Files in `/test/` or `/tests/` directories
- Files with `TestDsl.scala` suffix
**Action**: Skip extraction entirely for test files

### Framework 1: Spring Boot Annotations
Same patterns as Java extraction but adapted for Scala syntax.

**Class Detection**: 
```regex
/@RestController|@Controller/
/(class|object|trait)\s+(\w+)/
```

**Annotations**: Same as Java (@GetMapping, @PostMapping, etc.)
**Method Detection**: 
```regex
/def\s+(\w+)\s*[\(\[:]/    # def methodName(
/val\s+(\w+)\s*:/          # val methodName:
```

### Framework 2: Play Framework Routes
**File Detection**: Routes files (typically named "routes" without extension)
**Pattern**: `METHOD /path controller.method`

**Route Pattern**:
```regex
/^\s*(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)\s+(.+)/
```

**Extraction Logic**:
1. Match HTTP method at line start
2. Extract path (second group)
3. Extract controller reference (third group)
4. Use controller reference as methodName

**Example**:
```
GET     /api/users              controllers.UserController.getUsers
POST    /api/users              controllers.UserController.createUser
GET     /api/users/:id          controllers.UserController.getUser(id: Long)
```

### Framework 3: Akka HTTP Routes
**Detection Pattern**: 
```regex
# Pattern matching for Akka HTTP route definitions
/path(Prefix)?\s*\(\s*"[^"]*".*?(get|post|put|patch|delete)/i
/(get|post|put|patch|delete)\s*\(\s*path\s*\(/i
/(get|post|put|patch|delete)\s*\{.*?path/i
```

**Extraction Algorithm**:
1. **Method Detection**: Extract HTTP method from matched pattern
2. **Path Detection**: 
   - Primary: `path("segment")` or `pathPrefix("segment")`
   - Fallback: String literals containing "/"
3. **Path Validation**: Only extract if valid path found (not empty or just "/")
4. **Path Formatting**: Ensure path starts with "/"

**Examples**:
```scala
pathPrefix("api" / "users") {
  get {
    complete(getUsers())
  } ~
  post {
    entity(as[User]) { user =>
      complete(createUser(user))
    }
  }
}
```

### Framework 4: http4s Routes
**Detection Pattern**:
```regex
/case\s+(?:\w+\s*@\s+)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/
```

**Pattern Support**:
- **Standard Pattern**: `case GET -> Root / "path"`
- **Variable-Prefixed Pattern**: `case variable @ GET -> Root / "path"`

**Extraction Algorithm**:
1. **Method Detection**: Extract HTTP method from case statement, handling optional variable prefix
2. **Path Segment Extraction**:
   - **Quoted Segments**: Extract all `"segment"` patterns using regex `/"([^"]+)"/g`
   - **Variable Segments**: Extract `VariableName(param)` patterns using regex `/[A-Z]\w*\([^)]*\)/g` and convert to `:param`
3. **Path Construction**: Join segments with "/" to build full path

**Path Variable Conversion**:
- `BestekId(id)` → `:id`
- `IntVar(num)` → `:num`  
- `RolVar(rol)` → `:rol`
- Unknown variables → `:id` (generic placeholder)

**Examples**:
```scala
val routes: AuthedRoutes[User, F] = AuthedRoutes.of[User, F] {
  case GET -> Root / "users" / "about" / "me" as user =>
    Ok(user)
  
  case context @ POST -> Root / "voorlopigewijzigingen" as user =>
    createTempChange(context)
  
  case GET -> Root / "users" / "my" / "personas" as user =>
    getPersonas(user)
    
  case GET -> Root / "users" / "met" / "rol" / RolVar(rol) as user =>
    getUsersWithRole(rol)
}
```

**Extracted Endpoints**:
- GET /users/about/me
- POST /voorlopigewijzigingen
- GET /users/my/personas  
- GET /users/met/rol/:rol

## Pattern Matching Algorithms

### Class/Object Detection
```regex
/^(class|object|trait)\s+\w+/
/@RestController|@Controller/
```

### Play Routes Detection
```regex
/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+.*\s+\S+\.\S+/
```

### Akka HTTP Detection
```regex
/path(Prefix)?\s*\(\s*"[^"]*".*?(get|post|put|patch|delete)/i
/(get|post|put|patch|delete)\s*\(\s*path\s*\(/i
/(get|post|put|patch|delete)\s*\{.*?path/i
```

### http4s Detection
```regex
/case\s+(?:\w+\s*@\s+)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/
```

### Path Extraction Patterns

**Akka HTTP**:
```regex
/path(?:Prefix)?\s*\(\s*"([^"]*)"/     # path("segment")
/"([^"]*\/[^"]*)"/                     # fallback string with "/"
```

**http4s**:
```regex
/"([^"]+)"/g                           # quoted segments
/[A-Z]\w*\([^)]*\)/g                   # variable patterns
/\(([^)]*)\)/                          # parameter extraction
```

## Recent Improvements

### Enhanced http4s Pattern Recognition
**Version**: August 2025
**Impact**: Endpoint detection increased from 107 to 179 endpoints in pos project (+67% improvement)

**New Pattern Support**:
- **Variable-Prefixed Cases**: Added support for `case variable @ METHOD -> Root` patterns
- **Improved Regex**: Enhanced regex pattern to handle optional variable prefixes with `(?:\w+\s*@\s+)?`
- **Better Extraction**: More robust method extraction that handles both standard and prefixed patterns

**Technical Implementation**:
```typescript
// Before: Only supported standard patterns
/case\s+(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/

// After: Supports both standard and variable-prefixed patterns  
/case\s+(?:\w+\s*@\s+)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/
```

**Pattern Examples**:
- **Standard**: `case GET -> Root / "api" / "users"`
- **Variable-Prefixed**: `case context @ POST -> Root / "voorlopigewijzigingen"`
- **With Parameters**: `case request @ PUT -> Root / "users" / UserId(id)`

**Regex Components**:
- `case\s+` - Matches "case" with following whitespace
- `(?:\w+\s*@\s+)?` - Optional non-capturing group for variable prefix (e.g., "context @ ")
- `(GET|POST|PUT|PATCH|DELETE)` - Captures HTTP method
- `\s*->\s*Root` - Matches arrow pattern pointing to Root

## Business Rules

### Framework Priority
1. Skip if test file (highest priority)
2. Process Spring annotations (if present)
3. Process Play routes (if routes file)
4. Process Akka HTTP routes (if patterns match)
5. Process http4s routes (if patterns match)

### Path Construction Rules
- **Empty paths**: Default to "/"
- **Relative paths**: Add leading "/" if missing
- **Base path combination**: Same logic as Java extractor

### Method Name Assignment
- **Spring**: Extract from def/val declarations
- **Play**: Use full controller reference
- **Akka HTTP**: Usually undefined (route-based)
- **http4s**: Usually undefined (pattern-based)

### Class Context Tracking
- Track current class/object/trait name
- Reset on new class declaration
- Apply to all endpoints found within class scope

## Output Standardization

All frameworks produce the same endpoint structure:
```
{
  method: HttpMethod,
  path: string,
  filePath: string,
  lineNumber: number,
  className?: string,
  methodName?: string
}
```

## Error Handling

### Invalid Patterns
- Unrecognized HTTP methods are ignored
- Malformed path patterns skip extraction
- Missing path information results in no endpoint

### File Processing Errors
- Individual line parsing errors don't stop file processing
- Invalid regex matches are handled gracefully
- Missing class context doesn't prevent endpoint extraction

## Framework-Specific Considerations

### Play Framework
- Routes files don't have class context
- Controller references serve as method names
- Parameters in routes (`:id`) are preserved in paths

### Akka HTTP
- Nested route structures require careful path extraction
- Method detection must handle various syntax forms
- Path segments may be split across multiple constructs

### http4s
- Case pattern matching syntax is unique
- Variable extraction requires specialized parsing
- Path construction from segments needs proper joining

### Spring Annotations
- Scala method syntax differs from Java
- `def` and `val` declarations both valid for endpoints
- Same annotation patterns as Java but Scala-specific method detection