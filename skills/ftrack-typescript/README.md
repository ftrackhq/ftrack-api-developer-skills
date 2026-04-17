# ftrack TypeScript Integration

Focused skill for type-safe ftrack development with TypeScript.

## What This Skill Covers

- Schema generation
- Type-safe queries
- Repository pattern
- Service layer architecture
- React integration
- Custom hooks
- Express API patterns
- Testing with Jest

## When to Use

Invoke this skill when working with:
- TypeScript ftrack applications
- Type-safe API usage
- Generating workspace schemas
- Building React dashboards
- Creating REST APIs
- Repository/service patterns
- Unit testing ftrack code

## Quick Example

```typescript
import ftrack from '@ftrack/api';
import { Task } from './types/ftrack-schema';

const session = new ftrack.Session(server, user, key);
await session.initializing;

// Type-safe query
const response = await session.query<Task>(
  'select name, status.name from Task'
);

const tasks: Task[] = response.data;

// TypeScript knows the shape
tasks.forEach(task => {
  console.log(task.name); // ✓ Type-safe
  console.log(task.status.name); // ✓ Type-safe
});
```

## Schema Generation

```bash
npx @ftrack/ts-schema-generator \
  --server https://company.ftrackapp.com \
  --user user@example.com \
  --apiKey your-api-key \
  --output src/types/ftrack-schema.ts
```

## Invocation

```bash
/ftrack-typescript
```

Or automatically via `/ftrack-api-developer` when TypeScript-related keywords detected.

## Token Usage

~400 tokens (vs 3,500 for full ftrack skill)

## Language Support

**JavaScript/TypeScript only** - Python has built-in type hints

## Related Skills

- `/ftrack-query` - For query patterns
- `/ftrack-events` - For typed event handling
- `/ftrack-session` - For session setup
