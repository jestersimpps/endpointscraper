# Workflow Patterns

## What it does
Documents the application workflow patterns, state management, process orchestration, and control flow for different execution modes. Provides guidance for implementing consistent behavior across different programming languages.

## Execution Modes

### Interactive Mode Workflow
**Entry Point**: Default command or explicit `interactive` command

**Process Flow**:
1. **Welcome Display**: Show application banner and version
2. **Progressive Configuration**:
   - Directory path input with validation
   - API specification analysis toggle
   - Summary output preference  
   - Output mode selection
   - CSV export preference
3. **Configuration Review**: Display selected options summary
4. **Execution**: Run scan with configured options
5. **Result Presentation**: Show results according to output mode

**State Management**:
```
InteractiveState {
    welcome_shown: boolean
    directory: string | null
    api_spec_enabled: boolean | null
    summary_enabled: boolean | null
    output_mode: OutputMode | null
    csv_enabled: boolean | null
    configuration_complete: boolean
}
```

### Quick Mode Workflow  
**Entry Point**: `quick` or `q` command

**Process Flow**:
1. **Welcome Display**: Show quick mode banner
2. **Directory Input**: Single prompt for directory path
3. **Auto-Configuration**: Apply optimal defaults:
   - API specification analysis: enabled
   - Summary: enabled
   - Output mode: standard
   - CSV export: enabled
4. **Configuration Display**: Show auto-selected options
5. **Execution**: Run scan immediately
6. **Result Presentation**: Full output with coverage analysis

**State Management**:
```
QuickModeState {
    welcome_shown: boolean
    directory: string | null
    ready_to_execute: boolean
}
```

### Legacy Command Mode Workflow
**Entry Point**: `scan <directory> [options]` command

**Process Flow**:
1. **Argument Parsing**: Extract directory and options from command line
2. **Validation**: Verify directory exists and options are valid
3. **Direct Execution**: Run scan without prompts
4. **Result Presentation**: Output according to specified options

**State Management**:
```
CommandModeState {
    directory: string
    options: CommandOptions
    validated: boolean
}
```

## Core Processing Workflow

### Main Scan Operation
**Universal flow across all modes**:

1. **Input Validation**:
   - Verify directory exists and is readable
   - Resolve relative paths to absolute paths
   - Validate option combinations

2. **File Discovery**:
   - Apply inclusion patterns for source files
   - Apply exclusion patterns for unwanted files
   - Generate absolute file path list

3. **Content Processing**:
   - Read each file safely with error handling
   - Apply appropriate extractor based on file type
   - Collect endpoints and errors separately

4. **API Specification Processing** (if enabled):
   - Discover specification files in project
   - Parse and validate specification content
   - Extract specification endpoints

5. **Coverage Analysis** (if specifications found):
   - Match implementation endpoints to specification endpoints
   - Calculate coverage statistics
   - Enhance endpoints with coverage information

6. **Result Aggregation**:
   - Combine all discovered endpoints
   - Aggregate processing statistics
   - Prepare error summary

7. **Output Generation**:
   - Format results according to output mode
   - Generate coverage summaries if applicable
   - Export CSV if requested

## State Transitions

### Interactive Mode State Machine
```
[Initial] 
    ↓ display_welcome()
[Welcome Shown] 
    ↓ get_directory()
[Directory Collected]
    ↓ get_api_spec_preference()
[API Spec Configured]
    ↓ get_summary_preference()
[Summary Configured]
    ↓ get_output_mode()
[Output Mode Selected]
    ↓ get_csv_preference()
[CSV Configured]
    ↓ show_configuration()
[Configuration Complete]
    ↓ execute_scan()
[Execution Complete]
    ↓ show_results()
[Results Displayed]
    → [Terminal State]
```

### Error State Handling
```
[Any State]
    ↓ validation_error()
[Error State]
    ↓ show_error_message()
    ↓ retry_or_exit()
[Retry] → [Previous State]
[Exit] → [Terminal State]
```

## Data Flow Patterns

### File Processing Pipeline
```
Directory Path
    ↓ glob_patterns()
File Path List
    ↓ read_file_content()
File Content List
    ↓ extract_endpoints()
Raw Endpoint List
    ↓ aggregate_results()
Scan Result
```

### Coverage Enhancement Pipeline
```
Scan Result + API Specs
    ↓ match_endpoints()
Coverage Analysis
    ↓ enhance_endpoints()
Enhanced Scan Result
```

### Output Generation Pipeline
```
Enhanced Scan Result + Options
    ↓ format_output()
Formatted Results
    ↓ display_results()
Console Output
    ↓ export_csv() (if enabled)
CSV File
```

## Error Handling Patterns

### Graceful Degradation Strategy
**Principle**: Continue processing despite individual failures

**Implementation Pattern**:
```
function process_with_error_handling(items):
    results = []
    errors = []
    
    for item in items:
        try:
            result = process_item(item)
            results.append(result)
        except Exception as error:
            errors.append(format_error(item, error))
            continue  # Keep processing other items
    
    return {
        results: results,
        errors: errors,
        success: results.length > 0
    }
```

### Critical vs Non-Critical Errors
**Critical Errors** (Stop execution):
- Directory not found
- Permission denied for target directory
- Invalid command-line arguments
- System-level failures

**Non-Critical Errors** (Log and continue):
- Individual file read failures
- Parse errors in specific files
- Invalid specification files
- Missing optional metadata

### Error Recovery Workflows
```
[Error Detected]
    ↓ classify_error()
[Critical Error] → [Display Error] → [Exit(1)]
[Non-Critical Error] → [Log Error] → [Continue Processing]
```

## Concurrency Patterns

### File Processing Parallelization
**Pattern**: Process multiple files concurrently while maintaining order

**Implementation Strategy**:
```
function process_files_concurrently(file_paths, max_concurrent=5):
    semaphore = create_semaphore(max_concurrent)
    tasks = []
    
    for file_path in file_paths:
        task = create_task(() => {
            acquire(semaphore)
            try:
                return process_file(file_path)
            finally:
                release(semaphore)
        })
        tasks.append(task)
    
    return await_all(tasks)
```

### Result Aggregation Pattern
**Pattern**: Safely combine results from concurrent operations

**Implementation**:
```
function aggregate_concurrent_results(task_results):
    all_endpoints = []
    all_errors = []
    total_files = 0
    successful_files = 0
    
    for result in task_results:
        total_files += 1
        
        if result.success:
            successful_files += 1
            all_endpoints.extend(result.endpoints)
        else:
            all_errors.extend(result.errors)
    
    return create_scan_result(
        total_files=total_files,
        scanned_files=successful_files,
        endpoints=all_endpoints,
        errors=all_errors
    )
```

## Memory Management Patterns

### Streaming File Processing
**Pattern**: Process large files without loading entire content into memory

**Implementation**:
```
function process_large_file_streaming(file_path):
    endpoints = []
    line_number = 0
    
    with open_file_stream(file_path) as stream:
        for line in stream:
            line_number += 1
            
            if matches_endpoint_pattern(line):
                endpoint = extract_endpoint(line, file_path, line_number)
                endpoints.append(endpoint)
    
    return endpoints
```

### Resource Cleanup Pattern
**Pattern**: Ensure proper cleanup of system resources

**Implementation**:
```
function scan_with_cleanup(directory_path, options):
    resources = []
    
    try:
        # Acquire resources
        file_scanner = create_file_scanner()
        resources.append(file_scanner)
        
        output_formatter = create_output_formatter()
        resources.append(output_formatter)
        
        # Perform scan
        return execute_scan(file_scanner, output_formatter, directory_path, options)
    
    finally:
        # Cleanup resources
        for resource in reversed(resources):
            safely_cleanup(resource)
```

## Configuration Management

### Option Resolution Pattern
**Pattern**: Resolve final configuration from multiple sources

**Priority Order**:
1. Command-line arguments (highest priority)
2. Interactive prompt selections
3. Quick mode defaults
4. Application defaults (lowest priority)

**Implementation**:
```
function resolve_final_options(cli_args, interactive_choices, mode_defaults, app_defaults):
    final_options = copy(app_defaults)
    
    apply_overrides(final_options, mode_defaults)
    apply_overrides(final_options, interactive_choices)
    apply_overrides(final_options, cli_args)
    
    return final_options

function apply_overrides(base_options, override_options):
    for key, value in override_options:
        if value is not None:
            base_options[key] = value
```

### Validation Chain Pattern
**Pattern**: Apply multiple validation rules in sequence

**Implementation**:
```
function validate_configuration(options):
    validation_rules = [
        validate_directory_exists,
        validate_option_combinations,
        validate_output_permissions,
        validate_csv_path_writeable
    ]
    
    for rule in validation_rules:
        validation_result = rule(options)
        
        if not validation_result.valid:
            return create_validation_error(validation_result.message)
    
    return create_validation_success()
```

## Output Formatting Patterns

### Template-Based Output
**Pattern**: Use templates for consistent output formatting

**Implementation Structure**:
```
templates = {
    "welcome_banner": create_welcome_template(),
    "configuration_summary": create_config_template(),
    "endpoint_listing": create_endpoint_template(),
    "coverage_summary": create_coverage_template(),
    "error_report": create_error_template()
}

function format_output(template_name, data):
    template = templates[template_name]
    return template.render(data)
```

### Progressive Disclosure Pattern
**Pattern**: Show information progressively based on user preferences

**Implementation**:
```
function display_results(scan_result, options):
    if not options.quiet:
        display_detailed_endpoints(scan_result.endpoints)
    
    if options.summary:
        display_summary_statistics(scan_result)
    
    if scan_result.has_coverage_data():
        display_coverage_analysis(scan_result.coverage)
    
    if scan_result.errors.length > 0:
        display_error_summary(scan_result.errors)
```

## Extension Points

### Plugin Architecture Pattern
**Pattern**: Allow extending functionality through plugins

**Implementation Framework**:
```
interface ExtractorPlugin {
    can_handle(file_path: string, content: string): boolean
    extract_endpoints(file_path: string, content: string): Endpoint[]
    get_supported_extensions(): string[]
}

function register_extractor_plugin(plugin: ExtractorPlugin):
    extractor_registry.add(plugin)

function find_appropriate_extractor(file_path: string, content: string):
    for plugin in extractor_registry:
        if plugin.can_handle(file_path, content):
            return plugin
    
    return default_extractor
```

### Event-Driven Processing
**Pattern**: Emit events for different processing stages

**Implementation**:
```
event_emitter = create_event_emitter()

# Emit events during processing
event_emitter.emit("scan_started", { directory: target_path })
event_emitter.emit("file_processed", { file_path, endpoint_count })
event_emitter.emit("scan_completed", { total_endpoints, duration })

# Allow external listeners
event_emitter.on("file_processed", (data) => {
    update_progress_bar(data.file_path)
})
```

This workflow documentation provides the foundation for implementing consistent behavior and state management across different programming languages while maintaining the core application logic and user experience patterns.