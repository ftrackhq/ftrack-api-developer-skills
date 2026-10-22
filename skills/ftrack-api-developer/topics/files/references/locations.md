# Locations

Sources: https://developer.ftrack.com/api-clients/python/locations/overview, /configuring, /tutorial; `source/ftrack_api/entity/location.py`, `accessor/`, `structure/`, `resource_identifier_transformer/` in https://github.com/ftrackhq/ftrack-python; ftrack-recipes `plugins/per-project-location`, `events/customise-structure`.

## Concepts

- **Location**: a named place data can live (`studio.london.nas`, `jane-laptop`, `cloud-archive`). Names starting with `ftrack.` are reserved.
- **Accessor**: how bytes are read/written there (disk, cloud SDK...).
- **Structure**: turns an entity into a resource identifier - the relative path inside the location.
- **Resource identifier**: stored per component per location on the `ComponentLocation`; keep it path-like so every accessor can use it.
- **Transformer** (optional): encodes/decodes resource identifiers before they're stored/after they're read.
- **Availability**: 0-100% per location; sequences are partially available while frames transfer.

A location exists in the database (`session.ensure("Location", {"name": "my.location"})`) but can only manage data in a session where it's **configured** (accessor + structure). Unconfigured locations can still answer availability.

## Configure from a plugin

```python
import functools
import ftrack_api
import ftrack_api.accessor.disk
import ftrack_api.structure.standard


def configure_locations(session, event):
    location = session.ensure("Location", {"name": "studio.nas"})
    location.accessor = ftrack_api.accessor.disk.DiskAccessor(prefix="/mnt/projects")
    location.structure = ftrack_api.structure.standard.StandardStructure()
    location.priority = 10                          # lower = preferred by location="auto"


def register(session, **kw):
    if not isinstance(session, ftrack_api.Session):
        return
    session.event_hub.subscribe(
        "topic=ftrack.api.session.configure-location",
        functools.partial(configure_locations, session),
    )
```

Put the file on `FTRACK_EVENT_PLUGIN_PATH` so every session (scripts, Connect, DCC integrations) configures the same locations. The topic is synchronous and local - no event hub connection needed.

To track files where they are without copying, mix in `ftrack_api.entity.location.UnmanagedLocationMixin`: `ftrack_api.mixin(location, ftrack_api.entity.location.UnmanagedLocationMixin)`.

To change behaviour per component (e.g. a different root per project), mix in your own `Location` subclass and override `_add_data` / `get_filesystem_path`; the ftrack-recipes `per-project-location` plugin reads `Project["root"]` / `Project["disk"]` this way.

## Structures

| Class | Layout |
|---|---|
| `ftrack_api.structure.standard.StandardStructure(project_versions_prefix=None, illegal_character_substitute="_")` | `project/sequence/shot/task/asset/v001/component.ext`-style human-readable paths |
| `ftrack_api.structure.id.IdStructure(prefix="")` | Paths from component ids (stable, not human-readable) |
| `ftrack_api.structure.entity_id.EntityIdStructure` | The entity id as identifier |

Custom: subclass `ftrack_api.structure.base.Structure` and implement `get_resource_identifier(entity, context=None)` (`entity` is the component; `context` includes the source location). Use `self._get_sequence_expression(sequence)` for sequence members.

## Accessors

Built in: `ftrack_api.accessor.disk.DiskAccessor(prefix)`; `ftrack.server` uses a private server accessor configured automatically. For other storage, subclass `ftrack_api.accessor.base.Accessor` and implement:

| Method | Return |
|---|---|
| `list(resource_identifier)` | Child identifiers of a container |
| `exists(ri)`, `is_file(ri)`, `is_container(ri)`, `is_sequence(ri)` | bool |
| `open(ri, mode="rb")` | An `ftrack_api.data.Data` (e.g. `ftrack_api.data.File(local_path, mode)` or `String`) |
| `remove(ri)` | Delete the file |
| `make_container(ri, recursive=True)`, `get_container(ri)` | Create / return the parent container |
| `get_filesystem_path(ri)` (optional) | Local path, else raise `AccessorUnsupportedOperationError` |
| `get_url(ri)` (optional) | URL, else raise `AccessorUnsupportedOperationError` |

Raise `ftrack_api.exception.AccessorResourceNotFoundError` and friends for missing data.

**S3 / cloud**: there is no official ftrack S3 accessor. The community `ftrack-s3-accessor` package pins `ftrack-python-api<3`, so it doesn't install alongside the current 3.x API; write an accessor on boto3 (or similar) following the table above, with object keys as resource identifiers.

## Transformers

Subclass `ftrack_api.resource_identifier_transformer.base.ResourceIdentifierTransformer(session)` with `encode(resource_identifier, context=None)` and `decode(resource_identifier, context=None)`, then set `location.resource_identifier_transformer = MyTransformer(session)`. Example use: store JSON with per-platform paths and decode to the current OS's path.

## Working with locations

```python
location.add_component(component, source_location)        # copy/register into location
location.add_components(components, sources)
location.remove_component(component)
location.get_resource_identifier(component)
location.get_filesystem_path(component)
location.get_component_availability(component)
session.get_component_availability(component)             # {location_id: percent}
session.pick_location(component)                          # highest-priority location holding it
```

Events: the API publishes `ftrack.location.component-added` / `-removed` (`ftrack_api.symbol.COMPONENT_ADDED_TO_LOCATION_TOPIC`, `COMPONENT_REMOVED_FROM_LOCATION_TOPIC`) when components change location, and the server publishes `ftrack.location.request-resolve` when it needs a path for a component (reply `{"path": ...}`; see the `events` topic).

Built-in ids (`ftrack_api.symbol`): `SERVER_LOCATION_ID`, `UNMANAGED_LOCATION_ID`, `ORIGIN_LOCATION_ID`, `CONNECT_LOCATION_ID`, `REVIEW_LOCATION_ID`.
