# Changelog

## [2025-08-04 Enhanced http4s Pattern Recognition]
### Modified
- Scala Extraction: Enhanced http4s route detection to support variable-prefixed patterns
- Scala Extraction: Updated regex from `/case\s+(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/` to `/case\s+(?:\w+\s*@\s+)?(GET|POST|PUT|PATCH|DELETE)\s*->\s*Root/`
- Scala Extraction: Added support for patterns like "case context @ POST -> Root"
- Scala Extraction: Improved technical documentation with regex breakdown and pattern examples
- README: Updated framework support section to highlight enhanced http4s capabilities
- README: Added performance impact metrics (67% increase in endpoint detection)

### Added
- Scala Extraction: New "Recent Improvements" section documenting August 2025 enhancements
- Scala Extraction: Technical implementation details showing before/after regex patterns
- Scala Extraction: Additional pattern examples including variable-prefixed cases

## [2025-08-04 Initial Documentation]
### Added
- Created comprehensive project specifications
- Documented application architecture and core principles
- Documented Java Spring Boot endpoint extraction patterns
- Documented Scala multi-framework endpoint extraction (Play, Akka HTTP, http4s)
- Documented CLI interface with all command options
- Documented output formatting and CSV export functionality
- Documented file scanning patterns and exclusion rules