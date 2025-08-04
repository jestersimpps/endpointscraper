# EndpointScraper

A powerful Node.js CLI tool that extracts REST API endpoints from Java and Scala backend applications using file scraping techniques.

## Features

- 🔍 **Multi-language support**: Scans both Java and Scala files
- 🎯 **Framework detection**: Supports multiple frameworks:
  - **Java**: Spring Boot annotations (`@GetMapping`, `@PostMapping`, etc.)
  - **Scala**: Spring annotations, Play Framework routes, Akka HTTP routes, http4s routes
- 📋 **API Specification Analysis**: Finds and analyzes OpenAPI/Swagger specs
  - Automatically discovers API spec files (YAML/JSON)
  - Compares discovered endpoints with API specifications
  - Shows coverage analysis with visual indicators
  - Supports OpenAPI 3.x and Swagger 2.x
- 📁 **Smart scanning**: Recursively scans directories while ignoring build/test folders
- 🎨 **Rich output**: Color-coded results with file locations and line numbers
- ⚡ **Fast performance**: Optimized file parsing with glob patterns
- 📊 **Summary statistics**: Overview of endpoints by HTTP method and API coverage

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone or create the project
git clone <repository-url>
cd endpointscraper

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Interactive Mode (Recommended) 🆕

The CLI now runs in **interactive mode by default**, making it much easier to use! Simply run:

```bash
# Start interactive mode (no arguments needed!)
npm run dev

# Or use the built version
npm start
```

The interactive mode will guide you through:
- 📁 **Directory selection** with path validation
- 📋 **API specification analysis** option
- 📊 **Summary and output preferences**
- 🎨 **Output mode selection** (standard, quiet, minimal)
- 📄 **CSV export options**

### Command Modes

#### 1. Interactive Mode (Default)
```bash
npm run dev                    # Full interactive setup
npm run dev interactive        # Same as above
npm run dev i                  # Short alias
```

#### 2. Quick Mode
```bash
npm run dev quick              # Only asks for directory, uses smart defaults
npm run dev q                  # Short alias
```

#### 3. Legacy Command-Line Mode
```bash
# For backward compatibility and scripting
npm run dev -- scan /path/to/project [options]
```

### Legacy Command Options (for scripting)
```bash
# Show summary by HTTP method
npm run dev -- scan /path/to/your/project --summary

# Quiet mode (suppress detailed output)
npm run dev -- scan /path/to/your/project --quiet

# Skip CSV export (exports by default)
npm run dev -- scan /path/to/your/project --no-csv

# API Specification Analysis
npm run dev -- scan /path/to/your/project --api-spec

# Combine options
npm run dev -- scan /path/to/your/project --api-spec --summary --quiet
```

### API Specification Analysis

API specification analysis is now **built into the interactive mode**! When you enable it, you get:

- **Automatic Discovery**: Finds OpenAPI/Swagger files in common locations
- **Coverage Analysis**: Compares discovered endpoints with API specifications  
- **Visual Indicators**: Shows which endpoints are covered (✅) or missing (❌)
- **Enhanced CSV Export**: Includes coverage status in exported data
- **Progress Visualization**: Displays coverage percentage with progress bars

For legacy command-line usage:
```bash
# Basic API spec analysis
npm run dev -- scan /path/to/your/project --api-spec

# API spec analysis with summary
npm run dev -- scan /path/to/your/project --api-spec --summary
```

### Examples

#### Interactive Mode (Recommended)
```bash
# Start interactive mode - no arguments needed!
npm run dev

# Quick mode with smart defaults
npm run dev quick
```

#### Legacy Command-Line Mode
```bash
# Basic scan
npm run dev -- scan ./my-spring-boot-app

# Scan with summary
npm run dev -- scan ./my-scala-project --summary

# API Specification Analysis
npm run dev -- scan ./my-project --api-spec --summary

# Quiet mode with API spec analysis
npm run dev -- scan ./my-project --api-spec --quiet

# CSV Export options
npm run dev -- scan ./my-project --api-spec    # With coverage data
npm run dev -- scan ./my-project --no-csv      # Skip CSV export
```

## Supported Frameworks & Patterns

### Java (Spring Boot)
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    public List<User> getUsers() { ... }
    
    @PostMapping
    public User createUser(@RequestBody User user) { ... }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) { ... }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) { ... }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { ... }
}
```

### Scala (Play Framework)
```scala
# routes file
GET     /api/users              controllers.UserController.getUsers
POST    /api/users              controllers.UserController.createUser
GET     /api/users/:id          controllers.UserController.getUser(id: Long)
PUT     /api/users/:id          controllers.UserController.updateUser(id: Long)
DELETE  /api/users/:id          controllers.UserController.deleteUser(id: Long)
```

### Scala (Akka HTTP)
```scala
val route = 
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

### Scala (http4s)
```scala
val routes: AuthedRoutes[User, F] = AuthedRoutes.of[User, F] {
  case GET -> Root / "users" / "about" / "me" as user =>
    Ok(user)
  
  case GET -> Root / "users" / "my" / "personas" as user =>
    for {
      personas <- personaService.getPersonas(user)
      response <- Ok(personas)
    } yield response
    
  case GET -> Root / "users" / "met" / "rol" / RolVar(rol) as user =>
    getUsersWithRole(rol)
}
```

## Output Format

### Standard Output
```
📊 Endpoint Scan Results
──────────────────────────────────────────────────
📁 Total files: 15
✅ Scanned files: 12  
🎯 Endpoints found: 24

🚀 Discovered Endpoints:
──────────────────────────────────────────────────

📄 .../controllers/UserController.java
  GET    /api/users (line 45) - UserController.getUsers
  POST   /api/users (line 52) - UserController.createUser
  GET    /api/users/{id} (line 59) - UserController.getUser
  PUT    /api/users/{id} (line 66) - UserController.updateUser
  DELETE /api/users/{id} (line 73) - UserController.deleteUser
```

### API Specification Output (with --api-spec)
```
📋 API Specifications Found:
──────────────────────────────────────────────────
  📄 docs/swagger.yml
     OPENAPI v3.0.3 • 107 endpoints

  📄 api/openapi.yaml  
     OPENAPI v3.0.0 • 24 endpoints

📊 Endpoint Scan Results with API Coverage
──────────────────────────────────────────────────
📁 Total files: 15
✅ Scanned files: 12
🎯 Endpoints found: 24
📋 API specs found: 2

🚀 Discovered Endpoints with Coverage:
──────────────────────────────────────────────────

📄 .../controllers/UserController.java
  GET    /api/users (line 45) ✅ Covered - UserController.getUsers (getAllUsers)
  POST   /api/users (line 52) ✅ Covered - UserController.createUser (createUser)
  GET    /api/users/{id} (line 59) ❌ Not covered - UserController.getUser
  PUT    /api/users/{id} (line 66) ✅ Covered - UserController.updateUser (updateUser)
  DELETE /api/users/{id} (line 73) ❌ Not covered - UserController.deleteUser
```

### Summary Output
```
📈 Summary by HTTP Method:
──────────────────────────────
  GET    12
  POST   6
  PUT    4
  PATCH  1
  DELETE 3

📊 API Spec Coverage Summary:
──────────────────────────────
  ✅ Covered: 18
  ❌ Not covered: 6
  📈 Coverage: 75% ███████████████░░░░░
```

### CSV Export

#### Standard CSV Export
Results are saved to `./output/endpoints-[timestamp].csv` with the following columns:
- Method
- Path  
- File Path
- Line Number
- Class Name
- Method Name

#### Enhanced CSV Export (with --api-spec)
When using `--api-spec`, additional coverage columns are included:
- Method
- Path
- File Path
- Line Number
- Class Name
- Method Name
- **API Spec Coverage** (covered/not-covered/no-spec-found)
- **Spec File** (path to matching API specification)
- **Matched Operation** (operationId or summary from spec)

Example CSV content:
```csv
Method,Path,File Path,Line Number,Class Name,Method Name,API Spec Coverage,Spec File,Matched Operation
GET,/api/users,/src/controllers/UserController.java,45,UserController,getUsers,covered,docs/swagger.yml,getAllUsers
POST,/api/users,/src/controllers/UserController.java,52,UserController,createUser,covered,docs/swagger.yml,createUser
GET,/api/users/{id},/src/controllers/UserController.java,59,UserController,getUser,not-covered,,
```

## Configuration

### File Patterns
The tool automatically scans for:
- `**/*.java` - Java source files
- `**/*.scala` - Scala source files

### API Specification Patterns (with --api-spec)
The tool automatically discovers API specifications in:
- `**/*swagger*.{yaml,yml,json}` - Swagger specifications
- `**/*openapi*.{yaml,yml,json}` - OpenAPI specifications  
- `**/*api-spec*.{yaml,yml,json}` - General API spec files
- `**/spec*.{yaml,yml,json}` - Spec files
- `**/docs/**/*.{yaml,yml,json}` - Documentation directories
- `**/api/**/*.{yaml,yml,json}` - API directories

### Ignored Directories
- `node_modules/`
- `target/` (Maven/SBT build directory)
- `build/` (Gradle build directory)  
- `.git/`
- `test/`, `tests/` (Test directories)

### Output Directory
- `output/` - Contains generated CSV files (ignored by git)

## Development

### Project Structure
```
src/
├── models/
│   └── endpoint.ts          # Type definitions
├── services/
│   ├── file-scanner.ts      # Main scanning service
│   ├── java-extractor.ts    # Java endpoint extraction
│   ├── scala-extractor.ts   # Scala endpoint extraction
│   ├── api-spec-finder.ts   # API specification discovery
│   ├── coverage-analyzer.ts # Endpoint coverage analysis
│   ├── output-formatter.ts  # Result formatting
│   └── csv-exporter.ts      # CSV export functionality
└── index.ts                 # CLI entry point
```

### Available Scripts
```bash
npm run dev        # Run in interactive mode (development)
npm run build      # Compile TypeScript
npm run typecheck  # Type checking only
npm start          # Run built version in interactive mode
```

### Interactive Mode Benefits

The new interactive mode offers several advantages:

- 🎯 **User-Friendly**: No need to remember command-line arguments
- ✅ **Path Validation**: Ensures directory exists before starting scan
- 🔍 **Smart Defaults**: Quick mode uses optimal settings for most cases
- 🎨 **Better UX**: Beautiful welcome screen and progress indicators
- 📋 **Guided Setup**: Step-by-step configuration with explanations
- 🔄 **Error Prevention**: Validates inputs before processing

### Adding New Framework Support

To add support for a new framework:

1. Create a new extractor service in `src/services/`
2. Implement the extraction logic following the existing pattern
3. Register the extractor in `file-scanner.ts`

Example extractor structure:
```typescript
export class NewFrameworkExtractor {
  extract(filePath: string, content: string): Endpoint[] {
    // Implementation here
  }
}
```

## Troubleshooting

### Common Issues

**No endpoints found**
- Ensure the directory contains Java/Scala files
- Check that files use supported frameworks
- Verify file permissions are readable

**API specifications not found (with --api-spec)**
- Ensure API spec files exist in the project directory
- Check that spec files use supported formats (.yaml, .yml, .json)
- Verify spec files contain valid OpenAPI/Swagger content
- Common locations: `docs/`, `api/`, `src/main/resources/`, project root

**API coverage shows "not-covered" for existing endpoints**
- Check that paths in spec files match endpoint paths exactly
- Verify HTTP methods match between code and specifications
- Parameter patterns may differ (e.g., `{id}` vs `:id`)

**Build errors**  
- Run `npm run typecheck` to identify TypeScript issues
- Ensure Node.js version is 18+

**Permission errors**
- Check directory read permissions
- Run with appropriate user privileges

**Interactive mode issues**
- If prompts don't display correctly, ensure your terminal supports ANSI colors
- For automated scripts, use legacy mode: `npm run dev -- scan /path [options]`
- Press Ctrl+C to exit interactive mode at any time

**Legacy command-line mode issues**
- Always use `--` when passing arguments: `npm run dev -- scan /path --option`
- For direct usage: `npm start` runs in interactive mode

### Debug Mode
For debugging, you can modify the source to add more verbose logging or use the TypeScript compiler's `--sourceMap` flag for better error traces.

## License

MIT License - feel free to use and modify as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request
