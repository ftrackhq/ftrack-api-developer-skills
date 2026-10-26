"""Location plugin: a studio disk location with one root per project.

Based on ftrack-recipes (plugins/per-project-location). Put this file on
FTRACK_EVENT_PLUGIN_PATH; every ftrack_api session then configures the location.
Projects need a root set (Project "root" attribute, or a Disk with per-OS paths).
"""

import functools
import logging
import os
import platform

import ftrack_api
import ftrack_api.accessor.disk
import ftrack_api.structure.standard
from ftrack_api.entity.location import Location

logger = logging.getLogger("my_company.project_location")

LOCATION_NAME = "studio.project-disks"   # names starting with "ftrack." are reserved


class ProjectRootLocation(Location):
    """Write each component under its project's root folder."""

    def _project_root(self, component):
        project_id = component["version"]["project_id"]
        project = self.session.query(
            'select root, disk from Project where id is "{0}"'.format(project_id)
        ).one()
        if project["root"]:
            return project["root"]
        disk = project["disk"]
        root = disk and disk["windows" if platform.system() == "Windows" else "unix"]
        if not root:
            raise IOError("Project {0} has no root folder".format(project_id))
        return root

    def _add_data(self, component, resource_identifier, source):
        self.accessor.prefix = self._project_root(component)
        super(ProjectRootLocation, self)._add_data(component, resource_identifier, source)

    def get_filesystem_path(self, component):
        return os.path.join(self._project_root(component), self.get_resource_identifier(component))


def configure_location(session, event):
    location = session.ensure("Location", {"name": LOCATION_NAME})
    ftrack_api.mixin(location, ProjectRootLocation, name="ProjectRootLocation")
    location.accessor = ftrack_api.accessor.disk.DiskAccessor(prefix="")
    location.structure = ftrack_api.structure.standard.StandardStructure()
    location.priority = 10   # lower than other configured locations = used by location="auto"
    logger.info("Configured location %s", LOCATION_NAME)


def register(session, **kw):
    if not isinstance(session, ftrack_api.Session):
        return
    session.event_hub.subscribe(
        "topic=ftrack.api.session.configure-location",
        functools.partial(configure_location, session),
    )
