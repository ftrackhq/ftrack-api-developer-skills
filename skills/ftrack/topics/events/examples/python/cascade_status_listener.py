"""Set a Shot's status from the states of its Tasks whenever a task status changes.

Adapted from ftrack-recipes (python/events/cascade-status-changes).
Run directly, or put this file on FTRACK_EVENT_PLUGIN_PATH to load it as a plugin.
Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
"""

import functools
import logging

import ftrack_api
import ftrack_api.event.base
import ftrack_api.exception

logger = logging.getLogger("my_company.cascade_status_listener")

PUSH_TOKEN = "cascade-status-listener"


def is_task_status_change(entity):
    return (
        entity.get("entityType") == "task"
        and entity.get("action") in ("add", "update")
        and "statusid" in entity.get("keys", [])
    )


def status_for_state(project, state):
    for status in project["project_schema"].get_statuses("Shot"):
        if status["state"]["short"] == state:
            return status
    return None


def new_shot_status(project, task_states):
    if task_states == {"DONE"}:
        return status_for_state(project, "DONE")
    if task_states == {"NOT_STARTED"}:
        return status_for_state(project, "NOT_STARTED")
    if "BLOCKED" in task_states:
        return status_for_state(project, "BLOCKED")
    if "IN_PROGRESS" in task_states:
        return status_for_state(project, "IN_PROGRESS")
    return None


def notify(session, user_id, message):
    session.event_hub.publish(
        ftrack_api.event.base.Event(
            topic="ftrack.action.trigger-user-interface",
            data={"type": "message", "success": True, "message": message},
            target='applicationId=ftrack.client.web and user.id="{0}"'.format(user_id),
        ),
        on_error="ignore",
    )


def on_update(session, event):
    changed = False
    for entity in event["data"].get("entities", []):
        if not is_task_status_change(entity):
            continue

        shot = session.query(
            "select status_id, project.project_schema from Shot "
            'where children any (id is "{0}")'.format(entity["entityId"])
        ).first()
        if not shot:
            continue

        tasks = session.query(
            'select status.state.short from Task where parent_id is "{0}"'.format(shot["id"])
        ).all()
        states = {task["status"]["state"]["short"] for task in tasks if task["status"]}
        status = new_shot_status(shot["project"], states)
        if status and status["id"] != shot["status_id"]:
            shot["status_id"] = status["id"]
            changed = True

    if not changed:
        return

    try:
        session.commit()
    except ftrack_api.exception.ServerError:
        logger.exception("Failed to update shot status")
        session.rollback()
        return

    user_id = event["source"].get("user", {}).get("id")
    if user_id:
        notify(session, user_id, "Shot status updated from its tasks")


def register(session, **kw):
    if not isinstance(session, ftrack_api.Session):
        return
    # Ignore the update events caused by this listener's own commits.
    session.event_hub.subscribe(
        "topic=ftrack.update and data.pushToken!={0}".format(PUSH_TOKEN),
        functools.partial(on_update, session),
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    session = ftrack_api.Session(
        auto_connect_event_hub=True,
        headers={"ftrack-pushtoken": PUSH_TOKEN},
    )
    register(session)
    logger.info("Listening for task status changes. Ctrl-C to stop.")
    session.event_hub.wait()
