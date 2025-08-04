# EndpointScraper

A powerful Node.js CLI tool that extracts REST API endpoints from Java and Scala backend applications using file scraping techniques.

## Features

- 🔍 **Multi-language support**: Scans both Java and Scala files
- 🎯 **Framework detection**: Supports multiple frameworks:
  - **Java**: Spring Boot annotations (`@GetMapping`, `@PostMapping`, etc.)
  - **Scala**: Spring annotations, Play Framework routes, Akka HTTP routes
- 📁 **Smart scanning**: Recursively scans directories while ignoring build/test folders
- 🎨 **Rich output**: Color-coded results with file locations and line numbers
- ⚡ **Fast performance**: Optimized file parsing with glob patterns
- 📊 **Summary statistics**: Overview of endpoints by HTTP method

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

### Basic Usage
```bash
# Scan a directory for endpoints
npm run dev /path/to/your/java-scala-project

# Or using the built version
npm start /path/to/your/project
```

### Command Options
```bash
# Show summary by HTTP method
npm run dev /path/to/your/project --summary

# Quiet mode (suppress detailed output)
npm run dev /path/to/your/project --quiet

# Combine options
npm run dev /path/to/your/project --summary --quiet
```

### Examples

#### Basic scan
```bash
npm run dev ./my-spring-boot-app
```

#### Scan with summary
```bash
npm run dev ./my-scala-project --summary
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

### Summary Output
```
📈 Summary by HTTP Method:
──────────────────────────────
  GET    12
  POST   6
  PUT    4
  PATCH  1
  DELETE 3
```

## Configuration

### File Patterns
The tool automatically scans for:
- `**/*.java` - Java source files
- `**/*.scala` - Scala source files

### Ignored Directories
- `node_modules/`
- `target/` (Maven/SBT build directory)
- `build/` (Gradle build directory)  
- `.git/`
- `test/`, `tests/` (Test directories)

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
│   └── output-formatter.ts  # Result formatting
└── index.ts                 # CLI entry point
```

### Available Scripts
```bash
npm run dev        # Run with tsx (development)
npm run build      # Compile TypeScript
npm run typecheck  # Type checking only
npm start          # Run built version
```

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

**Build errors**  
- Run `npm run typecheck` to identify TypeScript issues
- Ensure Node.js version is 18+

**Permission errors**
- Check directory read permissions
- Run with appropriate user privileges

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
