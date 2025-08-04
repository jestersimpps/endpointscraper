# Error Handling and Validation

## What it does
Defines comprehensive error handling strategies, validation patterns, and recovery mechanisms for robust operation across different environments and edge cases. Ensures graceful degradation and helpful user feedback.

## Error Classification

### Critical Errors
**Definition**: Errors that prevent application from continuing
**Response**: Display error message and exit with non-zero code

**Categories**:
- **Invalid Directory**: Target directory doesn't exist or isn't accessible
- **Permission Denied**: No read access to target directory
- **Invalid Arguments**: Malformed command-line arguments
- **System Resource Issues**: Out of memory, disk space, etc.
- **Configuration Errors**: Invalid configuration that prevents startup

**Exit Codes**:
- `1`: General application error
- `2`: Invalid command-line arguments
- `3`: Directory access issues
- `4`: System resource problems

### Non-Critical Errors
**Definition**: Errors that allow application to continue with degraded functionality
**Response**: Log error and continue processing remaining items

**Categories**:
- **File Read Errors**: Individual files that can't be read
- **Parse Errors**: Malformed source code that can't be parsed
- **Spec File Issues**: Invalid or malformed API specification files
- **Metadata Extraction**: Missing optional information

**Handling Strategy**: Collect errors for summary reporting while continuing execution

### Warning Conditions
**Definition**: Unusual conditions that don't prevent operation but may indicate issues
**Response**: Display warning message and continue normally

**Categories**:
- **No Endpoints Found**: No REST endpoints discovered in scan
- **No Specifications Found**: API spec analysis enabled but no specs found
- **Large File Count**: Very large directory structures
- **Partial Coverage**: Low API specification coverage percentages

## Validation Patterns

### Input Validation Pipeline
**Pattern**: Sequential validation with early termination on critical failures

**Directory Validation**:
```
function validate_directory(directory_path):
    # Step 1: Basic format validation
    if not directory_path or directory_path.is_empty():
        return validation_error("Directory path cannot be empty")
    
    # Step 2: Path resolution
    try:
        resolved_path = resolve_absolute_path(directory_path)
    except path_resolution_error:
        return validation_error("Invalid directory path format")
    
    # Step 3: Existence check
    if not directory_exists(resolved_path):
        return validation_error("Directory does not exist: " + resolved_path)
    
    # Step 4: Permission check
    if not is_readable(resolved_path):
        return validation_error("Permission denied: " + resolved_path)
    
    # Step 5: Content validation
    if is_empty_directory(resolved_path):
        return validation_warning("Directory appears to be empty")
    
    return validation_success(resolved_path)
```

### Option Validation Matrix
**Pattern**: Validate option combinations for consistency

**Validation Rules**:
```
function validate_option_combinations(options):
    validation_results = []
    
    # Rule 1: CSV export requires write permissions
    if options.csv_enabled:
        if not can_write_to_output_directory():
            validation_results.append(
                validation_error("Cannot write to output directory for CSV export")
            )
    
    # Rule 2: API spec analysis with no specs should warn
    if options.api_spec_enabled:
        if not has_potential_spec_files(options.directory):
            validation_results.append(
                validation_warning("No potential API specification files found")
            )
    
    # Rule 3: Quiet mode with summary is valid combination
    if options.quiet and options.summary:
        validation_results.append(
            validation_info("Quiet mode enabled - only summary will be shown")
        )
    
    return aggregate_validation_results(validation_results)
```

### File Content Validation
**Pattern**: Validate file content before processing

**Source File Validation**:
```
function validate_source_file(file_path, content):
    validations = []
    
    # Basic content checks
    if content.is_empty():
        validations.append(warning("File is empty: " + file_path))
        return validations
    
    # Size validation
    if content.length > MAX_FILE_SIZE:
        validations.append(
            error("File too large to process: " + file_path)
        )
        return validations
    
    # Encoding validation
    if not is_valid_utf8(content):
        validations.append(
            error("Invalid file encoding (expected UTF-8): " + file_path)
        )
        return validations
    
    # Framework detection
    detected_frameworks = detect_frameworks(file_path, content)
    if detected_frameworks.is_empty():
        validations.append(
            info("No web framework patterns detected: " + file_path)
        )
    
    return validations
```

## Error Recovery Strategies

### File Processing Recovery
**Pattern**: Continue processing despite individual file failures

**Implementation**:
```
function process_files_with_recovery(file_paths):
    results = create_empty_results()
    
    for file_path in file_paths:
        try:
            file_result = process_single_file(file_path)
            results.add_success(file_result)
            
        except file_not_found_error as e:
            error_msg = "File not found: " + e.file_path
            results.add_error(error_msg)
            continue
            
        except permission_error as e:
            error_msg = "Permission denied: " + e.file_path
            results.add_error(error_msg)
            continue
            
        except parse_error as e:
            error_msg = "Parse error in " + e.file_path + ": " + e.message
            results.add_error(error_msg)
            continue
            
        except out_of_memory_error:
            # Critical error - cannot continue
            throw critical_error("Insufficient memory to process files")
            
        except unexpected_error as e:
            error_msg = "Unexpected error in " + file_path + ": " + e.message
            results.add_error(error_msg)
            continue
    
    return results
```

### Specification Processing Recovery
**Pattern**: Graceful handling of specification file issues

**Implementation**:
```
function process_api_specs_with_recovery(spec_file_paths):
    valid_specs = []
    spec_errors = []
    
    for spec_path in spec_file_paths:
        try:
            spec_content = read_file(spec_path)
            parsed_spec = parse_api_spec(spec_content, spec_path)
            
            if validate_spec_schema(parsed_spec):
                valid_specs.append(parsed_spec)
            else:
                spec_errors.append("Invalid schema in: " + spec_path)
                
        except json_parse_error:
            spec_errors.append("Invalid JSON format: " + spec_path)
            
        except yaml_parse_error:
            spec_errors.append("Invalid YAML format: " + spec_path)
            
        except file_read_error:
            spec_errors.append("Cannot read specification file: " + spec_path)
    
    # Return partial results if any specs were valid
    return {
        specifications: valid_specs,
        errors: spec_errors,
        success: valid_specs.length > 0
    }
```

## User-Friendly Error Messages

### Error Message Patterns
**Pattern**: Provide actionable error messages with context

**Template Structure**:
```
[Error Level] [Component]: [Problem Description]
  Cause: [Root cause explanation]
  Solution: [Suggested resolution steps]
  File: [Relevant file path if applicable]
```

**Examples**:
```
❌ Directory Scan: Target directory not found
  Cause: The specified path "/invalid/path" does not exist
  Solution: Verify the directory path and try again
  
⚠️  File Processing: Unable to parse Java file
  Cause: Syntax error on line 45
  Solution: Check file syntax or exclude from scan
  File: /project/src/BrokenController.java

ℹ️  API Analysis: No specification files found
  Cause: No OpenAPI or Swagger files detected in project
  Solution: Add --no-api-spec flag to skip coverage analysis
```

### Contextual Help Messages
**Pattern**: Provide relevant help based on error context

**Directory Error Help**:
```
function show_directory_error_help(error_type):
    base_message = get_error_message(error_type)
    
    help_text = base_message + "\n\n" + 
        "Common solutions:\n" +
        "  • Check that the directory path is correct\n" +
        "  • Ensure you have read permissions for the directory\n" +
        "  • Try using absolute path instead of relative path\n" +
        "  • Verify the directory contains Java or Scala files"
    
    return help_text
```

### Progress Error Reporting
**Pattern**: Show errors in context of overall progress

**Implementation**:
```
function report_progress_with_errors(total_files, processed_files, error_count):
    success_rate = ((processed_files - error_count) / total_files) * 100
    
    if error_count == 0:
        return "✅ Processed " + processed_files + "/" + total_files + " files successfully"
    
    elif success_rate >= 80:
        return "⚠️  Processed " + processed_files + "/" + total_files + 
               " files (" + error_count + " errors - see details below)"
    
    else:
        return "❌ Processing completed with significant errors: " + 
               error_count + "/" + total_files + " files failed"
```

## Logging and Debugging

### Structured Logging Pattern
**Pattern**: Consistent log format for debugging and monitoring

**Log Entry Structure**:
```
{
    timestamp: ISO_8601_string,
    level: "error" | "warning" | "info" | "debug",
    component: string,
    message: string,
    context: {
        file_path?: string,
        line_number?: number,
        operation?: string,
        duration_ms?: number
    },
    stack_trace?: string
}
```

**Implementation**:
```
function log_error(component, message, context, error):
    log_entry = {
        timestamp: get_current_timestamp(),
        level: "error",
        component: component,
        message: message,
        context: context
    }
    
    if error and error.stack_trace:
        log_entry.stack_trace = error.stack_trace
    
    write_log_entry(log_entry)
```

### Debug Mode Support
**Pattern**: Enhanced logging for troubleshooting

**Debug Information**:
```
function enable_debug_logging():
    log_levels.set_minimum_level("debug")
    
    # Log additional information
    log_debug("file_scanner", "File patterns: " + json_stringify(file_patterns))
    log_debug("extractors", "Registered extractors: " + get_extractor_names())
    log_debug("validation", "Validation rules: " + get_validation_rule_names())
```

## Resource Management

### Memory Management Patterns
**Pattern**: Handle memory constraints gracefully

**Large File Handling**:
```
function process_large_file_safely(file_path):
    file_size = get_file_size(file_path)
    
    if file_size > LARGE_FILE_THRESHOLD:
        log_warning("file_processor", "Processing large file: " + file_path)
        
        # Process in chunks to avoid memory issues
        return process_file_streaming(file_path)
    
    else:
        return process_file_standard(file_path)

function process_file_streaming(file_path):
    endpoints = []
    
    try:
        with file_stream(file_path) as stream:
            line_number = 0
            
            for line in stream:
                line_number += 1
                
                if matches_endpoint_pattern(line):
                    endpoint = extract_endpoint_from_line(line, file_path, line_number)
                    endpoints.append(endpoint)
                
                # Check memory usage periodically
                if line_number % 1000 == 0:
                    if is_memory_usage_high():
                        gc_collect()  # Force garbage collection
    
    except out_of_memory_error:
        throw critical_error("Insufficient memory to process file: " + file_path)
    
    return endpoints
```

### File Handle Management
**Pattern**: Ensure proper cleanup of file resources

**Implementation**:
```
function scan_with_resource_management(directory):
    open_files = []
    temp_files = []
    
    try:
        # Processing logic here
        result = perform_scan_operations(directory)
        return result
    
    finally:
        # Cleanup all resources
        for file_handle in open_files:
            safely_close_file(file_handle)
        
        for temp_file in temp_files:
            safely_delete_temp_file(temp_file)
```

## Testing Error Conditions

### Error Injection for Testing
**Pattern**: Simulate error conditions for testing

**Test Error Scenarios**:
```
function create_test_error_conditions():
    return {
        "directory_not_found": simulate_missing_directory,
        "permission_denied": simulate_permission_error,
        "file_read_failure": simulate_file_read_error,
        "parse_error": simulate_syntax_error,
        "out_of_memory": simulate_memory_error,
        "invalid_spec": simulate_malformed_spec,
        "network_timeout": simulate_timeout_error
    }
```

### Error Recovery Validation
**Pattern**: Verify error recovery mechanisms work correctly

**Recovery Tests**:
```
function test_error_recovery():
    # Test file processing continues after individual failures
    result = process_files(["valid_file.java", "invalid_file.java", "another_valid.java"])
    
    assert result.successful_files == 2
    assert result.failed_files == 1
    assert result.errors.length == 1
    assert result.endpoints.length > 0  # Should have endpoints from valid files
```

## Extension Points

### Custom Error Handlers
**Pattern**: Allow custom error handling logic

**Interface**:
```
interface ErrorHandler {
    can_handle(error_type: string): boolean
    handle_error(error: Error, context: Context): ErrorHandlingResult
    get_recovery_suggestions(error: Error): string[]
}

function register_error_handler(handler: ErrorHandler):
    error_handler_registry.add(handler)
```

### Error Reporting Integration
**Pattern**: Integration with external error reporting systems

**Implementation**:
```
function report_error_to_external_system(error, context):
    if should_report_externally(error):
        error_report = create_error_report(error, context)
        external_reporter.send_error_report(error_report)
```

This comprehensive error handling documentation ensures robust operation and provides clear guidance for implementation across different programming languages while maintaining excellent user experience even in error conditions.