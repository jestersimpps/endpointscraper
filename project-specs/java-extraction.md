# Java Endpoint Extraction

## What it does
Extracts REST API endpoints from Java source files using Spring Boot annotations. Parses class-level and method-level annotations to build complete endpoint paths with HTTP methods.

## Supported Annotations

### Class-Level Annotations
- **@RestController**: Identifies REST controller classes
- **@Controller**: Identifies MVC controller classes
- **@RequestMapping**: Provides base path for all methods in class

### Method-Level Annotations
- **@GetMapping**: GET endpoints
- **@PostMapping**: POST endpoints
- **@PutMapping**: PUT endpoints
- **@PatchMapping**: PATCH endpoints
- **@DeleteMapping**: DELETE endpoints
- **@RequestMapping**: Generic mapping with method specification

## Extraction Algorithm

### Step 1: File Processing
1. Split file content into lines for line-by-line analysis
2. Initialize tracking variables:
   - Current class name
   - Base mapping path from @RequestMapping
   - Line number counter

### Step 2: Class Detection
**Pattern**: `@RestController|@Controller` or `public class ClassName`
**Action**: Extract and store class name for endpoint metadata

### Step 3: Base Path Detection
**Pattern**: `@RequestMapping`
**Extraction Logic**:
- Match `value = "path"` or direct `@RequestMapping("path")`
- Match array format `value = {"path"}`
- Store as base path for path combination

### Step 4: Endpoint Detection
**Pattern**: `@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)`

**HTTP Method Extraction**:
- Direct mapping annotations → corresponding HTTP method
- @RequestMapping → extract from `method = RequestMethod.METHOD`
- Default to GET if method not specified

**Path Extraction**:
- Match `value = "path"` patterns
- Match direct annotation format `@Mapping("path")`
- Match `path = "path"` patterns
- Match array format `value = {"path"}` (take first element)

### Step 5: Method Name Detection
**Search Range**: 1-5 lines after annotation
**Pattern**: `public ReturnType methodName(`
**Extraction**: Extract method name for metadata

### Step 6: Path Combination
**Algorithm**:
1. Handle empty paths: default to "/"
2. Ensure leading slashes on both base and endpoint paths
3. Remove trailing slash from base path if present
4. Concatenate: `basePath + endpointPath`

## Pattern Matching Rules

### Class Declaration Detection
```regex
/^(@\w+\s+)*public\s+class\s+\w+/
/@RestController|@Controller/
```

### Annotation Detection
```regex
/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)/
```

### Path Value Extraction
```regex
/value\s*=\s*"([^"]*)"/          # value = "path"
/@\w+Mapping\("([^"]*)"\)/       # @Mapping("path")
/path\s*=\s*"([^"]*)"/           # path = "path"
/value\s*=\s*\{\s*"([^"]*)"/     # value = {"path"}
```

### Method Name Extraction
```regex
/public\s+\w+\s+(\w+)\s*\(/      # public ReturnType methodName(
```

### RequestMapping Method Extraction
```regex
/method\s*=\s*RequestMethod\.(\w+)/  # method = RequestMethod.GET
```

## Business Rules

### Path Construction
1. Empty base path + empty endpoint path = "/"
2. Empty base path + endpoint path = ensure leading slash
3. Base path + empty endpoint path = use base path with leading slash
4. Base path + endpoint path = combine with proper slash handling

### Method Resolution Priority
1. Specific mapping annotations (@GetMapping, @PostMapping, etc.)
2. @RequestMapping with explicit method parameter
3. @RequestMapping without method defaults to GET

### Class Context Tracking
- Class name persists until new class declaration found
- Base mapping persists until new @RequestMapping found
- Both reset on new class declaration

## Edge Cases Handled

### Multi-line Annotations
Annotations may span multiple lines; search considers line continuation.

### Multiple Values in Arrays
When `value = {"path1", "path2"}`, only first path is extracted.

### Method Without Explicit Path
Empty path values are handled gracefully in path combination logic.

### Nested Classes
Each class declaration resets the context, handling nested controller classes.

## Output Format
Each discovered endpoint generates:
```
{
  method: HttpMethod,
  path: string (combined base + endpoint path),
  filePath: string (absolute file path),
  lineNumber: number (annotation line),
  className: string (extracted class name),
  methodName: string (extracted method name)
}
```

## Examples

### Basic Controller
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping
    public List<User> getUsers() { ... }
    
    @PostMapping
    public User createUser(@RequestBody User user) { ... }
}
```

**Extracted Endpoints**:
- GET /api/users (UserController.getUsers)
- POST /api/users (UserController.createUser)

### Method-Specific Paths
```java
@RestController
@RequestMapping("/api")
public class UserController {
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) { ... }
    
    @DeleteMapping(value = "/users/{id}")
    public void deleteUser(@PathVariable Long id) { ... }
}
```

**Extracted Endpoints**:
- GET /api/users/{id} (UserController.getUser)
- DELETE /api/users/{id} (UserController.deleteUser)

### Generic RequestMapping
```java
@RestController
public class ApiController {
    @RequestMapping(value = "/data", method = RequestMethod.PUT)
    public Data updateData(@RequestBody Data data) { ... }
}
```

**Extracted Endpoints**:
- PUT /data (ApiController.updateData)