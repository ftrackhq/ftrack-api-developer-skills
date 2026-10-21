# `@ftrack/ts-schema-generator`

Source: https://github.com/ftrackhq/ftrack-ts-schema-generator (README, `source/index.ts`, `source/emit.ts`, test snapshots). Latest release at the time of writing: 2.1.3.

## Running it

```bash
npm install --save-dev @ftrack/ts-schema-generator
export FTRACK_SERVER=https://mycompany.ftrackapp.com
export FTRACK_API_USER=jane@example.com
export FTRACK_API_KEY=...
npx ftrack-ts-schema-generator                     # -> __generated__/schema.ts
npx ftrack-ts-schema-generator ./src/types ftrack.ts   # custom directory and filename
```

- Credentials come only from `FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`.
- Positional arguments: output directory (default `__generated__`), filename (default `schema.ts`). The directory is created if missing.
- It prints the number of schemas found and any non-fatal errors.
- The output reflects the workspace the key can see, including its custom attributes, statuses and types. Use a key with read access to the configuration you need.

Add it as a script and regenerate whenever the workspace schema, custom attributes, statuses or types change. Commit the generated file so builds don't need ftrack access; if you regenerate in CI, point it at a stable workspace (not production) and fail the build on diff if you want drift detection.

## What the file contains

Header comment with the generation date and server version, then:

| Export | Meaning |
|---|---|
| One interface/type per entity type (`Task`, `Project`, `AssetVersion`, `User`, ...) | Attributes from the schema. Read-only attributes are `readonly`, relations are typed as related entities or arrays, `__entity_type__` is the literal type name |
| `EntityTypeMap` | Entity type name -> interface; pass to `Session<EntityTypeMap>` |
| `EntityType` | `keyof EntityTypeMap` |
| `EntityData<T>` | `EntityTypeMap[T]` |
| `TypedContextSubtypeMap`, `TypedContextSubtype` | Hierarchy subtypes (`Task`, `Shot`, `Milestone`, ...). These are built from `TypedContextForSubtype<"Task">`, sharing `TypedContext` attributes (`status`, `priority`, `bid`, `start_date`, `end_date`, `ancestors`, `descendants`, ...) |
| `TypedCustomAttributeValue<K>`, `TypedContextCustomAttributesMap` | Custom attributes per entity type as a union keyed by attribute name, with value types from their configuration |
| `getStatuses()`, `getTypes()`, `getObjectTypes()`, `getPriorities()`, `getProjectSchemas()`, `getAttributeConfigurations()` | Runtime functions returning the workspace configuration captured at generation time (names, colours, sort order, attribute settings) |

The generated header says "Not intended to modify manually" - don't edit it; regenerate instead.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Crash in prettier with `SyntaxError: Property or signature expected` and a code frame like `> 1055 \| Camera Lens: number` | A custom attribute **key** contains a space or other character that isn't valid in a TypeScript identifier. 2.1.3 emits it unquoted and aborts without writing the file. Rename the attribute key (System settings > Custom attributes; the label can keep spaces) or patch the generated property name |
| `Unexpected token '<' ... is not valid JSON` | `FTRACK_SERVER` has a trailing slash; remove it |
| Missing custom attributes or types | The API key's role can't see them; use a key with access to the configuration |

## Notes

- Datetime attributes are typed as `string`. The client returns Moment objects in the current 1.x release (dayjs objects in the 2.0 beta) unless `decodeDatesAsIso: true` is passed, so pass that option where you read dates through typed code.
- Type checking covers entity names, attribute names in `create`/`update` data, and the shape of results. It does not check query strings or projections; a typo in a query fails at runtime.
- The `get*()` helpers are snapshots. For values that must be current (e.g. status ids, which aren't included), query the server.
- The generator itself uses `@ftrack/api` with `Session<Schema>` for its own queries - a good reference for typed usage.
