"""ftrack query examples (Python).

Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
Usage: python query_examples.py <project_id>
"""

import sys

import ftrack_api
import ftrack_api.exception


def quote(value):
    """Escape a user-supplied string for use inside a double-quoted query literal."""
    return value.replace("\\", "\\\\").replace('"', '\\"')


def tasks_in_project(session, project_id):
    # Project everything the loop reads so no extra request is sent per task.
    return session.query(
        'select name, status.name, type.name from Task '
        'where project_id is "{0}" order by name'.format(project_id)
    ).all()


def task_by_id(session, task_id):
    try:
        return session.query(
            'select name, parent.name from Task where id is "{0}"'.format(task_id)
        ).one()
    except ftrack_api.exception.NoResultFoundError:
        return None


def latest_version(session, asset_id):
    # first() adds its own limit, so the expression must not contain one.
    return session.query(
        'select version, comment from AssetVersion '
        'where asset_id is "{0}" order by version descending'.format(asset_id)
    ).first()


def tasks_by_ids(session, task_ids):
    # One request instead of one per id.
    ids = ", ".join('"{0}"'.format(task_id) for task_id in task_ids)
    return session.query('select name from Task where id in ({0})'.format(ids)).all()


def tasks_under(session, context_id):
    # Works at any depth (sequence, episode, ...) and avoids parent.parent... joins.
    return session.query(
        'select name from Task where ancestors any (id is "{0}")'.format(context_id)
    ).all()


def search_shots(session, project_id, text):
    return session.query(
        'select name from Shot where project_id is "{0}" and name like "{1}%"'.format(
            project_id, quote(text)
        )
    ).all()


def projects_with_metadata(session, key, value):
    # any (...) makes both conditions apply to the same metadata row.
    return session.query(
        'select name from Project where metadata any (key is "{0}" and value is "{1}")'.format(
            quote(key), quote(value)
        )
    ).all()


def iterate_all_tasks(session, project_id):
    # Pages are fetched transparently; page_size is a query() argument.
    query = session.query(
        'select name from Task where project_id is "{0}"'.format(project_id),
        page_size=200,
    )
    for task in query:
        yield task


def task_counts_by_status(project_id):
    # group by needs a strict session and session.call.
    with ftrack_api.Session(strict_api=True, auto_connect_event_hub=False) as strict:
        rows = strict.call([{
            "action": "query",
            "expression": (
                'select count(id), status_id from Task '
                'where project_id is "{0}" group by status_id'.format(project_id)
            ),
        }])[0]["data"]
        names = {s["id"]: s["name"] for s in strict.query("select id, name from Status")}
        return {names[r["status_id"]]: r["count_id"] for r in rows}


def main(project_id):
    with ftrack_api.Session(auto_connect_event_hub=False) as session:
        for task in tasks_in_project(session, project_id)[:10]:
            print(task["name"], "-", task["status"]["name"], "-", task["type"]["name"])

    for status, count in task_counts_by_status(project_id).items():
        print("{0}: {1}".format(status, count))


if __name__ == "__main__":
    main(sys.argv[1])
