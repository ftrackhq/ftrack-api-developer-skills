# ftrack JavaScript Skill

Expert guidance for building ftrack applications with modern JavaScript (ES6+), covering async patterns, browser/Node.js environments, and performance optimization.

## Overview

This skill provides comprehensive JavaScript-specific patterns and best practices for the ftrack API, optimized for both browser and Node.js environments.

## Features

- **Modern JavaScript**: ES6+ features, async/await, Promises
- **Dual Environment**: Browser and Node.js specific patterns
- **File Operations**: Upload/download in both environments
- **Event Handling**: Real-time updates with async handlers
- **Performance**: Caching, debouncing, retry logic
- **Testing**: Jest patterns and mocking strategies
- **Bundling**: Webpack and Vite configurations
- **Error Handling**: Comprehensive error patterns

## Installation

```bash
# Install as subskill (included with ftrack-api-developer)
/skill install ftrack-api-developer

# Or standalone
/skill install ftrack-javascript
```

## Usage

### Direct Invocation
```
/ftrack-javascript
```

### Auto-trigger
Mention JavaScript-specific topics:
- "Show me async/await patterns for ftrack"
- "How do I upload files in the browser?"
- "Node.js script to query ftrack"
- "JavaScript event handling examples"

## Parent Skill

This is a subskill of `ftrack-api-developer`. It's automatically loaded when JavaScript context is detected.

## What It Covers

### Core Patterns
- Async/await vs Promises
- Error handling with try/catch
- Parallel operations with Promise.all
- Sequential vs parallel execution

### Browser-Specific
- File upload from input elements
- Download files as blobs
- Real-time UI updates
- CORS handling

### Node.js-Specific
- File system operations
- Environment configuration
- CLI script patterns
- Process management

### Modern JavaScript
- Destructuring and spread operators
- Template literals for queries
- Optional chaining
- Array methods (map, filter, reduce)

### Performance
- Caching strategies
- Debouncing searches
- Retry logic with backoff
- Timeout handling

### Tooling
- Webpack/Vite bundling
- Jest testing patterns
- Module imports/exports
- Build optimization

## Related Skills

- `/ftrack-typescript` - TypeScript-specific patterns
- `/ftrack-query` - Query optimization
- `/ftrack-events` - Event handling
- `/ftrack-files` - File operations
- `/ftrack-session` - Session management

## Requirements

```json
{
  "dependencies": {
    "@ftrack/api": "^2.0.0"
  },
  "devDependencies": {
    "webpack": "^5.0.0",
    "babel-loader": "^9.0.0",
    "@babel/preset-env": "^7.0.0"
  }
}
```

## Examples

Check the parent skill's examples directory:
- `examples/javascript/query-operations.js`
- `examples/javascript/event-handling.js`
- `examples/javascript/file-operations.js`

## When to Use

Use this skill when:
- Working with `.js` files
- Building browser applications
- Creating Node.js scripts
- Need async/await patterns
- Implementing event handlers
- Performance optimization needed

## When to Use TypeScript Instead

Use `/ftrack-typescript` when:
- Working with `.ts` files
- Need type safety
- Generating schemas
- Using interfaces/types
- Building large applications

## Official Resources

- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **NPM Package**: https://www.npmjs.com/package/@ftrack/api
- **Examples**: https://github.com/ftrackhq/ftrack-recipes

## Token Usage

~600 tokens (JavaScript-specific patterns only)

## Version

1.0.0

## Author

Lorenzo Angeli (lorenzo.angeli@backlight.co)
