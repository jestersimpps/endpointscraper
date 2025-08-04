# EndpointScraper Project Specifications

## Application Overview
EndpointScraper is a Node.js CLI tool that extracts REST API endpoints from Java and Scala backend applications using static file analysis. The tool supports multiple web frameworks and provides formatted output with CSV export capabilities.

## Features

### Core Features
- [Application Architecture](./application-architecture.md) - Core system design and structure
- [File Scanning Engine](./file-scanning.md) - Directory traversal and file filtering
- [Java Endpoint Extraction](./java-extraction.md) - Spring Boot annotation parsing
- [Scala Endpoint Extraction](./scala-extraction.md) - Multi-framework route extraction
- [CLI Interface](./cli-interface.md) - Command-line interface and options
- [Output Formatting](./output-formatting.md) - Result display and CSV export

## Framework Support
- **Java**: Spring Boot annotations (@GetMapping, @PostMapping, etc.)
- **Scala**: Spring annotations, Play Framework routes, Akka HTTP routes, http4s routes (enhanced pattern recognition)

## Recent Improvements
- **Enhanced http4s Support**: Added support for variable-prefixed case patterns (`case variable @ METHOD -> Root`)
- **Performance Impact**: 67% increase in endpoint detection (107 → 179 endpoints in pos project)
- **Pattern Recognition**: Improved regex patterns for more comprehensive route extraction

## Design Principles
- Language-agnostic specification for cross-language implementation
- Pattern-based extraction using regex and string parsing
- Modular architecture with separate extractors per framework
- Comprehensive test file exclusion to avoid false positives
- Project-based CSV naming with timestamp tracking