"""ftrack session examples (Python).

Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
Usage: python session_examples.py <task_id>
"""

import functools
import logging
import os
import sys
import tempfile
import time

import requests

import ftrack_api
import ftrack_api.cache
import ftrack_api.exception
import ftrack_api.symbol

logger = logging.getLogger(__name__)


def create_session(**kwargs):
    # Event hub stays disconnected unless auto_connect_event_hub=True is passed.
    return ftrack_api.Session(timeout=30, **kwargs)


def rename_task(session, task_id, new_name):
    task = session.query('select name from Task where id is "{0}"'.format(task_id)).one()
    task["name"] = new_name
    try:
        session.commit()
    except ftrack_api.exception.ServerError:
        # The failed operations are still recorded; discard them so the next
        # commit doesn't resend them.
        session.rollback()
        raise
    return task


def retry_on_network_error(attempts=3, base_delay=1.0):
    """Retry only transport failures; server-side errors are not retried."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, attempts + 1):
                try:
                    return func(*args, **kwargs)
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                    if attempt == attempts:
                        raise
                    delay = base_delay * 2 ** (attempt - 1)
                    logger.warning("Network error, retrying in %ss", delay)
                    time.sleep(delay)

        return wrapper

    return decorator


@retry_on_network_error()
def get_task(session, task_id):
    try:
        return session.query(
            'select name, status.name from Task where id is "{0}"'.format(task_id)
        ).one()
    except ftrack_api.exception.NoResultFoundError:
        return None


def create_tasks_in_one_commit(session, parent, names, task_type):
    # One request and one transaction for all creates.
    tasks = [
        session.create("Task", {"name": name, "parent": parent, "type": task_type})
        for name in names
    ]
    try:
        session.commit()
    except ftrack_api.exception.ServerError:
        session.rollback()
        raise
    return tasks


def persistent_cache_session():
    cache_path = os.path.join(tempfile.gettempdir(), "ftrack_session_cache.dbm")

    def cache_maker(session):
        return ftrack_api.cache.SerialisedCache(
            ftrack_api.cache.FileCache(cache_path),
            encode=functools.partial(session.encode, entity_attribute_strategy="persisted_only"),
            decode=session.decode,
        )

    return create_session(cache=cache_maker)


def main(task_id):
    logging.basicConfig(level=logging.INFO)

    with create_session() as session:
        print("Server version:", session.server_information.get("version"))
        task = get_task(session, task_id)
        if task is None:
            print("Task not found")
            return
        print(task["name"], "-", task["status"]["name"])

        # Avoids one request per attribute when auto-population would kick in.
        with session.auto_populating(False):
            print("description loaded:", task["description"] is not ftrack_api.symbol.NOT_SET)

    # group by and aggregates need strict mode.
    with create_session(strict_api=True) as strict:
        rows = strict.call([{
            "action": "query",
            "expression": "select count(id), status_id from Task group by status_id",
        }])[0]["data"]
        print(len(rows), "statuses in use")


if __name__ == "__main__":
    main(sys.argv[1])
