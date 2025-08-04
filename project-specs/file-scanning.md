# File Scanning and Filtering

## What it does
Recursively discovers Java and Scala source files within a target directory while applying comprehensive exclusion patterns to avoid test files, build artifacts, and irrelevant directories. Provides the foundation for endpoint extraction by identifying relevant source files.

## File Discovery Patterns

### Inclusion Patterns
**Target File Types**:
- `**/*.java` - Java source files (recursive)
- `**/*.scala` - Scala source files (recursive)  
- `**/routes` - Play Framework routes files (no extension)

**Pattern Explanation**:
- `**` enables recursive directory traversal
- `*` matches any filename
- Specific extensions target relevant source files
- Routes files identified by name without extension

### Exclusion Patterns
**Build and Dependencies**:
- `**/node_modules/**` - Node.js dependencies
- `**/target/**` - Maven/SBT build output
- `**/build/**` - Gradle build output
- `**/.git/**` - Git repository metadata

**Test Files and Directories**:
- `**/*Test.scala` - Scala test files with Test suffix
- `**/*Test.java` - Java test files with Test suffix
- `**/*Spec.scala` - Scala specification files
- `**/*IT.scala` - Integration test files
- `**/*IntegrationTest.scala` - Full integration test name
- `**/src/test/**` - Standard test directory structure

## Directory Traversal Algorithm

### Scanning Process
1. **Initialize glob patterns** with inclusion and exclusion rules
2. **Execute pattern matching** against target directory structure
3. **Return absolute file paths** for all matching files
4. **Maintain discovery order** (typically alphabetical by filesystem)

### Path Resolution
**Input**: Target directory path (relative or absolute)
**Processing**: 
- Convert relative paths to absolute paths
- Normalize path separators for cross-platform compatibility
- Validate directory existence before scanning

**Output**: Array of absolute file paths

## File Access and Reading

### File Reading Strategy
**Sequential Processing**: Process files one at a time to manage memory usage
**Error Isolation**: Individual file read failures don't stop overall scanning
**Encoding**: Read files as UTF-8 text for international character support

### Error Handling
**File Access Errors**:
- Permission denied: Log error, continue with other files
- File not found: Log error (rare, as files come from glob results)
- Read errors: Log error with file path, continue processing

**Error Collection**: 
- Collect all file processing errors
- Include file path and error description
- Report in final scan results

## Performance Optimization

### Glob Pattern Efficiency
- Use native filesystem globbing when available
- Single glob operation with multiple patterns
- Avoid multiple directory traversals

### Memory Management
- Stream file reading rather than loading entire directory into memory
- Process files sequentially to limit memory footprint
- Release file handles promptly after reading

## Test File Detection

### Primary Exclusion (Glob Level)
**Patterns Applied During Discovery**:
- Files matching test name patterns
- Files in test directories
- Standard test file conventions

### Secondary Exclusion (Processing Level)
**Additional Checks in Scala Extractor**:
- `Test.scala` suffix check
- `Spec.scala` suffix check  
- `IT.scala` suffix check
- `IntegrationTest.scala` suffix check
- `TestDsl.scala` suffix check
- Path contains `/test/` or `/tests/`

### Rationale for Dual Exclusion
- **Glob exclusion**: Performance optimization to avoid reading test files
- **Processing exclusion**: Safety net for files that bypass glob patterns
- **Comprehensive coverage**: Handles various test naming conventions

## Directory Structure Understanding

### Standard Java/Scala Project Layouts
**Maven/SBT Structure**:
```
project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── scala/
│   └── test/          # Excluded
│       ├── java/
│       └── scala/
├── target/            # Excluded
└── build.sbt
```

**Gradle Structure**:
```
project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── scala/
│   └── test/          # Excluded
├── build/             # Excluded
└── build.gradle
```

### Play Framework Structure
```
play-app/
├── app/
│   ├── controllers/
│   └── models/
├── conf/
│   └── routes         # Included (routes file)
├── test/              # Excluded
└── target/            # Excluded
```

## Cross-Platform Considerations

### Path Handling
- Use platform-agnostic path separators in patterns
- Handle Windows drive letters correctly
- Support UNC paths on Windows systems

### File System Differences
- Case sensitivity handling (Linux vs Windows/macOS)
- Hidden file detection (files starting with ".")
- Permission model differences

## Integration with Extractors

### File Type Routing
**Decision Logic**:
1. If file path ends with `.java` → Java extractor
2. If file path ends with `.scala` OR ends with `/routes` → Scala extractor
3. Otherwise → Skip file (no applicable extractor)

### Content Delivery
**Format**: Provide both file path and file content to extractors
**Error Handling**: Skip files that can't be read, log error

## Statistical Tracking

### Metrics Collected
- **Total Files**: Count of files discovered by glob patterns
- **Scanned Files**: Count of files successfully read and processed
- **Error Count**: Count of files that failed to process
- **File Type Breakdown**: Count by .java vs .scala vs routes

### Reporting
- Statistics included in ScanResult object
- Used for progress indication and completion summary
- Error details preserved for troubleshooting

## Configuration Flexibility

### Extensible Patterns
**Design**: Pattern arrays allow easy modification
**Future Enhancements**:
- Configuration file support
- Runtime pattern modification
- Additional language support

### Exclusion Customization
**Test Patterns**: Comprehensive but extensible test file detection
**Build Patterns**: Common build system recognition
**Future Options**: User-defined exclusion patterns

## Edge Cases Handled

### Symbolic Links
- Follow symbolic links to directories
- Handle circular link detection if supported by glob library
- Process symbolic links to files normally

### Very Large Directories
- Glob patterns handle large directory trees efficiently
- Sequential file processing prevents memory issues
- Error reporting doesn't scale with directory size

### Permission Restricted Files
- Skip files without read permission
- Log permission errors for user awareness
- Continue processing accessible files

### Empty Directories
- Empty results handled gracefully
- No special processing required
- Clear messaging when no files found