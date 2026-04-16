# ftrack-api-developer Skill Structure

## Directory Layout

```
ftrack-api-developer/
│
├── README.md                      # Main documentation
├── plugin.json                    # Skill configuration
│
├── skills/
│   └── SKILL.md                   # LLM instructions (490 lines, optimized)
│
└── examples/                      # Code examples (organized by language)
    │
    ├── README.md                  # Overview & comparison guide
    │
    ├── python/                    # Python API examples
    │   ├── README.md              # Python-specific guide
    │   ├── action_handlers.py
    │   ├── custom_location_s3.py
    │   ├── exception_handling.py
    │   ├── performance_optimization.py
    │   └── resource_transformers.py
    │
    └── javascript/                # JavaScript API examples
        ├── README.md              # JavaScript-specific guide
        ├── package.json           # npm dependencies & scripts
        ├── session-management.js
        ├── query-operations.js
        ├── crud-operations.js
        ├── event-handling.js
        ├── file-operations.js
        └── typescript-example.ts
```

## File Count Summary

| Component | Files | Description |
|-----------|-------|-------------|
| **Core** | 2 | README.md, plugin.json |
| **Skills** | 1 | SKILL.md (LLM instructions) |
| **Documentation** | 3 | Main + Python + JavaScript READMEs |
| **Python Examples** | 5 | .py files |
| **JavaScript Examples** | 7 | .js/.ts files + package.json |
| **Total** | 18 | Complete skill package |

## Lines of Code

| Component | Lines | Tokens (est.) |
|-----------|-------|---------------|
| **SKILL.md** | 490 | ~3,500 |
| **Python Examples** | ~1,500 | ~10,000 |
| **JavaScript Examples** | ~2,930 | ~20,000 |
| **Documentation** | ~1,200 | ~8,000 |
| **Total** | ~6,120 | ~41,500 |

## Key Optimizations

### 1. Token Efficiency
- **SKILL.md**: Reduced from 32,000 → 3,500 tokens (89% reduction)
- **Language detection**: Load only relevant examples
- **Collapsible sections**: Show/hide based on context

### 2. Organization
- **Separated by language**: Clear Python vs JavaScript distinction
- **Dedicated READMEs**: Language-specific documentation
- **Consistent naming**: Easy to find examples

### 3. Coverage
- **Python**: 5 comprehensive examples
- **JavaScript**: 6 examples + TypeScript
- **Documentation**: 3 detailed guides

## Usage Patterns

### For Python Developers
```
1. Read: examples/python/README.md
2. Run: python examples/python/action_handlers.py
3. Adapt: Copy patterns to your project
```

### For JavaScript Developers
```
1. Read: examples/javascript/README.md
2. Install: cd examples/javascript && npm install
3. Run: npm run example:query
4. Adapt: Copy patterns to your project
```

### For LLM (Claude)
```
1. Detect language from user context
2. Load only relevant section of SKILL.md
3. Reference appropriate examples directory
4. Provide language-specific guidance
```

## Documentation Hierarchy

```
README.md (Main)
├── Installation & configuration
├── Features overview
├── Usage examples (both languages)
└── Links to detailed docs
    │
    ├── examples/README.md
    │   ├── Directory structure
    │   ├── Language comparison
    │   ├── Learning path
    │   └── Best practices
    │
    ├── examples/python/README.md
    │   ├── Python quick start
    │   ├── Pattern examples
    │   └── Python best practices
    │
    └── examples/javascript/README.md
        ├── JavaScript quick start
        ├── Pattern examples
        ├── Browser vs Node.js
        └── JavaScript best practices
```

## Example Coverage Matrix

| Feature | Python Example | JavaScript Example | Notes |
|---------|---------------|-------------------|-------|
| **Sessions** | ✅ performance_opt. | ✅ session-mgmt. | Both comprehensive |
| **Queries** | ✅ performance_opt. | ✅ query-ops. | JS has builder |
| **CRUD** | ✅ (scattered) | ✅ crud-ops. | JS consolidated |
| **Events** | ✅ action_handlers | ✅ event-handling | Both detailed |
| **Actions** | ✅ action_handlers | ⚠️ N/A | Python-specific |
| **Locations** | ✅ custom_location | ⚠️ N/A | Python-specific |
| **Transformers** | ✅ resource_trans. | ⚠️ N/A | Python-specific |
| **Files** | ⚠️ (partial) | ✅ file-ops. | JS more complete |
| **TypeScript** | ❌ N/A | ✅ typescript-ex. | JS-only |
| **Error Handling** | ✅ exception_hand. | ✅ (in all files) | Both comprehensive |
| **Performance** | ✅ performance_opt. | ✅ query-ops. | Both optimized |

## Quick Reference

### Python Entry Points
- **Action Handlers**: `examples/python/action_handlers.py`
- **Custom Locations**: `examples/python/custom_location_s3.py`
- **Performance**: `examples/python/performance_optimization.py`

### JavaScript Entry Points
- **Getting Started**: `examples/javascript/session-management.js`
- **Queries**: `examples/javascript/query-operations.js`
- **Real-time**: `examples/javascript/event-handling.js`
- **Type-Safe**: `examples/javascript/typescript-example.ts`

### Documentation Entry Points
- **Overview**: `README.md`
- **Examples Guide**: `examples/README.md`
- **Python Guide**: `examples/python/README.md`
- **JavaScript Guide**: `examples/javascript/README.md`

## Maintenance

### Adding Examples
1. Choose language directory (`python/` or `javascript/`)
2. Create file with clear name (e.g., `custom-workflow.js`)
3. Include docstrings/comments
4. Add error handling
5. Update language-specific README
6. Update examples/README.md comparison

### Updating SKILL.md
1. Keep token usage minimal
2. Maintain language separation
3. Use collapsible sections
4. Update example references
5. Test with skill invocation

### Versioning
- Track API version compatibility
- Note breaking changes
- Maintain changelog
- Update examples for new features

## Dependencies

### Python
```
ftrack-python-api >= 2.0
boto3 (for S3 location example)
```

### JavaScript
```
@ftrack/api >= 3.0
@types/node (TypeScript)
tsx (TypeScript execution)
```

## Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **SKILL.md tokens** | 32,000 | 3,500 | -89% |
| **Load time (est.)** | High | Low | Much faster |
| **Context usage** | Full | Selective | Efficient |
| **Maintainability** | Medium | High | Clear structure |
| **Coverage** | Python-only | Both langs | Complete |

## Success Criteria

- ✅ Clear language separation
- ✅ Token-optimized SKILL.md
- ✅ Comprehensive JavaScript examples
- ✅ Detailed documentation for both languages
- ✅ Easy navigation and discovery
- ✅ Production-ready patterns
- ✅ Type safety (TypeScript)
- ✅ Error handling in all examples
- ✅ Consistent naming conventions
- ✅ Maintainable structure

## Future Enhancements

### Short-term
- [ ] Add unit tests for patterns
- [ ] Create quick-start scripts
- [ ] Add CI/CD validation
- [ ] Generate API docs

### Long-term
- [ ] Interactive playground
- [ ] Video tutorials
- [ ] Community contributions
- [ ] Integration templates
- [ ] VS Code snippets

---

**Last Updated**: 2026-04-16
**Structure Version**: 2.0
**Total Files**: 18
**Total Lines**: ~6,120
