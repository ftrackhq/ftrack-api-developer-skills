"""ftrack action examples using ftrack-action-handler.

pip install ftrack-python-api ftrack-action-handler
Run directly (reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY), or put this
file on FTRACK_EVENT_PLUGIN_PATH to load it as a plugin.
"""

import csv
import logging
import os
import tempfile

import ftrack_api
from ftrack_action_handler.action import AdvancedBaseAction, BaseAction


class FindAndReplace(BaseAction):
    """Form asking which attribute to edit, then find/replace on the selection."""

    identifier = "my-company.find-and-replace"
    label = "Find and replace"
    description = "Find and replace text in name or description"

    def discover(self, session, entities, event):
        return len(entities) > 0

    def interface(self, session, entities, event):
        values = event["data"].get("values") or {}
        if values.get("attribute") and values.get("find"):
            return None
        return [
            {"type": "label", "value": "Replace text on {0} item(s)".format(len(entities))},
            {
                "type": "enumerator",
                "label": "Attribute",
                "name": "attribute",
                "value": "name",
                "data": [
                    {"label": "Name", "value": "name"},
                    {"label": "Description", "value": "description"},
                ],
            },
            {"type": "text", "label": "Find", "name": "find"},
            {"type": "text", "label": "Replace", "name": "replace", "value": ""},
        ]

    def launch(self, session, entities, event):
        values = event["data"]["values"]
        attribute, find, replace = values["attribute"], values["find"], values.get("replace", "")
        changed = 0
        for entity_type, entity_id in entities:
            entity = session.get(entity_type, entity_id)
            value = entity.get(attribute) if entity else None
            if isinstance(value, str) and find in value:
                entity[attribute] = value.replace(find, replace)
                changed += 1
        try:
            session.commit()
        except Exception:
            session.rollback()
            raise
        return {"success": True, "message": "Updated {0} item(s)".format(changed)}


class TaskReport(AdvancedBaseAction):
    """Restricted action that builds a CSV and hands it to the user as a job."""

    identifier = "my-company.task-report"
    label = "Task report"
    description = "Download a CSV of tasks under the selection"
    allowed_roles = ["Administrator", "Project Manager"]
    allowed_types = ["Project", "Sequence", "Shot"]

    def launch(self, session, entities, event):
        job_id = self.create_job(event, "Building task report")
        try:
            ids = ", ".join('"{0}"'.format(entity_id) for _, entity_id in entities)
            tasks = session.query(
                "select name, status.name, parent.name from Task "
                "where ancestors any (id in ({0}))".format(ids)
            ).all()

            path = os.path.join(tempfile.mkdtemp(), "task_report.csv")
            with open(path, "w", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(["parent", "task", "status"])
                for task in tasks:
                    writer.writerow([task["parent"]["name"], task["name"], task["status"]["name"]])

            component = session.create_component(
                path, data={"name": "task_report"}, location=session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID)
            )
            session.commit()
            self.attach_component_to_job(job_id, component["id"], "Task report ready")
        except Exception as error:
            session.rollback()
            self.mark_job_as_failed(job_id, str(error))
            raise
        return {"success": True, "message": "Report is being prepared, see Jobs"}


def register(session, **kw):
    if not isinstance(session, ftrack_api.Session):
        return
    FindAndReplace(session).register()
    TaskReport(session).register()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    # The action handler never connects the event hub itself.
    session = ftrack_api.Session(auto_connect_event_hub=True)
    register(session)
    logging.info("Actions registered. Ctrl-C to stop.")
    session.event_hub.wait()
