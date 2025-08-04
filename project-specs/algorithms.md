# Core Algorithms

## What it does
Documents the key algorithms used throughout EndpointScraper for pattern matching, path processing, endpoint extraction, and coverage analysis. These algorithms are designed to be language-agnostic and implementable in any programming language.

## File Discovery Algorithm

### Pattern-Based File Selection
**Purpose**: Efficiently discover relevant source files while excluding irrelevant content

**Input**: Target directory path
**Output**: Array of file paths to process

**Algorithm**:
1. **Pattern Matching**: Apply inclusion patterns simultaneously
   - `**/*.java` - Java source files
   - `**/*.scala` - Scala source files  
   - `**/routes` - Play Framework route files

2. **Exclusion Filtering**: Remove unwanted files/directories
   - `**/node_modules/**` - Package dependencies
   - `**/target/**` - Maven build output
   - `**/build/**` - Gradle build output
   - `**/.git/**` - Version control
   - `**/*Test.{java,scala}` - Test files
   - `**/*Spec.scala` - Specification files
   - `**/*IT.scala` - Integration tests
   - `**/src/test/**` - Test directories

3. **Deduplication**: Remove duplicate paths from multiple patterns
4. **Absolute Path Conversion**: Ensure all paths are absolute

**Performance**: O(n) where n is total files in directory tree
**Implementation Note**: Use fast file globbing libraries for optimal performance

## Endpoint Extraction Algorithm

### Multi-Framework Detection
**Purpose**: Extract endpoints from various Java/Scala web frameworks

**Input**: File path and content string
**Output**: Array of discovered endpoints

**Algorithm**:
1. **File Type Resolution**: 
   - `.java` files → Java extractor
   - `.scala` files → Scala extractor
   - `routes` files → Scala extractor (Play Framework)

2. **Line-by-Line Processing**:
   - Split content into lines
   - Track line numbers for source traceability
   - Maintain state (current class, base path) across lines

3. **Pattern Recognition**:
   - Apply framework-specific regex patterns
   - Extract HTTP methods, paths, and metadata
   - Combine base paths with endpoint paths

### Java Spring Boot Pattern Matching
**Algorithm**:
```
for each line in file:
    if matches_class_pattern(line):
        current_class = extract_class_name(line)
    
    elif matches_request_mapping(line):
        base_path = extract_path(line)
    
    elif matches_endpoint_annotation(line):
        method = extract_http_method(line)
        path = extract_path(line)
        method_name = find_method_name(subsequent_lines)
        
        endpoint = create_endpoint(
            method=method,
            path=combine_paths(base_path, path),
            file_path=file_path,
            line_number=current_line_number,
            class_name=current_class,
            method_name=method_name
        )
        
        add_to_results(endpoint)
```

**Key Patterns**:
- Class Detection: `@RestController|@Controller` or `public class ClassName`
- Base Mapping: `@RequestMapping("path")` or `@RequestMapping(value="path")`
- Endpoints: `@GetMapping|@PostMapping|@PutMapping|@PatchMapping|@DeleteMapping`
- Generic Mapping: `@RequestMapping(method=RequestMethod.METHOD)`

### Scala Multi-Framework Pattern Matching
**Algorithm**:
```
for each line in file:
    if is_test_file(file_path):
        skip_file()
        
    elif matches_class_pattern(line):
        current_class = extract_class_name(line)
    
    elif matches_play_route(line):
        endpoint = extract_play_route(line)
        add_to_results(endpoint)
    
    elif matches_spring_annotation(line):
        endpoint = extract_spring_endpoint(line)
        add_to_results(endpoint)
    
    elif matches_akka_http_route(line):
        endpoint = extract_akka_route(line)
        add_to_results(endpoint)
    
    elif matches_http4s_route(line):
        endpoint = extract_http4s_route(line)
        add_to_results(endpoint)
```

**Framework-Specific Patterns**:

**Play Framework**: `GET /api/path controllers.Controller.method()`
- Regex: `^\s*(GET|POST|PUT|PATCH|DELETE)\s+/\S+\s+\S+\.\S+`

**Akka HTTP**: `path("users") { get { ... } }`
- Regex: `path(Prefix)?\s*\(\s*"[^"]*".*?(get|post|put|patch|delete)`

**http4s**: `case GET -> Root / "users" / IntVar(id)`
- Regex: `case\s+(?:\w+\s*@\s+)?(?:Method\.)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root`

## Path Processing Algorithm

### Path Combination Logic
**Purpose**: Combine base paths with endpoint paths correctly

**Algorithm**:
```
function combine_paths(base_path, endpoint_path):
    if not base_path and not endpoint_path:
        return "/"
    
    if not base_path:
        return ensure_leading_slash(endpoint_path)
    
    if not endpoint_path:
        return ensure_leading_slash(base_path)
    
    clean_base = normalize_path(base_path)
    clean_endpoint = normalize_path(endpoint_path)
    
    if clean_base.ends_with("/"):
        return clean_base.slice(0, -1) + clean_endpoint
    else:
        return clean_base + clean_endpoint

function normalize_path(path):
    if path.is_empty():
        return "/"
    
    if not path.starts_with("/"):
        path = "/" + path
    
    return path
```

**Examples**:
- `combine_paths("", "/users")` → `"/users"`
- `combine_paths("/api", "posts")` → `"/api/posts"`
- `combine_paths("/api/", "/posts")` → `"/api/posts"`
- `combine_paths("", "")` → `"/"`

### Path Normalization for Coverage
**Purpose**: Standardize paths for comparison between implementation and specification

**Algorithm**:
```
function normalize_path(path):
    # Replace multiple slashes with single slash
    normalized = path.replace_regex("/+", "/")
    
    # Remove trailing slash unless root path
    if normalized.length > 1 and normalized.ends_with("/"):
        normalized = normalized.slice(0, -1)
    
    # Convert empty to root
    if normalized.is_empty():
        normalized = "/"
    
    return normalized
```

**Examples**:
- `"//api///users/"` → `"/api/users"`
- `"/users//"` → `"/users"`
- `""` → `"/"`
- `"/"` → `"/"` (unchanged)

## Coverage Analysis Algorithm

### Path Matching with Parameters
**Purpose**: Match implementation paths against specification paths with parameter support

**Algorithm**:
```
function paths_match(implementation_path, specification_path):
    norm_impl = normalize_path(implementation_path)
    norm_spec = normalize_path(specification_path)
    
    # Try exact match first
    if norm_impl == norm_spec:
        return true
    
    # Try parameter-aware matching
    return paths_match_with_parameters(norm_impl, norm_spec)

function paths_match_with_parameters(impl_path, spec_path):
    impl_segments = impl_path.split("/")
    spec_segments = spec_path.split("/")
    
    # Must have same segment count
    if impl_segments.length != spec_segments.length:
        return false
    
    # Compare each segment
    for i in range(impl_segments.length):
        impl_segment = impl_segments[i]
        spec_segment = spec_segments[i]
        
        # Skip if either is a parameter
        if is_parameter_segment(impl_segment) or is_parameter_segment(spec_segment):
            continue
        
        # Literal segments must match exactly
        if impl_segment != spec_segment:
            return false
    
    return true

function is_parameter_segment(segment):
    return (
        segment.starts_with("{") and segment.ends_with("}") or  # {id}
        segment.starts_with(":") or                            # :id
        segment.contains("*") or                               # wildcards
        segment.matches_regex("\\{[^}]+\\}")                   # complex {param}
    )
```

**Matching Examples**:
- `"/users/123"` vs `"/users/{id}"` → **Match** (parameter)
- `"/api/posts"` vs `"/api/posts"` → **Match** (exact)
- `"/v1/users"` vs `"/v2/users"` → **No Match** (different literal)
- `"/users/profile"` vs `"/users/{id}/settings"` → **No Match** (different structure)

### Coverage Statistics Calculation
**Purpose**: Calculate coverage percentages and generate statistics

**Algorithm**:
```
function calculate_coverage_stats(endpoints_with_coverage):
    stats = {
        covered: 0,
        not_covered: 0,
        no_spec_found: 0
    }
    
    for endpoint in endpoints_with_coverage:
        switch endpoint.coverage_status:
            case "covered":
                stats.covered++
            case "not-covered":
                stats.not_covered++
            case "no-spec-found":
                stats.no_spec_found++
    
    # Calculate percentage for endpoints with specifications
    total_with_spec = stats.covered + stats.not_covered
    coverage_percentage = 0
    
    if total_with_spec > 0:
        coverage_percentage = (stats.covered / total_with_spec) * 100
    
    return {
        stats: stats,
        coverage_percentage: round(coverage_percentage),
        total_endpoints: endpoints_with_coverage.length,
        has_specifications: total_with_spec > 0
    }
```

## Text Processing Algorithms

### Regex Pattern Compilation
**Purpose**: Compile efficient regex patterns for endpoint detection

**Java Patterns**:
```
CLASS_PATTERN = /@RestController|@Controller|^(@\w+\s+)*public\s+class\s+\w+/
REQUEST_MAPPING = /@RequestMapping/
ENDPOINT_ANNOTATION = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)/
PATH_VALUE = /value\s*=\s*"([^"]*)"|@\w+Mapping\("([^"]*)"\)|path\s*=\s*"([^"]*)"/
METHOD_EXTRACTION = /method\s*=\s*RequestMethod\.(\w+)/
```

**Scala Patterns**:
```
PLAY_ROUTE = /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\/\S+\s+\S+\.\S+/
AKKA_HTTP = /path(Prefix)?\s*\(\s*"[^"]*".*?(get|post|put|patch|delete)/i
HTTP4S_ROUTE = /case\s+(?:\w+\s*@\s+)?(?:Method\.)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/
SPRING_ANNOTATION = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)/
```

### CSV Generation Algorithm
**Purpose**: Generate properly escaped CSV content

**Algorithm**:
```
function generate_csv(headers, data_rows):
    csv_lines = []
    
    # Add header row
    csv_lines.append(format_csv_row(headers))
    
    # Add data rows
    for row in data_rows:
        csv_lines.append(format_csv_row(row))
    
    return csv_lines.join("\n")

function format_csv_row(cells):
    escaped_cells = []
    
    for cell in cells:
        escaped_cells.append(escape_csv_cell(cell))
    
    return escaped_cells.join(",")

function escape_csv_cell(cell):
    cell_str = convert_to_string(cell)
    
    if needs_escaping(cell_str):
        # Escape quotes by doubling them
        escaped = cell_str.replace('"', '""')
        return '"' + escaped + '"'
    
    return cell_str

function needs_escaping(cell):
    return (
        cell.contains(",") or
        cell.contains('"') or
        cell.contains("\n") or
        cell.contains("\r")
    )
```

## Performance Optimization Algorithms

### Early Termination Strategies
```
function find_first_match(endpoint, specifications):
    for spec in specifications:
        for spec_endpoint in spec.endpoints:
            if methods_match(endpoint.method, spec_endpoint.method):
                if paths_match(endpoint.path, spec_endpoint.path):
                    return create_match_result(spec, spec_endpoint)
    
    return no_match_result()
```

### Batch Processing Optimization
```
function process_files_in_batches(file_paths, batch_size=10):
    results = []
    
    for batch_start in range(0, file_paths.length, batch_size):
        batch_end = min(batch_start + batch_size, file_paths.length)
        batch_files = file_paths.slice(batch_start, batch_end)
        
        batch_results = process_files_parallel(batch_files)
        results.extend(batch_results)
    
    return aggregate_results(results)
```

## Error Handling Algorithms

### Resilient File Processing  
```
function process_file_safely(file_path):
    try:
        content = read_file(file_path)
        endpoints = extract_endpoints(file_path, content)
        return success_result(endpoints)
    
    catch file_not_found_error:
        return error_result("File not found: " + file_path)
    
    catch permission_error:
        return error_result("Permission denied: " + file_path)
    
    catch parsing_error as e:
        return error_result("Parse error in " + file_path + ": " + e.message)
    
    catch unexpected_error as e:
        return error_result("Unexpected error in " + file_path + ": " + e.message)
```

**Recovery Strategy**: Continue processing remaining files even when individual files fail

## Extension Algorithms

### Framework Detection Algorithm
```
function detect_framework(file_path, file_content):
    if file_path.ends_with(".java"):
        if content.contains("@RestController") or content.contains("@Controller"):
            return "spring_boot"
    
    elif file_path.ends_with(".scala"):
        if content.contains("@RestController"):
            return "scala_spring"
        elif content.contains("play.api.routing") or file_path.ends_with("routes"):
            return "play_framework"
        elif content.contains("akka.http"):
            return "akka_http"
        elif content.contains("org.http4s"):
            return "http4s"
    
    return "unknown"
```

This framework detection enables adding new extractors dynamically based on detected patterns.