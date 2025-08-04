# EndpointScraper Project Specifications

## Application Overview
EndpointScraper is a CLI tool that extracts REST API endpoints from Java and Scala backend applications using static file analysis. It provides comprehensive endpoint discovery, API specification coverage analysis, and multiple interaction modes with export capabilities.

## Core Features

### System Architecture
- [Application Architecture](./application-architecture.md) - Core system design and component structure
- [Data Models](./data-models.md) - Complete type definitions and data relationships
- [Algorithms](./algorithms.md) - Core algorithms for pattern matching and analysis
- [Workflow Patterns](./workflow-patterns.md) - State management and process orchestration
- [Error Handling](./error-handling.md) - Comprehensive error handling and validation patterns

### Endpoint Discovery
- [File Scanning Engine](./file-scanning.md) - Directory traversal and file filtering
- [Java Endpoint Extraction](./java-extraction.md) - Spring Boot annotation parsing
- [Scala Endpoint Extraction](./scala-extraction.md) - Multi-framework route extraction

### API Specification Analysis
- [API Spec Discovery](./api-spec-discovery.md) - Revolutionary content-based OpenAPI/Swagger discovery system
- [Coverage Analysis](./coverage-analysis.md) - Implementation vs specification comparison

### User Interface
- [CLI Interface](./cli-interface.md) - Command-line interface and legacy mode
- [Interactive Prompting](./interactive-prompting.md) - User-friendly interactive configuration
- [Output Formatting](./output-formatting.md) - Result display and visualization
- [CSV Export](./csv-export.md) - Data export and file generation

## Framework Support
- **Java**: Spring Boot annotations (@GetMapping, @PostMapping, etc.)
- **Scala**: Spring annotations, Play Framework routes, Akka HTTP routes, http4s routes (enhanced pattern recognition)

## Recent Major Improvements

### Revolutionary Content-Based API Spec Discovery (August 2025)
- **Architectural Overhaul**: Replaced filename-based discovery with universal content-based validation
- **Universal Discovery**: Now finds API specifications regardless of filename or location
- **Robust Validation**: Multi-layer validation with version format checking and structural requirements
- **Real-World Impact**: Improved from 0% to 94% specification coverage on test projects
- **Performance**: Smart filtering and exclusion patterns for efficient processing

### Enhanced http4s Support (August 2025)
- **Variable-Prefixed Patterns**: Added support for `case variable @ METHOD -> Root` patterns
- **Method Object Support**: Enhanced detection of `Method.GET`, `Method.POST` patterns
- **Performance Impact**: 67% increase in endpoint detection for http4s applications
- **Pattern Recognition**: Improved regex patterns for comprehensive route extraction

## Implementation Approach

### Language-Agnostic Design
These specifications are designed to be implementable in any programming language:
- **Core Algorithms**: Documented as language-neutral pseudocode
- **Data Structures**: Defined as interfaces/types without language-specific details
- **Pattern Matching**: Regex patterns and string processing logic
- **File Operations**: Standard filesystem operations available in all languages
- **Error Handling**: Generic patterns adaptable to any error handling system

### Recreation Guidelines
To recreate EndpointScraper in any programming language:

1. **Start with Data Models**: Implement the core data structures from [Data Models](./data-models.md)
2. **Implement Core Algorithms**: Use the algorithms from [Algorithms](./algorithms.md) as implementation guides
3. **Build File Processing**: Follow the file scanning patterns from [File Scanning](./file-scanning.md)
4. **Add Framework Extractors**: Implement extractors using patterns from Java/Scala extraction docs
5. **Create User Interface**: Build CLI and interactive interfaces following [CLI Interface](./cli-interface.md) and [Interactive Prompting](./interactive-prompting.md)
6. **Add Coverage Analysis**: Implement API spec discovery and coverage analysis features
7. **Implement Output Systems**: Build formatting and export capabilities

### Key Design Principles
- **Pattern-Based Extraction**: Uses regex and string parsing rather than full AST parsing
- **Modular Architecture**: Separate extractors per framework for easy extension
- **Graceful Error Handling**: Continue processing despite individual file failures
- **Comprehensive Test Exclusion**: Robust filtering to avoid false positives
- **User Experience Focus**: Multiple interaction modes for different use cases
- **Extensible Design**: Plugin-like architecture for adding new frameworks