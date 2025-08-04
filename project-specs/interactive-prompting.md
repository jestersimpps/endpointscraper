# Interactive Prompting System

## What it does
Provides user-friendly interactive command-line interfaces for configuring endpoint scanning operations. Offers multiple interaction modes with input validation, visual feedback, and progressive disclosure of options.

## Interaction Modes

### Full Interactive Mode (Default)
Complete configuration workflow with all available options:
1. Directory path input with validation
2. API specification analysis toggle
3. Summary output toggle
4. Output mode selection (standard/quiet/minimal)
5. CSV export toggle

### Quick Mode
Streamlined workflow for fast scanning:
1. Directory path input only
2. Pre-configured optimal defaults:
   - API specification analysis: enabled
   - Summary: enabled
   - Output mode: standard
   - CSV export: enabled

### Legacy Command Mode
Traditional CLI arguments for automation and scripting:
- Direct command-line flags
- No interactive prompts
- Backward compatibility with existing scripts

## User Interface Design

### Welcome Display
```
╔══════════════════════════════════════════════════════════════╗
║              🔍 EndpointScraper v1.0.0                    ║
║   Extract REST endpoints from Java & Scala applications     ║
╚══════════════════════════════════════════════════════════════╝
```

### Configuration Summary Display
Visual summary of selected options before execution:
```
✨ Starting endpoint scan with the following configuration:
┌────────────────────────────────────────────────────────────┐
│ 📁 Directory: /path/to/project                            │
│ 📋 API Spec Analysis: Enabled                             │
│ 📊 Summary: Enabled                                        │
│ 📄 CSV Export: Enabled                                     │
│ 🔇 Quiet Mode: Disabled                                    │
└────────────────────────────────────────────────────────────┘
```

## Input Validation

### Directory Path Validation
**Validation Rules**:
1. **Existence Check**: Directory must exist on filesystem
2. **Readability**: Directory must be accessible
3. **Path Resolution**: Convert relative to absolute paths

**Error Handling**:
- Display red error message for invalid paths
- Re-prompt until valid path provided
- Show resolved absolute path for confirmation

**Implementation Pattern**:
```
validate: (input: string) => {
    const resolvedPath = resolve(input)
    if (!existsSync(resolvedPath)) {
        return `Directory does not exist: ${resolvedPath}`
    }
    return true
}
```

### Boolean Option Validation
**Default Values**: All boolean options have sensible defaults
**Input Handling**: Standard yes/no prompts with y/n shortcuts
**Auto-completion**: Support for partial input matching

### Choice Selection Validation
**List Options**: Pre-defined choices with descriptions
**Navigation**: Arrow key navigation support
**Selection**: Enter key confirms, escape cancels

## Prompt Configuration

### Directory Input Prompt
```
Type: input
Message: "Enter the directory path to scan for endpoints:"
Default: "." (current directory)
Validation: Path existence and accessibility
Filter: Convert to absolute path
```

### API Specification Analysis
```
Type: confirm
Message: "Enable API specification analysis? (Finds OpenAPI/Swagger files and analyzes coverage)"
Default: true
Description: Enhanced analysis with coverage metrics
```

### Summary Option
```
Type: confirm  
Message: "Show summary by HTTP method?"
Default: true
Description: Displays endpoint counts grouped by HTTP method
```

### Output Mode Selection
```
Type: list
Message: "Choose output mode:"
Choices:
  - Standard output (detailed endpoint list)
  - Quiet mode (suppress detailed output)  
  - Minimal output (errors only)
Default: standard
```

### CSV Export Option
```
Type: confirm
Message: "Export results to CSV file?"
Default: true
Description: Creates timestamped CSV file in output directory
```

## Visual Enhancement

### Color Coding
- **Blue**: Informational messages and headers
- **Green**: Success states and confirmations
- **Red**: Error messages and validation failures
- **Yellow**: Warnings and optional features
- **Gray**: Secondary information and borders
- **Cyan**: Highlighted information and borders

### Icons and Symbols
- **🔍**: Application branding and search operations
- **📁**: Directory and file references
- **📋**: API specification features
- **📊**: Summary and statistics
- **📄**: Export and output features
- **✨**: Process initiation
- **🔇**: Quiet mode indication

### Progress Indication
- **Welcome screen**: Clear application identification
- **Configuration review**: Summary before execution
- **Processing feedback**: Real-time operation status

## State Management

### InteractiveOptions Interface
```
directory: string     # Validated absolute path
summary: boolean      # Show HTTP method summary
quiet: boolean        # Suppress detailed output
csv: boolean          # Export to CSV file
apiSpec: boolean      # Enable API spec analysis
```

### Mode-Specific Defaults

**Interactive Mode**: User makes all choices
```
No pre-set options, all prompted
```

**Quick Mode**: Optimized defaults
```
summary: true
quiet: false  
csv: true
apiSpec: true
```

**Legacy Mode**: Command-line driven
```
Inherit from CLI arguments
Backward compatibility maintained
```

## Error Handling

### Input Validation Errors
- **Directory Not Found**: Red error message, re-prompt
- **Access Denied**: Clear error explanation, alternative suggestions
- **Invalid Format**: Format requirements explanation

### System Errors
- **Permission Issues**: Clear explanation and resolution steps
- **Disk Space**: Warning about CSV export requirements
- **Network Issues**: Not applicable for local file operations

### Recovery Strategies
- **Retry Logic**: Re-prompt on validation failures
- **Fallback Options**: Default values when user cancels
- **Graceful Exit**: Clean termination on user abort

## Advanced Features

### Path Truncation Display
For long paths in configuration summary:
- Show full path if ≤ 40 characters
- Truncate to `.../{last-two-segments}` if longer
- Preserve important context for user recognition

### Smart Defaults
- **Current Directory**: Default to `.` for quick local scans
- **API Analysis**: Enabled by default for better insights
- **CSV Export**: Enabled by default for data persistence

### User Experience Enhancements
- **Clear Instructions**: Explanatory text for each option
- **Contextual Help**: Descriptions of feature benefits
- **Visual Hierarchy**: Consistent spacing and alignment

## Integration Points

### With CLI Framework
- **Command Registration**: Register interactive commands
- **Option Mapping**: Convert interactive choices to CLI options
- **Help Generation**: Auto-generate help text from prompts

### With Main Application
- **Option Conversion**: Transform interactive choices to scan options
- **Validation Bridge**: Pass validation results to main logic
- **Error Propagation**: Surface application errors to user

### With Output Systems
- **Configuration Display**: Show selected options before execution
- **Progress Integration**: Seamless transition from setup to execution
- **Result Presentation**: Consistent visual theme throughout

## Accessibility Considerations

### Terminal Compatibility
- **Color Support Detection**: Fallback to plain text if needed
- **Unicode Support**: Fallback characters for limited terminals
- **Screen Reader**: Descriptive text for all visual elements

### Keyboard Navigation
- **Arrow Keys**: List navigation support
- **Tab Completion**: Directory path completion where possible
- **Escape Handling**: Cancel operations gracefully

### Error Communication
- **Clear Language**: Non-technical error descriptions
- **Actionable Messages**: Specific steps for error resolution
- **Context Preservation**: Maintain user input during error states

## Extension Points

### New Interaction Modes
1. **Expert Mode**: Advanced options for power users
2. **Batch Mode**: Multiple directory processing
3. **Watch Mode**: Continuous monitoring and analysis

### Enhanced Validation
1. **Project Type Detection**: Auto-configure based on detected frameworks
2. **Git Integration**: Suggest scanning only changed files
3. **Configuration Persistence**: Save and reuse common configurations

### Visual Improvements
1. **Progress Bars**: Real-time processing feedback
2. **Animated Feedback**: Spinning indicators during processing
3. **Rich Tables**: Formatted option displays with alignment